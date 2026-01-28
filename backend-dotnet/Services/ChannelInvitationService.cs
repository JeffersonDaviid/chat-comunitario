using ChatComunitario.Exceptions;
using ChatComunitario.Hubs;
using ChatComunitario.Interfaces;
using ChatComunitario.Models;
using ChatComunitario.Repositories;
using Microsoft.AspNetCore.SignalR;

namespace ChatComunitario.Services;

/// <summary>
/// Servicio de gestión de invitaciones a canales
/// </summary>
public class ChannelInvitationService : IChannelInvitationService
{
    private readonly ChannelInvitationRepository _invitationRepository;
    private readonly ChannelRepository _channelRepository;
    private readonly ChannelMemberRepository _channelMemberRepository;
    private readonly UserRepository _userRepository;
    private readonly IHubContext<NotificationHub> _notificationHub;

    public ChannelInvitationService(
        ChannelInvitationRepository invitationRepository,
        ChannelRepository channelRepository,
        ChannelMemberRepository channelMemberRepository,
        UserRepository userRepository,
        IHubContext<NotificationHub> notificationHub)
    {
        _invitationRepository = invitationRepository;
        _channelRepository = channelRepository;
        _channelMemberRepository = channelMemberRepository;
        _userRepository = userRepository;
        _notificationHub = notificationHub;
    }

    public async Task<(bool Success, ChannelInvitation? Invitation, string Message)> CreateInvitationAsync(
        Guid channelId, string invitedUserCedula, string invitedByCedula)
    {
        try
        {
            Console.WriteLine($"[DEBUG] CreateChannelInvitationAsync - ChannelId: {channelId}, InvitedUser: {invitedUserCedula}");

            // Verificar que el canal existe
            var channel = await _channelRepository.GetByIdWithRelationsAsync(channelId);
            if (channel == null)
            {
                throw new NotFoundException("Canal", channelId);
            }

            // No se puede invitar al canal General
            if (channel.IsGeneral)
            {
                throw new ValidationException("No se puede invitar directamente al canal General. Use invitaciones de comunidad.");
            }

            // Verificar que el usuario invitado existe
            var invitedUser = await _userRepository.GetByCedulaAsync(invitedUserCedula);
            if (invitedUser == null)
            {
                throw new NotFoundException("Usuario invitado", invitedUserCedula);
            }

            // Verificar que el usuario que invita existe
            var invitedBy = await _userRepository.GetByCedulaAsync(invitedByCedula);
            if (invitedBy == null)
            {
                throw new NotFoundException("Usuario que invita", invitedByCedula);
            }

            // Verificar que el usuario no es ya miembro del canal
            var isMember = await _channelMemberRepository.IsMemberOfChannelAsync(channelId, invitedUserCedula);
            if (isMember)
            {
                throw new ConflictException("El usuario ya es miembro del canal");
            }

            // Verificar que no existe una invitación pendiente
            var hasPending = await _invitationRepository.HasPendingInvitationAsync(channelId, invitedUserCedula);
            if (hasPending)
            {
                throw new ConflictException("Ya existe una invitación pendiente para este usuario");
            }

            var invitation = new ChannelInvitation
            {
                ChannelId = channelId,
                InvitedUserCedula = invitedUserCedula,
                InvitedByCedula = invitedByCedula,
                Status = ChannelInvitationStatus.Pending
            };

            await _invitationRepository.AddAsync(invitation);
            await _invitationRepository.SaveAsync();

            Console.WriteLine($"[DEBUG] Channel invitation created with ID: {invitation.Id}");

            // Enviar notificación en tiempo real
            try
            {
                var notificationData = new
                {
                    Type = "ChannelInvitation",
                    Id = invitation.Id.ToString(),
                    ChannelId = channelId.ToString(),
                    ChannelName = channel.Name,
                    CommunityId = channel.CommunityId.ToString(),
                    CommunityTitle = channel.Community?.Title ?? "",
                    InvitedByName = $"{invitedBy.Name} {invitedBy.LastName}",
                    InvitedByCedula = invitedByCedula,
                    CreatedAt = invitation.CreatedAt.ToString("O")
                };

                await NotificationHub.SendInvitationNotification(_notificationHub, invitedUserCedula, notificationData);
                Console.WriteLine($"[DEBUG] Channel invitation notification sent to {invitedUserCedula}");
            }
            catch (Exception notifEx)
            {
                Console.WriteLine($"[DEBUG] Failed to send notification: {notifEx.Message}");
            }

            return (true, invitation, "Invitación al canal enviada exitosamente");
        }
        catch (BusinessException ex)
        {
            Console.WriteLine($"[DEBUG] BusinessException: {ex.Message}");
            return (false, null, ex.Message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DEBUG] Exception: {ex.Message}");
            return (false, null, $"Error: {ex.Message}");
        }
    }

