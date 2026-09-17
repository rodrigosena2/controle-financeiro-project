using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Reflection;
using ControleFinanceiro.Api.Dtos.Transactions;

namespace ControleFinanceiro.Tests.Domain;

public sealed class TransactionRequestValidationTests
{
    [Theory]
    [InlineData("pt-BR")]
    [InlineData("en-US")]
    public void AmountRangeIsIndependentOfServerCulture(string culture)
    {
        var previous = CultureInfo.CurrentCulture;
        try
        {
            CultureInfo.CurrentCulture = CultureInfo.GetCultureInfo(culture);
            foreach (var dto in new[] { typeof(CreateTransactionRequest), typeof(UpdateTransactionRequest) })
            {
                // MVC reads validation attributes from positional record parameters.
                var range = dto.GetConstructors().Single().GetParameters()
                    .Single(p => p.Name == "Amount").GetCustomAttribute<RangeAttribute>()!;
                Assert.True(range.IsValid(0.01m));
                Assert.True(range.IsValid(3200.75m));
                Assert.True(range.IsValid(999999999999999.99m));
                Assert.False(range.IsValid(0m));
                Assert.False(range.IsValid(-1m));
                Assert.False(range.IsValid(1000000000000000m));
            }
        }
        finally
        {
            CultureInfo.CurrentCulture = previous;
        }
    }
}
