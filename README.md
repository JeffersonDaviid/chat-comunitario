# Chat Comunitario - Plataforma de Comunicación en Tiempo Real

Sistema de chat comunitario con soporte para múltiples comunidades, canales y mensajería en tiempo real. Proyecto migrado de Node.js/TypeScript a ASP.NET Core con PostgreSQL.

## 📋 Tabla de Contenidos
- [Características](#características)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Configuración](#instalación-y-configuración)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [API Endpoints](#api-endpoints)
- [WebSocket/SignalR](#websocketsignalr)
- [Migraciones](#migraciones)
- [Ejecución](#ejecución)
- [Frontend](#frontend)
- [Desarrollo](#desarrollo)
- [Seguridad](#seguridad)

---

## ✨ Características

- ✅ **Autenticación JWT** con validación de cédula ecuatoriana
- ✅ **Comunidades** con propietarios y miembros
- ✅ **Canales** organizados por comunidad
- ✅ **Mensajería en tiempo real** con SignalR
- ✅ **Persistencia** en PostgreSQL con Entity Framework Core
- ✅ **Upload de imágenes** de perfil
- ✅ **Historial de mensajes** por canal
- ✅ **Docker** para base de datos PostgreSQL
- ✅ **CORS** configurado para Angular

---

## 🛠 Tecnologías

### Backend (.NET)
- **ASP.NET Core 8.0** - Framework web
- **Entity Framework Core 8.0** - ORM
- **PostgreSQL** - Base de datos relacional
- **SignalR** - Comunicación en tiempo real (WebSocket)
- **BCrypt.Net** - Hash de contraseñas
- **JWT Bearer** - Autenticación

### Frontend (Angular)
- **Angular 17+** - Framework frontend
- **TypeScript** - Lenguaje
- **TailwindCSS** - Estilos
- **@microsoft/signalr** - Cliente SignalR

### DevOps
- **Docker Compose** - Orquestación de PostgreSQL
- **Git** - Control de versiones

---

## 🏗 Arquitectura

```
┌─────────────────┐      HTTP/HTTPS       ┌──────────────────┐
│                 │◄────────────────────►  │                  │
│  Angular App    │                        │   ASP.NET Core   │
│  (Frontend)     │      SignalR/WS        │   Web API        │
│                 │◄────────────────────►  │                  │
└─────────────────┘                        └────────┬─────────┘
                                                    │
                                                    │ EF Core
                                                    │
                                            ┌───────▼──────────┐
                                            │                  │
                                            │   PostgreSQL     │
                                            │   (Docker)       │
                                            │                  │
                                            └──────────────────┘
```

**Flujo de Datos:**
1. Usuario se registra/autentica → Backend valida y emite JWT
2. Cliente se conecta a SignalR con JWT
3. Usuario se une a canal → SignalR agrupa conexiones
4. Usuario envía mensaje → Backend persiste en PostgreSQL y emite a grupo
5. Todos los usuarios del canal reciben mensaje en tiempo real

---

## 📦 Requisitos Previos

### Instalaciones Necesarias

1. **.NET SDK 8.0+**
   - Descargar: https://dotnet.microsoft.com/download
   - Verificar: `dotnet --version`

2. **Docker Desktop**
   - Descargar: https://www.docker.com/products/docker-desktop
   - Verificar: `docker --version` y `docker-compose --version`

3. **Node.js 18+ & npm** (para frontend)
   - Descargar: https://nodejs.org/
   - Verificar: `node --version` y `npm --version`

4. **Git**
   - Descargar: https://git-scm.com/
   - Verificar: `git --version`

---

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone https://github.com/JeffersonDaviid/chat-comunitario.git
cd chat-comunitario
```

### 2. Iniciar PostgreSQL con Docker

```bash
# En la raíz del proyecto
docker-compose up -d
```

**Verificar que PostgreSQL está corriendo:**
```bash
docker ps
# Debe aparecer: chatcomunitario-postgres
```

**Conexión a PostgreSQL:**
- **Host:** localhost
- **Puerto:** 5432
- **Usuario:** postgres
- **Contraseña:** postgres123
- **Base de datos:** chatcomunitario

### 3. Configurar Backend .NET

```bash
cd backend-dotnet

# Restaurar dependencias
dotnet restore

# Aplicar migraciones (crear tablas en PostgreSQL)
dotnet ef migrations add InitialCreate
dotnet ef database update

# Verificar configuración en appsettings.json
# ConnectionStrings.DefaultConnection debe apuntar a PostgreSQL local
```

**Configuración de appsettings.json:**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=chatcomunitario;Username=postgres;Password=postgres123"
  },
  "Jwt": {
    "Key": "your-super-secret-key-change-this-in-production-at-least-32-characters-long",
    "Issuer": "ChatComunitario",
    "Audience": "ChatComunitarioUsers",
    "ExpiryInHours": 24
  }
}
```

### 4. Configurar Frontend Angular

```bash
cd ../front

# Instalar dependencias
npm install

# Instalar cliente SignalR (si no está)
npm install @microsoft/signalr
```

---

## 📁 Estructura del Proyecto

```
chat-comunitario/
├── backend-dotnet/                    # Backend ASP.NET Core
│   ├── Controllers/                   # Controladores REST API
│   │   ├── AuthController.cs          # Autenticación y registro
│   │   ├── CommunityController.cs     # Gestión de comunidades
│   │   └── ChannelController.cs       # Gestión de canales
│   ├── Models/                        # Modelos de datos (Entidades)
│   │   ├── User.cs
│   │   ├── Community.cs
│   │   ├── CommunityMember.cs
│   │   ├── Channel.cs
│   │   └── Message.cs
│   ├── Data/
│   │   └── AppDbContext.cs            # Contexto de EF Core
│   ├── DTOs/                          # Data Transfer Objects
│   │   └── RequestDtos.cs
│   ├── Hubs/                          # SignalR Hubs
│   │   └── ChatHub.cs                 # Hub de chat en tiempo real
│   ├── Utils/                         # Utilidades
│   │   ├── CedulaValidator.cs
│   │   └── JwtHelper.cs
│   ├── Program.cs                     # Punto de entrada
│   ├── appsettings.json               # Configuración
│   └── ChatComunitario.csproj         # Proyecto .NET
│
├── front/                             # Frontend Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   └── chat/              # Componente de chat
│   │   │   ├── pages/
│   │   │   │   ├── dashboard/         # Dashboard principal
│   │   │   │   ├── home/              # Página de inicio
│   │   │   │   ├── login/             # Login
│   │   │   │   └── register/          # Registro
│   │   │   └── services/
│   │   │       ├── auth.service.ts    # Servicio de autenticación
│   │   │       ├── community.service.ts
│   │   │       ├── channel.service.ts
│   │   │       └── websocket.service.ts  # ⚠️ Migrar a SignalR
│   │   ├── styles.css
│   │   └── index.html
│   └── package.json
│
├── docker-compose.yml                 # PostgreSQL containerizado
└── README.md                          # Este archivo
```

---

## 🔌 API Endpoints

### Autenticación (`/api/auth`)

#### POST `/api/auth/register`
Registrar nuevo usuario con validación de cédula ecuatoriana.

**Body (multipart/form-data):**
```json
{
  "cedula": "1234567890",
  "name": "Jefferson",
  "lastName": "Chileno",
  "email": "jefferson@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "phone": "0987654321",
  "address": "Quito, Ecuador",
  "latitude": -0.1807,
  "longitude": -78.4678,
  "profile": <archivo imagen>
}
```

**Response:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "cedula": "1234567890",
    "name": "Jefferson",
    "lastName": "Chileno",
    "email": "jefferson@example.com",
    "phone": "0987654321",
    "address": "Quito, Ecuador",
    "profileImg": "1234567890.jpg"
  }
}
```

#### POST `/api/auth/login`
Iniciar sesión.

**Body:**
```json
{
  "email": "jefferson@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

#### GET `/api/auth/communities/{communityId}/channels/{channelId}/messages`
Obtener historial de mensajes de un canal.

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "uuid",
      "senderId": "1234567890",
      "sender": {
        "cedula": "1234567890",
        "username": "Jefferson Chileno",
        "avatar": "1234567890.jpg"
      },
      "text": "Hola mundo",
      "content": "Hola mundo",
      "file": null,
      "timestamp": "2026-01-13T22:00:00Z",
      "channelId": "uuid"
    }
  ]
}
```

---

### Comunidades (`/api/community`)

#### POST `/api/community`
Crear nueva comunidad (requiere autenticación).

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "title": "Comunidad de Desarrolladores",
  "description": "Comunidad para desarrolladores de software",
  "ownerCedula": "1234567890"
}
```

#### GET `/api/community`
Obtener todas las comunidades.

#### GET `/api/community/user/{cedula}`
Obtener comunidades de un usuario.

#### GET `/api/community/{id}`
Obtener una comunidad por ID.

#### PUT `/api/community/{id}`
Actualizar comunidad (requiere autenticación).

#### DELETE `/api/community/{id}`
Eliminar comunidad (requiere autenticación).

#### POST `/api/community/{id}/members`
Agregar miembro a comunidad.

**Body:**
```json
{
  "cedulaMember": "0987654321"
}
```

#### DELETE `/api/community/{id}/members/{cedula}`
Eliminar miembro de comunidad.

---

### Canales (`/api/channel`)

#### POST `/api/channel/{communityId}`
Crear canal en comunidad.

**Body:**
```json
{
  "name": "general",
  "description": "Canal general de la comunidad"
}
```

#### GET `/api/channel/{id}`
Obtener canal por ID.

#### GET `/api/channel/community/{communityId}`
Obtener canales de una comunidad.

#### PUT `/api/channel/{id}`
Actualizar canal.

#### DELETE `/api/channel/{id}`
Eliminar canal.

---

## 🔌 WebSocket/SignalR

### Conexión (Frontend)

**Migración necesaria en `websocket.service.ts`:**

```typescript
import * as signalR from '@microsoft/signalr';

export class WebsocketService {
  private connection: signalR.HubConnection;

  constructor() {
    // Configurar conexión SignalR
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:3000/ws', {
        accessTokenFactory: () => localStorage.getItem('auth_token') || ''
      })
      .withAutomaticReconnect()
      .build();

    // Escuchar mensajes
    this.connection.on('ReceiveMessage', (message) => {
      this.messagesSubject.next(message);
    });

    // Escuchar errores
    this.connection.on('Error', (error) => {
      console.error('[SignalR] Error:', error);
    });
  }

  async connect() {
    await this.connection.start();
  }

  async joinChannel(communityId: string, channelId: string, cedula: string) {
    await this.connection.invoke('JoinChannel', communityId, channelId, cedula);
  }

  async sendMessage(content: string, fileUrl?: string, fileType?: string) {
    await this.connection.invoke('SendMessage', content, fileUrl, fileType);
  }

  disconnect() {
    this.connection.stop();
  }
}
```

### Eventos SignalR

#### Cliente → Servidor

**`JoinChannel`**
```typescript
await connection.invoke('JoinChannel', communityId, channelId, cedula);
```

**`SendMessage`**
```typescript
await connection.invoke('SendMessage', content, fileUrl?, fileType?);
```

#### Servidor → Cliente

**`ReceiveMessage`**
```typescript
connection.on('ReceiveMessage', (message) => {
  console.log('Mensaje recibido:', message);
});
```

**Formato de mensaje:**
```json
{
  "type": "chat",
  "payload": {
    "id": "uuid",
    "cedula": "1234567890",
    "senderId": "1234567890",
    "sender": {
      "cedula": "1234567890",
      "username": "Jefferson Chileno",
      "avatar": "1234567890.jpg"
    },
    "text": "Hola mundo",
    "content": "Hola mundo",
    "file": null,
    "fileType": null,
    "channelId": "uuid",
    "ts": 1705183200000,
    "timestamp": "2026-01-13T22:00:00Z"
  }
}
```

**`Error`**
```typescript
connection.on('Error', (error) => {
  console.error('Error:', error);
});
```

---

## 🗄 Migraciones

### Crear Nueva Migración

```bash
cd backend-dotnet
dotnet ef migrations add NombreDeLaMigracion
```

### Aplicar Migraciones

```bash
dotnet ef database update
```

### Revertir Migración

```bash
dotnet ef database update MigracionAnterior
```

### Eliminar Última Migración (sin aplicar)

```bash
dotnet ef migrations remove
```

---

## ▶️ Ejecución

### Opción 1: Desarrollo

**Backend (.NET):**
```bash
cd backend-dotnet
dotnet run
# Servidor corriendo en http://localhost:3000
# Swagger UI: http://localhost:3000/swagger
```

**Frontend (Angular):**
```bash
cd front
npm start
# Aplicación corriendo en http://localhost:4200
```

### Opción 2: Producción

**Backend:**
```bash
cd backend-dotnet
dotnet publish -c Release -o ./publish
cd publish
dotnet ChatComunitario.dll
```

**Frontend:**
```bash
cd front
npm run build
# Archivos en front/dist/
```

---

## 🌐 Frontend

### Servicios a Actualizar

1. **`websocket.service.ts`** → Cambiar de `ws` a `@microsoft/signalr`
2. **URLs de API** → Cambiar de `http://localhost:3000/api/...` (si es necesario)

### Instalación SignalR Client

```bash
cd front
npm install @microsoft/signalr
```

### Ejemplo de Integración

```typescript
import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private connection: signalR.HubConnection;
  private messagesSubject = new BehaviorSubject<any>(null);
  private statusSubject = new BehaviorSubject<boolean>(false);

  constructor() {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:3000/ws', {
        accessTokenFactory: () => localStorage.getItem('auth_token') || ''
      })
      .withAutomaticReconnect()
      .build();

    this.connection.on('ReceiveMessage', (msg) => {
      this.messagesSubject.next(msg);
    });

    this.connection.onreconnected(() => {
      this.statusSubject.next(true);
    });

    this.connection.onclose(() => {
      this.statusSubject.next(false);
    });
  }

  async setIdentity(identity: any, reconnect: boolean = false) {
    if (reconnect && this.connection.state === 'Disconnected') {
      await this.connection.start();
      this.statusSubject.next(true);
    }

    await this.connection.invoke(
      'JoinChannel',
      identity.communityId,
      identity.channelId,
      identity.cedula
    );
  }

  async send(content: string) {
    await this.connection.invoke('SendMessage', content);
  }

  messages$(): Observable<any> {
    return this.messagesSubject.asObservable();
  }

  status$(): Observable<boolean> {
    return this.statusSubject.asObservable();
  }

  close() {
    this.connection.stop();
  }
}
```

---

## 👨‍💻 Desarrollo

### Comandos Útiles

**Backend:**
```bash
# Compilar
dotnet build

# Ejecutar con hot-reload
dotnet watch run

# Tests (si existen)
dotnet test

# Limpiar
dotnet clean
```

**Frontend:**
```bash
# Desarrollo con hot-reload
npm start

# Build de producción
npm run build

# Tests
npm test

# Linting
npm run lint
```

**Docker:**
```bash
# Iniciar PostgreSQL
docker-compose up -d

# Detener PostgreSQL
docker-compose down

# Ver logs
docker-compose logs -f postgres

# Reiniciar PostgreSQL
docker-compose restart postgres

# Eliminar datos (⚠️ PELIGRO)
docker-compose down -v
```

### Base de Datos

**Conectar a PostgreSQL:**
```bash
docker exec -it chatcomunitario-postgres psql -U postgres -d chatcomunitario
```

**Comandos PostgreSQL:**
```sql
-- Listar tablas
\dt

-- Ver estructura de tabla
\d "Users"

-- Consultas
SELECT * FROM "Users";
SELECT * FROM "Communities";
SELECT * FROM "Channels";
SELECT * FROM "Messages";

-- Salir
\q
```

---

## 🔒 Seguridad

### Buenas Prácticas Implementadas

1. **JWT con clave segura**: Cambiar `Jwt:Key` en producción
2. **Hash de contraseñas**: BCrypt con salt automático
3. **Validación de cédulas**: Algoritmo de verificación ecuatoriano
4. **CORS configurado**: Solo permite origen específico
5. **Autenticación en endpoints**: `[Authorize]` en controladores
6. **Validación de modelos**: Data Annotations en DTOs
7. **SQL Injection protegido**: Entity Framework Core (ORM)
8. **WebSocket autenticado**: JWT en SignalR

### Recomendaciones para Producción

1. **Variables de Entorno**:
   ```bash
   export JWT_KEY="clave-super-secreta-de-al-menos-32-caracteres"
   export DB_PASSWORD="contraseña-segura-postgres"
   ```

2. **HTTPS**:
   - Configurar certificado SSL/TLS
   - Forzar HTTPS en `Program.cs`

3. **Rate Limiting**:
   - Implementar límite de peticiones por IP

4. **Logging**:
   - Configurar Serilog o similar
   - Monitoreo de errores

5. **Backup Base de Datos**:
   ```bash
   docker exec chatcomunitario-postgres pg_dump -U postgres chatcomunitario > backup.sql
   ```

---

## 📝 Notas de Migración

### Diferencias clave Node.js → .NET

| Aspecto | Node.js/TypeScript | ASP.NET Core/.NET |
|---------|-------------------|-------------------|
| **WebSocket** | `ws` library | SignalR |
| **ORM** | Simulado en memoria | Entity Framework Core |
| **Base de Datos** | JSON en archivo | PostgreSQL real |
| **Autenticación** | JWT manual | JWT Bearer integrado |
| **Validación** | Zod schemas | Data Annotations |
| **Hash** | bcryptjs | BCrypt.Net |
| **Servidor** | Express.js | Kestrel (built-in) |
| **Tipado** | TypeScript | C# (fuertemente tipado) |

### Ventajas de .NET

- ✅ Rendimiento superior (compilado AOT)
- ✅ Tipado nativo fuerte
- ✅ SignalR más robusto que `ws`
- ✅ Entity Framework Core (migraciones, relaciones)
- ✅ Mejor integración con Azure
- ✅ Menos dependencias externas

---

## 🤝 Contribuciones

```bash
git checkout -b feature/nueva-funcionalidad
git commit -m "feat: descripción de la funcionalidad"
git push origin feature/nueva-funcionalidad
```

---

## 📄 Licencia

ISC License

---

## 👥 Autores

- **Jefferson Chileno** - Desarrollo inicial (Node.js)
- **Equipo de Desarrollo** - Migración a .NET Core

---

## 🆘 Troubleshooting

### Error: "Cannot connect to PostgreSQL"
```bash
# Verificar que Docker está corriendo
docker ps

# Reiniciar PostgreSQL
docker-compose restart postgres

# Verificar logs
docker-compose logs postgres
```

### Error: "Entity Framework migration failed"
```bash
# Eliminar migraciones
rm -rf Migrations/

# Recrear migración
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### Error: "SignalR connection failed"
- Verificar que backend está corriendo en puerto 3000
- Verificar CORS en `Program.cs`
- Verificar token JWT válido

### Error: "Port 5432 already in use"
```bash
# Ver qué proceso usa el puerto
netstat -ano | findstr :5432  # Windows
lsof -i :5432  # Linux/Mac

# Detener PostgreSQL local si existe
# O cambiar puerto en docker-compose.yml
```

---

## 📞 Contacto

- **Repositorio:** https://github.com/JeffersonDaviid/chat-comunitario
- **Issues:** https://github.com/JeffersonDaviid/chat-comunitario/issues

---

**¡Listo para usar! 🚀**
