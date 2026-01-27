using ChatComunitario.DTOs;
using ChatComunitario.Interfaces;
using ChatComunitario.Repositories;

namespace ChatComunitario.SoapServices;

/// <summary>
/// Implementación del servicio SOAP de comunidades
/// </summary>
public class CommunitySoapService : ICommunitySoapService
{
    private readonly ICommunityService _communityService;
    private readonly IInvitationService _invitationService;
    private readonly UserRepository _userRepository;

    public CommunitySoapService(ICommunityService communityService, IInvitationService invitationService, UserRepository userRepository)
    {
        _communityService = communityService;
        _invitationService = invitationService;
        _userRepository = userRepository;
    }

    public async Task<CreateCommunityResponse> CreateCommunity(CreateCommunityRequest request)
    {
        Console.WriteLine($"[CommunitySoapService] CreateCommunity request received");
        Console.WriteLine($"[CommunitySoapService] Title: '{request.Title}'");
        Console.WriteLine($"[CommunitySoapService] Description: '{request.Description}'");
        Console.WriteLine($"[CommunitySoapService] OwnerCedula: '{request.OwnerCedula}'");
        
        var dto = new CreateCommunityDto
        {
            Title = request.Title,
            Description = request.Description,
            OwnerCedula = request.OwnerCedula
        };

        var (success, community, message) = await _communityService.CreateCommunityAsync(dto);

        CommunityResponse? communityResponse = null;
        if (community != null)
        {
            var commResp = await _communityService.GetCommunityByIdAsync(community.Id);
            communityResponse = commResp.Community;
        }

        return new CreateCommunityResponse
        {
            Success = success,
            Message = message,
            Community = communityResponse
        };
    }

    public async Task<GetAllCommunitiesResponse> GetAllCommunities()
    {
        var (success, communities, message) = await _communityService.GetAllCommunitiesAsync();

        return new GetAllCommunitiesResponse
        {
            Success = success,
            Message = message,
            Communities = communities.ToList()
        };
    }

    public async Task<GetCommunitiesByUserResponse> GetCommunitiesByUser(GetCommunitiesByUserRequest request)
    {
        Console.WriteLine($"[DEBUG] GetCommunitiesByUser called with cedula: {request.Cedula}");
        var (success, communities, message) = await _communityService.GetCommunitiesByUserAsync(request.Cedula);

        return new GetCommunitiesByUserResponse
        {
            Success = success,
            Message = message,
            Communities = communities.ToList()
        };
    }

    public async Task<GetCommunityByIdResponse> GetCommunityById(GetCommunityByIdRequest request)
    {
        var (success, community, message) = await _communityService.GetCommunityByIdAsync(request.Id);

        return new GetCommunityByIdResponse
        {
            Success = success,
            Message = message,
            Community = community
        };
    }

    public async Task<UpdateCommunityResponse> UpdateCommunity(UpdateCommunityRequest request)
    {
        var dto = new CreateCommunityDto
        {
            Title = request.Title,
            Description = request.Description,
            OwnerCedula = string.Empty // No se actualiza el owner
        };

        var (success, _, message) = await _communityService.UpdateCommunityAsync(request.Id, dto);

        return new UpdateCommunityResponse
        {
            Success = success,
            Message = message
        };
    }

    public async Task<DeleteCommunityResponse> DeleteCommunity(DeleteCommunityRequest request)
    {
        var (success, message) = await _communityService.DeleteCommunityAsync(request.Id);

        return new DeleteCommunityResponse
        {
            Success = success,
            Message = message
        };
    }

    public async Task<AddMemberResponse> AddMember(AddMemberRequest request)
    {
        var dto = new AddMemberDto
        {
            CedulaMember = request.CedulaMember
        };

        var (success, message) = await _communityService.AddMemberAsync(request.CommunityId, dto);

        return new AddMemberResponse
        {
            Success = success,
            Message = message
        };
    }

    public async Task<RemoveMemberResponse> RemoveMember(RemoveMemberRequest request)
    {
        var (success, message) = await _communityService.RemoveMemberAsync(request.CommunityId, request.Cedula);

        return new RemoveMemberResponse
        {
            Success = success,
            Message = message
        };
    }

