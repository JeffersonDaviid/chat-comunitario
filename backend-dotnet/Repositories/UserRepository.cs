using ChatComunitario.Data;
using ChatComunitario.Models;
using Microsoft.EntityFrameworkCore;

namespace ChatComunitario.Repositories;

/// <summary>
/// Repositorio específico para usuarios
/// </summary>
public class UserRepository : Repository<User>
{
    public UserRepository(AppDbContext context) : base(context) { }

    public async Task<User?> GetByCedulaAsync(string cedula)
    {
        return await _dbSet.FirstOrDefaultAsync(u => u.Cedula == cedula);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _dbSet.FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<bool> ExistsByCedulaAsync(string cedula)
    {
        return await _dbSet.AnyAsync(u => u.Cedula == cedula);
    }

    public async Task<bool> ExistsByEmailAsync(string email)
    {
        return await _dbSet.AnyAsync(u => u.Email == email);
    }

    public async Task<bool> ExistsByPhoneAsync(string phone)
    {
        return await _dbSet.AnyAsync(u => u.Phone == phone);
    }
}
