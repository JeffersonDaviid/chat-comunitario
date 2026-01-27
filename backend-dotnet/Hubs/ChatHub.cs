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
        var channelExists = community.Channels.Any(ch => ch.Id.ToString() == channelId);
        if (!channelExists)
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

        // Enviar mensaje de bienvenida
        await Clients.Caller.SendAsync("ReceiveMessage", new
        {
            type = "welcome",
            payload = new
            {
                communityName = community.Title,
                channelName = community.Channels.FirstOrDefault(c => c.Id.ToString() == channelId)?.Name ?? "Canal",
                message = $"Bienvenido {userName}"
            }
        });

        Console.WriteLine($"[SignalR] Usuario {cedula} se unió al canal {channelId} en comunidad {communityId}");
    }

    public async Task SendMessage(string content, string? fileUrl = null, string? fileType = null)
    {
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
