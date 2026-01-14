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
}
