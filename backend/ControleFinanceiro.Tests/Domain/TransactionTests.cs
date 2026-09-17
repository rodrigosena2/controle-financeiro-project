using ControleFinanceiro.Api.Domain;
using ControleFinanceiro.Api.Errors;

namespace ControleFinanceiro.Tests.Domain;

public sealed class TransactionTests
{
    private static readonly Guid UserId = Guid.Parse("99b8760d-0698-4cdf-82cc-b60fa019823a");
    private static readonly DateOnly Date = new(2026, 9, 8);
    private static readonly DateTime UtcNow = new(2026, 9, 8, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Create_WithValidData_CreatesTransaction()
    {
        var transaction = Transaction.Create(
            UserId, "Salário", 2500.50m, TransactionType.Income, TransactionCategory.Salary, Date, UtcNow);

        Assert.NotEqual(Guid.Empty, transaction.Id);
        Assert.Equal(UserId, transaction.UserId);
        Assert.Equal("Salário", transaction.Description);
        Assert.Equal(2500.50m, transaction.Amount);
        Assert.Equal(TransactionType.Income, transaction.Type);
        Assert.Equal(TransactionCategory.Salary, transaction.Category);
        Assert.Equal(Date, transaction.Date);
        Assert.Equal(UtcNow, transaction.CreatedAt);
        Assert.Null(transaction.UpdatedAt);
    }

    [Theory]
    [InlineData("0")]
    [InlineData("-0.01")]
    public void Create_WithInvalidAmount_ThrowsValidationException(string amount)
    {
        var parsedAmount = decimal.Parse(amount, System.Globalization.CultureInfo.InvariantCulture);

        var exception = Assert.Throws<DomainValidationException>(() =>
            Transaction.Create(
                UserId, "Mercado", parsedAmount, TransactionType.Expense, TransactionCategory.Food, Date, UtcNow));

        Assert.Contains("valor", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    [InlineData("ab")]
    public void Create_WithInvalidDescription_ThrowsValidationException(string description)
    {
        var exception = Assert.Throws<DomainValidationException>(() =>
            Transaction.Create(
                UserId, description, 10m, TransactionType.Expense, TransactionCategory.Food, Date, UtcNow));

        Assert.Contains("descrição", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData(TransactionType.Income)]
    [InlineData(TransactionType.Expense)]
    public void Create_WithSupportedType_CreatesTransaction(TransactionType type)
    {
        var category = type == TransactionType.Income ? TransactionCategory.OtherIncome : TransactionCategory.OtherExpense;
        var transaction = Transaction.Create(UserId, "Transação", 10m, type, category, Date, UtcNow);

        Assert.Equal(type, transaction.Type);
    }

    [Fact]
    public void Create_WithUnknownType_ThrowsValidationException()
    {
        Assert.Throws<DomainValidationException>(() =>
            Transaction.Create(UserId, "Transação", 10m, (TransactionType)99, TransactionCategory.OtherIncome, Date, UtcNow));
    }

    [Theory]
    [InlineData(TransactionType.Income, TransactionCategory.Salary)]
    [InlineData(TransactionType.Income, TransactionCategory.Freelance)]
    [InlineData(TransactionType.Expense, TransactionCategory.Food)]
    [InlineData(TransactionType.Expense, TransactionCategory.Subscriptions)]
    public void Create_WithCompatibleCategory_CreatesTransaction(TransactionType type, TransactionCategory category)
    {
        var transaction = Transaction.Create(UserId, "Transação", 10m, type, category, Date, UtcNow);
        Assert.Equal(category, transaction.Category);
    }

    [Theory]
    [InlineData(TransactionType.Income, TransactionCategory.Food)]
    [InlineData(TransactionType.Expense, TransactionCategory.Salary)]
    [InlineData(TransactionType.Expense, (TransactionCategory)999)]
    public void Create_WithInvalidCategory_ThrowsValidationException(TransactionType type, TransactionCategory category)
    {
        var exception = Assert.Throws<DomainValidationException>(() =>
            Transaction.Create(UserId, "Transação", 10m, type, category, Date, UtcNow));
        Assert.Contains("categoria", exception.Message, StringComparison.OrdinalIgnoreCase);
    }
}
