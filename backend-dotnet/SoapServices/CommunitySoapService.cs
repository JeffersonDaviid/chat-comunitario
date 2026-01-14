using ChatComunitario.DTOs;
using ChatComunitario.Interfaces;

namespace ChatComunitario.SoapServices;

/// <summary>
/// Implementación del servicio SOAP de comunidades
/// </summary>
public class CommunitySoapService : ICommunitySoapService
{
    private readonly ICommunityService _communityService;

    public CommunitySoapService(ICommunityService communityService)
    {
        _communityService = communityService;
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
}
