using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChatComunitario.Models;

public enum InvitationStatus
{
    Pending = 0,
    Accepted = 1,
    Rejected = 2
}

public class CommunityInvitation
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CommunityId { get; set; }

    [Required]
    [StringLength(10)]
    public string InvitedUserCedula { get; set; } = string.Empty;

    [Required]
    [StringLength(10)]
    public string InvitedByCedula { get; set; } = string.Empty;

    public InvitationStatus Status { get; set; } = InvitationStatus.Pending;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? RespondedAt { get; set; }

    // Navigation properties
    [ForeignKey(nameof(CommunityId))]
    public Community Community { get; set; } = null!;

    [ForeignKey(nameof(InvitedUserCedula))]
    public User InvitedUser { get; set; } = null!;

    [ForeignKey(nameof(InvitedByCedula))]
    public User InvitedBy { get; set; } = null!;
}
