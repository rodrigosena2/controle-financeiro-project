using System.ComponentModel.DataAnnotations;
using ControleFinanceiro.Api.Domain;

namespace ControleFinanceiro.Api.Dtos.Transactions;

public sealed record CreateTransactionRequest(
    [Required, MinLength(3), MaxLength(200)] string Description,
    [Range(typeof(decimal), "0.01", "999999999999999.99", ParseLimitsInInvariantCulture = true)] decimal Amount,
    TransactionType Type,
    TransactionCategory Category,
    DateOnly Date,
    RecurrenceFrequency? RecurrenceFrequency = null);
