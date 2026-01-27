using ChatComunitario.Data;
using ChatComunitario.Models;
using Microsoft.EntityFrameworkCore;

namespace ChatComunitario.Repositories;

/// <summary>
/// Repositorio específico para invitaciones de comunidad
/// </summary>
public class CommunityInvitationRepository : Repository<CommunityInvitation>
{
    public CommunityInvitationRepository(AppDbContext context) : base(context) { }

    public async Task<IEnumerable<CommunityInvitation>> GetPendingInvitationsForUserAsync(string userCedula)
    {
        return await _dbSet
            .Include(ci => ci.Community)
            .Include(ci => ci.InvitedBy)
            .Where(ci => ci.InvitedUserCedula == userCedula && ci.Status == InvitationStatus.Pending)
            .OrderByDescending(ci => ci.CreatedAt)
            .ToListAsync();
    }

    public async Task<CommunityInvitation?> GetPendingInvitationAsync(Guid communityId, string userCedula)
    {
        return await _dbSet
            .FirstOrDefaultAsync(ci => 
                ci.CommunityId == communityId && 
                ci.InvitedUserCedula == userCedula && 
                ci.Status == InvitationStatus.Pending);
    }

    public async Task<bool> HasPendingInvitationAsync(Guid communityId, string userCedula)
    {
        return await _dbSet
            .AnyAsync(ci => 
                ci.CommunityId == communityId && 
                ci.InvitedUserCedula == userCedula && 
                ci.Status == InvitationStatus.Pending);
    }

    public async Task<CommunityInvitation?> GetByIdWithRelationsAsync(Guid id)
    {
        return await _dbSet
            .Include(ci => ci.Community)
            .Include(ci => ci.InvitedUser)
            .Include(ci => ci.InvitedBy)
            .FirstOrDefaultAsync(ci => ci.Id == id);
    }
}
