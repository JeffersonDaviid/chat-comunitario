using ChatComunitario.DTOs;
using ChatComunitario.Exceptions;
using ChatComunitario.Interfaces;
using ChatComunitario.Models;
using ChatComunitario.Repositories;

namespace ChatComunitario.Services;

/// <summary>
/// Servicio de gestión de canales
/// </summary>
public class ChannelService : IChannelService
{
    private readonly ChannelRepository _channelRepository;
    private readonly CommunityRepository _communityRepository;

    public ChannelService(ChannelRepository channelRepository, CommunityRepository communityRepository)
    {
        _channelRepository = channelRepository;
        _communityRepository = communityRepository;
    }

    public async Task<(bool Success, Channel? Channel, string Message)> CreateChannelAsync(Guid communityId, CreateChannelDto dto)
    {
        try
        {
            var community = await _communityRepository.GetByIdAsync(communityId);
            if (community == null)
            {
                throw new NotFoundException("Comunidad", communityId);
            }

            var channel = new Channel
            {
                Name = dto.Name,
                Description = dto.Description,
                CommunityId = communityId
            };

            await _channelRepository.AddAsync(channel);
            await _channelRepository.SaveAsync();

            return (true, channel, "Canal creado exitosamente");
        }
        catch (BusinessException ex)
        {
            return (false, null, ex.Message);
        }
        catch (Exception ex)
        {
            return (false, null, $"Error: {ex.Message}");
        }
    }

    public async Task<(bool Success, Channel? Channel, string Message)> GetChannelByIdAsync(Guid id)
    {
        try
        {
            var channel = await _channelRepository.GetByIdWithMessagesAsync(id);
            if (channel == null)
            {
                throw new NotFoundException("Canal", id);
            }

            return (true, channel, "Canal obtenido exitosamente");
        }
        catch (BusinessException ex)
        {
            return (false, null, ex.Message);
        }
        catch (Exception ex)
        {
            return (false, null, $"Error: {ex.Message}");
        }
    }

    public async Task<(bool Success, IEnumerable<Channel> Channels, string Message)> GetChannelsByCommunityAsync(Guid communityId)
    {
        try
        {
            var community = await _communityRepository.GetByIdAsync(communityId);
            if (community == null)
            {
                throw new NotFoundException("Comunidad", communityId);
            }

            var channels = await _channelRepository.GetByCommunityIdAsync(communityId);

            return (true, channels, "Canales obtenidos exitosamente");
        }
        catch (BusinessException ex)
        {
            return (false, new List<Channel>(), ex.Message);
        }
        catch (Exception ex)
        {
            return (false, new List<Channel>(), $"Error: {ex.Message}");
        }
    }

    public async Task<(bool Success, Channel? Channel, string Message)> UpdateChannelAsync(Guid id, CreateChannelDto dto)
    {
        try
        {
            var channel = await _channelRepository.GetByIdAsync(id);
            if (channel == null)
            {
                throw new NotFoundException("Canal", id);
            }

            channel.Name = dto.Name;
            channel.Description = dto.Description;

            await _channelRepository.UpdateAsync(channel);
            await _channelRepository.SaveAsync();

            return (true, channel, "Canal actualizado exitosamente");
        }
        catch (BusinessException ex)
        {
            return (false, null, ex.Message);
        }
        catch (Exception ex)
        {
            return (false, null, $"Error: {ex.Message}");
        }
    }

    public async Task<(bool Success, string Message)> DeleteChannelAsync(Guid id)
    {
        try
        {
            var channel = await _channelRepository.GetByIdAsync(id);
            if (channel == null)
            {
                throw new NotFoundException("Canal", id);
            }

            await _channelRepository.DeleteAsync(channel);
            await _channelRepository.SaveAsync();

            return (true, "Canal eliminado exitosamente");
        }
        catch (BusinessException ex)
        {
            return (false, ex.Message);
        }
        catch (Exception ex)
        {
            return (false, $"Error: {ex.Message}");
        }
    }
}
