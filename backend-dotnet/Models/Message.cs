using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChatComunitario.Models;

public class Message
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string Content { get; set; } = string.Empty;

    [StringLength(10)]
    public string SenderCedula { get; set; } = string.Empty;

    public Guid ChannelId { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [StringLength(500)]
    public string? FileUrl { get; set; }

    [StringLength(100)]
    public string? FileType { get; set; }

    [StringLength(255)]
    public string? FileName { get; set; }

    // Navigation properties
    [ForeignKey(nameof(SenderCedula))]
    public User Sender { get; set; } = null!;

    [ForeignKey(nameof(ChannelId))]
    public Channel Channel { get; set; } = null!;
}
