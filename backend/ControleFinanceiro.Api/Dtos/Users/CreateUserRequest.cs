using System.ComponentModel.DataAnnotations;

namespace ControleFinanceiro.Api.Dtos.Users;

public sealed record CreateUserRequest(
    [Required, EmailAddress, MaxLength(254)] string Email,
    [Required, MinLength(2), MaxLength(100)] string DisplayName);
