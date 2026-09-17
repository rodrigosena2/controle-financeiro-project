using ControleFinanceiro.Api.Errors;

namespace ControleFinanceiro.Api.Domain;

public sealed class RecurringTransaction
{
    private RecurringTransaction() { }

    private RecurringTransaction(Guid id, Guid userId, string description, decimal amount,
        TransactionType type, TransactionCategory category, RecurrenceFrequency frequency,
        DateOnly nextOccurrenceDate, DateTime createdAt)
    {
        Id = id;
        UserId = userId;
        Description = description.Trim();
        Amount = amount;
        Type = type;
        Category = category;
        Frequency = frequency;
        NextOccurrenceDate = nextOccurrenceDate;
        IsActive = true;
        CreatedAt = createdAt;
    }

    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public decimal Amount { get; private set; }
    public TransactionType Type { get; private set; }
    public TransactionCategory Category { get; private set; }
    public RecurrenceFrequency Frequency { get; private set; }
    public DateOnly NextOccurrenceDate { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? EndedAt { get; private set; }
    public User User { get; private set; } = null!;
    public ICollection<Transaction> Transactions { get; private set; } = [];

    public static RecurringTransaction Create(Guid userId, string description, decimal amount,
        TransactionType type, TransactionCategory category, RecurrenceFrequency frequency,
        DateOnly firstOccurrence, DateTime utcNow)
    {
        Transaction.Validate(userId, description, amount, type, category, firstOccurrence);
        if (!Enum.IsDefined(frequency))
            throw new DomainValidationException("A recorrência deve ser Weekly ou Monthly.");

        return new RecurringTransaction(Guid.NewGuid(), userId, description, amount, type,
            category, frequency, Next(firstOccurrence, frequency), utcNow);
    }

    public void Advance() => NextOccurrenceDate = Next(NextOccurrenceDate, Frequency);

    public void End(DateTime utcNow)
    {
        if (!IsActive) return;
        IsActive = false;
        EndedAt = utcNow;
    }

    private static DateOnly Next(DateOnly date, RecurrenceFrequency frequency) => frequency switch
    {
        RecurrenceFrequency.Weekly => date.AddDays(7),
        RecurrenceFrequency.Monthly => date.AddMonths(1),
        _ => throw new DomainValidationException("A recorrência deve ser Weekly ou Monthly.")
    };
}
