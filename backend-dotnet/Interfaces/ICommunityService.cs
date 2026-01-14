using ChatComunitario.DTOs;
using ChatComunitario.Models;

namespace ChatComunitario.Interfaces;

/// <summary>
/// Servicio de gestión de comunidades
/// </summary>
public interface ICommunityService
{
    /// <summary>
    /// Crea una nueva comunidad
    /// </summary>
    Task<(bool Success, Community? Community, string Message)> CreateCommunityAsync(CreateCommunityDto dto);

    /// <summary>
    /// Obtiene todas las comunidades
    /// </summary>
    Task<(bool Success, IEnumerable<CommunityResponse> Communities, string Message)> GetAllCommunitiesAsync();

    /// <summary>
    /// Obtiene las comunidades de un usuario
    /// </summary>
    Task<(bool Success, IEnumerable<CommunityResponse> Communities, string Message)> GetCommunitiesByUserAsync(string cedula);

    /// <summary>
    /// Obtiene una comunidad por ID
    /// </summary>
    Task<(bool Success, CommunityResponse? Community, string Message)> GetCommunityByIdAsync(Guid id);

    /// <summary>
    /// Actualiza una comunidad
    /// </summary>
    Task<(bool Success, Community? Community, string Message)> UpdateCommunityAsync(Guid id, CreateCommunityDto dto);

    /// <summary>
    /// Elimina una comunidad
    /// </summary>
    Task<(bool Success, string Message)> DeleteCommunityAsync(Guid id);

    /// <summary>
    /// Agrega un miembro a una comunidad
    /// </summary>
    Task<(bool Success, string Message)> AddMemberAsync(Guid communityId, AddMemberDto dto);

    /// <summary>
    /// Elimina un miembro de una comunidad
    /// </summary>
    Task<(bool Success, string Message)> RemoveMemberAsync(Guid communityId, string cedula);
}

public class CommunityResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public UserResponse Owner { get; set; } = new();
    public List<UserResponse> Members { get; set; } = new();
    public List<ChannelResponse> Channels { get; set; } = new();
}

public class ChannelResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class UserResponse
{
    public string Cedula { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? ProfileImg { get; set; }
}

public class MessageResponse
{
    public Guid Id { get; set; }
    public string SenderId { get; set; } = string.Empty;
    public UserResponse Sender { get; set; } = new();
    public string Text { get; set; } = string.Empty;
    public string? File { get; set; }
    public DateTime Timestamp { get; set; }
    public Guid ChannelId { get; set; }
}
