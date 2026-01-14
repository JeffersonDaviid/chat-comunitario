using ChatComunitario.Data;
using ChatComunitario.Models;
using Microsoft.EntityFrameworkCore;

namespace ChatComunitario.Repositories;

/// <summary>
/// Repositorio específico para comunidades
/// </summary>
public class CommunityRepository : Repository<Community>
{
    public CommunityRepository(AppDbContext context) : base(context) { }

    public async Task<Community?> GetByIdWithRelationsAsync(Guid id)
    {
        return await _dbSet
            .Include(c => c.Owner)
            .Include(c => c.Members).ThenInclude(m => m.User)
            .Include(c => c.Channels)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<IEnumerable<Community>> GetByUserCedulaAsync(string cedula)
    {
        return await _dbSet
            .Include(c => c.Owner)
            .Include(c => c.Members).ThenInclude(m => m.User)
            .Include(c => c.Channels)
            .Where(c => c.Members.Any(m => m.UserCedula == cedula))
            .ToListAsync();
    }

    public async Task<IEnumerable<Community>> GetAllWithRelationsAsync()
    {
        return await _dbSet
            .Include(c => c.Owner)
            .Include(c => c.Members).ThenInclude(m => m.User)
            .Include(c => c.Channels)
            .ToListAsync();
    }
}
