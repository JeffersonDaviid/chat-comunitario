using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ChatComunitario.DTOs;
using ChatComunitario.Interfaces;

namespace ChatComunitario.Controllers;

[ApiController]
[Route("api/community")]
[Authorize]
public class CommunityController : ControllerBase
{
    private readonly ICommunityService _communityService;

    public CommunityController(ICommunityService communityService)
    {
        _communityService = communityService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateCommunity([FromBody] CreateCommunityDto dto)
    {
        var (success, community, message) = await _communityService.CreateCommunityAsync(dto);

        if (!success)
        {
            return BadRequest(new { success, message });
        }

        return CreatedAtAction(nameof(GetCommunityById), new { id = community?.Id }, new
        {
            success,
            message,
            community
        });
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAllCommunities()
    {
        var (success, communities, message) = await _communityService.GetAllCommunitiesAsync();

        return Ok(new { success, message, communities });
    }

    [HttpGet("user/{cedula}")]
    public async Task<IActionResult> GetCommunitiesByUser(string cedula)
    {
        var (success, communities, message) = await _communityService.GetCommunitiesByUserAsync(cedula);

        return Ok(new { success, message, communities });
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCommunityById(Guid id)
    {
        var (success, community, message) = await _communityService.GetCommunityByIdAsync(id);

        if (!success)
        {
            return NotFound(new { success, message });
        }

        return Ok(new { success, message, community });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCommunity(Guid id, [FromBody] CreateCommunityDto dto)
    {
        var (success, community, message) = await _communityService.UpdateCommunityAsync(id, dto);

        if (!success)
        {
            return BadRequest(new { success, message });
        }

        return Ok(new { success, message, community });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCommunity(Guid id)
    {
        var (success, message) = await _communityService.DeleteCommunityAsync(id);

        if (!success)
        {
            return BadRequest(new { success, message });
        }

        return Ok(new { success, message });
    }

    [HttpPost("{id}/members")]
    public async Task<IActionResult> AddMember(Guid id, [FromBody] AddMemberDto dto)
    {
        var (success, message) = await _communityService.AddMemberAsync(id, dto);

        if (!success)
        {
            return BadRequest(new { success, message });
        }

        return Ok(new { success, message });
    }

    [HttpDelete("{id}/members/{cedula}")]
    public async Task<IActionResult> RemoveMember(Guid id, string cedula)
    {
        var (success, message) = await _communityService.RemoveMemberAsync(id, cedula);

        if (!success)
        {
            return BadRequest(new { success, message });
        }

        return Ok(new { success, message });
    }
}

