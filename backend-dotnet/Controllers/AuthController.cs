using Microsoft.AspNetCore.Mvc;
using ChatComunitario.DTOs;
using ChatComunitario.Interfaces;

namespace ChatComunitario.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IWebHostEnvironment _environment;


    public AuthController(IAuthService authService,
        IWebHostEnvironment environment
    )
    {
        _authService = authService;
        _environment = environment;

    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        string? imagePath = null;
        // Procesar imagen Base64 si existe
        if (!string.IsNullOrEmpty(dto.ProfileImg) && dto.ProfileImg.StartsWith("data:image"))
        {
            imagePath = await SaveBase64ImageAsync(dto.ProfileImg, dto.Cedula);

            // No guardar el Base64 en la BD, solo la ruta
            dto.ProfileImg = imagePath;
        }

        var (success, token, userResponse, message) = await _authService.RegisterAsync(dto);

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

    // Método para guardar imagen Base64
    private async Task<string> SaveBase64ImageAsync(string base64Image, string cedula)
    {
        try
        {
            // Extraer la parte Base64 (remover "data:image/...;base64,")
            var base64Data = base64Image.Substring(base64Image.IndexOf(",") + 1);

            // Obtener el tipo de imagen del header
            var imageType = GetImageTypeFromBase64(base64Image);

            // Convertir Base64 a bytes
            var imageBytes = Convert.FromBase64String(base64Data);

            // Guardar archivo
            return await SaveImageFileAsync(imageBytes, cedula, imageType);
        }
        catch (Exception ex)
        {
            // Log error pero continuar sin imagen
            Console.WriteLine($"Error guardando imagen Base64: {ex.Message}");
            return null;
        }
    }

    // Método común para guardar archivo
    private async Task<string> SaveImageFileAsync(byte[] imageBytes, string cedula, string imageType)
    {
        // Crear nombre único para el archivo
        var fileName = $"profile_{cedula}_{Guid.NewGuid():N}.{imageType}";

        // Definir la carpeta de uploads
        var uploadsFolder = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads", "profiles");

        // Asegurar que el directorio existe
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        // Ruta completa del archivo
        var filePath = Path.Combine(uploadsFolder, fileName);

        // Guardar archivo
        await System.IO.File.WriteAllBytesAsync(filePath, imageBytes);

        // Devolver ruta relativa para almacenar en BD
        // Por ejemplo: "/uploads/profiles/filename.jpg"
        return $"/uploads/profiles/{fileName}";
    }

    private string GetImageTypeFromBase64(string base64)
    {
        if (base64.StartsWith("data:image/jpeg") || base64.StartsWith("data:image/jpg"))
            return "jpg";
        if (base64.StartsWith("data:image/png"))
            return "png";
        if (base64.StartsWith("data:image/gif"))
            return "gif";
        if (base64.StartsWith("data:image/webp"))
            return "webp";

        return "jpg"; // default
    }

}