    public async Task<(bool Success, IEnumerable<ChannelInvitation> Invitations, string Message)> GetPendingInvitationsAsync(string userCedula)
    {
        try
        {
            var invitations = await _invitationRepository.GetPendingInvitationsForUserAsync(userCedula);
            return (true, invitations, "Invitaciones a canales obtenidas exitosamente");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DEBUG] Exception: {ex.Message}");
            return (false, new List<ChannelInvitation>(), $"Error: {ex.Message}");
        }
    }

    public async Task<(bool Success, string Message)> AcceptInvitationAsync(Guid invitationId, string userCedula)
    {
        try
        {
            Console.WriteLine($"[DEBUG] AcceptChannelInvitationAsync - InvitationId: {invitationId}, UserCedula: {userCedula}");

            var invitation = await _invitationRepository.GetByIdWithRelationsAsync(invitationId);
            if (invitation == null)
            {
                throw new NotFoundException("Invitación", invitationId);
            }

            if (invitation.InvitedUserCedula != userCedula)
            {
                throw new UnauthorizedException("No tienes permiso para aceptar esta invitación");
            }

            if (invitation.Status != ChannelInvitationStatus.Pending)
            {
                throw new ConflictException("Esta invitación ya fue respondida");
            }

            // Agregar al usuario como miembro del canal
            var channelMember = new ChannelMember
            {
                ChannelId = invitation.ChannelId,
                UserCedula = userCedula
            };

            await _channelMemberRepository.AddAsync(channelMember);
            await _channelMemberRepository.SaveAsync();

            // Actualizar el estado de la invitación
            invitation.Status = ChannelInvitationStatus.Accepted;
            invitation.RespondedAt = DateTime.UtcNow;
            await _invitationRepository.UpdateAsync(invitation);
            await _invitationRepository.SaveAsync();

            Console.WriteLine($"[DEBUG] Channel invitation accepted, user added to channel");
            return (true, "Te has unido al canal exitosamente");
        }
        catch (BusinessException ex)
        {
            Console.WriteLine($"[DEBUG] BusinessException: {ex.Message}");
            return (false, ex.Message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DEBUG] Exception: {ex.Message}");
            return (false, $"Error: {ex.Message}");
        }
    }

    public async Task<(bool Success, string Message)> RejectInvitationAsync(Guid invitationId, string userCedula)
    {
        try
        {
            Console.WriteLine($"[DEBUG] RejectChannelInvitationAsync - InvitationId: {invitationId}, UserCedula: {userCedula}");

            var invitation = await _invitationRepository.GetByIdWithRelationsAsync(invitationId);
            if (invitation == null)
            {
                throw new NotFoundException("Invitación", invitationId);
            }

            if (invitation.InvitedUserCedula != userCedula)
            {
                throw new UnauthorizedException("No tienes permiso para rechazar esta invitación");
            }

            if (invitation.Status != ChannelInvitationStatus.Pending)
            {
                throw new ConflictException("Esta invitación ya fue respondida");
            }

            invitation.Status = ChannelInvitationStatus.Rejected;
            invitation.RespondedAt = DateTime.UtcNow;
            await _invitationRepository.UpdateAsync(invitation);
            await _invitationRepository.SaveAsync();

            Console.WriteLine($"[DEBUG] Channel invitation rejected");
            return (true, "Invitación rechazada");
        }
        catch (BusinessException ex)
        {
            Console.WriteLine($"[DEBUG] BusinessException: {ex.Message}");
            return (false, ex.Message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DEBUG] Exception: {ex.Message}");
            return (false, $"Error: {ex.Message}");
        }
    }
}
