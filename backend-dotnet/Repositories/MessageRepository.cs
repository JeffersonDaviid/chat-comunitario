using ChatComunitario.Data;
using ChatComunitario.Models;
using Microsoft.EntityFrameworkCore;

namespace ChatComunitario.Repositories;

/// <summary>
/// Repositorio específico para mensajes
/// </summary>
public class MessageRepository : Repository<Message>
{
    public MessageRepository(AppDbContext context) : base(context) { }

    public async Task<IEnumerable<Message>> GetByChannelIdAsync(Guid channelId)
    {
        return await _dbSet
            .Where(m => m.ChannelId == channelId)
            .Include(m => m.Sender)
            .OrderBy(m => m.Timestamp)
            .ToListAsync();
    }

    public async Task<Message?> GetByIdWithSenderAsync(Guid id)
    {
        return await _dbSet
            .Include(m => m.Sender)
            .FirstOrDefaultAsync(m => m.Id == id);
    }
}
