using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
namespace ControleFinanceiro.Api.Security;

// Action filter runs after authorization: unauthenticated financial requests return 401.
public sealed class AntiforgeryFilter(IAntiforgery antiforgery) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var method = context.HttpContext.Request.Method;
        if (!HttpMethods.IsGet(method) && !HttpMethods.IsHead(method) && !HttpMethods.IsOptions(method))
        {
            try { await antiforgery.ValidateRequestAsync(context.HttpContext); }
            catch (AntiforgeryValidationException)
            {
                context.Result = new ObjectResult(new ProblemDetails
                {
                    Status = 400, Title = "Token CSRF ausente ou inválido."
                }) { StatusCode = 400 };
                return;
            }
        }
        await next();
    }
}
