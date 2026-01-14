using ChatComunitario.DTOs;
using ChatComunitario.Models;

namespace ChatComunitario.Interfaces;

/// <summary>
/// Servicio de gestión de canales
/// </summary>
public interface IChannelService
{
    /// <summary>
    /// Crea un nuevo canal en una comunidad
    /// </summary>
    Task<(bool Success, Channel? Channel, string Message)> CreateChannelAsync(Guid communityId, CreateChannelDto dto);

    /// <summary>
    /// Obtiene un canal por ID
    /// </summary>
    Task<(bool Success, Channel? Channel, string Message)> GetChannelByIdAsync(Guid id);

    /// <summary>
    /// Obtiene los canales de una comunidad
    /// </summary>
    Task<(bool Success, IEnumerable<Channel> Channels, string Message)> GetChannelsByCommunityAsync(Guid communityId);

    /// <summary>
    /// Actualiza un canal
    /// </summary>
    Task<(bool Success, Channel? Channel, string Message)> UpdateChannelAsync(Guid id, CreateChannelDto dto);

    /// <summary>
    /// Elimina un canal
    /// </summary>
    Task<(bool Success, string Message)> DeleteChannelAsync(Guid id);
}
