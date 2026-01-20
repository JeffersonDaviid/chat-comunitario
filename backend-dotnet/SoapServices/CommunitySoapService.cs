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
    private readonly UserRepository _userRepository;

    public CommunitySoapService(ICommunityService communityService, UserRepository userRepository)
    {
        _communityService = communityService;
        _userRepository = userRepository;
    }

    public async Task<CreateCommunityResponse> CreateCommunity(CreateCommunityRequest request)
    {
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
            foreach (var cedula in request.UserCedulas)
            {
                var (success, message) = await _communityService.AddMemberAsync(request.CommunityId, new AddMemberDto { CedulaMember = cedula });
                
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
                ? $"Se invitaron exitosamente {invitedUsers.Count} usuarios" 
                : $"Se invitaron {invitedUsers.Count} usuarios. Errores: {string.Join("; ", errors)}";

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
}
