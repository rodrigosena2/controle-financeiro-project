using System.ComponentModel.DataAnnotations;
using ControleFinanceiro.Api.Domain;

namespace ControleFinanceiro.Api.Dtos.Transactions;

public enum TransactionSortBy { Date, Amount, Description }
public enum SortDirection { Asc, Desc }

public sealed class TransactionQuery
{
    public DateOnly? From { get; init; }
    public DateOnly? To { get; init; }
    public TransactionType? Type { get; init; }
    public TransactionCategory? Category { get; init; }
    [MaxLength(200)] public string? Search { get; init; }
    public TransactionSortBy SortBy { get; init; } = TransactionSortBy.Date;
    public SortDirection SortDirection { get; init; } = SortDirection.Desc;
    [Range(1, int.MaxValue)] public int Page { get; init; } = 1;
    [Range(1, 50)] public int PageSize { get; init; } = 10;
}
