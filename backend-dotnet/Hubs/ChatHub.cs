using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ChatComunitario.Data;
using ChatComunitario.Models;
using System.Security.Claims;

namespace ChatComunitario.Hubs;

public class ChatHub : Hub
{
    private const string ErrorEvent = "Error";
    
    private readonly AppDbContext _context;
    private static readonly Dictionary<string, (string CommunityId, string ChannelId, string Cedula)> _connections = new();

    public ChatHub(AppDbContext context)
    {
        _context = context;
    }

    public async Task JoinChannel(string communityId, string channelId, string cedula)
    {
        // Validar que la comunidad existe
        var community = await _context.Communities
            .Include(c => c.Members)
            .Include(c => c.Channels)
            .FirstOrDefaultAsync(c => c.Id.ToString() == communityId);

        if (community == null)
        {
            await Clients.Caller.SendAsync(ErrorEvent, "Comunidad no encontrada");
            return;
        }

        // Validar que el usuario es miembro
        var isMember = community.Members.Any(m => m.UserCedula == cedula);
        if (!isMember)
        {
            await Clients.Caller.SendAsync(ErrorEvent, "Usuario no es miembro de la comunidad");
            return;
        }

        // Validar que el canal existe
        var channel = community.Channels.FirstOrDefault(ch => ch.Id.ToString() == channelId);
        if (channel == null)
        {
            await Clients.Caller.SendAsync(ErrorEvent, "Canal no encontrado en la comunidad");
            return;
        }

        // Guardar la conexión
        _connections[Context.ConnectionId] = (communityId, channelId, cedula);

        // Unirse al grupo del canal
        var groupName = $"{communityId}:{channelId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        // Obtener información del usuario
        var user = await _context.Users.FindAsync(cedula);
        var userName = user != null ? $"{user.Name} {user.LastName}" : "Usuario";

        // Obtener el historial de mensajes del canal (últimos 50 mensajes)
        var messages = await _context.Messages
            .Where(m => m.ChannelId.ToString() == channelId)
            .Include(m => m.Sender)
            .OrderByDescending(m => m.Timestamp)
            .Take(50)
            .OrderBy(m => m.Timestamp)
            .ToListAsync();

        // Enviar historial de mensajes
        foreach (var message in messages)
        {
            var sender = message.Sender ?? new User { Cedula = message.SenderCedula, Name = "Usuario", LastName = "Eliminado" };
            
            await Clients.Caller.SendAsync("ReceiveMessage", new
            {
                type = "chat",
                payload = new
                {
                    id = message.Id.ToString(),
                    cedula = message.SenderCedula,
                    senderId = message.SenderCedula,
                    sender = new
                    {
                        cedula = sender.Cedula,
                        username = $"{sender.Name} {sender.LastName}".Trim(),
                        avatar = sender.ProfileImg
                    },
                    text = message.Content,
                    content = message.Content,
                    file = message.FileUrl,
                    fileType = message.FileType,
                    channelId = message.ChannelId.ToString(),
                    ts = ((DateTimeOffset)message.Timestamp).ToUnixTimeMilliseconds(),
                    timestamp = message.Timestamp,
                    isHistory = true // Indicador de mensaje histórico
                }
            });
        }

        // Enviar mensaje de bienvenida
        await Clients.Caller.SendAsync("ReceiveMessage", new
        {
            type = "welcome",
            payload = new
            {
                communityName = community.Title,
                channelName = channel.Name,
                message = $"Bienvenido {userName}",
                messageCount = messages.Count
            }
        });

        Console.WriteLine($"[SignalR] Usuario {cedula} se unió al canal {channelId} en comunidad {communityId} - Historial: {messages.Count} mensajes");
    }

    public async Task SendMessage(string content, string? fileUrl = null, string? fileType = null)
    {
        // Validar tipos de archivo permitidos
        if (!string.IsNullOrEmpty(fileType))
        {
            var allowedTypes = new[] { "image/jpeg", "image/png", "application/pdf" };
            if (!allowedTypes.Contains(fileType.ToLower()))
            {
                await Clients.Caller.SendAsync(ErrorEvent, "Tipo de archivo no permitido. Use JPG, PNG o PDF");
                Console.WriteLine($"[SignalR] Archivo rechazado: tipo no permitido {fileType}");
                return;
            }

            Console.WriteLine($"[SignalR] Validación de tipo: {fileType} ✓");
        }

        if (!_connections.TryGetValue(Context.ConnectionId, out var connectionInfo))
        {
            await Clients.Caller.SendAsync(ErrorEvent, "No estás conectado a ningún canal");
            return;
        }

        var (communityId, channelId, cedula) = connectionInfo;

        // Obtener información del usuario
        var user = await _context.Users.FindAsync(cedula);
        if (user == null)
        {
            await Clients.Caller.SendAsync(ErrorEvent, "Usuario no encontrado");
            return;
        }

        // Guardar mensaje en la base de datos
        var message = new Message
        {
            Content = content ?? string.Empty,
            SenderCedula = cedula,
            ChannelId = Guid.Parse(channelId),
            FileUrl = fileUrl,
            FileType = fileType,
            Timestamp = DateTime.UtcNow
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        // Enviar mensaje a todos los usuarios del canal
        var groupName = $"{communityId}:{channelId}";
        await Clients.Group(groupName).SendAsync("ReceiveMessage", new
        {
            type = "chat",
            payload = new
            {
                id = message.Id.ToString(),
                cedula = user.Cedula,
                senderId = user.Cedula,
                sender = new
                {
                    cedula = user.Cedula,
                    username = $"{user.Name} {user.LastName}",
                    avatar = user.ProfileImg
                },
                text = content,
                content,
                file = fileUrl,
                fileType,
                channelId,
                ts = ((DateTimeOffset)message.Timestamp).ToUnixTimeMilliseconds(),
                timestamp = message.Timestamp
            }
        });

        Console.WriteLine($"[SignalR] Mensaje enviado por {cedula} al canal {channelId}: {content}");
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (_connections.TryGetValue(Context.ConnectionId, out var connectionInfo))
        {
            var (communityId, channelId, cedula) = connectionInfo;
            var groupName = $"{communityId}:{channelId}";
            
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
            _connections.Remove(Context.ConnectionId);
            
            Console.WriteLine($"[SignalR] Usuario {cedula} desconectado del canal {channelId}");
        }

        await base.OnDisconnectedAsync(exception);
    }
}
