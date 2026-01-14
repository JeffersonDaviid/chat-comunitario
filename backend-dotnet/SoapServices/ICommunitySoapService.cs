using System.ServiceModel;
using System.Runtime.Serialization;
using ChatComunitario.Interfaces;

namespace ChatComunitario.SoapServices;

/// <summary>
/// Contrato SOAP para servicios de comunidades
/// </summary>
[ServiceContract]
public interface ICommunitySoapService
{
    [OperationContract]
    Task<CreateCommunityResponse> CreateCommunity(CreateCommunityRequest request);

    [OperationContract]
    Task<GetAllCommunitiesResponse> GetAllCommunities();

    [OperationContract]
    Task<GetCommunitiesByUserResponse> GetCommunitiesByUser(GetCommunitiesByUserRequest request);

    [OperationContract]
    Task<GetCommunityByIdResponse> GetCommunityById(GetCommunityByIdRequest request);

    [OperationContract]
    Task<UpdateCommunityResponse> UpdateCommunity(UpdateCommunityRequest request);

    [OperationContract]
    Task<DeleteCommunityResponse> DeleteCommunity(DeleteCommunityRequest request);

    [OperationContract]
    Task<AddMemberResponse> AddMember(AddMemberRequest request);

    [OperationContract]
    Task<RemoveMemberResponse> RemoveMember(RemoveMemberRequest request);
}

// Request/Response models
public class CreateCommunityRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string OwnerCedula { get; set; } = string.Empty;
}

public class CreateCommunityResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public CommunityResponse? Community { get; set; }
}

public class GetAllCommunitiesResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<CommunityResponse> Communities { get; set; } = new();
}

public class GetCommunitiesByUserRequest
{
    public string Cedula { get; set; } = string.Empty;
}

public class GetCommunitiesByUserResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<CommunityResponse> Communities { get; set; } = new();
}

public class GetCommunityByIdRequest
{
    public Guid Id { get; set; }
}

public class GetCommunityByIdResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public CommunityResponse? Community { get; set; }
}

public class UpdateCommunityRequest
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class UpdateCommunityResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class DeleteCommunityRequest
{
    public Guid Id { get; set; }
}

public class DeleteCommunityResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class AddMemberRequest
{
    public Guid CommunityId { get; set; }
    public string CedulaMember { get; set; } = string.Empty;
}

public class AddMemberResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class RemoveMemberRequest
{
    public Guid CommunityId { get; set; }
    public string Cedula { get; set; } = string.Empty;
}

public class RemoveMemberResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}
