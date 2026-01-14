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
public class CreateChannelRequest
{
    public Guid CommunityId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class CreateChannelResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public ChannelResponse? Channel { get; set; }
}

public class GetChannelByIdRequest
{
    public Guid Id { get; set; }
}

public class GetChannelByIdResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public Channel? Channel { get; set; }
}

public class GetChannelsByCommunityRequest
{
    public Guid CommunityId { get; set; }
}

public class GetChannelsByCommunityResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<Channel> Channels { get; set; } = new();
}

public class UpdateChannelRequest
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class UpdateChannelResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class DeleteChannelRequest
{
    public Guid Id { get; set; }
}

public class DeleteChannelResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}
