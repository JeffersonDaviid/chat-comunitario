using System.ServiceModel;
using System.Runtime.Serialization;
using ChatComunitario.Interfaces;

namespace ChatComunitario.SoapServices;

/// <summary>
/// Contrato SOAP para servicios de autenticación
/// </summary>
[ServiceContract]
public interface IAuthSoapService
{
    [OperationContract]
    Task<RegisterResponse> Register(RegisterRequest request);

    [OperationContract]
    Task<LoginResponse> Login(LoginRequest request);

    [OperationContract]
    Task<GetMessagesResponse> GetChannelMessages(GetMessagesRequest request);
}

// Request/Response models para SOAP
public class RegisterRequest
{
    public string Cedula { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

public class RegisterResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Token { get; set; }
    public UserResponse? User { get; set; }
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Token { get; set; }
    public UserResponse? User { get; set; }
}

public class GetMessagesRequest
{
    public Guid ChannelId { get; set; }
}

public class GetMessagesResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<MessageResponse> Messages { get; set; } = new();
}
