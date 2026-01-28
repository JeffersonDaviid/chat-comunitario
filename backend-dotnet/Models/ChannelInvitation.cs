using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChatComunitario.Models;

public enum ChannelInvitationStatus
{
    Pending = 0,
    Accepted = 1,
    Rejected = 2
}

/// <summary>
/// Invitación a un canal específico.
/// Permite invitar a usuarios que no son miembros de la comunidad.
/// </summary>
public class ChannelInvitation
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ChannelId { get; set; }

    [Required]
    [StringLength(10)]
    public string InvitedUserCedula { get; set; } = string.Empty;

    [Required]
    [StringLength(10)]
    public string InvitedByCedula { get; set; } = string.Empty;

    public ChannelInvitationStatus Status { get; set; } = ChannelInvitationStatus.Pending;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? RespondedAt { get; set; }

    // Navigation properties
    [ForeignKey(nameof(ChannelId))]
    public Channel Channel { get; set; } = null!;

    [ForeignKey(nameof(InvitedUserCedula))]
    public User InvitedUser { get; set; } = null!;

    [ForeignKey(nameof(InvitedByCedula))]
    public User InvitedBy { get; set; } = null!;
}
