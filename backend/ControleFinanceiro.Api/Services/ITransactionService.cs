using ControleFinanceiro.Api.Dtos.Transactions;

namespace ControleFinanceiro.Api.Services;

public interface ITransactionService
{
    Task<PagedResponse<TransactionResponse>> GetAllAsync(Guid userId, TransactionQuery query, CancellationToken cancellationToken);
    Task<TransactionSummaryResponse> GetSummaryAsync(Guid userId, DateOnly? from, DateOnly? to, CancellationToken cancellationToken);
    CategoryCatalogResponse GetCategories();
    Task<TransactionResponse> GetByIdAsync(Guid userId, Guid id, CancellationToken cancellationToken);
    Task<TransactionResponse> CreateAsync(Guid userId, CreateTransactionRequest request, CancellationToken cancellationToken);
    Task<TransactionResponse> UpdateAsync(Guid userId, Guid id, UpdateTransactionRequest request, CancellationToken cancellationToken);
    Task DeleteAsync(Guid userId, Guid id, CancellationToken cancellationToken);
    Task EndRecurrenceAsync(Guid userId, Guid recurrenceId, CancellationToken cancellationToken);
}
