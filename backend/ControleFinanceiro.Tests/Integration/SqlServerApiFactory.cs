using ControleFinanceiro.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.DataProtection;

namespace ControleFinanceiro.Tests.Integration;

public sealed class SqlServerApiFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"ControleFinanceiroTests_{Guid.NewGuid():N}";

    public string ConnectionString
    {
        get
        {
            var baseConnection = Environment.GetEnvironmentVariable("CONTROLE_FINANCEIRO_TEST_SQL")
                ?? "Server=(localdb)\\MSSQLLocalDB;Database=master;Trusted_Connection=True;Encrypt=False";
            var builder = new SqlConnectionStringBuilder(baseConnection)
            {
                InitialCatalog = _databaseName
            };
            return builder.ConnectionString;
        }
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureLogging(logging => { logging.ClearProviders(); logging.AddConsole(); });
        builder.ConfigureServices(services => services.AddDataProtection().UseEphemeralDataProtectionProvider());
        builder.UseSetting("ConnectionStrings:DefaultConnection", ConnectionString);
    }

    public async Task InitializeDatabaseAsync()
    {
        using var scope = Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();
    }

    public async Task DeleteDatabaseAsync()
    {
        using var scope = Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.EnsureDeletedAsync();
    }
}
