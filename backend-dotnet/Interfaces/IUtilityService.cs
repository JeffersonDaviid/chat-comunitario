using ChatComunitario.DTOs;

namespace ChatComunitario.Interfaces;

/// <summary>
/// Servicio de utilidades
/// </summary>
public interface IUtilityService
{
    /// <summary>
    /// Valida una cédula ecuatoriana
    /// </summary>
    bool ValidateEcuadorianCedula(string cedula);

    /// <summary>
    /// Genera un token JWT
    /// </summary>
    string GenerateToken(string cedula, string email);
}
