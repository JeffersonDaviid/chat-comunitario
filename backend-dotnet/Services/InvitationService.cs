using ChatComunitario.DTOs;
using ChatComunitario.Exceptions;
using ChatComunitario.Hubs;
using ChatComunitario.Interfaces;
using ChatComunitario.Models;
using ChatComunitario.Repositories;
using Microsoft.AspNetCore.SignalR;

namespace ChatComunitario.Services;

/// <summary>
/// Servicio de gestión de invitaciones a comunidades
/// </summary>
public class InvitationService : IInvitationService
{
    private readonly CommunityInvitationRepository _invitationRepository;
    private readonly CommunityRepository _communityRepository;
    private readonly UserRepository _userRepository;
    private readonly ICommunityService _communityService;
    private readonly IHubContext<NotificationHub> _notificationHub;

    public InvitationService(
        CommunityInvitationRepository invitationRepository,
        CommunityRepository communityRepository,
        UserRepository userRepository,
        ICommunityService communityService,
        IHubContext<NotificationHub> notificationHub)
    {
        _invitationRepository = invitationRepository;
        _communityRepository = communityRepository;
        _userRepository = userRepository;
        _communityService = communityService;
        _notificationHub = notificationHub;
    }

    public async Task<(bool Success, CommunityInvitation? Invitation, string Message)> CreateInvitationAsync(
        Guid communityId, string invitedUserCedula, string invitedByCedula)
    {
        try
        {
            Console.WriteLine($"[DEBUG] CreateInvitationAsync - CommunityId: {communityId}, InvitedUser: {invitedUserCedula}, InvitedBy: {invitedByCedula}");

            // Verificar que la comunidad existe
            var community = await _communityRepository.GetByIdAsync(communityId);
            if (community == null)
            {
                throw new NotFoundException("Comunidad", communityId);
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

            // Verificar que el usuario no es ya miembro
            var communityWithMembers = await _communityRepository.GetByIdWithRelationsAsync(communityId);
            if (communityWithMembers?.Members.Any(m => m.UserCedula == invitedUserCedula) == true)
            {
                throw new ConflictException("El usuario ya es miembro de la comunidad");
            }

            // Verificar que no existe una invitación pendiente
            var existingInvitation = await _invitationRepository.HasPendingInvitationAsync(communityId, invitedUserCedula);
            if (existingInvitation)
            {
                throw new ConflictException("Ya existe una invitación pendiente para este usuario");
            }

            var invitation = new CommunityInvitation
            {
                CommunityId = communityId,
                InvitedUserCedula = invitedUserCedula,
                InvitedByCedula = invitedByCedula,
                Status = InvitationStatus.Pending
            };

            Console.WriteLine($"[DEBUG] Creating invitation with ID: {invitation.Id}");
            await _invitationRepository.AddAsync(invitation);
            await _invitationRepository.SaveAsync();
            Console.WriteLine($"[DEBUG] Invitation saved successfully with ID: {invitation.Id}");

            // Verificar que realmente se guardó
            var savedInvitation = await _invitationRepository.GetByIdSimpleAsync(invitation.Id);
            if (savedInvitation == null)
            {
                throw new BusinessException("Error: La invitación no se guardó correctamente en la base de datos");
            }
            Console.WriteLine($"[DEBUG] Verified invitation exists in DB with ID: {savedInvitation.Id}");

            // Enviar notificación en tiempo real al usuario invitado
            try 
            {
                var notificationData = new
                {
                    Id = invitation.Id.ToString(),
                    CommunityId = communityId.ToString(),
                    CommunityTitle = community.Title,
                    CommunityDescription = community.Description,
                    InvitedByName = $"{invitedBy.Name} {invitedBy.LastName}",
                    InvitedByCedula = invitedByCedula,
                    CreatedAt = invitation.CreatedAt.ToString("O")
                };
                
                await NotificationHub.SendInvitationNotification(_notificationHub, invitedUserCedula, notificationData);
                Console.WriteLine($"[DEBUG] Real-time notification sent to {invitedUserCedula}");
            }
            catch (Exception notifEx)
            {
                Console.WriteLine($"[DEBUG] Failed to send notification (non-critical): {notifEx.Message}");
            }

            return (true, invitation, "Invitación enviada exitosamente");
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

    public async Task<(bool Success, IEnumerable<CommunityInvitation> Invitations, string Message)> GetPendingInvitationsAsync(string userCedula)
    {
        try
        {
            Console.WriteLine($"[DEBUG] GetPendingInvitationsAsync - UserCedula: {userCedula}");
            var invitations = await _invitationRepository.GetPendingInvitationsForUserAsync(userCedula);
            Console.WriteLine($"[DEBUG] Found {invitations.Count()} pending invitations");
            
            foreach (var inv in invitations)
            {
                Console.WriteLine($"[DEBUG] Invitation ID: {inv.Id}, CommunityId: {inv.CommunityId}, Status: {inv.Status}");
            }
            
            return (true, invitations, "Invitaciones obtenidas exitosamente");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DEBUG] Exception: {ex.Message}");
            return (false, new List<CommunityInvitation>(), $"Error: {ex.Message}");
        }
    }

    public async Task<(bool Success, string Message)> AcceptInvitationAsync(Guid invitationId, string userCedula)
    {
        try
        {
            Console.WriteLine($"[DEBUG] AcceptInvitationAsync - InvitationId: {invitationId}, UserCedula: {userCedula}");

            // Primero verificar si existe sin relaciones usando el método simple
            var invitationSimple = await _invitationRepository.GetByIdSimpleAsync(invitationId);
            Console.WriteLine($"[DEBUG] Invitation exists (simple query): {invitationSimple != null}");
            
            if (invitationSimple == null)
            {
                // Listar todas las invitaciones pendientes para debug
                var allPending = await _invitationRepository.GetPendingInvitationsForUserAsync(userCedula);
                Console.WriteLine($"[DEBUG] Total pending invitations for user: {allPending.Count()}");
                foreach (var pending in allPending)
                {
                    Console.WriteLine($"[DEBUG] Pending invitation: ID={pending.Id}, Status={pending.Status}");
                }
                
                throw new NotFoundException("Invitación", invitationId);
            }
            
            Console.WriteLine($"[DEBUG] Invitation status: {invitationSimple.Status}, CommunityId: {invitationSimple.CommunityId}");

            // Verificar que el usuario es el invitado
            if (invitationSimple.InvitedUserCedula != userCedula)
            {
                throw new UnauthorizedException("No tienes permiso para aceptar esta invitación");
            }

            // Verificar que la invitación está pendiente
            if (invitationSimple.Status != InvitationStatus.Pending)
            {
                throw new ConflictException("Esta invitación ya fue respondida");
            }

            // Guardar el CommunityId antes de modificar
            var communityId = invitationSimple.CommunityId;

            // Primero actualizar el estado de la invitación usando SQL directo (sin tracking)
            // Esto evita problemas de concurrencia optimista
            var updatedRows = await _invitationRepository.UpdateStatusDirectAsync(invitationId, InvitationStatus.Accepted);
            if (updatedRows == 0)
            {
                throw new BusinessException("No se pudo actualizar el estado de la invitación");
            }
            Console.WriteLine($"[DEBUG] Invitation status updated to Accepted (direct SQL)");

            // Ahora agregar al usuario como miembro de la comunidad
            var (success, message) = await _communityService.AddMemberAsync(
                communityId, 
                new AddMemberDto { CedulaMember = userCedula });

            if (!success)
            {
                // Si falla, revertir el estado de la invitación
                Console.WriteLine($"[DEBUG] AddMemberAsync failed, reverting invitation status");
                await _invitationRepository.UpdateStatusDirectAsync(invitationId, InvitationStatus.Pending);
                throw new BusinessException(message);
            }
            
            Console.WriteLine($"[DEBUG] User added to community successfully");
            Console.WriteLine($"[DEBUG] Invitation accepted, user added to community");
            return (true, "Te has unido a la comunidad exitosamente");
        }
        catch (BusinessException ex)
        {
            Console.WriteLine($"[DEBUG] BusinessException: {ex.Message}");
            return (false, ex.Message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DEBUG] Exception: {ex.Message}");
            Console.WriteLine($"[DEBUG] Stack trace: {ex.StackTrace}");
            return (false, $"Error: {ex.Message}");
        }
    }

    public async Task<(bool Success, string Message)> RejectInvitationAsync(Guid invitationId, string userCedula)
    {
        try
        {
            Console.WriteLine($"[DEBUG] RejectInvitationAsync - InvitationId: {invitationId}, UserCedula: {userCedula}");

            var invitation = await _invitationRepository.GetByIdWithRelationsAsync(invitationId);
            if (invitation == null)
            {
                throw new NotFoundException("Invitación", invitationId);
            }

            // Verificar que el usuario es el invitado
            if (invitation.InvitedUserCedula != userCedula)
            {
                throw new UnauthorizedException("No tienes permiso para rechazar esta invitación");
            }

            // Verificar que la invitación está pendiente
            if (invitation.Status != InvitationStatus.Pending)
            {
                throw new ConflictException("Esta invitación ya fue respondida");
            }

            // Actualizar el estado de la invitación
            invitation.Status = InvitationStatus.Rejected;
            invitation.RespondedAt = DateTime.UtcNow;
            await _invitationRepository.UpdateAsync(invitation);
            await _invitationRepository.SaveAsync();

            Console.WriteLine($"[DEBUG] Invitation rejected");
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

    public async Task<int> GetPendingInvitationsCountAsync(string userCedula)
    {
        try
        {
            var invitations = await _invitationRepository.GetPendingInvitationsForUserAsync(userCedula);
            return invitations.Count();
        }
        catch
        {
            return 0;
        }
    }
}
