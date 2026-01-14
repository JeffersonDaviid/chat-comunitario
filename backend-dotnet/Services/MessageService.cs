using ChatComunitario.Exceptions;
using ChatComunitario.Interfaces;
using ChatComunitario.Models;
using ChatComunitario.Repositories;

namespace ChatComunitario.Services;

/// <summary>
/// Servicio de gestión de mensajes
/// </summary>
public class MessageService : IMessageService
{
    private readonly MessageRepository _messageRepository;
    private readonly ChannelRepository _channelRepository;
    private readonly UserRepository _userRepository;

    public MessageService(
        MessageRepository messageRepository,
        ChannelRepository channelRepository,
        UserRepository userRepository)
    {
        _messageRepository = messageRepository;
        _channelRepository = channelRepository;
        _userRepository = userRepository;
    }

    public async Task<(bool Success, Message? Message, string ErrorMessage)> CreateMessageAsync(
        string senderCedula, Guid channelId, string content, string? fileUrl = null, string? fileType = null)
    {
        try
        {
            var user = await _userRepository.GetByCedulaAsync(senderCedula);
            if (user == null)
            {
                throw new NotFoundException("Usuario", senderCedula);
            }

            var channel = await _channelRepository.GetByIdAsync(channelId);
            if (channel == null)
            {
                throw new NotFoundException("Canal", channelId);
            }

            if (string.IsNullOrWhiteSpace(content) && string.IsNullOrWhiteSpace(fileUrl))
            {
                throw new ValidationException("El mensaje debe contener contenido o archivo");
            }

            var message = new Message
            {
                Content = content ?? string.Empty,
                SenderCedula = senderCedula,
                ChannelId = channelId,
                FileUrl = fileUrl,
                FileType = fileType,
                Timestamp = DateTime.UtcNow
            };

            await _messageRepository.AddAsync(message);
            await _messageRepository.SaveAsync();

            return (true, message, "Mensaje creado exitosamente");
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

    public async Task<(bool Success, IEnumerable<Message> Messages, string ErrorMessage)> GetChannelMessagesAsync(Guid channelId)
    {
        try
        {
            var channel = await _channelRepository.GetByIdAsync(channelId);
            if (channel == null)
            {
                throw new NotFoundException("Canal", channelId);
            }

            var messages = await _messageRepository.GetByChannelIdAsync(channelId);

            return (true, messages, "Mensajes obtenidos exitosamente");
        }
        catch (BusinessException ex)
        {
            return (false, new List<Message>(), ex.Message);
        }
        catch (Exception ex)
        {
            return (false, new List<Message>(), $"Error: {ex.Message}");
        }
    }

    public async Task<(bool Success, Message? Message, string ErrorMessage)> GetMessageByIdAsync(Guid id)
    {
        try
        {
            var message = await _messageRepository.GetByIdWithSenderAsync(id);
            if (message == null)
            {
                throw new NotFoundException("Mensaje", id);
            }

            return (true, message, "Mensaje obtenido exitosamente");
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

    public async Task<(bool Success, string Message)> DeleteMessageAsync(Guid id)
    {
        try
        {
            var message = await _messageRepository.GetByIdAsync(id);
            if (message == null)
            {
                throw new NotFoundException("Mensaje", id);
            }

            await _messageRepository.DeleteAsync(message);
            await _messageRepository.SaveAsync();

            return (true, "Mensaje eliminado exitosamente");
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
