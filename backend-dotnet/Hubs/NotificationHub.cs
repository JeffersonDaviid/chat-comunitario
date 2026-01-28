using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ChatComunitario.Data;

namespace ChatComunitario.Hubs;

/// <summary>
/// Hub de SignalR para notificaciones en tiempo real (invitaciones, etc.)
/// Los usuarios se conectan con su cédula para recibir notificaciones personales
/// </summary>
public class NotificationHub : Hub
{
    private readonly AppDbContext _context;
    
    // Mapeo de connectionId -> cedula del usuario
    private static readonly Dictionary<string, string> _userConnections = new();
    
    // Mapeo inverso: cedula -> lista de connectionIds (un usuario puede tener múltiples tabs)
    private static readonly Dictionary<string, HashSet<string>> _cedulaToConnections = new();

    public NotificationHub(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Registra al usuario para recibir notificaciones
    /// </summary>
    public async Task RegisterUser(string cedula)
    {
        if (string.IsNullOrEmpty(cedula))
        {
            await Clients.Caller.SendAsync("Error", "Cédula requerida");
            return;
        }

        var connectionId = Context.ConnectionId;
        
        // Registrar la conexión
        _userConnections[connectionId] = cedula;
        
        if (!_cedulaToConnections.ContainsKey(cedula))
        {
            _cedulaToConnections[cedula] = new HashSet<string>();
        }
        _cedulaToConnections[cedula].Add(connectionId);

        // Añadir al grupo personal del usuario
        await Groups.AddToGroupAsync(connectionId, $"user:{cedula}");

        Console.WriteLine($"[NotificationHub] Usuario {cedula} registrado para notificaciones (connectionId: {connectionId})");
        
        await Clients.Caller.SendAsync("Registered", new { cedula, message = "Registrado para notificaciones" });
    }

    /// <summary>
    /// Envía una notificación de nueva invitación a un usuario específico
    /// </summary>
    public static async Task SendInvitationNotification(IHubContext<NotificationHub> hubContext, string targetCedula, object invitationData)
    {
        Console.WriteLine($"[NotificationHub] Enviando notificación de invitación a {targetCedula}");
        await hubContext.Clients.Group($"user:{targetCedula}").SendAsync("NewInvitation", invitationData);
    }

    /// <summary>
    /// Envía una notificación de invitación aceptada (útil para el que invitó)
    /// </summary>
    public static async Task SendInvitationAccepted(IHubContext<NotificationHub> hubContext, string targetCedula, object data)
    {
        Console.WriteLine($"[NotificationHub] Notificando aceptación de invitación a {targetCedula}");
        await hubContext.Clients.Group($"user:{targetCedula}").SendAsync("InvitationAccepted", data);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var connectionId = Context.ConnectionId;
        
        if (_userConnections.TryGetValue(connectionId, out var cedula))
        {
            _userConnections.Remove(connectionId);
            
            if (_cedulaToConnections.TryGetValue(cedula, out var connections))
            {
                connections.Remove(connectionId);
                if (connections.Count == 0)
                {
                    _cedulaToConnections.Remove(cedula);
                }
            }

            Console.WriteLine($"[NotificationHub] Usuario {cedula} desconectado (connectionId: {connectionId})");
        }

        await base.OnDisconnectedAsync(exception);
    }
}
