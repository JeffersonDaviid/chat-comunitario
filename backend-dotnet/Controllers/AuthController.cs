using Microsoft.AspNetCore.Mvc;
using ChatComunitario.DTOs;
using ChatComunitario.Interfaces;

namespace ChatComunitario.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromForm] RegisterDto dto)
    {
        var (success, token, userResponse, message) = await _authService.RegisterAsync(dto);

        if (!success)
        {
            return BadRequest(new { success, message });
        }

        return Ok(new
        {
            success,
            message,
            token,
            user = userResponse
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var (success, token, userResponse, message) = await _authService.LoginAsync(dto);

        if (!success)
        {
            return Unauthorized(new { success, message });
        }

        return Ok(new
        {
            success,
            message,
            token,
            user = userResponse
        });
    }

    [HttpGet("communities/{communityId}/channels/{channelId}/messages")]
    public async Task<IActionResult> GetChannelMessages(Guid communityId, Guid channelId)
    {
        var (success, messages, message) = await _authService.GetChannelMessagesAsync(channelId);

        if (!success)
        {
            return BadRequest(new { success, message });
        }

        return Ok(new { success, message, messages });
    }
}

