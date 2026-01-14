using ChatComunitario.DTOs;
using ChatComunitario.Interfaces;

namespace ChatComunitario.SoapServices;

/// <summary>
/// Implementación del servicio SOAP de canales
/// </summary>
public class ChannelSoapService : IChannelSoapService
{
    private readonly IChannelService _channelService;

    public ChannelSoapService(IChannelService channelService)
    {
        _channelService = channelService;
    }

    public async Task<CreateChannelResponse> CreateChannel(CreateChannelRequest request)
    {
        var dto = new CreateChannelDto
        {
            Name = request.Name,
            Description = request.Description
        };

        var (success, channel, message) = await _channelService.CreateChannelAsync(request.CommunityId, dto);

        ChannelResponse? channelResponse = null;
        if (channel != null)
        {
            channelResponse = new ChannelResponse
            {
                Id = channel.Id,
                Name = channel.Name,
                Description = channel.Description
            };
        }

        return new CreateChannelResponse
        {
            Success = success,
            Message = message,
            Channel = channelResponse
        };
    }

    public async Task<GetChannelByIdResponse> GetChannelById(GetChannelByIdRequest request)
    {
        var (success, channel, message) = await _channelService.GetChannelByIdAsync(request.Id);

        return new GetChannelByIdResponse
        {
            Success = success,
            Message = message,
            Channel = channel
        };
    }

    public async Task<GetChannelsByCommunityResponse> GetChannelsByCommunity(GetChannelsByCommunityRequest request)
    {
        var (success, channels, message) = await _channelService.GetChannelsByCommunityAsync(request.CommunityId);

        return new GetChannelsByCommunityResponse
        {
            Success = success,
            Message = message,
            Channels = channels.ToList()
        };
    }

    public async Task<UpdateChannelResponse> UpdateChannel(UpdateChannelRequest request)
    {
        var dto = new CreateChannelDto
        {
            Name = request.Name,
            Description = request.Description
        };

        var (success, _, message) = await _channelService.UpdateChannelAsync(request.Id, dto);

        return new UpdateChannelResponse
        {
            Success = success,
            Message = message
        };
    }

    public async Task<DeleteChannelResponse> DeleteChannel(DeleteChannelRequest request)
    {
        var (success, message) = await _channelService.DeleteChannelAsync(request.Id);

        return new DeleteChannelResponse
        {
            Success = success,
            Message = message
        };
    }
}
