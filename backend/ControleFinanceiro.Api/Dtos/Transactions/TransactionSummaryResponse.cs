namespace ControleFinanceiro.Api.Dtos.Transactions;

public sealed record TransactionSummaryResponse(
    DateOnly? From,
    DateOnly? To,
    decimal Income,
    decimal Expense,
    decimal Balance);
