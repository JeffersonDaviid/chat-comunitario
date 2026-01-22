using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.AspNetCore.Authorization;

[ApiController]
[Route("api/images")]
public class ImagesController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ImagesController> _logger;

    public ImagesController(
        IWebHostEnvironment environment,
        IConfiguration configuration,
        ILogger<ImagesController> logger)
    {
        _environment = environment;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene una imagen por su nombre de archivo
    /// </summary>
    /// <param name="filename">Nombre del archivo (ej: profile_0201596129_abc123.jpg)</param>
    /// <returns>Archivo de imagen</returns>
    [HttpGet("{filename}")]
    [AllowAnonymous] // Permite acceso sin autenticación
    public IActionResult GetImage(string filename)
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
                "profiles",
                filename);

            // Verificar si el archivo existe
            if (!System.IO.File.Exists(filePath))
            {
                _logger.LogWarning($"Archivo no encontrado: {filename}");
                return NotFound(new { message = "Imagen no encontrada" });
            }

            // Obtener el tipo MIME del archivo
            var provider = new FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(filePath, out var contentType))
            {
                contentType = "application/octet-stream";
            }

            // Leer el archivo como bytes
            var fileBytes = System.IO.File.ReadAllBytes(filePath);

            // Devolver el archivo
            return File(fileBytes, contentType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error al obtener la imagen: {filename}");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Obtiene la imagen de perfil de un usuario por su cédula
    /// </summary>
    /// <param name="cedula">Cédula del usuario</param>
    /// <returns>Archivo de imagen</returns>
    [HttpGet("profile/{cedula}")]
    [AllowAnonymous]
    public IActionResult GetProfileImage(string cedula)
    {
        try
        {
            // Validar cédula
            if (string.IsNullOrWhiteSpace(cedula))
            {
                return BadRequest(new { message = "Cédula inválida" });
            }

            // Buscar archivos que coincidan con el patrón
            var uploadsFolder = Path.Combine(
                _environment.ContentRootPath,
                "wwwroot",
                "uploads",
                "profiles");

            if (!Directory.Exists(uploadsFolder))
            {
                return NotFound(new { message = "No hay imágenes almacenadas" });
            }

            // Buscar archivos que empiecen con "profile_{cedula}_"
            var files = Directory.GetFiles(uploadsFolder, $"profile_{cedula}_*");

            if (files.Length == 0)
            {
                // Retornar imagen por defecto si no existe
                return GetDefaultProfileImage();
            }

            // Tomar el archivo más reciente (última imagen de perfil)
            var latestFile = files
                .Select(f => new FileInfo(f))
                .OrderByDescending(f => f.LastWriteTime)
                .First();

            // Obtener tipo MIME
            var provider = new FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(latestFile.FullName, out var contentType))
            {
                contentType = "application/octet-stream";
            }

            var fileBytes = System.IO.File.ReadAllBytes(latestFile.FullName);
            return File(fileBytes, contentType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error al obtener imagen de perfil para cédula: {cedula}");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Sube una nueva imagen de perfil
    /// </summary>
    [HttpPost("upload-profile")]
    [Authorize] // Requiere autenticación
    public async Task<IActionResult> UploadProfileImage(IFormFile file)
    {
        try
        {
            // Validar archivo
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No se proporcionó ningún archivo" });
            }

            // Validar tamaño (máximo 5MB)
            if (file.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new { message = "El archivo es demasiado grande. Máximo 5MB" });
            }

            // Validar tipo de archivo
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest(new { message = "Formato de archivo no permitido. Use JPG, PNG, GIF o WebP" });
            }

            // Obtener cédula del usuario autenticado
            var cedula = User.FindFirst("cedula")?.Value;
            if (string.IsNullOrEmpty(cedula))
            {
                return Unauthorized(new { message = "Usuario no autenticado" });
            }

            // Guardar la nueva imagen
            var uploadsFolder = Path.Combine(
                _environment.ContentRootPath,
                "wwwroot",
                "uploads",
                "profiles");

            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            // Generar nombre único
            var fileName = $"profile_{cedula}_{Guid.NewGuid():N}{fileExtension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Devolver la ruta relativa de la nueva imagen
            var imageUrl = $"/api/images/{fileName}";

            return Ok(new
            {
                success = true,
                message = "Imagen subida exitosamente",
                imageUrl = imageUrl,
                fileName = fileName
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al subir imagen de perfil");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Elimina una imagen de perfil
    /// </summary>
    [HttpDelete("{filename}")]
    [Authorize]
    public IActionResult DeleteImage(string filename)
    {
        try
        {
            // Validar nombre de archivo
            if (string.IsNullOrWhiteSpace(filename) || filename.Contains(".."))
            {
                return BadRequest(new { message = "Nombre de archivo inválido" });
            }

            // Obtener cédula del usuario autenticado
            var cedula = User.FindFirst("cedula")?.Value;
            if (string.IsNullOrEmpty(cedula))
            {
                return Unauthorized(new { message = "Usuario no autenticado" });
            }

            // Verificar que el archivo pertenezca al usuario
            if (!filename.StartsWith($"profile_{cedula}_"))
            {
                return Forbid(); // No tiene permiso para eliminar este archivo
            }

            var filePath = Path.Combine(
                _environment.ContentRootPath,
                "wwwroot",
                "uploads",
                "profiles",
                filename);

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "Archivo no encontrado" });
            }

            // Eliminar archivo
            System.IO.File.Delete(filePath);

            return Ok(new
            {
                success = true,
                message = "Imagen eliminada exitosamente"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error al eliminar imagen: {filename}");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Obtiene todas las imágenes de perfil de un usuario
    /// </summary>
    [HttpGet("user/{cedula}/all")]
    [Authorize]
    public IActionResult GetUserImages(string cedula)
    {
        try
        {
            // Verificar que el usuario autenticado solo pueda ver sus propias imágenes
            var authenticatedCedula = User.FindFirst("cedula")?.Value;
            if (authenticatedCedula != cedula)
            {
                return Forbid();
            }

            var uploadsFolder = Path.Combine(
                _environment.ContentRootPath,
                "wwwroot",
                "uploads",
                "profiles");

            if (!Directory.Exists(uploadsFolder))
            {
                return Ok(new { images = new List<string>() });
            }

            var imageFiles = Directory.GetFiles(uploadsFolder, $"profile_{cedula}_*")
                .Select(Path.GetFileName)
                .ToList();

            var imageUrls = imageFiles.Select(filename =>
                $"{Request.Scheme}://{Request.Host}/api/images/{filename}").ToList();

            return Ok(new { images = imageUrls });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error al obtener imágenes para cédula: {cedula}");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Imagen de perfil por defecto
    /// </summary>
    private IActionResult GetDefaultProfileImage()
    {
        try
        {
            // Ruta de la imagen por defecto
            var defaultImagePath = Path.Combine(
                _environment.ContentRootPath,
                "wwwroot",
                "images",
                "default-profile.jpg");

            // Si no existe la imagen por defecto, crear una simple
            if (!System.IO.File.Exists(defaultImagePath))
            {
                // Crear una imagen simple programáticamente o usar un placeholder
                return NotFound(new { message = "Imagen no encontrada" });
            }

            var fileBytes = System.IO.File.ReadAllBytes(defaultImagePath);
            return File(fileBytes, "image/jpeg");
        }
        catch
        {
            // Si todo falla, devolver un 404
            return NotFound(new { message = "Imagen no encontrada" });
        }
    }
}