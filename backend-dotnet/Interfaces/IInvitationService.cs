using ChatComunitario.Models;

namespace ChatComunitario.Interfaces;

/// <summary>
/// Interfaz para el servicio de invitaciones
/// </summary>
public interface IInvitationService
{
    Task<(bool Success, CommunityInvitation? Invitation, string Message)> CreateInvitationAsync(Guid communityId, string invitedUserCedula, string invitedByCedula);
    Task<(bool Success, IEnumerable<CommunityInvitation> Invitations, string Message)> GetPendingInvitationsAsync(string userCedula);
    Task<(bool Success, string Message)> AcceptInvitationAsync(Guid invitationId, string userCedula);
    Task<(bool Success, string Message)> RejectInvitationAsync(Guid invitationId, string userCedula);
    Task<int> GetPendingInvitationsCountAsync(string userCedula);
}
