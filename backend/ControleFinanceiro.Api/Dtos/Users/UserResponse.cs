namespace ControleFinanceiro.Api.Dtos.Users;

public sealed record UserResponse(
    Guid Id,
    string Email,
    string DisplayName,
    DateTime CreatedAt);