    public async Task<GetAvailableUsersResponse> GetAvailableUsers(GetAvailableUsersRequest request)
    {
        try
        {
            var allUsers = await _userRepository.GetAllAsync();
            var availableUsers = allUsers
                .Where(u => u.Cedula != request.ExcludeCedula)
                .Select(u => new UserResponse
                {
                    Cedula = u.Cedula,
                    Name = u.Name,
                    LastName = u.LastName,
                    Email = u.Email,
                    ProfileImg = u.ProfileImg
                })
                .ToList();

            return new GetAvailableUsersResponse
            {
                Success = true,
                Message = "Usuarios disponibles obtenidos exitosamente",
                Users = availableUsers
            };
        }
        catch (Exception ex)
        {
            return new GetAvailableUsersResponse
            {
                Success = false,
                Message = $"Error: {ex.Message}",
                Users = new List<UserResponse>()
            };
        }
    }

    public async Task<InviteUsersResponse> InviteUsers(InviteUsersRequest request)
    {
        Console.WriteLine($"[DEBUG] InviteUsers called with CommunityId: {request.CommunityId}, UserCedulas count: {request.UserCedulas?.Count ?? 0}");
        if (request.UserCedulas != null)
        {
            foreach (var cedula in request.UserCedulas)
            {
                Console.WriteLine($"[DEBUG] Cedula to invite: {cedula}");
            }
        }
        
        var invitedUsers = new List<string>();
        var errors = new List<string>();

        try
        {
            // Obtener la cédula del dueño de la comunidad para usarla como invitedBy
            var community = await _communityService.GetCommunityByIdAsync(request.CommunityId);
            var invitedByCedula = community.Community?.OwnerCedula ?? "";

            foreach (var cedula in request.UserCedulas)
            {
                var (success, _, message) = await _invitationService.CreateInvitationAsync(
                    request.CommunityId, 
                    cedula, 
                    invitedByCedula);
                
                if (success)
                {
                    invitedUsers.Add(cedula);
                }
                else
                {
                    errors.Add($"{cedula}: {message}");
                }
            }

            var finalMessage = errors.Count == 0 
                ? $"Se enviaron invitaciones a {invitedUsers.Count} usuarios" 
                : $"Se enviaron {invitedUsers.Count} invitaciones. Errores: {string.Join("; ", errors)}";

            return new InviteUsersResponse
            {
                Success = errors.Count == 0,
                Message = finalMessage,
                InvitedUsers = invitedUsers
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DEBUG] Error in InviteUsers: {ex.Message}");
            return new InviteUsersResponse
            {
                Success = false,
                Message = $"Error: {ex.Message}",
                InvitedUsers = invitedUsers
            };
        }
    }

    public async Task<GetPendingInvitationsResponse> GetPendingInvitations(GetPendingInvitationsRequest request)
    {
        Console.WriteLine($"[DEBUG] GetPendingInvitations called for user: {request.UserCedula}");
        
        try
        {
            var (success, invitations, message) = await _invitationService.GetPendingInvitationsAsync(request.UserCedula);
            
            var invitationResponses = invitations.Select(i => new InvitationResponse
            {
                Id = i.Id,
                CommunityId = i.CommunityId,
                CommunityTitle = i.Community?.Title ?? "",
                CommunityDescription = i.Community?.Description ?? "",
                InvitedByName = i.InvitedBy != null ? $"{i.InvitedBy.Name} {i.InvitedBy.LastName}" : "",
                InvitedByCedula = i.InvitedByCedula,
                CreatedAt = i.CreatedAt
            }).ToList();

            return new GetPendingInvitationsResponse
            {
                Success = success,
                Message = message,
                Invitations = invitationResponses
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DEBUG] Error in GetPendingInvitations: {ex.Message}");
            return new GetPendingInvitationsResponse
            {
                Success = false,
                Message = $"Error: {ex.Message}",
                Invitations = new List<InvitationResponse>()
            };
        }
    }

    public async Task<AcceptInvitationResponse> AcceptInvitation(AcceptInvitationRequest request)
    {
        Console.WriteLine($"[DEBUG] AcceptInvitation called for invitation: {request.InvitationId}, user: {request.UserCedula}");
        
        var (success, message) = await _invitationService.AcceptInvitationAsync(request.InvitationId, request.UserCedula);

        return new AcceptInvitationResponse
        {
            Success = success,
            Message = message
        };
    }

    public async Task<RejectInvitationResponse> RejectInvitation(RejectInvitationRequest request)
    {
        Console.WriteLine($"[DEBUG] RejectInvitation called for invitation: {request.InvitationId}, user: {request.UserCedula}");
        
        var (success, message) = await _invitationService.RejectInvitationAsync(request.InvitationId, request.UserCedula);

        return new RejectInvitationResponse
        {
            Success = success,
            Message = message
        };
    }
}
