using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ChatComunitario.Data;
using ChatComunitario.DTOs;
using ChatComunitario.Models;
using ChatComunitario.Utils;
using BCrypt.Net;

namespace ChatComunitario.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;

    public AuthController(AppDbContext context, IConfiguration configuration, IWebHostEnvironment environment)
    {
        _context = context;
        _configuration = configuration;
        _environment = environment;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromForm] RegisterDto dto, IFormFile? profile)
    {
        // Validar cédula ecuatoriana
        if (!CedulaValidator.ValidateEcuadorianId(dto.Cedula))
        {
            return BadRequest(new { success = false, message = "Cédula ecuatoriana inválida" });
        }

        // Verificar si el usuario ya existe
        if (await _context.Users.AnyAsync(u => u.Cedula == dto.Cedula))
        {
            return Conflict(new { success = false, message = "El usuario ya existe" });
        }

        if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
        {
            return Conflict(new { success = false, message = "El email ya está registrado" });
        }

        // Hash de la contraseña
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password);

        // Manejar imagen de perfil
        string? profileImgPath = null;
        if (profile != null)
        {
            var uploadsFolder = Path.Combine(_environment.ContentRootPath, "src", "assets", "profiles");
            Directory.CreateDirectory(uploadsFolder);
            
            var fileName = $"{dto.Cedula}.jpg";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await profile.CopyToAsync(stream);
            }

            profileImgPath = fileName;
        }

        // Crear nuevo usuario
        var user = new User
        {
            Cedula = dto.Cedula,
            Name = dto.Name,
            LastName = dto.LastName,
            Email = dto.Email,
            Password = hashedPassword,
            Phone = dto.Phone,
            Address = dto.Address,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            ProfileImg = profileImgPath
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Generar token JWT
        var jwtHelper = new JwtHelper(_configuration);
        var token = jwtHelper.GenerateToken(user.Cedula, user.Email);

        return Ok(new
        {
            success = true,
            message = "Usuario registrado exitosamente",
            token,
            user = new
            {
                user.Cedula,
                user.Name,
                user.LastName,
                user.Email,
                user.Phone,
                user.Address,
                user.ProfileImg
            }
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Password))
        {
            return Unauthorized(new { success = false, message = "Credenciales inválidas" });
        }

        var jwtHelper = new JwtHelper(_configuration);
        var token = jwtHelper.GenerateToken(user.Cedula, user.Email);

        return Ok(new
        {
            success = true,
            token,
            user = new
            {
                user.Cedula,
                user.Name,
                user.LastName,
                user.Email,
                user.Phone,
                user.Address,
                user.ProfileImg,
                avatar = user.ProfileImg
            }
        });
    }

    [HttpGet("communities/{communityId}/channels/{channelId}/messages")]
    public async Task<IActionResult> GetChannelMessages(Guid communityId, Guid channelId)
    {
        var messages = await _context.Messages
            .Where(m => m.ChannelId == channelId)
            .Include(m => m.Sender)
            .OrderBy(m => m.Timestamp)
            .Select(m => new
            {
                m.Id,
                senderId = m.SenderCedula,
                sender = new
                {
                    cedula = m.Sender.Cedula,
                    username = m.Sender.Name + " " + m.Sender.LastName,
                    avatar = m.Sender.ProfileImg
                },
                text = m.Content,
                content = m.Content,
                file = m.FileUrl,
                timestamp = m.Timestamp,
                m.ChannelId
            })
            .ToListAsync();

        return Ok(new { success = true, messages });
    }
}
