# Chat Comunitario - Servicios SOAP/WSDL

Backend migrado de Node.js a .NET Core 10 con servicios SOAP/WSDL expuestos mediante SoapCore.

## 🌐 Servicios SOAP Disponibles

El servidor expone 3 servicios SOAP con WSDL completo:

### 1. AuthService (Autenticación)
- **Endpoint**: `http://localhost:3000/AuthService.svc`
- **WSDL**: `http://localhost:3000/AuthService.svc?wsdl`
- **Operaciones**:
  - `Register` - Registrar nuevo usuario
  - `Login` - Iniciar sesión
  - `GetChannelMessages` - Obtener mensajes de un canal

### 2. CommunityService (Comunidades)
- **Endpoint**: `http://localhost:3000/CommunityService.svc`
- **WSDL**: `http://localhost:3000/CommunityService.svc?wsdl`
- **Operaciones**:
  - `CreateCommunity` - Crear comunidad
  - `GetAllCommunities` - Listar todas las comunidades
  - `GetCommunitiesByUser` - Comunidades por usuario
  - `GetCommunityById` - Obtener comunidad específica
  - `UpdateCommunity` - Actualizar comunidad
  - `DeleteCommunity` - Eliminar comunidad
  - `AddMember` - Agregar miembro
  - `RemoveMember` - Remover miembro

### 3. ChannelService (Canales)
- **Endpoint**: `http://localhost:3000/ChannelService.svc`
- **WSDL**: `http://localhost:3000/ChannelService.svc?wsdl`
- **Operaciones**:
  - `CreateChannel` - Crear canal
  - `GetChannelById` - Obtener canal por ID
  - `GetChannelsByCommunity` - Canales de una comunidad
  - `UpdateChannel` - Actualizar canal
  - `DeleteChannel` - Eliminar canal

### 4. SignalR Hub (Tiempo Real)
- **Endpoint WebSocket**: `ws://localhost:3000/ws`
- Usado para mensajería en tiempo real

## 📋 Requisitos

- **.NET SDK 10.0** o superior
- **PostgreSQL 16** (via Docker Compose)
- **SoapCore 1.1.0.2** (ya incluido)

## 🚀 Ejecución

### Iniciar Base de Datos
```bash
cd chat-comunitario
docker-compose up -d
```

### Ejecutar Backend
```bash
cd backend-dotnet
dotnet restore
dotnet run
```

El servidor iniciará en `http://localhost:3000`

## 🧪 Probar los Servicios SOAP

### Opción 1: SoapUI

