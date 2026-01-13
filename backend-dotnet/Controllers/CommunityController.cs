using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ChatComunitario.Data;
using ChatComunitario.DTOs;
using ChatComunitario.Models;

namespace ChatComunitario.Controllers;

[ApiController]
[Route("api/community")]
[Authorize]
public class CommunityController : ControllerBase
{
    private readonly AppDbContext _context;

    public CommunityController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> CreateCommunity([FromBody] CreateCommunityDto dto)
    {
        var owner = await _context.Users.FindAsync(dto.OwnerCedula);
        if (owner == null)
        {
            return NotFound(new { success = false, message = "Usuario propietario no encontrado" });
        }

        var community = new Community
        {
            Title = dto.Title,
            Description = dto.Description,
            OwnerCedula = dto.OwnerCedula
        };

        _context.Communities.Add(community);

        // Agregar al propietario como miembro
        var membership = new CommunityMember
        {
            CommunityId = community.Id,
            UserCedula = dto.OwnerCedula
        };
        _context.CommunityMembers.Add(membership);

        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCommunityById), new { id = community.Id }, new
        {
            success = true,
            message = "Comunidad creada exitosamente",
            community = new
            {
                community.Id,
                community.Title,
                community.Description,
                owner = new
                {
                    owner.Cedula,
                    owner.Name,
                    owner.LastName,
                    owner.Email
                },
                members = new[] { owner },
                channels = Array.Empty<object>()
            }
        });
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAllCommunities()
    {
        var communities = await _context.Communities
            .Include(c => c.Owner)
            .Include(c => c.Members).ThenInclude(m => m.User)
            .Include(c => c.Channels)
            .Select(c => new
            {
                c.Id,
                c.Title,
                c.Description,
                owner = new
                {
                    c.Owner.Cedula,
                    c.Owner.Name,
                    c.Owner.LastName,
                    c.Owner.Email
                },
                members = c.Members.Select(m => new
                {
                    m.User.Cedula,
                    m.User.Name,
                    m.User.LastName,
                    m.User.Email
                }).ToList(),
                channels = c.Channels.Select(ch => new
                {
                    ch.Id,
                    ch.Name,
                    ch.Description
                }).ToList()
            })
            .ToListAsync();

        return Ok(new { success = true, communities });
    }

    [HttpGet("user/{cedula}")]
    public async Task<IActionResult> GetCommunitiesByUser(string cedula)
    {
        var communities = await _context.Communities
            .Include(c => c.Owner)
            .Include(c => c.Members).ThenInclude(m => m.User)
            .Include(c => c.Channels)
            .Where(c => c.Members.Any(m => m.UserCedula == cedula))
            .Select(c => new
            {
                c.Id,
                c.Title,
                c.Description,
                owner = new
                {
                    c.Owner.Cedula,
                    c.Owner.Name,
                    c.Owner.LastName,
                    c.Owner.Email
                },
                members = c.Members.Select(m => new
                {
                    m.User.Cedula,
                    m.User.Name,
                    m.User.LastName,
                    m.User.Email
                }).ToList(),
                channels = c.Channels.Select(ch => new
                {
                    ch.Id,
                    ch.Name,
                    ch.Description
                }).ToList()
            })
            .ToListAsync();

        return Ok(new { success = true, communities });
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCommunityById(Guid id)
    {
        var community = await _context.Communities
            .Include(c => c.Owner)
            .Include(c => c.Members).ThenInclude(m => m.User)
            .Include(c => c.Channels)
            .Where(c => c.Id == id)
            .Select(c => new
            {
                c.Id,
                c.Title,
                c.Description,
                owner = new
                {
                    c.Owner.Cedula,
                    c.Owner.Name,
                    c.Owner.LastName,
                    c.Owner.Email
                },
                members = c.Members.Select(m => new
                {
                    m.User.Cedula,
                    m.User.Name,
                    m.User.LastName,
                    m.User.Email,
                    m.User.ProfileImg
                }).ToList(),
                channels = c.Channels.Select(ch => new
                {
                    id = ch.Id.ToString(),
                    ch.Name,
                    ch.Description
                }).ToList()
            })
            .FirstOrDefaultAsync();

        if (community == null)
        {
            return NotFound(new { success = false, message = "Comunidad no encontrada" });
        }

        return Ok(new { success = true, community });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCommunity(Guid id, [FromBody] CreateCommunityDto dto)
    {
        var community = await _context.Communities.FindAsync(id);
        if (community == null)
        {
            return NotFound(new { success = false, message = "Comunidad no encontrada" });
        }

        community.Title = dto.Title;
        community.Description = dto.Description;

        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Comunidad actualizada exitosamente", community });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCommunity(Guid id)
    {
        var community = await _context.Communities.FindAsync(id);
        if (community == null)
        {
            return NotFound(new { success = false, message = "Comunidad no encontrada" });
        }

        _context.Communities.Remove(community);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Comunidad eliminada exitosamente" });
    }

    [HttpPost("{id}/members")]
    public async Task<IActionResult> AddMember(Guid id, [FromBody] AddMemberDto dto)
    {
        var community = await _context.Communities.FindAsync(id);
        if (community == null)
        {
            return NotFound(new { success = false, message = "Comunidad no encontrada" });
        }

        var user = await _context.Users.FindAsync(dto.CedulaMember);
        if (user == null)
        {
            return NotFound(new { success = false, message = "Usuario no encontrado" });
        }

        var existingMember = await _context.CommunityMembers
            .FirstOrDefaultAsync(cm => cm.CommunityId == id && cm.UserCedula == dto.CedulaMember);

        if (existingMember != null)
        {
            return Conflict(new { success = false, message = "El usuario ya es miembro de la comunidad" });
        }

        var membership = new CommunityMember
        {
            CommunityId = id,
            UserCedula = dto.CedulaMember
        };

        _context.CommunityMembers.Add(membership);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Miembro agregado exitosamente" });
    }

    [HttpDelete("{id}/members/{cedula}")]
    public async Task<IActionResult> RemoveMember(Guid id, string cedula)
    {
        var membership = await _context.CommunityMembers
            .FirstOrDefaultAsync(cm => cm.CommunityId == id && cm.UserCedula == cedula);

        if (membership == null)
        {
            return NotFound(new { success = false, message = "Miembro no encontrado en la comunidad" });
        }

        _context.CommunityMembers.Remove(membership);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Miembro eliminado exitosamente" });
    }
}
