using GitVault.Core.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace GitVault.Infrastructure.Cache;

public static class CacheServiceExtensions
{
    /// <summary>
    /// Registers ICacheService with Redis if "Redis:ConnectionString" is present,
    /// otherwise falls back to IMemoryCache.
    ///
    /// appsettings.json (Redis active):
    /// <code>
    /// "Redis": {
    ///   "ConnectionString": "localhost:6379",
    ///   "InstanceName": "gitvault:"
    /// }
    /// </code>
    ///
    /// appsettings.json (sin Redis — solo borrar o dejar vacío):
    /// <code>
    /// "Redis": { "ConnectionString": "" }
    /// </code>
    /// </summary>
    public static IServiceCollection AddGitVaultCache(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var redisConn = configuration["Redis:ConnectionString"];

        if (!string.IsNullOrWhiteSpace(redisConn))
        {
            var instanceName = configuration["Redis:InstanceName"] ?? "gitvault:";

            services.AddStackExchangeRedisCache(opts =>
            {
                opts.Configuration = redisConn;
                opts.InstanceName = instanceName;
            });

            services.AddSingleton<ICacheService, RedisCacheService>();

            // Log at startup so the operator knows which backend is active
            using var sp = services.BuildServiceProvider();
            var log = sp.GetRequiredService<ILoggerFactory>()
                        .CreateLogger("GitVault.Cache");
            log.LogInformation("Cache backend: Redis ({Connection}, prefix: {Prefix})",
                MaskConnection(redisConn), instanceName);
        }
        else
        {
            services.AddMemoryCache();
            services.AddSingleton<ICacheService, MemoryCacheService>();

            using var sp = services.BuildServiceProvider();
            var log = sp.GetRequiredService<ILoggerFactory>()
                        .CreateLogger("GitVault.Cache");
            log.LogInformation("Cache backend: in-process IMemoryCache (single instance)");
        }

        return services;
    }

    // Masks password in redis connection strings like "host:6379,password=secret"
    private static string MaskConnection(string conn)
    {
        var idx = conn.IndexOf("password=", StringComparison.OrdinalIgnoreCase);
        if (idx < 0) return conn;
        var end = conn.IndexOf(',', idx);
        var masked = conn[..idx] + "password=***" + (end > 0 ? conn[end..] : "");
        return masked;
    }
}
