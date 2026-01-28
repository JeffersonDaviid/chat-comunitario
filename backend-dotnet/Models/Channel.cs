using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChatComunitario.Models;

public class Channel
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [StringLength(1000)]
    public string Description { get; set; } = string.Empty;

    public Guid CommunityId { get; set; }

    /// <summary>
    /// Indica si es el canal General (por defecto) de la comunidad.
    /// Todos los miembros de la comunidad son automáticamente miembros de este canal.
    /// </summary>
    public bool IsGeneral { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(CommunityId))]
    public Community Community { get; set; } = null!;

    public ICollection<Message> Messages { get; set; } = new List<Message>();
    public ICollection<ChannelMember> Members { get; set; } = new List<ChannelMember>();
}
