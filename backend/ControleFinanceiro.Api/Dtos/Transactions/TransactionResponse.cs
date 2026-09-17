using ControleFinanceiro.Api.Domain;

namespace ControleFinanceiro.Api.Dtos.Transactions;

public sealed record TransactionResponse(
    Guid Id,
    Guid UserId,
    string Description,
    decimal Amount,
    TransactionType Type,
    TransactionCategory Category,
    DateOnly Date,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    Guid? RecurrenceId,
    RecurrenceFrequency? RecurrenceFrequency,
    bool IsRecurrenceActive,
    DateOnly? NextOccurrenceDate);
