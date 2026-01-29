using ChatComunitario.DTOs;
using ChatComunitario.Exceptions;
using ChatComunitario.Interfaces;
using ChatComunitario.Models;
using ChatComunitario.Repositories;
using BCrypt.Net;

namespace ChatComunitario.Services;

/// <summary>
/// Servicio de autenticación y gestión de usuarios
/// </summary>
public class AuthService : IAuthService
{
    private readonly UserRepository _userRepository;
    private readonly ChannelRepository _channelRepository;
    private readonly IUtilityService _utilityService;

    public AuthService(
        UserRepository userRepository,
        ChannelRepository channelRepository,
        IUtilityService utilityService
        )
    {
        _userRepository = userRepository;
        _channelRepository = channelRepository;
        _utilityService = utilityService;
    }

    public async Task<(bool Success, string Token, UserResponse? User, string Message)> RegisterAsync(RegisterDto dto)
    {
        try
        {
            // Limpiar y validar cédula
            dto.Cedula = dto.Cedula?.Trim() ?? "";

            // if (!_utilityService.ValidateEcuadorianCedula(dto.Cedula))
            // {
            //     throw new ValidationException("Cédula ecuatoriana inválida");
            // }

            // Verificar si el usuario ya existe
            if (await _userRepository.ExistsByCedulaAsync(dto.Cedula))
            {
                throw new ConflictException("El usuario ya existe");
            }

            if (await _userRepository.ExistsByEmailAsync(dto.Email))
            {
                throw new ConflictException("El email ya está registrado");
            }

            if (!string.IsNullOrWhiteSpace(dto.Phone) && await _userRepository.ExistsByPhoneAsync(dto.Phone))
            {
                throw new ConflictException("El teléfono ya está registrado");
            }

            // Hash de la contraseña
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            // Crear nuevo usuario
            var user = new User
            {
                Cedula = dto.Cedula,
                Name = dto.Name,
                LastName = dto.LastName,
                Email = dto.Email,
                Password = hashedPassword,
                Phone = dto.Phone,
                Address = dto.Address,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                ProfileImg = dto.ProfileImg
            };

            await _userRepository.AddAsync(user);
            await _userRepository.SaveAsync();

            // Generar token
            var token = _utilityService.GenerateToken(user.Cedula, user.Email);

            var userResponse = MapUserToResponse(user);

            return (true, token, userResponse, "Usuario registrado exitosamente");
        }
        catch (BusinessException ex)
        {
            return (false, string.Empty, null, ex.Message);
        }
        catch (Exception ex)
        {
            return (false, string.Empty, null, $"Error: {ex.Message}");
        }
    }

    public async Task<(bool Success, string Token, UserResponse? User, string Message)> LoginAsync(LoginDto dto)
    {
        try
        {
            var user = await _userRepository.GetByEmailAsync(dto.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Password))
            {
                throw new UnauthorizedException("Credenciales inválidas");
            }

            var token = _utilityService.GenerateToken(user.Cedula, user.Email);
            var userResponse = MapUserToResponse(user);

            return (true, token, userResponse, "Sesión iniciada exitosamente");
        }
        catch (BusinessException ex)
        {
            return (false, string.Empty, null, ex.Message);
        }
        catch (Exception ex)
        {
            return (false, string.Empty, null, $"Error: {ex.Message}");
        }
    }

    public async Task<(bool Success, IEnumerable<MessageResponse> Messages, string Message)> GetChannelMessagesAsync(Guid channelId)
    {
        try
        {
            var channel = await _channelRepository.GetByIdWithMessagesAsync(channelId);

            if (channel == null)
            {
                throw new NotFoundException("Canal", channelId);
            }

            var messageResponses = channel.Messages.Select(m => new MessageResponse
            {
                Id = m.Id,
                SenderId = m.SenderCedula,
                Sender = new UserResponse
                {
                    Cedula = m.Sender.Cedula,
                    Name = m.Sender.Name,
                    LastName = m.Sender.LastName,
                    Email = m.Sender.Email,
                    ProfileImg = m.Sender.ProfileImg
                },
                Text = m.Content,
                File = m.FileUrl,
                Timestamp = m.Timestamp,
                ChannelId = m.ChannelId
            }).ToList();

            return (true, messageResponses, "Mensajes obtenidos exitosamente");
        }
        catch (BusinessException ex)
        {
            return (false, new List<MessageResponse>(), ex.Message);
        }
        catch (Exception ex)
        {
            return (false, new List<MessageResponse>(), $"Error: {ex.Message}");
        }
    }

    public async Task<User?> GetUserByCedulaAsync(string cedula)
    {
        return await _userRepository.GetByCedulaAsync(cedula);
    }

    private static UserResponse MapUserToResponse(User user)
    {
        return new UserResponse
        {
            Cedula = user.Cedula,
            Name = user.Name,
            LastName = user.LastName,
            Email = user.Email,
            ProfileImg = user.ProfileImg
        };
    }
}
