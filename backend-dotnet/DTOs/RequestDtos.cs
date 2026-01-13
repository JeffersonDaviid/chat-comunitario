using System.ComponentModel.DataAnnotations;

namespace ChatComunitario.DTOs;

public class RegisterDto
{
    [Required(ErrorMessage = "La cédula es requerida")]
    [StringLength(10, MinimumLength = 10, ErrorMessage = "La cédula debe tener 10 dígitos")]
    public string Cedula { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre es requerido")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "El apellido es requerido")]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "El email es requerido")]
    [EmailAddress(ErrorMessage = "Email inválido")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es requerida")]
    [MinLength(6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "La confirmación de contraseña es requerida")]
    [Compare("Password", ErrorMessage = "Las contraseñas no coinciden")]
    public string ConfirmPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "El teléfono es requerido")]
    [RegularExpression(@"^09\d{8}$", ErrorMessage = "El teléfono debe tener 10 dígitos y comenzar con 09")]
    public string Phone { get; set; } = string.Empty;

    [Required(ErrorMessage = "La dirección es requerida")]
    public string Address { get; set; } = string.Empty;

    [Range(-90, 90, ErrorMessage = "Latitud inválida")]
    public double Latitude { get; set; }

    [Range(-180, 180, ErrorMessage = "Longitud inválida")]
    public double Longitude { get; set; }
}

public class LoginDto
{
    [Required(ErrorMessage = "El email es requerido")]
    [EmailAddress(ErrorMessage = "Email inválido")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es requerida")]
    public string Password { get; set; } = string.Empty;
}

public class CreateCommunityDto
{
    [Required]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    [Required]
    public string OwnerCedula { get; set; } = string.Empty;
}

public class CreateChannelDto
{
    [Required]
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;
}

public class AddMemberDto
{
    [Required]
    public string CedulaMember { get; set; } = string.Empty;
}

public class SendMessageDto
{
    public string? Content { get; set; }
    public string? FileUrl { get; set; }
    public string? FileType { get; set; }
}
