using URTM.DizinTarama.Client.Models;

namespace URTM.DizinTarama.Client.Services;

/// <summary>
/// Veritabanı servisi arayüzü
/// </summary>
public interface IDatabaseService
{
    /// <summary>
    /// Toplu parça bilgisi sorgular
    /// </summary>
    Task<BulkPartResponse> GetBulkPartInfoAsync(List<string> partNames, CancellationToken cancellationToken = default);

    /// <summary>
    /// Tek parça bilgisi sorgular
    /// </summary>
    Task<DatabasePartInfo> GetPartInfoAsync(string partName, CancellationToken cancellationToken = default);

    /// <summary>
    /// Tarama sonuçlarını sunucuya gönderir
    /// </summary>
    Task<bool> SendScanResultsAsync(List<ScannedPart> scannedParts, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sunucu bağlantısını test eder
    /// </summary>
    Task<bool> TestConnectionAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Cache'i temizler
    /// </summary>
    void ClearCache();
}