using ChatComunitario.DTOs;
using ChatComunitario.Models;
using System.Runtime.Serialization;

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

[DataContract]
public class CommunityResponse
{
    [DataMember]
    public Guid Id { get; set; }
    
    [DataMember]
    public string Title { get; set; } = string.Empty;
    
    [DataMember]
    public string Description { get; set; } = string.Empty;
    
    [DataMember]
    public string OwnerCedula { get; set; } = string.Empty;
    
    [DataMember]
    public UserResponse Owner { get; set; } = new();
    
    [DataMember]
    public List<UserResponse> Members { get; set; } = new();
    
    [DataMember]
    public List<ChannelResponse> Channels { get; set; } = new();
}

[DataContract]
public class ChannelResponse
{
    [DataMember]
    public Guid Id { get; set; }
    
    [DataMember]
    public string Name { get; set; } = string.Empty;
    
    [DataMember]
    public string Description { get; set; } = string.Empty;
}

[DataContract]
public class UserResponse
{
    [DataMember]
    public string Cedula { get; set; } = string.Empty;
    
    [DataMember]
    public string Name { get; set; } = string.Empty;
    
    [DataMember]
    public string LastName { get; set; } = string.Empty;
    
    [DataMember]
    public string Email { get; set; } = string.Empty;
    
    [DataMember]
    public string? ProfileImg { get; set; }
}

[DataContract]
public class MessageResponse
{
    [DataMember]
    public Guid Id { get; set; }
    
    [DataMember]
    public string SenderId { get; set; } = string.Empty;
    
    [DataMember]
    public UserResponse Sender { get; set; } = new();
    
    [DataMember]
    public string Text { get; set; } = string.Empty;
    
    [DataMember]
    public string? File { get; set; }
    
    [DataMember]
    public DateTime Timestamp { get; set; }
    public Guid ChannelId { get; set; }
}
