namespace ControleFinanceiro.Api.Errors;

public sealed class NotFoundException(string message) : Exception(message);
