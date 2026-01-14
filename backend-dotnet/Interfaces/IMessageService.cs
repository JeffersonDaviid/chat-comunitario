using ChatComunitario.Models;

namespace ChatComunitario.Interfaces;

/// <summary>
/// Servicio de gestión de mensajes
/// </summary>
public interface IMessageService
{
    /// <summary>
    /// Crea un nuevo mensaje
    /// </summary>
    Task<(bool Success, Message? Message, string ErrorMessage)> CreateMessageAsync(
        string senderCedula, Guid channelId, string content, string? fileUrl = null, string? fileType = null);

    /// <summary>
    /// Obtiene los mensajes de un canal
    /// </summary>
    Task<(bool Success, IEnumerable<Message> Messages, string ErrorMessage)> GetChannelMessagesAsync(Guid channelId);

    /// <summary>
    /// Obtiene un mensaje por ID
    /// </summary>
    Task<(bool Success, Message? Message, string ErrorMessage)> GetMessageByIdAsync(Guid id);

    /// <summary>
    /// Elimina un mensaje
    /// </summary>
    Task<(bool Success, string Message)> DeleteMessageAsync(Guid id);
}
