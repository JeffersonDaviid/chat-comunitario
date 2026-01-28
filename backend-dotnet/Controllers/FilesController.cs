using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ChatComunitario.Data;

namespace ChatComunitario.Controllers;

[ApiController]
[Route("api/files")]
public class FilesController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<FilesController> _logger;
    private readonly AppDbContext _context;

    public FilesController(
        IWebHostEnvironment environment,
        ILogger<FilesController> logger,
        AppDbContext context)
    {
        _environment = environment;
        _logger = logger;
        _context = context;
    }

    /// <summary>
    /// Descarga un archivo del chat con su nombre original
    /// </summary>
    /// <param name="filename">Nombre del archivo (GUID)</param>
    /// <returns>Archivo con el nombre original</returns>
    [HttpGet("chat/{filename}")]
    [AllowAnonymous]
    public async Task<IActionResult> DownloadChatFile(string filename)
    {
        try
        {
            // Validar el nombre del archivo por seguridad
            if (string.IsNullOrWhiteSpace(filename) || filename.Contains(".."))
            {
                return BadRequest(new { message = "Nombre de archivo inválido" });
            }

            // Obtener la ruta completa del archivo
            var filePath = Path.Combine(
                _environment.ContentRootPath,
                "wwwroot",
                "uploads",
                "chat",
                filename);

            // Verificar si el archivo existe
            if (!System.IO.File.Exists(filePath))
            {
                _logger.LogWarning($"Archivo no encontrado: {filename}");
                return NotFound(new { message = "Archivo no encontrado" });
            }

            // Buscar el mensaje que contiene este archivo para obtener el nombre original
            var fileUrl = $"/uploads/chat/{filename}";
            var message = await _context.Messages
                .Where(m => m.FileUrl == fileUrl)
                .FirstOrDefaultAsync();

            // Obtener el nombre original o usar el nombre del archivo
            var originalFileName = message?.FileName ?? filename;

            // Obtener el tipo MIME del archivo
            var provider = new FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(filePath, out var contentType))
            {
                contentType = "application/octet-stream";
            }

            // Leer el archivo como bytes
            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);

            // Devolver el archivo con el nombre original
            return File(fileBytes, contentType, originalFileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error al descargar el archivo: {filename}");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Ver un archivo del chat en el navegador (sin forzar descarga)
    /// </summary>
    /// <param name="filename">Nombre del archivo (GUID)</param>
    /// <returns>Archivo para visualización</returns>
    [HttpGet("chat/{filename}/view")]
    [AllowAnonymous]
    public async Task<IActionResult> ViewChatFile(string filename)
    {
        try
        {
            // Validar el nombre del archivo por seguridad
            if (string.IsNullOrWhiteSpace(filename) || filename.Contains(".."))
            {
                return BadRequest(new { message = "Nombre de archivo inválido" });
            }

            // Obtener la ruta completa del archivo
            var filePath = Path.Combine(
                _environment.ContentRootPath,
                "wwwroot",
                "uploads",
                "chat",
                filename);

            // Verificar si el archivo existe
            if (!System.IO.File.Exists(filePath))
            {
                _logger.LogWarning($"Archivo no encontrado: {filename}");
                return NotFound(new { message = "Archivo no encontrado" });
            }

            // Buscar el mensaje para obtener el nombre original
            var fileUrl = $"/uploads/chat/{filename}";
            var message = await _context.Messages
                .Where(m => m.FileUrl == fileUrl)
                .FirstOrDefaultAsync();

            var originalFileName = message?.FileName ?? filename;

            // Obtener el tipo MIME del archivo
            var provider = new FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(filePath, out var contentType))
            {
                contentType = "application/octet-stream";
            }

            // Leer el archivo
            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);

            // Configurar headers para visualización inline con nombre correcto
            Response.Headers.Append("Content-Disposition", $"inline; filename=\"{originalFileName}\"");
            
            return File(fileBytes, contentType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error al visualizar el archivo: {filename}");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }
}
