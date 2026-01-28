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

    [OperationContract]
    Task<GetAvailableUsersResponse> GetAvailableUsers(GetAvailableUsersRequest request);

    [OperationContract]
    Task<InviteUsersResponse> InviteUsers(InviteUsersRequest request);

    [OperationContract]
    Task<GetPendingInvitationsResponse> GetPendingInvitations(GetPendingInvitationsRequest request);

    [OperationContract]
    Task<AcceptInvitationResponse> AcceptInvitation(AcceptInvitationRequest request);

    [OperationContract]
    Task<RejectInvitationResponse> RejectInvitation(RejectInvitationRequest request);
}

// Request/Response models
[DataContract]
public class CreateCommunityRequest
{
    [DataMember(Order = 0)]
    public string Description { get; set; } = string.Empty;
    
    [DataMember(Order = 1)]
    public string OwnerCedula { get; set; } = string.Empty;
    
    [DataMember(Order = 2)]
    public string Title { get; set; } = string.Empty;
}

[DataContract]
public class CreateCommunityResponse
{
    [DataMember]
    public bool Success { get; set; }
    
    [DataMember]
    public string Message { get; set; } = string.Empty;
    
    [DataMember]
    public CommunityResponse? Community { get; set; }
}

[DataContract]
public class GetAllCommunitiesResponse
{
    [DataMember]
    public bool Success { get; set; }
    
    [DataMember]
    public string Message { get; set; } = string.Empty;
    
    [DataMember]
    public List<CommunityResponse> Communities { get; set; } = new();
}

[DataContract]
public class GetCommunitiesByUserRequest
{
    [DataMember]
    public string Cedula { get; set; } = string.Empty;
}

[DataContract]
public class GetCommunitiesByUserResponse
{
    [DataMember]
    public bool Success { get; set; }
    
    [DataMember]
    public string Message { get; set; } = string.Empty;
    
    [DataMember]
    public List<CommunityResponse> Communities { get; set; } = new();
}

[DataContract]
public class GetCommunityByIdRequest
{
    [DataMember]
    public Guid Id { get; set; }
}

[DataContract]
public class GetCommunityByIdResponse
{
    [DataMember]
    public bool Success { get; set; }
    
    [DataMember]
    public string Message { get; set; } = string.Empty;
    
    [DataMember]
    public CommunityResponse? Community { get; set; }
}

[DataContract]
public class UpdateCommunityRequest
{
    [DataMember(Order = 0)]
    public string Description { get; set; } = string.Empty;
    
    [DataMember(Order = 1)]
    public Guid Id { get; set; }
    
    [DataMember(Order = 2)]
    public string Title { get; set; } = string.Empty;
}

[DataContract]
public class UpdateCommunityResponse
{
    [DataMember]
    public bool Success { get; set; }
    
    [DataMember]
    public string Message { get; set; } = string.Empty;
}

[DataContract]
public class DeleteCommunityRequest
{
    [DataMember]
    public Guid Id { get; set; }
}

[DataContract]
public class DeleteCommunityResponse
{
    [DataMember]
    public bool Success { get; set; }
    
    [DataMember]
    public string Message { get; set; } = string.Empty;
}

[DataContract]
public class AddMemberRequest
{
    [DataMember(Order = 0)]
    public Guid CommunityId { get; set; }
    
    [DataMember(Order = 1)]
    public string CedulaMember { get; set; } = string.Empty;
}

[DataContract]
public class AddMemberResponse
{
    [DataMember]
    public bool Success { get; set; }
    
    [DataMember]
    public string Message { get; set; } = string.Empty;
}

[DataContract]
public class RemoveMemberRequest
{
    [DataMember(Order = 0)]
    public Guid CommunityId { get; set; }
    
    [DataMember(Order = 1)]
    public string Cedula { get; set; } = string.Empty;
}

[DataContract]
public class RemoveMemberResponse
{
    [DataMember]
    public bool Success { get; set; }
    
    [DataMember]
    public string Message { get; set; } = string.Empty;
}
[DataContract]
public class GetAvailableUsersRequest
{
    [DataMember]
    public string ExcludeCedula { get; set; } = string.Empty;
}

[DataContract]
public class GetAvailableUsersResponse
{
    [DataMember]
    public bool Success { get; set; }
    
    [DataMember]
    public string Message { get; set; } = string.Empty;
    
    [DataMember]
    public List<UserResponse> Users { get; set; } = new();
}

[DataContract]
public class InviteUsersRequest
{
    [DataMember(Order = 0)]
    public Guid CommunityId { get; set; }
    
    /// <summary>
    /// Lista de cédulas separadas por coma
    /// </summary>
    [DataMember(Order = 1)]
    public string UserCedulasCSV { get; set; } = string.Empty;
}

[DataContract]
public class InviteUsersResponse
{
    [DataMember]
    public bool Success { get; set; }
    
    [DataMember]
    public string Message { get; set; } = string.Empty;
    
    [DataMember]
    public List<string> InvitedUsers { get; set; } = new();
}

[DataContract]
public class GetPendingInvitationsRequest
{
    [DataMember]
    public string UserCedula { get; set; } = string.Empty;
}

[DataContract]
public class GetPendingInvitationsResponse
{
    [DataMember]
    public bool Success { get; set; }
    
    [DataMember]
    public string Message { get; set; } = string.Empty;
    
    [DataMember]
    public List<InvitationResponse> Invitations { get; set; } = new();
}

[DataContract]
public class InvitationResponse
{
    [DataMember]
    public Guid Id { get; set; }
    
    [DataMember]
    public Guid CommunityId { get; set; }
    
    [DataMember]
    public string CommunityTitle { get; set; } = string.Empty;
    
    [DataMember]
    public string CommunityDescription { get; set; } = string.Empty;
    
    [DataMember]
    public string InvitedByName { get; set; } = string.Empty;
    
    [DataMember]
    public string InvitedByCedula { get; set; } = string.Empty;
    
    [DataMember]
    public DateTime CreatedAt { get; set; }
}

[DataContract]
public class AcceptInvitationRequest
{
    [DataMember(Order = 0)]
    public Guid InvitationId { get; set; }
    
    [DataMember(Order = 1)]
    public string UserCedula { get; set; } = string.Empty;
}

[DataContract]
public class AcceptInvitationResponse
{
    [DataMember]
    public bool Success { get; set; }
    
    [DataMember]
    public string Message { get; set; } = string.Empty;
}

[DataContract]
public class RejectInvitationRequest
{
    [DataMember(Order = 0)]
    public Guid InvitationId { get; set; }
    
    [DataMember(Order = 1)]
    public string UserCedula { get; set; } = string.Empty;
}

[DataContract]
public class RejectInvitationResponse
{
    [DataMember]
    public bool Success { get; set; }
    
    [DataMember]
    public string Message { get; set; } = string.Empty;
}