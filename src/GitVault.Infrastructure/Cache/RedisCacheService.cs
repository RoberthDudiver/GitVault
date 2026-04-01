using System.Text.Json;
using GitVault.Core.Services;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace GitVault.Infrastructure.Cache;

/// <summary>
/// ICacheService backed by Redis (via IDistributedCache).
/// Activated automatically when "Redis:ConnectionString" is present in configuration.
/// Falls back to MemoryCacheService when Redis is not configured.
///
/// Serialization: System.Text.Json (no external dependencies).
/// Not-found marker: stored as the literal string "__NF__" with short TTL.
/// </summary>
public class RedisCacheService(
    IDistributedCache redis,
    ILogger<RedisCacheService> logger) : ICacheService
{
    private const string NotFoundMarker = "__NF__";

    public T? Get<T>(string key)
    {
        TryGet<T>(key, out var value);
        return value;
    }

    public bool TryGet<T>(string key, out T? value)
    {
        try
        {
            var bytes = redis.Get(key);
            if (bytes is null) { value = default; return false; }

            var json = System.Text.Encoding.UTF8.GetString(bytes);
            if (json == NotFoundMarker) { value = default; return false; }

            value = JsonSerializer.Deserialize<T>(json);
            return value is not null;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis GET failed for key {Key} — treating as miss", key);
            value = default;
            return false;
        }
    }

    public void Set<T>(string key, T value, TimeSpan ttl)
    {
        try
        {
            var json = JsonSerializer.Serialize(value);
            var bytes = System.Text.Encoding.UTF8.GetBytes(json);
            redis.Set(key, bytes, new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = ttl
            });
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis SET failed for key {Key} — continuing without cache", key);
        }
    }

    public void Remove(string key)
    {
        try { redis.Remove(key); }
        catch (Exception ex) { logger.LogWarning(ex, "Redis DEL failed for key {Key}", key); }
    }

    public void SetNotFound(string key, TimeSpan? ttl = null)
    {
        try
        {
            var bytes = System.Text.Encoding.UTF8.GetBytes(NotFoundMarker);
            redis.Set(key, bytes, new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = ttl ?? CacheTtl.NotFound
            });
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis SET (not-found marker) failed for key {Key}", key);
        }
    }

    public bool IsNotFound(string key)
    {
        try
        {
            var bytes = redis.Get(key);
            if (bytes is null) return false;
            var value = System.Text.Encoding.UTF8.GetString(bytes);
            return value == NotFoundMarker;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis GET (not-found check) failed for key {Key}", key);
            return false;
        }
    }
}
