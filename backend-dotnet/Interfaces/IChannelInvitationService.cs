using ChatComunitario.Models;

namespace ChatComunitario.Interfaces;

/// <summary>
/// Interfaz para el servicio de invitaciones a canales
/// </summary>
public interface IChannelInvitationService
{
    Task<(bool Success, ChannelInvitation? Invitation, string Message)> CreateInvitationAsync(
        Guid channelId, string invitedUserCedula, string invitedByCedula);
    
    Task<(bool Success, IEnumerable<ChannelInvitation> Invitations, string Message)> GetPendingInvitationsAsync(string userCedula);
    
    Task<(bool Success, string Message)> AcceptInvitationAsync(Guid invitationId, string userCedula);
    
    Task<(bool Success, string Message)> RejectInvitationAsync(Guid invitationId, string userCedula);
}
