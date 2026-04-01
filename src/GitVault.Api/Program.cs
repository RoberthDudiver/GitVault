using FirebaseAdmin;
using GitVault.Api.Middleware;
using GitVault.Core.Services;
using GitVault.Infrastructure.Cache;
using GitVault.Infrastructure.Crypto;
using GitVault.Infrastructure.Firebase;
using GitVault.Infrastructure.GitHub;
using GitVault.Infrastructure.Persistence;
using GitVault.Infrastructure.Services;
using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using Serilog;
using System.Threading.RateLimiting;

// ── Bootstrap Serilog early ───────────────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // Load .env file in development
    if (builder.Environment.IsDevelopment())
    {
        var envPath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
        if (File.Exists(envPath))
            DotEnvLoader.Load(envPath);
    }

    // ── Serilog ───────────────────────────────────────────────────────────────
    builder.Host.UseSerilog((ctx, services, config) => config
        .ReadFrom.Configuration(ctx.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console(outputTemplate:
            "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}"));

    // ── Firebase Admin SDK ────────────────────────────────────────────────────
    var firebaseCredPath = builder.Configuration["FIREBASE_CREDENTIAL_PATH"];
    var firebaseCredJson = builder.Configuration["FIREBASE_CREDENTIAL_JSON"];

    GoogleCredential googleCredential;
    if (!string.IsNullOrWhiteSpace(firebaseCredJson))
        googleCredential = GoogleCredential.FromJson(firebaseCredJson);
    else if (!string.IsNullOrWhiteSpace(firebaseCredPath) && File.Exists(firebaseCredPath))
        googleCredential = GoogleCredential.FromFile(firebaseCredPath);
    else
    {
        Log.Warning("Firebase credentials not configured. Auth will fail. " +
                    "Set FIREBASE_CREDENTIAL_PATH or FIREBASE_CREDENTIAL_JSON.");
        googleCredential = GoogleCredential.GetApplicationDefault();
    }

    if (FirebaseApp.DefaultInstance is null)
        FirebaseApp.Create(new AppOptions { Credential = googleCredential });

    // ── Database ──────────────────────────────────────────────────────────────
    var dbPath = builder.Configuration["SQLITE_PATH"] ?? "gitvault.db";
    builder.Services.AddDbContext<GitVaultDbContext>(options =>
        options.UseSqlite($"Data Source={dbPath}"));

    // ── Caching (Redis si está configurado, IMemoryCache si no) ──────────────
    builder.Services.AddGitVaultCache(builder.Configuration);

    // ── GitHub ────────────────────────────────────────────────────────────────
    builder.Services.AddSingleton<GitHubAppAuthenticator>();
    builder.Services.AddScoped<GitHubClientFactory>();
    builder.Services.AddScoped<IGitHubContentService, GitHubContentService>();

    // ── Domain Services ───────────────────────────────────────────────────────
    builder.Services.AddScoped<ICryptoService, CryptoService>();
    builder.Services.AddScoped<IStorageService, StorageService>();
    builder.Services.AddScoped<IMetadataService, MetadataService>();
    builder.Services.AddScoped<IServingService, ServingService>();
    builder.Services.AddScoped<IVaultService, VaultService>();
    builder.Services.AddScoped<IAppService, AppService>();
    builder.Services.AddScoped<IFirebaseTokenValidator, FirebaseTokenValidator>();

    // ── Authentication ────────────────────────────────────────────────────────
    builder.Services.AddAuthentication()
        .AddScheme<FirebaseAuthOptions, FirebaseAuthHandler>(
            FirebaseAuthHandler.SchemeName, null)
        .AddScheme<ApiKeyAuthOptions, ApiKeyAuthHandler>(
            ApiKeyAuthHandler.SchemeName, null);

    builder.Services.AddAuthorization();

    // ── Rate Limiting ─────────────────────────────────────────────────────────
    builder.Services.AddRateLimiter(opts =>
    {
        opts.RejectionStatusCode = 429;

        opts.AddFixedWindowLimiter("api", o =>
        {
            o.PermitLimit = 120;
            o.Window = TimeSpan.FromMinutes(1);
            o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            o.QueueLimit = 5;
        });

        opts.AddFixedWindowLimiter("serving", o =>
        {
            o.PermitLimit = 600;
            o.Window = TimeSpan.FromMinutes(1);
        });

        opts.AddFixedWindowLimiter("upload", o =>
        {
            o.PermitLimit = 30;
            o.Window = TimeSpan.FromMinutes(1);
        });
    });

    // ── CORS ──────────────────────────────────────────────────────────────────
    var frontendUrl = builder.Configuration["FRONTEND_URL"] ?? "http://localhost:3000";
    builder.Services.AddCors(opts =>
        opts.AddPolicy("Frontend", policy => policy
            .WithOrigins(frontendUrl)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials()));

    // ── Controllers + OpenAPI ─────────────────────────────────────────────────
    builder.Services.AddControllers();
    builder.Services.AddOpenApi();

    // ── Health checks ─────────────────────────────────────────────────────────
    builder.Services.AddHealthChecks()
        .AddDbContextCheck<GitVaultDbContext>("sqlite");

    // ─────────────────────────────────────────────────────────────────────────
    var app = builder.Build();

    // ── Migrate DB on startup ─────────────────────────────────────────────────
    using (var scope = app.Services.CreateScope())
    {
        var dbCtx = scope.ServiceProvider.GetRequiredService<GitVaultDbContext>();
        await dbCtx.Database.MigrateAsync();
        Log.Information("Database migrated successfully.");
    }

    // ── Middleware pipeline ───────────────────────────────────────────────────
    app.UseSerilogRequestLogging(opts =>
        opts.MessageTemplate = "HTTP {RequestMethod} {RequestPath} → {StatusCode} ({Elapsed:0.0}ms)");

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        app.MapScalarApiReference(opts =>
        {
            opts.Title = "GitVault API";
            opts.Theme = ScalarTheme.Mars;
        });
    }

    app.UseCors("Frontend");
    app.UseRateLimiter();
    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();
    app.MapHealthChecks("/healthz");

    Log.Information("GitVault API starting — env: {Env}", app.Environment.EnvironmentName);
    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application startup failed.");
}
finally
{
    await Log.CloseAndFlushAsync();
}

/// <summary>Minimal .env file loader for local development only.</summary>
public static class DotEnvLoader
{
    public static void Load(string filePath)
    {
        foreach (var line in File.ReadAllLines(filePath))
        {
            var trimmed = line.Trim();
            if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith('#')) continue;
            var eq = trimmed.IndexOf('=');
            if (eq < 0) continue;
            var key = trimmed[..eq].Trim();
            var value = trimmed[(eq + 1)..].Trim().Trim('"');
            if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
                Environment.SetEnvironmentVariable(key, value);
        }
    }
}
