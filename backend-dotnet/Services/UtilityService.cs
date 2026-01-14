using ChatComunitario.Interfaces;
using ChatComunitario.Utils;

namespace ChatComunitario.Services;

/// <summary>
/// Implementación de servicios de utilidad
/// </summary>
public class UtilityService : IUtilityService
{
    private readonly JwtHelper _jwtHelper;

    public UtilityService(JwtHelper jwtHelper)
    {
        _jwtHelper = jwtHelper;
    }

    public bool ValidateEcuadorianCedula(string cedula)
    {
        return CedulaValidator.ValidateEcuadorianId(cedula);
    }

    public string GenerateToken(string cedula, string email)
    {
        return _jwtHelper.GenerateToken(cedula, email);
    }
}
