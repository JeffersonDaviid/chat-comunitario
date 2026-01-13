using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChatComunitario.Models;

public class Community
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(1000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [StringLength(10)]
    public string OwnerCedula { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(OwnerCedula))]
    public User Owner { get; set; } = null!;

    public ICollection<CommunityMember> Members { get; set; } = new List<CommunityMember>();
    public ICollection<Channel> Channels { get; set; } = new List<Channel>();
}
