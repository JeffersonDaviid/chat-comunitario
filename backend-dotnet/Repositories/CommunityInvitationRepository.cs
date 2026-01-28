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
        Console.WriteLine($"[DEBUG] CommunityInvitationRepository.GetByIdWithRelationsAsync - Looking for ID: {id}");
        
        var result = await _dbSet
            .Include(ci => ci.Community)
            .Include(ci => ci.InvitedUser)
            .Include(ci => ci.InvitedBy)
            .FirstOrDefaultAsync(ci => ci.Id == id);
            
        Console.WriteLine($"[DEBUG] CommunityInvitationRepository.GetByIdWithRelationsAsync - Result: {(result != null ? "Found" : "Not Found")}");
        return result;
    }
    
    public async Task<CommunityInvitation?> GetByIdSimpleAsync(Guid id)
    {
        Console.WriteLine($"[DEBUG] CommunityInvitationRepository.GetByIdSimpleAsync - Looking for ID: {id}");
        
        var result = await _dbSet.AsNoTracking().FirstOrDefaultAsync(ci => ci.Id == id);
            
        Console.WriteLine($"[DEBUG] CommunityInvitationRepository.GetByIdSimpleAsync - Result: {(result != null ? "Found" : "Not Found")}");
        return result;
    }

    /// <summary>
    /// Actualiza el estado de la invitación directamente en la BD sin usar tracking
    /// Esto evita problemas de concurrencia optimista
    /// </summary>
    public async Task<int> UpdateStatusDirectAsync(Guid invitationId, InvitationStatus newStatus)
    {
        Console.WriteLine($"[DEBUG] UpdateStatusDirectAsync - ID: {invitationId}, NewStatus: {newStatus}");
        
        var affectedRows = await _dbSet
            .Where(ci => ci.Id == invitationId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(ci => ci.Status, newStatus)
                .SetProperty(ci => ci.RespondedAt, DateTime.UtcNow));
        
        Console.WriteLine($"[DEBUG] UpdateStatusDirectAsync - Affected rows: {affectedRows}");
        return affectedRows;
    }
}
