using GitVault.Api.Extensions;
using GitVault.Core.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GitVault.Api.Controllers;

[ApiController]
[Authorize(AuthenticationSchemes = "Firebase,ApiKey")]
[Route("v1/[controller]")]
[Produces("application/json")]
public abstract class BaseApiController : ControllerBase
{
    protected string CurrentUserId => User.UserId();

    protected IActionResult FromResult<T>(Result<T> result)
    {
        if (result.IsSuccess) return Ok(result.Value);

        return result.ErrorCode switch
        {
            ErrorCodes.NotFound => NotFound(new { error = result.ErrorCode, message = result.ErrorMessage }),
            ErrorCodes.Unauthorized => Unauthorized(new { error = result.ErrorCode, message = result.ErrorMessage }),
            ErrorCodes.Forbidden => Forbid(),
            ErrorCodes.Conflict => Conflict(new { error = result.ErrorCode, message = result.ErrorMessage }),
            ErrorCodes.FileTooLarge => BadRequest(new { error = result.ErrorCode, message = result.ErrorMessage }),
            ErrorCodes.RateLimitExceeded => StatusCode(429, new { error = result.ErrorCode, message = result.ErrorMessage }),
            _ => StatusCode(500, new { error = result.ErrorCode, message = result.ErrorMessage })
        };
    }

    protected bool HasScope(string scope) => User.HasScope(scope);
}
