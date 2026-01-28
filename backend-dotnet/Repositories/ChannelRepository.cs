using ChatComunitario.Data;
using ChatComunitario.Models;
using Microsoft.EntityFrameworkCore;

namespace ChatComunitario.Repositories;

/// <summary>
/// Repositorio específico para canales
/// </summary>
public class ChannelRepository : Repository<Channel>
{
    public ChannelRepository(AppDbContext context) : base(context) { }

    public async Task<Channel?> GetByIdWithRelationsAsync(Guid id)
    {
        return await _dbSet
            .Include(ch => ch.Community)
            .Include(ch => ch.Members).ThenInclude(m => m.User)
            .FirstOrDefaultAsync(ch => ch.Id == id);
    }

    public async Task<Channel?> GetByIdWithMessagesAsync(Guid id)
    {
        return await _dbSet
            .Include(ch => ch.Messages).ThenInclude(m => m.Sender)
            .Include(ch => ch.Community)
            .FirstOrDefaultAsync(ch => ch.Id == id);
    }

    public async Task<IEnumerable<Channel>> GetByCommunityIdAsync(Guid communityId)
    {
        return await _dbSet
            .Where(ch => ch.CommunityId == communityId)
            .Include(ch => ch.Messages)
            .ToListAsync();
    }

    /// <summary>
    /// Obtiene el canal General de una comunidad sin cargar relaciones extras
    /// </summary>
    public async Task<Channel?> GetGeneralChannelAsync(Guid communityId)
    {
        return await _dbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(ch => ch.CommunityId == communityId && ch.IsGeneral);
    }
}
