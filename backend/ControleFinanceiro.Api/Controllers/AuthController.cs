using System.ComponentModel.DataAnnotations;
using ControleFinanceiro.Api.Domain;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ControleFinanceiro.Api.Controllers;

public sealed record RegisterRequest(
    [Required, EmailAddress, MaxLength(254)] string Email,
    [Required, MinLength(2), MaxLength(100)] string DisplayName,
    [Required, MinLength(12), MaxLength(128)] string Password);
public sealed record LoginRequest(
    [Required, EmailAddress, MaxLength(254)] string Email,
    [Required, MaxLength(128)] string Password);

[ApiController]
[Route("api/auth")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class AuthController(UserManager<User> users, SignInManager<User> signIn,
    IAntiforgery antiforgery) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("csrf")]
    public IActionResult Csrf() => Ok(new { token = antiforgery.GetAndStoreTokens(HttpContext).RequestToken });

    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var email = request.Email.Trim();
        var user = new User
        {
            Id = Guid.NewGuid(), UserName = email, Email = email,
            DisplayName = request.DisplayName.Trim(), CreatedAt = DateTime.UtcNow
        };
        if (user.DisplayName.Length < 2)
            return Problem(statusCode: 400, title: "Nome inválido.");
        var result = await users.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            // No account enumeration through Identity's duplicate-email messages.
            return Problem(statusCode: 400, title: "Cadastro não realizado.",
                detail: "Verifique o e-mail e a política de senha ou tente entrar.");
        }
        return StatusCode(201, new { user.Id, user.Email, user.DisplayName });
    }

    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var user = await users.FindByEmailAsync(request.Email.Trim());
        var result = user is null ? Microsoft.AspNetCore.Identity.SignInResult.Failed
            : await signIn.PasswordSignInAsync(user, request.Password, false, lockoutOnFailure: true);
        if (!result.Succeeded)
            return Problem(statusCode: 401, title: "E-mail ou senha inválidos.");
        return Ok(new { user!.Id, user.Email, user.DisplayName });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user = await users.GetUserAsync(User);
        return user is null ? Unauthorized() : Ok(new { user.Id, user.Email, user.DisplayName });
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var user = await users.GetUserAsync(User);
        // Revoke copied cookies too; deliberately closes all sessions for this user.
        if (user is not null)
            await users.UpdateSecurityStampAsync(user);
        await signIn.SignOutAsync();
        return NoContent();
    }
}
