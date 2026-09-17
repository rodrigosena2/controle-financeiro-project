using ControleFinanceiro.Api.Data;
using ControleFinanceiro.Api.Domain;
using ControleFinanceiro.Api.Dtos.Transactions;
using ControleFinanceiro.Api.Errors;
using Microsoft.EntityFrameworkCore;

namespace ControleFinanceiro.Api.Services;

public sealed class TransactionService(AppDbContext dbContext) : ITransactionService
{
    public async Task<PagedResponse<TransactionResponse>> GetAllAsync(
        Guid userId, TransactionQuery query, CancellationToken cancellationToken)
    {
        ValidatePeriod(query.From, query.To);
        ValidateCategoryFilter(query.Type, query.Category);
        await MaterializeDueOccurrencesAsync(userId, cancellationToken);

        var filtered = ApplyFilters(dbContext.Transactions.AsNoTracking()
            .Include(transaction => transaction.RecurringTransaction)
            .Where(transaction => transaction.UserId == userId), query);
        var totalItems = await filtered.CountAsync(cancellationToken);
        var entities = await ApplyOrdering(filtered, query.SortBy, query.SortDirection)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);
        var items = entities.Select(ToResponse).ToList();
        var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)query.PageSize);
        return new PagedResponse<TransactionResponse>(items, query.Page, query.PageSize, totalItems, totalPages);
    }

    public async Task<TransactionSummaryResponse> GetSummaryAsync(
        Guid userId, DateOnly? from, DateOnly? to, CancellationToken cancellationToken)
    {
        ValidatePeriod(from, to);
        await MaterializeDueOccurrencesAsync(userId, cancellationToken);
        var query = dbContext.Transactions.AsNoTracking().Where(transaction => transaction.UserId == userId);
        if (from.HasValue) query = query.Where(transaction => transaction.Date >= from.Value);
        if (to.HasValue) query = query.Where(transaction => transaction.Date <= to.Value);
        var income = await query.Where(transaction => transaction.Type == TransactionType.Income)
            .SumAsync(transaction => (decimal?)transaction.Amount, cancellationToken) ?? 0m;
        var expense = await query.Where(transaction => transaction.Type == TransactionType.Expense)
            .SumAsync(transaction => (decimal?)transaction.Amount, cancellationToken) ?? 0m;
        return new TransactionSummaryResponse(from, to, income, expense, income - expense);
    }

    public CategoryCatalogResponse GetCategories()
    {
        static CategoryOptionResponse Option(TransactionCategory category) =>
            new(category.ToString(), TransactionCategoryRules.Label(category));
        return new CategoryCatalogResponse(
            [Option(TransactionCategory.Salary), Option(TransactionCategory.Freelance),
                Option(TransactionCategory.Investments), Option(TransactionCategory.OtherIncome)],
            [Option(TransactionCategory.Food), Option(TransactionCategory.Housing),
                Option(TransactionCategory.Transportation), Option(TransactionCategory.Health),
                Option(TransactionCategory.Education), Option(TransactionCategory.Leisure),
                Option(TransactionCategory.Subscriptions), Option(TransactionCategory.OtherExpense)]);
    }

    public async Task<TransactionResponse> GetByIdAsync(
        Guid userId, Guid id, CancellationToken cancellationToken) =>
        ToResponse(await FindAsync(userId, id, false, cancellationToken));

    public async Task<TransactionResponse> CreateAsync(
        Guid userId, CreateTransactionRequest request, CancellationToken cancellationToken)
    {
        if (!await dbContext.Users.AnyAsync(user => user.Id == userId, cancellationToken))
            throw new NotFoundException("Usuário não encontrado.");

        var utcNow = DateTime.UtcNow;
        RecurringTransaction? recurrence = null;
        if (request.RecurrenceFrequency.HasValue)
        {
            recurrence = RecurringTransaction.Create(userId, request.Description, request.Amount,
                request.Type, request.Category, request.RecurrenceFrequency.Value, request.Date, utcNow);
            dbContext.RecurringTransactions.Add(recurrence);
        }
        var transaction = Transaction.Create(userId, request.Description, request.Amount,
            request.Type, request.Category, request.Date, utcNow, recurrence?.Id);
        dbContext.Transactions.Add(transaction);
        if (recurrence is not null) AddDueOccurrences(recurrence, DateOnly.FromDateTime(utcNow));
        await dbContext.SaveChangesAsync(cancellationToken);
        if (recurrence is not null)
            transaction = await FindAsync(userId, transaction.Id, false, cancellationToken);
        return ToResponse(transaction);
    }

    public async Task<TransactionResponse> UpdateAsync(
        Guid userId, Guid id, UpdateTransactionRequest request, CancellationToken cancellationToken)
    {
        var transaction = await FindAsync(userId, id, true, cancellationToken);
        transaction.Update(request.Description, request.Amount, request.Type, request.Category,
            request.Date, DateTime.UtcNow);
        await dbContext.SaveChangesAsync(cancellationToken);
        return ToResponse(transaction);
    }

    public async Task DeleteAsync(Guid userId, Guid id, CancellationToken cancellationToken)
    {
        var transaction = await FindAsync(userId, id, true, cancellationToken);
        dbContext.Transactions.Remove(transaction);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task EndRecurrenceAsync(Guid userId, Guid recurrenceId, CancellationToken cancellationToken)
    {
        var recurrence = await dbContext.RecurringTransactions.SingleOrDefaultAsync(
            item => item.Id == recurrenceId && item.UserId == userId, cancellationToken)
            ?? throw new NotFoundException("Recorrência não encontrada.");
        recurrence.End(DateTime.UtcNow);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task MaterializeDueOccurrencesAsync(Guid userId, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var recurrences = await dbContext.RecurringTransactions
            .Where(item => item.UserId == userId && item.IsActive && item.NextOccurrenceDate <= today)
            .ToListAsync(cancellationToken);
        foreach (var recurrence in recurrences) AddDueOccurrences(recurrence, today);
        if (recurrences.Count > 0) await dbContext.SaveChangesAsync(cancellationToken);
    }

    private void AddDueOccurrences(RecurringTransaction recurrence, DateOnly through)
    {
        while (recurrence.IsActive && recurrence.NextOccurrenceDate <= through)
        {
            var date = recurrence.NextOccurrenceDate;
            dbContext.Transactions.Add(Transaction.Create(recurrence.UserId, recurrence.Description,
                recurrence.Amount, recurrence.Type, recurrence.Category, date, DateTime.UtcNow, recurrence.Id));
            recurrence.Advance();
        }
    }

    private static IQueryable<Transaction> ApplyFilters(IQueryable<Transaction> query, TransactionQuery filters)
    {
        if (filters.From.HasValue) query = query.Where(item => item.Date >= filters.From.Value);
        if (filters.To.HasValue) query = query.Where(item => item.Date <= filters.To.Value);
        if (filters.Type.HasValue) query = query.Where(item => item.Type == filters.Type.Value);
        if (filters.Category.HasValue) query = query.Where(item => item.Category == filters.Category.Value);
        if (!string.IsNullOrWhiteSpace(filters.Search))
        {
            var search = filters.Search.Trim();
            query = query.Where(item => item.Description.Contains(search));
        }
        return query;
    }

    private static IOrderedQueryable<Transaction> ApplyOrdering(IQueryable<Transaction> query,
        TransactionSortBy sortBy, SortDirection direction)
    {
        var ascending = direction == SortDirection.Asc;
        IOrderedQueryable<Transaction> ordered = sortBy switch
        {
            TransactionSortBy.Amount => ascending ? query.OrderBy(item => item.Amount) : query.OrderByDescending(item => item.Amount),
            TransactionSortBy.Description => ascending ? query.OrderBy(item => item.Description) : query.OrderByDescending(item => item.Description),
            _ => ascending ? query.OrderBy(item => item.Date) : query.OrderByDescending(item => item.Date)
        };
        return ordered.ThenByDescending(item => item.CreatedAt).ThenByDescending(item => item.Id);
    }

    private async Task<Transaction> FindAsync(Guid userId, Guid id, bool asTracking,
        CancellationToken cancellationToken)
    {
        IQueryable<Transaction> query = dbContext.Transactions.Include(item => item.RecurringTransaction);
        if (!asTracking) query = query.AsNoTracking();
        return await query.SingleOrDefaultAsync(item => item.Id == id && item.UserId == userId, cancellationToken)
            ?? throw new NotFoundException("Transação não encontrada.");
    }

    private static void ValidatePeriod(DateOnly? from, DateOnly? to)
    {
        if (from.HasValue && to.HasValue && from.Value > to.Value)
            throw new DomainValidationException("A data inicial deve ser anterior ou igual à data final.");
    }

    private static void ValidateCategoryFilter(TransactionType? type, TransactionCategory? category)
    {
        if (type.HasValue && category.HasValue && !TransactionCategoryRules.IsCompatible(category.Value, type.Value))
            throw new DomainValidationException("A categoria não é compatível com o tipo informado.");
    }

    private static TransactionResponse ToResponse(Transaction transaction) => new(
        transaction.Id, transaction.UserId, transaction.Description, transaction.Amount,
        transaction.Type, transaction.Category, transaction.Date, transaction.CreatedAt,
        transaction.UpdatedAt, transaction.RecurringTransactionId,
        transaction.RecurringTransaction == null ? null : transaction.RecurringTransaction.Frequency,
        transaction.RecurringTransaction != null && transaction.RecurringTransaction.IsActive,
        transaction.RecurringTransaction == null ? null : transaction.RecurringTransaction.NextOccurrenceDate);

}
