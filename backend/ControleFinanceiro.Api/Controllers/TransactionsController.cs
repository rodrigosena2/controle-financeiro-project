using System.Security.Claims;
using ControleFinanceiro.Api.Dtos.Transactions;
using ControleFinanceiro.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace ControleFinanceiro.Api.Controllers;
[ApiController]
[Authorize]
[Route("api/transactions")]
public sealed class TransactionsController(ITransactionService service) : ControllerBase
{
    private Guid OwnerId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] TransactionQuery query, CancellationToken ct) =>
        Ok(await service.GetAllAsync(OwnerId, query, ct));
    [HttpGet("summary")]
    public async Task<IActionResult> Summary([FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken ct) =>
        Ok(await service.GetSummaryAsync(OwnerId, from, to, ct));
    [HttpGet("categories")]
    public IActionResult Categories() => Ok(service.GetCategories());
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct) =>
        Ok(await service.GetByIdAsync(OwnerId, id, ct));
    [HttpPost]
    public async Task<IActionResult> Create(CreateTransactionRequest request, CancellationToken ct)
    {
        var result = await service.CreateAsync(OwnerId, request, ct);
        return CreatedAtAction(nameof(Get), new { id = result.Id }, result);
    }
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateTransactionRequest request, CancellationToken ct) =>
        Ok(await service.UpdateAsync(OwnerId, id, request, ct));
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await service.DeleteAsync(OwnerId, id, ct);
        return NoContent();
    }
    [HttpPost("recurrences/{recurrenceId:guid}/end")]
    public async Task<IActionResult> EndRecurrence(Guid recurrenceId, CancellationToken ct)
    {
        await service.EndRecurrenceAsync(OwnerId, recurrenceId, ct);
        return NoContent();
    }
}
