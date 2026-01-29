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
            // 1. Obtener los datos del usuario que busca (Origen)
            var currentUser = await _userRepository.GetByIdAsync(request.ExcludeCedula);
            
            if (currentUser == null)
            {
                return new GetAvailableUsersResponse
                {
                    Success = false,
                    Message = "Usuario de búsqueda no encontrado",
                    Users = new List<UserResponse>()
                };
            }

            // 2. Obtener todos los usuarios
            var allUsers = await _userRepository.GetAllAsync();

            // 3. Filtrar por Cédula y por Radio de 3km
            var availableUsers = allUsers
                .Where(u => u.Cedula != request.ExcludeCedula) // Excluir al buscador
                .Where(u => CalcularDistanciaKm(currentUser.Latitude, currentUser.Longitude, u.Latitude, u.Longitude) <= 3.0)
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
                Message = $"Se encontraron {availableUsers.Count} usuarios en un radio de 3km",
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

    private double CalcularDistanciaKm(double lat1, double lon1, double lat2, double lon2)
    {
        // Radio de la Tierra en kilómetros
        const double RadioTierra = 6371.0;

        double dLat = ToRadians(lat2 - lat1);
        double dLon = ToRadians(lon2 - lon1);

        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return RadioTierra * c;
    }

    private double ToRadians(double angle) => Math.PI * angle / 180.0;

    public async Task<InviteUsersResponse> InviteUsers(InviteUsersRequest request)
    {
        // Parsear las cédulas del CSV
        var userCedulas = !string.IsNullOrWhiteSpace(request.UserCedulasCSV)
            ? request.UserCedulasCSV.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList()
            : new List<string>();
            
        Console.WriteLine($"[DEBUG] InviteUsers called with CommunityId: {request.CommunityId}, UserCedulasCSV: '{request.UserCedulasCSV}', Parsed count: {userCedulas.Count}");
        foreach (var cedula in userCedulas)
        {
            Console.WriteLine($"[DEBUG] Cedula to invite: {cedula}");
        }
        
        var invitedUsers = new List<string>();
        var errors = new List<string>();

        try
        {
            // Obtener la cédula del dueño de la comunidad para usarla como invitedBy
            var community = await _communityService.GetCommunityByIdAsync(request.CommunityId);
            var invitedByCedula = community.Community?.OwnerCedula ?? "";

            foreach (var cedula in userCedulas)
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
        Console.WriteLine($"[DEBUG] AcceptInvitation called");
        Console.WriteLine($"[DEBUG] Raw InvitationId: '{request.InvitationId}'");
        Console.WriteLine($"[DEBUG] UserCedula: '{request.UserCedula}'");
        Console.WriteLine($"[DEBUG] InvitationId type: {request.InvitationId.GetType()}, IsEmpty: {request.InvitationId == Guid.Empty}");
        
        if (request.InvitationId == Guid.Empty)
        {
            return new AcceptInvitationResponse
            {
                Success = false,
                Message = "El ID de la invitación no es válido (vacío)"
            };
        }
        
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
