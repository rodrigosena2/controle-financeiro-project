using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using ControleFinanceiro.Api.Controllers;
using ControleFinanceiro.Api.Data;
using ControleFinanceiro.Api.Dtos.Transactions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ControleFinanceiro.Tests.Integration;

public sealed class TransactionsApiTests
{
    internal const string Password = "UmaSenha!Segura123";
    internal static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    { Converters = { new JsonStringEnumConverter() } };

    internal static HttpClient Client(SqlServerApiFactory factory) => factory.CreateClient(new()
    { BaseAddress = new Uri("https://localhost"), AllowAutoRedirect = false });

    internal static async Task Csrf(HttpClient client)
    {
        var value = await client.GetFromJsonAsync<JsonElement>("/api/auth/csrf");
        client.DefaultRequestHeaders.Remove("X-CSRF-TOKEN");
        client.DefaultRequestHeaders.Add("X-CSRF-TOKEN", value.GetProperty("token").GetString());
    }

    internal static async Task<Guid> RegisterAndLogin(HttpClient client, string email)
    {
        await Csrf(client);
        var register = await client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest(email, "Usuário teste", Password));
        Assert.Equal(HttpStatusCode.Created, register.StatusCode);
        var data = await register.Content.ReadFromJsonAsync<JsonElement>();
        var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, Password));
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        await Csrf(client);
        return data.GetProperty("id").GetGuid();
    }

    internal static async Task<PagedResponse<TransactionResponse>> List(HttpClient client, string query = "") =>
        (await client.GetFromJsonAsync<PagedResponse<TransactionResponse>>("/api/transactions" + query, Json))!;

    [Fact]
    public async Task SqlServer_CrudAndIsolationBetweenTwoAuthenticatedUsers()
    {
        using var factory = new SqlServerApiFactory();
        await factory.InitializeDatabaseAsync();
        try
        {
            using var a = Client(factory);
            using var b = Client(factory);
            var aId = await RegisterAndLogin(a, "a@example.test");
            var bId = await RegisterAndLogin(b, "b@example.test");
            var payload = new { description = "Salário", amount = 3200.75m, type = "Income", category = "Salary",
                date = "2026-09-08", userId = bId }; // Deliberate owner spoof.
            var create = await a.PostAsJsonAsync("/api/transactions?userId=" + bId, payload);
            Assert.Equal(HttpStatusCode.Created, create.StatusCode);
            var transaction = (await create.Content.ReadFromJsonAsync<TransactionResponse>(Json))!;
            Assert.Equal(aId, transaction.UserId);
            var url = "/api/transactions/" + transaction.Id;
            Assert.Equal(HttpStatusCode.OK, (await a.GetAsync(url)).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await b.GetAsync(url)).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await b.PutAsJsonAsync(url, payload)).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await b.DeleteAsync(url)).StatusCode);
            Assert.Empty((await List(b, "?userId=" + aId)).Items);
            Assert.Equal(HttpStatusCode.NotFound,
                (await b.GetAsync($"/api/users/{aId}/transactions/{transaction.Id}")).StatusCode);
            Assert.Single((await List(a)).Items);
            b.DefaultRequestHeaders.Remove("X-CSRF-TOKEN");
            Assert.Equal(HttpStatusCode.BadRequest, (await b.PostAsJsonAsync("/api/transactions", payload)).StatusCode);
            await Csrf(b);
            var bCreated = await b.PostAsJsonAsync("/api/transactions",
                new { description = "Privado B", amount = 10m, type = "Expense", category = "OtherExpense", date = "2026-09-08", userId = aId });
            Assert.Equal(HttpStatusCode.Created, bCreated.StatusCode);
            var bRow = (await bCreated.Content.ReadFromJsonAsync<TransactionResponse>(Json))!;
            Assert.Equal(bId, bRow.UserId);
            Assert.Equal(HttpStatusCode.NotFound, (await a.GetAsync("/api/transactions/" + bRow.Id)).StatusCode);
            Assert.Single((await List(b)).Items);
            var updated = await a.PutAsJsonAsync(url,
                new { description = "Atualizado", amount = 3500m, type = "Expense", category = "OtherExpense", date = "2026-09-09", userId = bId });
            Assert.Equal(HttpStatusCode.OK, updated.StatusCode);
            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var row = await db.Transactions.AsNoTracking().SingleAsync(x => x.Id == transaction.Id);
                Assert.Equal(3500m, row.Amount);
                Assert.Equal(aId, row.UserId);
                Assert.NotNull(row.UpdatedAt);
                var user = await db.Users.AsNoTracking().SingleAsync(x => x.Id == aId);
                Assert.NotNull(user.PasswordHash);
                Assert.NotEqual(Password, user.PasswordHash);
            }
            Assert.Equal(HttpStatusCode.NoContent, (await a.PostAsync("/api/auth/logout", null)).StatusCode);
            Assert.Equal(HttpStatusCode.Unauthorized, (await a.GetAsync(url)).StatusCode);
            await Csrf(a);
            Assert.Equal(HttpStatusCode.OK, (await a.PostAsJsonAsync("/api/auth/login",
                new LoginRequest("a@example.test", Password))).StatusCode);
            await Csrf(a);
            Assert.Equal(HttpStatusCode.OK, (await a.GetAsync(url)).StatusCode);
            // A fresh browser has no cookies; login recovers the same persisted data.
            using var anotherBrowser = Client(factory);
            Assert.Equal(HttpStatusCode.Unauthorized, (await anotherBrowser.GetAsync(url)).StatusCode);
            await Csrf(anotherBrowser);
            Assert.Equal(HttpStatusCode.OK, (await anotherBrowser.PostAsJsonAsync("/api/auth/login",
                new LoginRequest("a@example.test", Password))).StatusCode);
            Assert.Equal(HttpStatusCode.OK, (await anotherBrowser.GetAsync("/api/auth/me")).StatusCode);
            var restoredRow = Assert.Single((await List(anotherBrowser)).Items);
            Assert.Equal(transaction.Id, restoredRow.Id);
            Assert.Equal(aId, restoredRow.UserId);
            Assert.Equal(3500m, restoredRow.Amount);
            Assert.Equal("Atualizado", restoredRow.Description);
            Assert.Equal(HttpStatusCode.NoContent, (await a.DeleteAsync(url)).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await a.GetAsync(url)).StatusCode);
            Assert.Empty((await List(anotherBrowser)).Items);
            using var finalScope = factory.Services.CreateScope();
            var finalDb = finalScope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.False(await finalDb.Transactions.AnyAsync(x => x.UserId == aId));
            Assert.True(await finalDb.Transactions.AnyAsync(x => x.Id == bRow.Id && x.UserId == bId));
        }
        finally { await factory.DeleteDatabaseAsync(); }
    }

    [Fact]
    public async Task SqlServer_InvalidCredentialsDuplicateAndRevokedSession()
    {
        using var factory = new SqlServerApiFactory();
        await factory.InitializeDatabaseAsync();
        try
        {
            using var client = Client(factory);
            await RegisterAndLogin(client, "login@example.test");
            Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/auth/register",
                new RegisterRequest("LOGIN@example.test", "Duplicado", Password))).StatusCode);
            // Capture the real cookie before logout; replay must fail after stamp revocation.
            using var replay = factory.CreateClient(new()
                { BaseAddress = new Uri("https://localhost"), HandleCookies = false });
            await Csrf(client);
            var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest("login@example.test", Password));
            var cookie = login.Headers.GetValues("Set-Cookie")
                .Single(x => x.StartsWith("ControleFinanceiro.Session=")).Split(';')[0];
            replay.DefaultRequestHeaders.Add("Cookie", cookie);
            Assert.Equal(HttpStatusCode.OK, (await replay.GetAsync("/api/auth/me")).StatusCode);
            await Csrf(client);
            Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsync("/api/auth/logout", null)).StatusCode);
            Assert.Equal(HttpStatusCode.Unauthorized, (await replay.GetAsync("/api/auth/me")).StatusCode);
            await Csrf(client);
            var wrong = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest("login@example.test", "WrongPassword!1"));
            var missing = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest("missing@example.test", Password));
            Assert.Equal(HttpStatusCode.Unauthorized, wrong.StatusCode);
            Assert.Equal(wrong.StatusCode, missing.StatusCode);
            for (var i = 0; i < 4; i++)
                await client.PostAsJsonAsync("/api/auth/login", new LoginRequest("login@example.test", "WrongPassword!1"));
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/auth/login",
                new LoginRequest("login@example.test", Password))).StatusCode);
        }
        finally { await factory.DeleteDatabaseAsync(); }
    }
}
