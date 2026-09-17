using ControleFinanceiro.Api.Errors;

namespace ControleFinanceiro.Api.Domain;

public sealed class Transaction
{
    private Transaction() { }

    private Transaction(
        Guid id,
        Guid userId,
        string description,
        decimal amount,
        TransactionType type,
        TransactionCategory category,
        DateOnly date,
        DateTime createdAt,
        Guid? recurringTransactionId)
    {
        Id = id;
        UserId = userId;
        Description = description;
        Amount = amount;
        Type = type;
        Category = category;
        Date = date;
        CreatedAt = createdAt;
        RecurringTransactionId = recurringTransactionId;
    }

    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public decimal Amount { get; private set; }
    public TransactionType Type { get; private set; }
    public TransactionCategory Category { get; private set; }
    public DateOnly Date { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }
    public User User { get; private set; } = null!;
    public Guid? RecurringTransactionId { get; private set; }
    public RecurringTransaction? RecurringTransaction { get; private set; }

    public static Transaction Create(
        Guid userId,
        string description,
        decimal amount,
        TransactionType type,
        TransactionCategory category,
        DateOnly date,
        DateTime utcNow,
        Guid? recurringTransactionId = null)
    {
        Validate(userId, description, amount, type, category, date);

        return new Transaction(
            Guid.NewGuid(), userId, description.Trim(), amount, type, category, date, utcNow,
            recurringTransactionId);
    }

    public void Update(
        string description,
        decimal amount,
        TransactionType type,
        TransactionCategory category,
        DateOnly date,
        DateTime utcNow)
    {
        Validate(UserId, description, amount, type, category, date);

        Description = description.Trim();
        Amount = amount;
        Type = type;
        Category = category;
        Date = date;
        UpdatedAt = utcNow;
    }

    internal static void Validate(
        Guid userId,
        string description,
        decimal amount,
        TransactionType type,
        TransactionCategory category,
        DateOnly date)
    {
        if (userId == Guid.Empty)
        {
            throw new DomainValidationException("O usuário é obrigatório.");
        }

        var cleanDescription = description?.Trim() ?? string.Empty;
        if (cleanDescription.Length is < 3 or > 200)
        {
            throw new DomainValidationException("A descrição deve possuir entre 3 e 200 caracteres.");
        }

        if (amount <= 0 || amount > 999_999_999_999_999.99m)
        {
            throw new DomainValidationException("O valor deve ser positivo e compatível com o limite monetário.");
        }

        if (!Enum.IsDefined(type))
        {
            throw new DomainValidationException("O tipo da transação deve ser Income ou Expense.");
        }

        if (!Enum.IsDefined(category) || !TransactionCategoryRules.IsCompatible(category, type))
        {
            throw new DomainValidationException("A categoria não é compatível com o tipo da transação.");
        }

        if (date == default)
        {
            throw new DomainValidationException("A data da transação é obrigatória.");
        }
    }
}