1. Descargar [SoapUI](https://www.soapui.org/downloads/soapui/)
2. Crear nuevo proyecto SOAP
3. Importar WSDL:
   - `http://localhost:3000/AuthService.svc?wsdl`
   - `http://localhost:3000/CommunityService.svc?wsdl`
   - `http://localhost:3000/ChannelService.svc?wsdl`

### Opción 2: Postman

1. Abrir Postman
2. New Request → SOAP
3. Importar WSDL desde URL
4. Seleccionar operación y enviar request

### Opción 3: curl (Ejemplo Register)

```bash
curl -X POST http://localhost:3000/AuthService.svc \
  -H "Content-Type: text/xml" \
  -d '<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
               xmlns:tem="http://tempuri.org/">
  <soap:Body>
    <tem:Register>
      <tem:request>
        <tem:Cedula>1234567890</tem:Cedula>
        <tem:Name>Juan</tem:Name>
        <tem:LastName>Pérez</tem:LastName>
        <tem:Email>juan@example.com</tem:Email>
        <tem:Password>password123</tem:Password>
        <tem:Phone>0987654321</tem:Phone>
        <tem:Address>Quito, Ecuador</tem:Address>
        <tem:Latitude>-0.1807</tem:Latitude>
        <tem:Longitude>-78.4678</tem:Longitude>
      </tem:request>
    </tem:Register>
  </soap:Body>
</soap:Envelope>'
```

### Ejemplo Login

```bash
curl -X POST http://localhost:3000/AuthService.svc \
  -H "Content-Type: text/xml" \
  -d '<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
               xmlns:tem="http://tempuri.org/">
  <soap:Body>
    <tem:Login>
      <tem:request>
        <tem:Email>juan@example.com</tem:Email>
        <tem:Password>password123</tem:Password>
      </tem:request>
    </tem:Login>
  </soap:Body>
</soap:Envelope>'
```

## 🏗️ Arquitectura

```
Cliente SOAP/WSDL
       ↓
SoapCore Middleware
       ↓
SOAP Services (AuthSoapService, CommunitySoapService, ChannelSoapService)
       ↓
Business Services (AuthService, CommunityService, ChannelService)
       ↓
Repositories (UserRepository, CommunityRepository, ChannelRepository, MessageRepository)
       ↓
Entity Framework Core
       ↓
PostgreSQL Database
```

### Capas del Sistema

1. **SOAP Layer**: Expone servicios SOAP con contratos WCF ([ServiceContract], [OperationContract])
2. **Business Layer**: Lógica de negocio (validaciones, reglas)
3. **Data Access Layer**: Repositorios con Entity Framework
4. **Database**: PostgreSQL con migraciones

## 📦 Tecnologías

- **ASP.NET Core 10.0** - Framework web
- **SoapCore 1.1.0.2** - Middleware SOAP/WSDL para .NET Core
- **Entity Framework Core 10.0** - ORM
- **Npgsql.EntityFrameworkCore.PostgreSQL 9.0.1** - Provider PostgreSQL
- **SignalR** - Comunicación en tiempo real
- **JWT Bearer Authentication** - Autenticación
- **BCrypt.Net** - Hash de contraseñas

## 🔐 Autenticación

Los servicios SOAP devuelven un token JWT en las operaciones `Register` y `Login`:

```xml
<RegisterResponse>
  <Success>true</Success>
  <Token>eyJhbGciOiJIUzI1...</Token>
  <User>
    <Cedula>1234567890</Cedula>
    <Name>Juan</Name>
    ...
  </User>
  <Message>Usuario registrado exitosamente</Message>
</RegisterResponse>
```

Este token debe incluirse en futuras peticiones SOAP usando headers personalizados o extensiones WS-Security (dependiendo del cliente).

## 📝 Validaciones

- **Cédula ecuatoriana**: Validación de 10 dígitos con algoritmo módulo 10
- **Email**: Formato válido
- **Teléfono**: 10 dígitos comenzando con 09
- **Contraseña**: Mínimo 6 caracteres

## 🗄️ Base de Datos

### Conexión
```
Host: localhost:5432
Database: chat-comunitario-db
Usuario: postgres
Password: postgres123
```

### Tablas
- `users` - Usuarios del sistema
- `communities` - Comunidades
- `channels` - Canales de comunicación
- `messages` - Mensajes
- `community_user` - Relación muchos a muchos

## 🛠️ Comandos Útiles

```bash
# Compilar
dotnet build

# Ejecutar
dotnet run

# Ejecutar migraciones
dotnet ef database update

# Crear nueva migración
dotnet ef migrations add NombreMigracion

# Ver logs
dotnet run --verbosity detailed
```

## 📚 Recursos Adicionales

- [Documentación SoapCore](https://github.com/DigDes/SoapCore)
- [WCF Service Contracts](https://learn.microsoft.com/en-us/dotnet/framework/wcf/designing-service-contracts)
- [SOAP Protocol](https://www.w3.org/TR/soap/)
- [WSDL Specification](https://www.w3.org/TR/wsdl)

## 🐛 Troubleshooting

### Error: "Cannot consume scoped service from singleton"
✅ Solucionado: Los servicios SOAP se registran como `AddScoped` en vez de `AddSingleton`

### Error: "Value cannot be null (Parameter 'version')"
✅ Solucionado: Se configuró `MessageVersion = MessageVersion.Soap11` en `SoapEncoderOptions`

### Los servicios WSDL no cargan
- Verificar que el servidor esté corriendo en puerto 3000
- Acceder a `http://localhost:3000` para ver la página principal
- Verificar que PostgreSQL esté corriendo (`docker ps`)

### Base de datos no conecta
```bash
# Reiniciar contenedor PostgreSQL
docker-compose down
docker-compose up -d
```

## 📄 Licencia

MIT License - Universidad - Proyecto Aplicaciones Web
