using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;
using System.Text.Json;
using URTM.DizinTarama.Client.Models;

namespace URTM.DizinTarama.Client.Services;

/// <summary>
/// Veritabanı servisi implementasyonu
/// </summary>
public class DatabaseService : IDatabaseService
{
    private readonly HttpClient _httpClient;
    private readonly ServerSettings _settings;
    private readonly ILogger<DatabaseService> _logger;
    private readonly Dictionary<string, DatabasePartInfo> _cache;
    private readonly object _cacheLock = new object();

    public DatabaseService(
        IOptions<ServerSettings> settings,
        ILogger<DatabaseService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
        _cache = new Dictionary<string, DatabasePartInfo>();

        _httpClient = new HttpClient
        {
            BaseAddress = new Uri(_settings.BaseUrl),
            Timeout = TimeSpan.FromSeconds(_settings.Timeout)
        };

        _httpClient.DefaultRequestHeaders.Add("User-Agent", "URTM-DizinTarama-Client/1.0.0");
    }

    public async Task<BulkPartResponse> GetBulkPartInfoAsync(List<string> partNames, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Toplu parça bilgisi sorgulanıyor: {Count} parça", partNames.Count);

            var cacheHits = 0;
            var apiParts = new List<DatabasePartInfo>();

            // Önce cache'ten kontrol et
            foreach (var partName in partNames)
            {
                lock (_cacheLock)
                {
                    if (_cache.TryGetValue(partName, out var cachedInfo))
                    {
                        apiParts.Add(cachedInfo);
                        cacheHits++;
                    }
                }
            }

            // Cache'de olmayanları API'den al
            var uncachedParts = partNames.Except(apiParts.Select(p => GetPartNameFromCache(p))).ToList();
            if (uncachedParts.Any())
            {
                var requestBody = new
                {
                    partNames = uncachedParts
                };

                var response = await _httpClient.PostAsJsonAsync("/api/parts/bulk", requestBody, cancellationToken);
                response.EnsureSuccessStatusCode();

                var jsonResponse = await response.Content.ReadAsStringAsync(cancellationToken);
                var bulkResponse = JsonSerializer.Deserialize<BulkPartResponse>(jsonResponse, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (bulkResponse?.Success == true && bulkResponse.Data?.Parts != null)
                {
                    // Cache'e ekle
                    lock (_cacheLock)
                    {
                        foreach (var part in bulkResponse.Data.Parts)
                        {
                            var partName = GetPartNameFromResponse(part);
                            if (!string.IsNullOrEmpty(partName))
                            {
                                _cache[partName] = part;
                            }
                        }
                    }

                    apiParts.AddRange(bulkResponse.Data.Parts);
                }
                else
                {
                    _logger.LogError("Toplu parça sorgusu başarısız: {Error}", bulkResponse?.Error?.Message);
                    return new BulkPartResponse
                    {
                        Success = false,
                        Error = bulkResponse?.Error ?? new ApiError { Message = "Bilinmeyen hata" }
                    };
                }
            }

            var foundCount = apiParts.Count(p => p.Found);
            var notFoundCount = apiParts.Count - foundCount;

            _logger.LogInformation("Toplu parça sorgusu tamamlandı: {Found} bulundu, {NotFound} bulunamadı, {Cache} cache'den",
                foundCount, notFoundCount, cacheHits);

            return new BulkPartResponse
            {
                Success = true,
                Data = new BulkPartData
                {
                    Parts = apiParts,
                    FoundCount = foundCount,
                    NotFoundCount = notFoundCount,
                    Statistics = new ApiStatistics
                    {
                        CacheHitCount = cacheHits,
                        DatabaseQueryCount = uncachedParts.Count,
                        TotalResponseTime = TimeSpan.Zero
                    }
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Toplu parça bilgisi sorgulanırken hata");
            return new BulkPartResponse
            {
                Success = false,
                Error = new ApiError
                {
                    Message = ex.Message,
                    Code = "BULK_QUERY_ERROR"
                }
            };
        }
    }

    public async Task<DatabasePartInfo> GetPartInfoAsync(string partName, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Parça bilgisi sorgulanıyor: {PartName}", partName);

            // Cache kontrol
            lock (_cacheLock)
            {
                if (_cache.TryGetValue(partName, out var cachedInfo))
                {
                    _logger.LogDebug("Parça bilgisi cache'den bulundu: {PartName}", partName);
                    return cachedInfo;
                }
            }

            var response = await _httpClient.GetAsync($"/api/parts/{Uri.EscapeDataString(partName)}", cancellationToken);
            response.EnsureSuccessStatusCode();

            var jsonResponse = await response.Content.ReadAsStringAsync(cancellationToken);
            var partInfo = JsonSerializer.Deserialize<DatabasePartInfo>(jsonResponse, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (partInfo != null)
            {
                lock (_cacheLock)
                {
                    _cache[partName] = partInfo;
                }

                _logger.LogDebug("Parça bilgisi API'den alındı: {PartName}", partName);
            }

            return partInfo ?? new DatabasePartInfo { Found = false, Reason = "Parça bulunamadı" };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Parça bilgisi sorgulanırken hata: {PartName}", partName);
            return new DatabasePartInfo
            {
                Found = false,
                Reason = $"Hata: {ex.Message}"
            };
        }
    }

    public async Task<bool> SendScanResultsAsync(List<ScannedPart> scannedParts, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Tarama sonuçları gönderiliyor: {Count} parça", scannedParts.Count);

            var requestBody = new
            {
                scannedParts = scannedParts,
                timestamp = DateTime.UtcNow,
                clientVersion = "1.0.0"
            };

            var response = await _httpClient.PostAsJsonAsync("/api/scan/results", requestBody, cancellationToken);
            response.EnsureSuccessStatusCode();

            _logger.LogInformation("Tarama sonuçları başarıyla gönderildi");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Tarama sonuçları gönderilirken hata");
            return false;
        }
    }

    public async Task<bool> TestConnectionAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Sunucu bağlantısı test ediliyor: {BaseUrl}", _settings.BaseUrl);

            var response = await _httpClient.GetAsync("/api/health", cancellationToken);
            var success = response.IsSuccessStatusCode;

            if (success)
            {
                _logger.LogInformation("Sunucu bağlantısı başarılı: {BaseUrl}", _settings.BaseUrl);
            }
            else
            {
                _logger.LogWarning("Sunucu bağlantısı başarısız: {StatusCode}", response.StatusCode);
            }

            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Sunucu bağlantısı test edilirken hata");
            return false;
        }
    }

    public void ClearCache()
    {
        lock (_cacheLock)
        {
            var count = _cache.Count;
            _cache.Clear();
            _logger.LogInformation("Parça bilgisi cache'i temizlendi: {Count} kayıt silindi", count);
        }
    }

    private static string GetPartNameFromCache(DatabasePartInfo partInfo)
    {
        return partInfo.PartData?.Code ?? string.Empty;
    }

    private static string GetPartNameFromResponse(DatabasePartInfo partInfo)
    {
        return partInfo.PartData?.Code ?? string.Empty;
    }

    public void Dispose()
    {
        _httpClient?.Dispose();
    }
}