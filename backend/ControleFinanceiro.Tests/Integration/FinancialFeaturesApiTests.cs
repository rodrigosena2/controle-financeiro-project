using System.Net;
using System.Net.Http.Json;
using ControleFinanceiro.Api.Data;
using ControleFinanceiro.Api.Dtos.Transactions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ControleFinanceiro.Tests.Integration;

public sealed class FinancialFeaturesApiTests
{
    [Fact]
    public async Task SqlServer_FiltersSortingPaginationSummaryAndRecurrenceAreIsolatedAndIdempotent()
    {
        using var factory = new SqlServerApiFactory();
        await factory.InitializeDatabaseAsync();
        try
        {
            using var a = TransactionsApiTests.Client(factory);
            using var b = TransactionsApiTests.Client(factory);
            var aId = await TransactionsApiTests.RegisterAndLogin(a, "finance-a@example.test");
            await TransactionsApiTests.RegisterAndLogin(b, "finance-b@example.test");
            var catalog = await a.GetFromJsonAsync<CategoryCatalogResponse>(
                "/api/transactions/categories", TransactionsApiTests.Json);
            Assert.Contains(catalog!.Income, item => item.Value == "Salary");
            Assert.Contains(catalog.Expense, item => item.Value == "Food");

            await Create(a, "Salário principal", 5000m, "Income", "Salary", "2026-09-01");
            await Create(a, "Mercado Central", 250m, "Expense", "Food", "2026-09-05");
            await Create(a, "Aluguel", 1200m, "Expense", "Housing", "2026-09-10");
            await Create(b, "Mercado de B", 999m, "Expense", "Food", "2026-09-05");

            Assert.Equal(3, (await TransactionsApiTests.List(a,
                "?from=2026-09-01&to=2026-09-30")).TotalItems);
            Assert.Equal(2, (await TransactionsApiTests.List(a, "?type=Expense")).TotalItems);
            Assert.Single((await TransactionsApiTests.List(a, "?category=Food")).Items);
            Assert.Single((await TransactionsApiTests.List(a, "?search=Mercado")).Items);
            var filtered = await TransactionsApiTests.List(a,
                "?from=2026-09-01&to=2026-09-30&type=Expense&category=Food&search=Mercado");
            var only = Assert.Single(filtered.Items);
            Assert.Equal("Mercado Central", only.Description);
            Assert.Equal("Food", only.Category.ToString());
            Assert.Equal(aId, only.UserId);

            var page = await TransactionsApiTests.List(a,
                "?from=2026-09-01&to=2026-09-30&sortBy=Amount&sortDirection=Asc&page=1&pageSize=2");
            Assert.Equal(3, page.TotalItems);
            Assert.Equal(2, page.TotalPages);
            Assert.Equal([250m, 1200m], page.Items.Select(item => item.Amount));
            Assert.Single((await TransactionsApiTests.List(a,
                "?from=2026-09-01&to=2026-09-30&page=2&pageSize=2")).Items);

            var summary = (await a.GetFromJsonAsync<TransactionSummaryResponse>(
                "/api/transactions/summary?from=2026-09-01&to=2026-09-30", TransactionsApiTests.Json))!;
            Assert.Equal(5000m, summary.Income);
            Assert.Equal(1450m, summary.Expense);
            Assert.Equal(3550m, summary.Balance);

            var invalid = await a.PostAsJsonAsync("/api/transactions", new
            {
                description = "Categoria inválida", amount = 10m, type = "Income",
                category = "Food", date = "2026-09-12"
            });
            Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);

            var start = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-14);
            var recurringResponse = await Create(a, "Internet recorrente", 100m, "Expense",
                "Subscriptions", start.ToString("yyyy-MM-dd"), "Weekly");
            Assert.NotNull(recurringResponse.RecurrenceId);
            Assert.True(recurringResponse.IsRecurrenceActive);
            Assert.Equal("Weekly", recurringResponse.RecurrenceFrequency.ToString());

            var firstRead = await TransactionsApiTests.List(a, "?search=Internet&pageSize=50");
            var secondRead = await TransactionsApiTests.List(a, "?search=Internet&pageSize=50");
            Assert.Equal(3, firstRead.TotalItems);
            Assert.Equal(firstRead.TotalItems, secondRead.TotalItems);
            Assert.Equal(3, firstRead.Items.Select(item => item.Date).Distinct().Count());
            Assert.Equal(firstRead.Items.Select(item => item.Date).OrderByDescending(date => date),
                firstRead.Items.Select(item => item.Date));

            var recurrenceUrl = $"/api/transactions/recurrences/{recurringResponse.RecurrenceId}/end";
            Assert.Equal(HttpStatusCode.NotFound, (await b.PostAsync(recurrenceUrl, null)).StatusCode);
            Assert.Equal(HttpStatusCode.NoContent, (await a.PostAsync(recurrenceUrl, null)).StatusCode);
            var ended = await a.GetFromJsonAsync<TransactionResponse>(
                $"/api/transactions/{recurringResponse.Id}", TransactionsApiTests.Json);
            Assert.False(ended!.IsRecurrenceActive);

            var update = await a.PutAsJsonAsync($"/api/transactions/{recurringResponse.Id}", new
            {
                description = "Internet editada", amount = 110m, type = "Expense",
                category = "Subscriptions", date = start.ToString("yyyy-MM-dd")
            });
            Assert.Equal(HttpStatusCode.OK, update.StatusCode);
            Assert.Equal(HttpStatusCode.NoContent,
                (await a.DeleteAsync($"/api/transactions/{recurringResponse.Id}")).StatusCode);

            using var scope = factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.False(await db.Transactions.AnyAsync(item => item.Id == recurringResponse.Id));
            Assert.Equal(2, await db.Transactions.CountAsync(item => item.RecurringTransactionId == recurringResponse.RecurrenceId));
        }
        finally { await factory.DeleteDatabaseAsync(); }
    }

    private static async Task<TransactionResponse> Create(HttpClient client, string description,
        decimal amount, string type, string category, string date, string? recurrenceFrequency = null)
    {
        var response = await client.PostAsJsonAsync("/api/transactions", new
        {
            description, amount, type, category, date, recurrenceFrequency
        });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<TransactionResponse>(TransactionsApiTests.Json))!;
    }
}
