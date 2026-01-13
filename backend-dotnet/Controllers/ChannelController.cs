using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ChatComunitario.Data;
using ChatComunitario.DTOs;
using ChatComunitario.Models;

namespace ChatComunitario.Controllers;

[ApiController]
[Route("api/channel")]
[Authorize]
public class ChannelController : ControllerBase
{
    private readonly AppDbContext _context;

    public ChannelController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("{communityId}")]
    public async Task<IActionResult> CreateChannel(Guid communityId, [FromBody] CreateChannelDto dto)
    {
        var community = await _context.Communities.FindAsync(communityId);
        if (community == null)
        {
            return NotFound(new { success = false, message = "Comunidad no encontrada" });
        }

        var channel = new Channel
        {
            Name = dto.Name,
            Description = dto.Description,
            CommunityId = communityId
        };

        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetChannelById), new { id = channel.Id }, new
        {
            success = true,
            message = "Canal creado exitosamente",
            channel = new
            {
                channel.Id,
                channel.Name,
                channel.Description
            }
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetChannelById(Guid id)
    {
        var channel = await _context.Channels
            .Include(ch => ch.Messages)
            .FirstOrDefaultAsync(ch => ch.Id == id);

        if (channel == null)
        {
            return NotFound(new { success = false, message = "Canal no encontrado" });
        }

        return Ok(new { success = true, channel });
    }

    [HttpGet("community/{communityId}")]
    public async Task<IActionResult> GetChannelsByCommunity(Guid communityId)
    {
        var channels = await _context.Channels
            .Where(ch => ch.CommunityId == communityId)
            .Select(ch => new
            {
                ch.Id,
                ch.Name,
                ch.Description
            })
            .ToListAsync();

        return Ok(new { success = true, channels });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateChannel(Guid id, [FromBody] CreateChannelDto dto)
    {
        var channel = await _context.Channels.FindAsync(id);
        if (channel == null)
        {
            return NotFound(new { success = false, message = "Canal no encontrado" });
        }

        channel.Name = dto.Name;
        channel.Description = dto.Description;

        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Canal actualizado exitosamente", channel });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteChannel(Guid id)
    {
        var channel = await _context.Channels.FindAsync(id);
        if (channel == null)
        {
            return NotFound(new { success = false, message = "Canal no encontrado" });
        }

        _context.Channels.Remove(channel);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Canal eliminado exitosamente" });
    }
}
