namespace ControleFinanceiro.Api.Dtos.Transactions;

public sealed record CategoryOptionResponse(string Value, string Label);

public sealed record CategoryCatalogResponse(
    IReadOnlyList<CategoryOptionResponse> Income,
    IReadOnlyList<CategoryOptionResponse> Expense);
