using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChatComunitario.Models;

public class ChannelMember
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ChannelId { get; set; }

    [StringLength(10)]
    public string UserCedula { get; set; } = string.Empty;

    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(ChannelId))]
    public Channel Channel { get; set; } = null!;

    [ForeignKey(nameof(UserCedula))]
    public User User { get; set; } = null!;
}
