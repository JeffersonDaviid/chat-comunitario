using System.ServiceModel;
using System.Runtime.Serialization;
using ChatComunitario.Interfaces;
using ChatComunitario.Models;

namespace ChatComunitario.SoapServices;

/// <summary>
/// Contrato SOAP para servicios de canales
/// </summary>
[ServiceContract]
public interface IChannelSoapService
{
    [OperationContract]
    Task<CreateChannelResponse> CreateChannel(CreateChannelRequest request);

    [OperationContract]
    Task<GetChannelByIdResponse> GetChannelById(GetChannelByIdRequest request);

    [OperationContract]
    Task<GetChannelsByCommunityResponse> GetChannelsByCommunity(GetChannelsByCommunityRequest request);

    [OperationContract]
    Task<UpdateChannelResponse> UpdateChannel(UpdateChannelRequest request);

    [OperationContract]
    Task<DeleteChannelResponse> DeleteChannel(DeleteChannelRequest request);

    // Invitaciones a canales
    [OperationContract]
    Task<InviteToChannelResponse> InviteToChannel(InviteToChannelRequest request);

    [OperationContract]
    Task<GetPendingChannelInvitationsResponse> GetPendingChannelInvitations(GetPendingChannelInvitationsRequest request);

    [OperationContract]
    Task<AcceptChannelInvitationResponse> AcceptChannelInvitation(AcceptChannelInvitationRequest request);

    [OperationContract]
    Task<RejectChannelInvitationResponse> RejectChannelInvitation(RejectChannelInvitationRequest request);
}

// Request/Response models
[DataContract]
public class CreateChannelRequest
{
    [DataMember(Order = 0)]
    public Guid CommunityId { get; set; }
    
    [DataMember(Order = 1)]
    public string? Description { get; set; }
    
    [DataMember(Order = 2)]
    public string Name { get; set; } = string.Empty;
}

[DataContract]
public class CreateChannelResponse
{
    [DataMember]
    public bool Success { get; set; }
    
    [DataMember]
    public string Message { get; set; } = string.Empty;
    
    [DataMember]
    public ChannelResponse? Channel { get; set; }
}

[DataContract]
public class GetChannelByIdRequest
{
    [DataMember]
    public Guid Id { get; set; }
}

[DataContract]
public class GetChannelByIdResponse
{
    [DataMember]
    public bool Success { get; set; }
    
    [DataMember]
    public string Message { get; set; } = string.Empty;
    
    [DataMember]
    public Channel? Channel { get; set; }
}

[DataContract]
public class GetChannelsByCommunityRequest
{
    [DataMember]
    public Guid CommunityId { get; set; }
}

[DataContract]
public class GetChannelsByCommunityResponse
{
    [DataMember]
    public bool Success { get; set; }
    
    [DataMember]
    public string Message { get; set; } = string.Empty;
    
    [DataMember]
    public List<Channel> Channels { get; set; } = new();
}

[DataContract]
public class UpdateChannelRequest
{
    [DataMember(Order = 0)]
    public string? Description { get; set; }
    
    [DataMember(Order = 1)]
    public Guid Id { get; set; }
    
    [DataMember(Order = 2)]
    public string Name { get; set; } = string.Empty;
}

[DataContract]
public class UpdateChannelResponse
{
    [DataMember]
    public bool Success { get; set; }
    
    [DataMember]
    public string Message { get; set; } = string.Empty;
}

[DataContract]
public class DeleteChannelRequest
{
    [DataMember]
    public Guid Id { get; set; }
}

[DataContract]
public class DeleteChannelResponse
{
    [DataMember]
    public bool Success { get; set; }
    
    [DataMember]
    public string Message { get; set; } = string.Empty;
}

// Channel Invitation Request/Response models
[DataContract]
public class InviteToChannelRequest
{
    [DataMember(Order = 0)]
    public Guid ChannelId { get; set; }
    
    [DataMember(Order = 1)]
    public string InvitedByCedula { get; set; } = string.Empty;
    
    [DataMember(Order = 2)]
    public string UserCedulasCSV { get; set; } = string.Empty;
}

[DataContract]
public class InviteToChannelResponse
{
    [DataMember]
    public bool Success { get; set; }
    
    [DataMember]
    public string Message { get; set; } = string.Empty;
    
    [DataMember]
    public List<string> InvitedUsers { get; set; } = new();
}

[DataContract]
public class GetPendingChannelInvitationsRequest
{
    [DataMember]
    public string UserCedula { get; set; } = string.Empty;
}

[DataContract]
public class GetPendingChannelInvitationsResponse
{
    [DataMember]
    public bool Success { get; set; }
    
    [DataMember]
    public string Message { get; set; } = string.Empty;
    
    [DataMember]
    public List<ChannelInvitationResponse> Invitations { get; set; } = new();
}

[DataContract]
public class ChannelInvitationResponse
{
    [DataMember]
    public Guid Id { get; set; }
    
    [DataMember]
    public Guid ChannelId { get; set; }
    
    [DataMember]
    public string ChannelName { get; set; } = string.Empty;
    
    [DataMember]
    public Guid CommunityId { get; set; }
    
    [DataMember]
    public string CommunityTitle { get; set; } = string.Empty;
    
    [DataMember]
    public string InvitedByName { get; set; } = string.Empty;
    
    [DataMember]
    public string InvitedByCedula { get; set; } = string.Empty;
    
    [DataMember]
    public DateTime CreatedAt { get; set; }
}

[DataContract]
public class AcceptChannelInvitationRequest
{
    [DataMember(Order = 0)]
    public Guid InvitationId { get; set; }
    
    [DataMember(Order = 1)]
    public string UserCedula { get; set; } = string.Empty;
}

[DataContract]
public class AcceptChannelInvitationResponse
{
    [DataMember]
    public bool Success { get; set; }
    
    [DataMember]
    public string Message { get; set; } = string.Empty;
}

[DataContract]
public class RejectChannelInvitationRequest
{
    [DataMember(Order = 0)]
    public Guid InvitationId { get; set; }
    
    [DataMember(Order = 1)]
    public string UserCedula { get; set; } = string.Empty;
}

[DataContract]
public class RejectChannelInvitationResponse
{
    [DataMember]
    public bool Success { get; set; }
    
    [DataMember]
    public string Message { get; set; } = string.Empty;
}
