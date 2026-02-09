using URTM.DizinTarama.Client.Models;

namespace URTM.DizinTarama.Client.Services;

/// <summary>
/// Dosya tarama servisi arayüzü
/// </summary>
public interface IFileScanService
{
    /// <summary>
    /// Belirtilen dizini tarar
    /// </summary>
    Task<List<ScannedPart>> ScanDirectoryAsync(string directoryPath, IProgress<ScanProgress>? progress = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// CAD dosyası olup olmadığını kontrol eder
    /// </summary>
    bool IsCadFile(string filePath);

    /// <summary>
    /// Dosyadan parça adını çıkarır
    /// </summary>
    string ExtractPartNameFromPath(string filePath);

    /// <summary>
    /// Dosya bilgilerini analiz eder
    /// </summary>
    ScannedPart AnalyzeFile(string filePath);
}

/// <summary>
/// Tarama ilerlemesi
/// </summary>
public class ScanProgress
{
    public int CurrentFileNumber { get; set; }
    public int TotalFiles { get; set; }
    public string CurrentDirectory { get; set; } = string.Empty;
    public string CurrentFileName { get; set; } = string.Empty;
    public TimeSpan ElapsedTime { get; set; }
    public TimeSpan EstimatedTimeRemaining { get; set; }
    public int FoundParts { get; set; }
}