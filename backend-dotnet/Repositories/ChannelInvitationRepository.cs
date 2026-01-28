using ChatComunitario.Data;
using ChatComunitario.Models;
using Microsoft.EntityFrameworkCore;

namespace ChatComunitario.Repositories;

/// <summary>
/// Repositorio específico para invitaciones a canales
/// </summary>
public class ChannelInvitationRepository : Repository<ChannelInvitation>
{
    public ChannelInvitationRepository(AppDbContext context) : base(context) { }

    public async Task<ChannelInvitation?> GetByIdWithRelationsAsync(Guid id)
    {
        return await _dbSet
            .Include(ci => ci.Channel)
                .ThenInclude(ch => ch.Community)
            .Include(ci => ci.InvitedUser)
            .Include(ci => ci.InvitedBy)
            .FirstOrDefaultAsync(ci => ci.Id == id);
    }

    public async Task<IEnumerable<ChannelInvitation>> GetPendingInvitationsForUserAsync(string userCedula)
    {
        return await _dbSet
            .Include(ci => ci.Channel)
                .ThenInclude(ch => ch.Community)
            .Include(ci => ci.InvitedBy)
            .Where(ci => ci.InvitedUserCedula == userCedula && ci.Status == ChannelInvitationStatus.Pending)
            .OrderByDescending(ci => ci.CreatedAt)
            .ToListAsync();
    }

    public async Task<bool> HasPendingInvitationAsync(Guid channelId, string userCedula)
    {
        return await _dbSet
            .AnyAsync(ci => ci.ChannelId == channelId && 
                           ci.InvitedUserCedula == userCedula && 
                           ci.Status == ChannelInvitationStatus.Pending);
    }

    public async Task<IEnumerable<ChannelInvitation>> GetChannelInvitationsAsync(Guid channelId)
    {
        return await _dbSet
            .Include(ci => ci.InvitedUser)
            .Include(ci => ci.InvitedBy)
            .Where(ci => ci.ChannelId == channelId)
            .OrderByDescending(ci => ci.CreatedAt)
            .ToListAsync();
    }
}
