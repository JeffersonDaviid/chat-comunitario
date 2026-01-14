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
