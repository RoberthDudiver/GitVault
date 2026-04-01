using GitVault.Core.Services;
using Microsoft.Extensions.Caching.Memory;

namespace GitVault.Infrastructure.Cache;

public class MemoryCacheService(IMemoryCache cache) : ICacheService
{
    private const string NotFoundMarker = "__NF__";

    public T? Get<T>(string key)
    {
        cache.TryGetValue(key, out T? value);
        return value;
    }

    public bool TryGet<T>(string key, out T? value)
    {
        return cache.TryGetValue(key, out value);
    }

    public void Set<T>(string key, T value, TimeSpan ttl)
    {
        cache.Set(key, value, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = ttl,
            // Evict low-priority items first under memory pressure
            Priority = CacheItemPriority.Normal
        });
    }

    public void Remove(string key) => cache.Remove(key);

    public void SetNotFound(string key, TimeSpan? ttl = null)
    {
        cache.Set(key, NotFoundMarker, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = ttl ?? CacheTtl.NotFound,
            Priority = CacheItemPriority.Low
        });
    }

    public bool IsNotFound(string key)
    {
        return cache.TryGetValue(key, out string? marker) && marker == NotFoundMarker;
    }
}
