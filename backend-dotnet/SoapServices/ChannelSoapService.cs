using ChatComunitario.DTOs;
using ChatComunitario.Interfaces;

namespace ChatComunitario.SoapServices;

/// <summary>
/// Implementación del servicio SOAP de canales
/// </summary>
public class ChannelSoapService : IChannelSoapService
{
    private readonly IChannelService _channelService;
    private readonly IChannelInvitationService _channelInvitationService;

    public ChannelSoapService(IChannelService channelService, IChannelInvitationService channelInvitationService)
    {
        _channelService = channelService;
        _channelInvitationService = channelInvitationService;
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

    // Invitaciones a canales
    public async Task<InviteToChannelResponse> InviteToChannel(InviteToChannelRequest request)
    {
        var userCedulas = !string.IsNullOrWhiteSpace(request.UserCedulasCSV)
            ? request.UserCedulasCSV.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList()
            : new List<string>();

        Console.WriteLine($"[DEBUG] InviteToChannel called with ChannelId: {request.ChannelId}, UserCedulasCSV: '{request.UserCedulasCSV}'");

        var invitedUsers = new List<string>();
        var errors = new List<string>();

        foreach (var cedula in userCedulas)
        {
            var (success, _, message) = await _channelInvitationService.CreateInvitationAsync(
                request.ChannelId,
                cedula,
                request.InvitedByCedula);

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

        return new InviteToChannelResponse
        {
            Success = errors.Count == 0,
            Message = finalMessage,
            InvitedUsers = invitedUsers
        };
    }

    public async Task<GetPendingChannelInvitationsResponse> GetPendingChannelInvitations(GetPendingChannelInvitationsRequest request)
    {
        Console.WriteLine($"[DEBUG] GetPendingChannelInvitations called for user: {request.UserCedula}");

        try
        {
            var (success, invitations, message) = await _channelInvitationService.GetPendingInvitationsAsync(request.UserCedula);

            var invitationResponses = invitations.Select(i => new ChannelInvitationResponse
            {
                Id = i.Id,
                ChannelId = i.ChannelId,
                ChannelName = i.Channel?.Name ?? "",
                CommunityId = i.Channel?.CommunityId ?? Guid.Empty,
                CommunityTitle = i.Channel?.Community?.Title ?? "",
                InvitedByName = i.InvitedBy != null ? $"{i.InvitedBy.Name} {i.InvitedBy.LastName}" : "",
                InvitedByCedula = i.InvitedByCedula,
                CreatedAt = i.CreatedAt
            }).ToList();

            return new GetPendingChannelInvitationsResponse
            {
                Success = success,
                Message = message,
                Invitations = invitationResponses
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DEBUG] Error in GetPendingChannelInvitations: {ex.Message}");
            return new GetPendingChannelInvitationsResponse
            {
                Success = false,
                Message = $"Error: {ex.Message}",
                Invitations = new List<ChannelInvitationResponse>()
            };
        }
    }

    public async Task<AcceptChannelInvitationResponse> AcceptChannelInvitation(AcceptChannelInvitationRequest request)
    {
        Console.WriteLine($"[DEBUG] AcceptChannelInvitation called for invitation: {request.InvitationId}");

        var (success, message) = await _channelInvitationService.AcceptInvitationAsync(request.InvitationId, request.UserCedula);

        return new AcceptChannelInvitationResponse
        {
            Success = success,
            Message = message
        };
    }

    public async Task<RejectChannelInvitationResponse> RejectChannelInvitation(RejectChannelInvitationRequest request)
    {
        Console.WriteLine($"[DEBUG] RejectChannelInvitation called for invitation: {request.InvitationId}");

        var (success, message) = await _channelInvitationService.RejectInvitationAsync(request.InvitationId, request.UserCedula);

        return new RejectChannelInvitationResponse
        {
            Success = success,
            Message = message
        };
    }
}
