using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChatComunitario.Models;

public class CommunityMember
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CommunityId { get; set; }

    [StringLength(10)]
    public string UserCedula { get; set; } = string.Empty;

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(CommunityId))]
    public Community Community { get; set; } = null!;

    [ForeignKey(nameof(UserCedula))]
    public User User { get; set; } = null!;
}
