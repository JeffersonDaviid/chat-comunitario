using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.ServiceModel.Channels;
using ChatComunitario.Data;
using ChatComunitario.Hubs;
using ChatComunitario.Repositories;
using ChatComunitario.Services;
using ChatComunitario.Interfaces;
using ChatComunitario.Utils;
using ChatComunitario.SoapServices;
using SoapCore;
using System.ServiceModel;

var builder = WebApplication.CreateBuilder(args);

// REST Controllers
builder.Services.AddControllers();

// SOAP Services
builder.Services.AddScoped<IAuthSoapService, AuthSoapService>();
builder.Services.AddScoped<ICommunitySoapService, CommunitySoapService>();
builder.Services.AddScoped<IChannelSoapService, ChannelSoapService>();

// PostgreSQL Database Context
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Service-Oriented Architecture (SOA) - Dependency Injection
// Repositorios
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<CommunityRepository>();
builder.Services.AddScoped<CommunityInvitationRepository>();
builder.Services.AddScoped<ChannelRepository>();
builder.Services.AddScoped<ChannelMemberRepository>();
builder.Services.AddScoped<MessageRepository>();

// Servicios
builder.Services.AddScoped<JwtHelper>();
builder.Services.AddScoped<IUtilityService, UtilityService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICommunityService, CommunityService>();
builder.Services.AddScoped<IChannelService, ChannelService>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<IInvitationService, InvitationService>();

// CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "your-super-secret-key-change-this-in-production-at-least-32-characters-long";
var key = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };

    // SignalR JWT Authentication
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/ws"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// SignalR
builder.Services.AddSignalR();

var app = builder.Build();
app.UseStaticFiles(); // Esto sirve archivos de wwwroot

// Configure the HTTP request pipeline
app.UseCors("AllowAll");

// Serve static files for profile images
var profilesPath = Path.Combine(Directory.GetCurrentDirectory(), "src", "assets", "profiles");
if (!Directory.Exists(profilesPath))
{
    Directory.CreateDirectory(profilesPath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(profilesPath),
    RequestPath = "/profiles"
});

app.UseAuthentication();
app.UseAuthorization();

// REST Controllers mapping
app.MapControllers();

// SOAP Endpoints con WSDL
var encoderOptions = new SoapEncoderOptions
{
    WriteEncoding = Encoding.UTF8,
    MessageVersion = MessageVersion.Soap11
};
SoapEndpointExtensions.UseSoapEndpoint<IAuthSoapService>((IApplicationBuilder)app, "/AuthService.svc", encoderOptions, SoapSerializer.DataContractSerializer);
SoapEndpointExtensions.UseSoapEndpoint<ICommunitySoapService>((IApplicationBuilder)app, "/CommunityService.svc", encoderOptions, SoapSerializer.DataContractSerializer);
SoapEndpointExtensions.UseSoapEndpoint<IChannelSoapService>((IApplicationBuilder)app, "/ChannelService.svc", encoderOptions, SoapSerializer.DataContractSerializer);

// SignalR Hub endpoint (se mantiene para tiempo real)
app.MapHub<ChatHub>("/ws");

app.MapGet("/", () => Results.Content(@"
<html>
<head><title>Chat Comunitario - SOAP/WSDL Services</title></head>
<body style='font-family: Arial; padding: 40px;'>
<h1>🌐 Chat Comunitario - Servicios SOAP</h1>
<p>Servicios SOAP disponibles con WSDL:</p>
<ul>
<li><a href='/AuthService.svc?wsdl'>AuthService WSDL</a> - Autenticación y usuarios</li>
<li><a href='/CommunityService.svc?wsdl'>CommunityService WSDL</a> - Gestión de comunidades</li>
<li><a href='/ChannelService.svc?wsdl'>ChannelService WSDL</a> - Gestión de canales</li>
<li><a href='/ws'>SignalR Hub</a> - Chat en tiempo real</li>
</ul>
<p>Puerto: 5000 | Base URL: http://localhost:5000</p>
</body>
</html>", "text/html"))
   .WithName("Home");

// Apply migrations and seed data
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await dbContext.Database.MigrateAsync();
}

await app.RunAsync();
