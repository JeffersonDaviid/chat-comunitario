using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ChatComunitario.Interfaces;
using ChatComunitario.Services;

namespace ChatComunitario.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class MessageController : ControllerBase
{
    private readonly IMessageService _messageService;
    private readonly IChannelService _channelService;
    private readonly ICommunityService _communityService;

    public MessageController(
        IMessageService messageService,
        IChannelService channelService,
        ICommunityService communityService)
    {
        _messageService = messageService;
        _channelService = channelService;
        _communityService = communityService;
    }

    /// <summary>
    /// Obtiene el historial de mensajes de un canal
    /// </summary>
    /// <param name="communityId">ID de la comunidad</param>
    /// <param name="channelId">ID del canal</param>
    /// <param name="limit">Número máximo de mensajes (default: 50)</param>
    /// <returns>Lista de mensajes ordenados por timestamp</returns>
    [HttpGet("channel/{communityId}/{channelId}")]
    public async Task<IActionResult> GetChannelMessages(
        [FromRoute] string communityId,
        [FromRoute] string channelId,
        [FromQuery] int limit = 50)
    {
        try
        {
            // Validar que el canal existe
            if (!Guid.TryParse(channelId, out var channelIdGuid))
            {
                return BadRequest(new { message = "ID de canal inválido" });
            }

            var (success, messages, errorMessage) = await _messageService.GetChannelMessagesAsync(channelIdGuid);

            if (!success || messages == null)
            {
                return NotFound(new { message = errorMessage });
            }

            // Limitar y ordenar por timestamp descendente (más reciente primero)
            var orderedMessages = messages
                .OrderByDescending(m => m.Timestamp)
                .Take(limit)
                .OrderBy(m => m.Timestamp) // Reordenar ascendente para mostrar en UI
                .ToList();

            var messageData = orderedMessages.Select(m => new
            {
                id = m.Id.ToString(),
                cedula = m.SenderCedula,
                senderId = m.SenderCedula,
                sender = new
                {
                    cedula = m.Sender?.Cedula,
                    username = $"{m.Sender?.Name} {m.Sender?.LastName}".Trim(),
                    avatar = m.Sender?.ProfileImg
                },
                text = m.Content,
                content = m.Content,
                file = m.FileUrl,
                fileType = m.FileType,
                channelId = m.ChannelId.ToString(),
                ts = ((DateTimeOffset)m.Timestamp).ToUnixTimeMilliseconds(),
                timestamp = m.Timestamp
            }).ToList();

            return Ok(new
            {
                success = true,
                count = messageData.Count,
                messages = messageData
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error: {ex.Message}" });
        }
    }

    /// <summary>
    /// Obtiene un mensaje específico por ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetMessage([FromRoute] string id)
    {
        try
        {
            if (!Guid.TryParse(id, out var messageId))
            {
                return BadRequest(new { message = "ID de mensaje inválido" });
            }

            var (success, message, errorMessage) = await _messageService.GetMessageByIdAsync(messageId);

            if (!success || message == null)
            {
                return NotFound(new { message = errorMessage });
            }

            var messageData = new
            {
                id = message.Id.ToString(),
                cedula = message.SenderCedula,
                senderId = message.SenderCedula,
                sender = new
                {
                    cedula = message.Sender?.Cedula,
                    username = $"{message.Sender?.Name} {message.Sender?.LastName}".Trim(),
                    avatar = message.Sender?.ProfileImg
                },
                text = message.Content,
                content = message.Content,
                file = message.FileUrl,
                fileType = message.FileType,
                channelId = message.ChannelId.ToString(),
                ts = ((DateTimeOffset)message.Timestamp).ToUnixTimeMilliseconds(),
                timestamp = message.Timestamp
            };

            return Ok(new
            {
                success = true,
                message = messageData
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error: {ex.Message}" });
        }
    }

    /// <summary>
    /// Elimina un mensaje
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMessage([FromRoute] string id)
    {
        try
        {
            if (!Guid.TryParse(id, out var messageId))
            {
                return BadRequest(new { message = "ID de mensaje inválido" });
            }

            var (success, errorMessage) = await _messageService.DeleteMessageAsync(messageId);

            if (!success)
            {
                return BadRequest(new { message = errorMessage });
            }

            return Ok(new { success = true, message = "Mensaje eliminado exitosamente" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error: {ex.Message}" });
        }
    }
}
