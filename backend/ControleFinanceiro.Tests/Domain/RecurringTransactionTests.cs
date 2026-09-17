using ControleFinanceiro.Api.Domain;
using ControleFinanceiro.Api.Errors;

namespace ControleFinanceiro.Tests.Domain;

public sealed class RecurringTransactionTests
{
    private static readonly Guid UserId = Guid.Parse("b40d30bc-8e0b-4bb8-b281-f20a69e368aa");
    private static readonly DateTime Now = new(2026, 9, 16, 12, 0, 0, DateTimeKind.Utc);

    [Theory]
    [InlineData(RecurrenceFrequency.Weekly, "2026-09-23")]
    [InlineData(RecurrenceFrequency.Monthly, "2026-10-16")]
    public void Create_WithValidFrequency_SetsNextOccurrence(RecurrenceFrequency frequency, string expected)
    {
        var recurrence = RecurringTransaction.Create(UserId, "Assinatura", 20m,
            TransactionType.Expense, TransactionCategory.Subscriptions, frequency,
            new DateOnly(2026, 9, 16), Now);
        Assert.True(recurrence.IsActive);
        Assert.Equal(DateOnly.Parse(expected), recurrence.NextOccurrenceDate);
    }

    [Fact]
    public void Create_WithInvalidFrequency_ThrowsValidationException()
    {
        Assert.Throws<DomainValidationException>(() => RecurringTransaction.Create(UserId,
            "Assinatura", 20m, TransactionType.Expense, TransactionCategory.Subscriptions,
            (RecurrenceFrequency)99, new DateOnly(2026, 9, 16), Now));
    }

    [Fact]
    public void End_IsIdempotent()
    {
        var recurrence = RecurringTransaction.Create(UserId, "Assinatura", 20m,
            TransactionType.Expense, TransactionCategory.Subscriptions,
            RecurrenceFrequency.Monthly, new DateOnly(2026, 9, 16), Now);
        recurrence.End(Now);
        recurrence.End(Now.AddDays(1));
        Assert.False(recurrence.IsActive);
        Assert.Equal(Now, recurrence.EndedAt);
    }
}
