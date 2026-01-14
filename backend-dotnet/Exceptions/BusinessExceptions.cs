namespace ChatComunitario.Exceptions;

/// <summary>
/// Excepción base para errores de negocio
/// </summary>
public class BusinessException : Exception
{
    public BusinessException(string message) : base(message) { }
}

/// <summary>
/// Excepción cuando un recurso no es encontrado
/// </summary>
public class NotFoundException : BusinessException
{
    public NotFoundException(string resourceName, object id)
        : base($"{resourceName} con ID '{id}' no fue encontrado") { }
}

/// <summary>
/// Excepción cuando hay validación fallida
/// </summary>
public class ValidationException : BusinessException
{
    public ValidationException(string message) : base(message) { }
}

/// <summary>
/// Excepción cuando hay conflicto (e.g., recurso duplicado)
/// </summary>
public class ConflictException : BusinessException
{
    public ConflictException(string message) : base(message) { }
}

/// <summary>
/// Excepción para acceso no autorizado
/// </summary>
public class UnauthorizedException : BusinessException
{
    public UnauthorizedException(string message) : base(message) { }
}
