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
[DataContract]
public class RegisterRequest
{
    [DataMember(Order = 0)]
    public string Address { get; set; } = string.Empty;
    
    [DataMember(Order = 1)]
    public string Cedula { get; set; } = string.Empty;
    
    [DataMember(Order = 2)]
    public string ConfirmPassword { get; set; } = string.Empty;
    
    [DataMember(Order = 3)]
    public string Email { get; set; } = string.Empty;
    
    [DataMember(Order = 4)]
    public string LastName { get; set; } = string.Empty;
    
    [DataMember(Order = 5)]
    public double Latitude { get; set; }
    
    [DataMember(Order = 6)]
    public double Longitude { get; set; }
    
    [DataMember(Order = 7)]
    public string Name { get; set; } = string.Empty;
    
    [DataMember(Order = 8)]
    public string Password { get; set; } = string.Empty;
    
    [DataMember(Order = 9)]
    public string Phone { get; set; } = string.Empty;
    
    [DataMember(Order = 10)]
    public string? ProfilePictureBase64 { get; set; }
    
    [DataMember(Order = 11)]
    public string? ProfilePictureExtension { get; set; } // .jpg, .png, etc.
}

[DataContract]
public class RegisterResponse
{
    [DataMember]
    public bool Success { get; set; }
    
    [DataMember]
    public string Message { get; set; } = string.Empty;
    
    [DataMember]
    public string? Token { get; set; }
    
    [DataMember]
    public UserResponse? User { get; set; }
}

[DataContract]
public class LoginRequest
{
    [DataMember]
    public string Email { get; set; } = string.Empty;
    
    [DataMember]
    public string Password { get; set; } = string.Empty;
}

[DataContract]
public class LoginResponse
{
    [DataMember]
    public bool Success { get; set; }
    
    [DataMember]
    public string Message { get; set; } = string.Empty;
    
    [DataMember]
    public string? Token { get; set; }
    
    [DataMember]
    public UserResponse? User { get; set; }
}

[DataContract]
public class GetMessagesRequest
{
    [DataMember]
    public Guid ChannelId { get; set; }
}

[DataContract]
public class GetMessagesResponse
{
    [DataMember]
    public bool Success { get; set; }
    
    [DataMember]
    public string Message { get; set; } = string.Empty;
    
    [DataMember]
    public List<MessageResponse> Messages { get; set; } = new();
}
