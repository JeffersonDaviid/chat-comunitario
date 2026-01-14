using ChatComunitario.DTOs;
using ChatComunitario.Models;

namespace ChatComunitario.Interfaces;

/// <summary>
/// Servicio de autenticación y gestión de usuarios
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Registra un nuevo usuario
    /// </summary>
    Task<(bool Success, string Token, UserResponse? User, string Message)> RegisterAsync(RegisterDto dto);

    /// <summary>
    /// Inicia sesión de usuario
    /// </summary>
    Task<(bool Success, string Token, UserResponse? User, string Message)> LoginAsync(LoginDto dto);

    /// <summary>
    /// Obtiene el historial de mensajes de un canal
    /// </summary>
    Task<(bool Success, IEnumerable<MessageResponse> Messages, string Message)> GetChannelMessagesAsync(Guid channelId);

    /// <summary>
    /// Obtiene un usuario por cédula
    /// </summary>
    Task<User?> GetUserByCedulaAsync(string cedula);
}
