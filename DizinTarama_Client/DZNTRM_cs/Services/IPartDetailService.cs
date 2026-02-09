using URTM.DizinTarama.Client.Models;

namespace URTM.DizinTarama.Client.Services;

/// <summary>
/// Parça detay servisi arayüzü
/// </summary>
public interface IPartDetailService
{
    /// <summary>
    /// Parça detaylarını birleştirir
    /// </summary>
    CombinedPartData CombinePartData(ScannedPart scannedPart, DatabasePartInfo databaseInfo);

    /// <summary>
    /// Görsel URL'ini oluşturur
    /// </summary>
    string? GetImageUrl(string? relativePath);

    /// <summary>
    /// Dosyayı açar
    /// </summary>
    Task<bool> OpenFileAsync(string filePath);

    /// <summary>
    /// URL'yi tarayıcıda açar
    /// </summary>
    Task<bool> OpenUrlAsync(string url);
}

/// <summary>
/// Birleştirilmiş parça verisi
/// </summary>
public class CombinedPartData
{
    public string ParcaAdi { get; set; } = string.Empty;
    public bool Has3D { get; set; }
    public bool HasDrawing { get; set; }
    public bool HasPDF { get; set; }
    public List<string> SldprtFiles { get; set; } = new();
    public List<string> SlddrwFiles { get; set; } = new();
    public List<string> PdfFiles { get; set; } = new();
    public DatabasePartInfo Database { get; set; } = new();
    public string FullPath { get; set; } = string.Empty;
    public DateTime LastModified { get; set; }
    public long FileSize { get; set; }
}