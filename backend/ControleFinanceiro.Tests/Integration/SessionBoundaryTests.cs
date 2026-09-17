using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using ControleFinanceiro.Api.Controllers;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ControleFinanceiro.Tests.Integration;

public sealed class SessionBoundaryTests
{
    [Theory]
    [InlineData("GET")]
    [InlineData("POST")]
    [InlineData("PUT")]
    [InlineData("DELETE")]
    public async Task UnauthenticatedFinancialRequestsReturn401(string method)
    {
        using var factory = new SqlServerApiFactory();
        using var client = TransactionsApiTests.Client(factory);
        var path = method is "GET" or "POST" ? "/api/transactions" : "/api/transactions/" + Guid.NewGuid();
        using var request = new HttpRequestMessage(new HttpMethod(method), path);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.SendAsync(request)).StatusCode);
    }

    [Fact]
    public async Task InvalidAndExpiredCookiesAreRejected()
    {
        using var factory = new SqlServerApiFactory();
        using var client = factory.CreateClient(new()
            { BaseAddress = new Uri("https://localhost"), HandleCookies = false });
        client.DefaultRequestHeaders.Add("Cookie", "ControleFinanceiro.Session=invalid");
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/auth/me")).StatusCode);
        var options = factory.Services.GetRequiredService<IOptionsMonitor<CookieAuthenticationOptions>>()
            .Get(IdentityConstants.ApplicationScheme);
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(new ClaimsIdentity(
            new[] { new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()) },
            IdentityConstants.ApplicationScheme)),
            new AuthenticationProperties { IssuedUtc = DateTimeOffset.UtcNow.AddHours(-2),
                ExpiresUtc = DateTimeOffset.UtcNow.AddHours(-1) }, IdentityConstants.ApplicationScheme);
        client.DefaultRequestHeaders.Remove("Cookie");
        client.DefaultRequestHeaders.Add("Cookie", "ControleFinanceiro.Session=" + options.TicketDataFormat.Protect(ticket));
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/transactions")).StatusCode);
        Assert.Equal(TimeSpan.FromMinutes(30), options.ExpireTimeSpan);
        Assert.False(options.SlidingExpiration);
        Assert.True(options.Cookie.HttpOnly);
        Assert.Equal(Microsoft.AspNetCore.Http.CookieSecurePolicy.Always, options.Cookie.SecurePolicy);
    }

    [Theory]
    [InlineData("register")]
    [InlineData("login")]
    public async Task AuthWritesRequireCsrf(string action)
    {
        using var factory = new SqlServerApiFactory();
        using var client = TransactionsApiTests.Client(factory);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/auth/" + action,
            new RegisterRequest("a@example.test", "Teste", TransactionsApiTests.Password))).StatusCode);
    }

    [Theory]
    [InlineData("invalid", "BoaSenha!12345")]
    [InlineData("a@example.test", "short")]
    public async Task InvalidRegistrationReturns400WithoutDatabase(string email, string password)
    {
        using var factory = new SqlServerApiFactory();
        using var client = TransactionsApiTests.Client(factory);
        await TransactionsApiTests.Csrf(client);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest(email, "Teste", password))).StatusCode);
    }
}
