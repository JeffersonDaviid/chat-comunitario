using Microsoft.EntityFrameworkCore;
using ChatComunitario.Models;

namespace ChatComunitario.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Community> Communities { get; set; }
    public DbSet<CommunityMember> CommunityMembers { get; set; }
    public DbSet<CommunityInvitation> CommunityInvitations { get; set; }
    public DbSet<Channel> Channels { get; set; }
    public DbSet<ChannelMember> ChannelMembers { get; set; }
    public DbSet<Message> Messages { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Cedula);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.Phone).IsUnique();
        });

        // Community configuration
        modelBuilder.Entity<Community>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(c => c.Owner)
                  .WithMany(u => u.OwnedCommunities)
                  .HasForeignKey(c => c.OwnerCedula)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // CommunityMember configuration
        modelBuilder.Entity<CommunityMember>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.CommunityId, e.UserCedula }).IsUnique();
            
            entity.HasOne(cm => cm.Community)
                  .WithMany(c => c.Members)
                  .HasForeignKey(cm => cm.CommunityId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(cm => cm.User)
                  .WithMany(u => u.CommunityMemberships)
                  .HasForeignKey(cm => cm.UserCedula)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Channel configuration
        modelBuilder.Entity<Channel>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(ch => ch.Community)
                  .WithMany(c => c.Channels)
                  .HasForeignKey(ch => ch.CommunityId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ChannelMember configuration
        modelBuilder.Entity<ChannelMember>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ChannelId, e.UserCedula }).IsUnique();

            entity.HasOne(cm => cm.Channel)
                  .WithMany(c => c.Members)
                  .HasForeignKey(cm => cm.ChannelId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(cm => cm.User)
                  .WithMany()
                  .HasForeignKey(cm => cm.UserCedula)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Message configuration
        modelBuilder.Entity<Message>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Timestamp);

            entity.HasOne(m => m.Sender)
                  .WithMany(u => u.Messages)
                  .HasForeignKey(m => m.SenderCedula)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(m => m.Channel)
                  .WithMany(ch => ch.Messages)
                  .HasForeignKey(m => m.ChannelId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // CommunityInvitation configuration
        modelBuilder.Entity<CommunityInvitation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.CommunityId, e.InvitedUserCedula, e.Status });

            entity.HasOne(ci => ci.Community)
                  .WithMany()
                  .HasForeignKey(ci => ci.CommunityId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ci => ci.InvitedUser)
                  .WithMany()
                  .HasForeignKey(ci => ci.InvitedUserCedula)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(ci => ci.InvitedBy)
                  .WithMany()
                  .HasForeignKey(ci => ci.InvitedByCedula)
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
