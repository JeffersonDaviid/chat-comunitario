using ChatComunitario.DTOs;
using ChatComunitario.Interfaces;

namespace ChatComunitario.SoapServices;

/// <summary>
/// Implementación del servicio SOAP de autenticación
/// </summary>
public class AuthSoapService : IAuthSoapService
{
    private readonly IAuthService _authService;

    public AuthSoapService(IAuthService authService)
    {
        _authService = authService;
    }

    public async Task<RegisterResponse> Register(RegisterRequest request)
    {
        // Procesar imagen Base64 si existe
        string? profilePath = null;
        if (!string.IsNullOrEmpty(request.ProfilePictureBase64))
        {
            try
            {
                profilePath = await SaveBase64ImageAsync(
                    request.ProfilePictureBase64,
                    request.Cedula,
                    request.ProfilePictureExtension ?? ".jpg"
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error guardando imagen: {ex.Message}");
            }
        }

        var dto = new RegisterDto
        {
            Cedula = request.Cedula,
            Name = request.Name,
            LastName = request.LastName,
            Email = request.Email,
            Password = request.Password,
            ConfirmPassword = request.ConfirmPassword,
            Phone = request.Phone,
            Address = request.Address,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            ProfileImg = profilePath // Agregar la ruta de la imagen
        };

        var (success, token, user, message) = await _authService.RegisterAsync(dto);

        return new RegisterResponse
        {
            Success = success,
            Message = message,
            Token = token,
            User = user
        };
    }

    /// <summary>
    /// Guarda una imagen Base64 en el sistema de archivos
    /// </summary>
    private async Task<string> SaveBase64ImageAsync(string base64String, string cedula, string extension)
    {
        // Limpiar el string Base64 (remover data:image/...;base64, si existe)
        var cleanBase64 = base64String;
        if (base64String.Contains(","))
        {
            cleanBase64 = base64String.Split(',')[1];
        }

        // Convertir Base64 a bytes
        byte[] imageBytes = Convert.FromBase64String(cleanBase64);

        // Asegurar que la extensión comienza con punto
        if (!extension.StartsWith("."))
        {
            extension = "." + extension;
        }

        // Crear directorio si no existe
        var profilesDir = Path.Combine(Directory.GetCurrentDirectory(), "src", "assets", "profiles");
        if (!Directory.Exists(profilesDir))
        {
            Directory.CreateDirectory(profilesDir);
        }

        // Nombre del archivo
        var fileName = $"{cedula}{extension}";
        var filePath = Path.Combine(profilesDir, fileName);

        // Guardar archivo
        await File.WriteAllBytesAsync(filePath, imageBytes);

        // Retornar la ruta relativa para la BD
        return $"/profiles/{fileName}";
    }

    public async Task<LoginResponse> Login(LoginRequest request)
    {
        var dto = new LoginDto
        {
            Email = request.Email,
            Password = request.Password
        };

        var (success, token, user, message) = await _authService.LoginAsync(dto);

        return new LoginResponse
        {
            Success = success,
            Message = message,
            Token = token,
            User = user
        };
    }

    public async Task<GetMessagesResponse> GetChannelMessages(GetMessagesRequest request)
    {
        var (success, messages, message) = await _authService.GetChannelMessagesAsync(request.ChannelId);

        return new GetMessagesResponse
        {
            Success = success,
            Message = message,
            Messages = messages.ToList()
        };
    }
}
