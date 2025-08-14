using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using MongoDB.Driver;
using Serilog;
using System.Reflection;
using TradingNoteX.Models.Entities;
using TradingNoteX.Models.Settings;
using TradingNoteX.Services.Implementations;
using TradingNoteX.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
//Log.Logger = new LoggerConfiguration()
//    .WriteTo.Console()
//    .WriteTo.File("logs/tradingnotex-.txt", rollingInterval: RollingInterval.Day)
//    .CreateLogger();

//builder.Host.UseSerilog();

// Add services to the container
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDbSettings"));

// Register services with dependency injection
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITradeService, TradeService>();
builder.Services.AddScoped<IImportService, ImportService>();
builder.Services.AddScoped<IRiskSettingsService, RiskSettingsService>();
builder.Services.AddScoped<IAccountService, AccountService>();
builder.Services.AddScoped<ICloudFunctionsService, CloudFunctionsService>();
builder.Services.AddScoped<IAIAnalysisService, AIAnalysisService>();
builder.Services.AddScoped<HttpClient, HttpClient>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
});

// Configure controllers with custom validation behavior
builder.Services.AddControllers(options =>
{
    // Desabilitar validação automática para permitir filtros opcionais
    options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true;
})
.ConfigureApiBehaviorOptions(options =>
{
    // Configurar comportamento customizado para respostas de validação
    options.InvalidModelStateResponseFactory = context =>
    {
        // Log para debugging
        var errors = context.ModelState
            .Where(x => x.Value.Errors.Count > 0)
            .ToDictionary(
                kvp => kvp.Key,
                kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray()
            );

        Console.WriteLine($"Validation errors: {System.Text.Json.JsonSerializer.Serialize(errors)}");

        var result = new BadRequestObjectResult(new
        {
            type = "https://tools.ietf.org/html/rfc9110#section-15.5.1",
            title = "One or more validation errors occurred.",
            status = 400,
            errors = errors,
            traceId = context.HttpContext.TraceIdentifier
        });

        return result;
    };
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "TradingNoteX API",
        Version = "v1",
        Description = "API para journal de trades (SMC), gestão de risco e parciais"
    });

    c.AddSecurityDefinition("SessionToken", new OpenApiSecurityScheme
    {
        Description = "Session Token",
        Name = "X-Parse-Session-Token",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "SessionToken"
                }
            },
            new string[] {}
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "TradingNoteX API v1");
        c.RoutePrefix = "swagger";
        c.DisplayRequestDuration();
    });
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

// Inicializar índices do MongoDB
using var scope = app.Services.CreateScope();
var mongoSettings = scope.ServiceProvider.GetRequiredService<IOptions<MongoDbSettings>>();
var client = new MongoClient(mongoSettings.Value.ConnectionString);
var database = client.GetDatabase(mongoSettings.Value.DatabaseName);

// Criar índices se não existirem
var tradesCollection = database.GetCollection<Trade>("Trades");
await tradesCollection.Indexes.CreateOneAsync(
    new CreateIndexModel<Trade>(
        Builders<Trade>.IndexKeys.Ascending(t => t.OwnerId)
            .Ascending(t => t.ExecutedAtUTC)
    )
);

Log.Information("Starting TradingNoteX API...");
app.Run();