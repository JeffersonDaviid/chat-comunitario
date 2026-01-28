using ChatComunitario.Data;
using ChatComunitario.Models;
using Microsoft.EntityFrameworkCore;

namespace ChatComunitario.Repositories;

/// <summary>
/// Repositorio específico para miembros de canal
/// </summary>
public class ChannelMemberRepository : Repository<ChannelMember>
{
    public ChannelMemberRepository(AppDbContext context) : base(context) { }

    public async Task<bool> IsMemberOfChannelAsync(Guid channelId, string userCedula)
    {
        return await _dbSet
            .AnyAsync(cm => cm.ChannelId == channelId && cm.UserCedula == userCedula);
    }

    public async Task<IEnumerable<ChannelMember>> GetChannelMembersAsync(Guid channelId)
    {
        return await _dbSet
            .Where(cm => cm.ChannelId == channelId)
            .Include(cm => cm.User)
            .ToListAsync();
    }

    public async Task<bool> RemoveMemberAsync(Guid channelId, string userCedula)
    {
        var member = await _dbSet.FirstOrDefaultAsync(cm => 
            cm.ChannelId == channelId && cm.UserCedula == userCedula);
        
        if (member == null)
            return false;

        _dbSet.Remove(member);
        await SaveAsync();
        return true;
    }

    /// <summary>
    /// Verifica si un usuario es miembro de un canal
    /// </summary>
    public async Task<bool> IsMemberAsync(Guid channelId, string userCedula)
    {
        return await _dbSet
            .AsNoTracking()
            .AnyAsync(cm => cm.ChannelId == channelId && cm.UserCedula == userCedula);
    }
}
