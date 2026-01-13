using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChatComunitario.Models;

public class User
{
    [Key]
    [StringLength(10)]
    public string Cedula { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    [Required]
    [StringLength(10)]
    public string Phone { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string Address { get; set; } = string.Empty;

    public double Latitude { get; set; }
    
    public double Longitude { get; set; }

    [StringLength(255)]
    public string? ProfileImg { get; set; }

    // Navigation properties
    public ICollection<Community> OwnedCommunities { get; set; } = new List<Community>();
    public ICollection<CommunityMember> CommunityMemberships { get; set; } = new List<CommunityMember>();
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}
