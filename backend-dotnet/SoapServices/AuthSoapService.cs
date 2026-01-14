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
            Longitude = request.Longitude
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
