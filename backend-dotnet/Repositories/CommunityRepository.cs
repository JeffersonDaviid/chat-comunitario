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
            .Include(c => c.Channels).ThenInclude(ch => ch.Members)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<IEnumerable<Community>> GetByUserCedulaAsync(string cedula)
    {
        return await _dbSet
            .Include(c => c.Owner)
            .Include(c => c.Members).ThenInclude(m => m.User)
            .Include(c => c.Channels).ThenInclude(ch => ch.Members)
            .Where(c => c.OwnerCedula == cedula || c.Members.Any(m => m.UserCedula == cedula))
            .ToListAsync();
    }

    public async Task<IEnumerable<Community>> GetAllWithRelationsAsync()
    {
        return await _dbSet
            .Include(c => c.Owner)
            .Include(c => c.Members).ThenInclude(m => m.User)
            .Include(c => c.Channels).ThenInclude(ch => ch.Members)
            .ToListAsync();
    }

    /// <summary>
    /// Verifica si un usuario es miembro de una comunidad sin cargar relaciones
    /// </summary>
    public async Task<bool> IsMemberAsync(Guid communityId, string userCedula)
    {
        return await _context.CommunityMembers
            .AnyAsync(cm => cm.CommunityId == communityId && cm.UserCedula == userCedula);
    }

    /// <summary>
    /// Añade un miembro directamente sin usar navegación de la comunidad
    /// </summary>
    public async Task AddMemberDirectAsync(CommunityMember membership)
    {
        await _context.CommunityMembers.AddAsync(membership);
        await _context.SaveChangesAsync();
        Console.WriteLine($"[Repository] AddMemberDirectAsync - Member added to community");
    }
}
