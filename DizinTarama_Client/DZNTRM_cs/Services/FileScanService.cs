using Microsoft.Extensions.Logging;
using System.IO;
using System.Text.RegularExpressions;
using URTM.DizinTarama.Client.Models;

namespace URTM.DizinTarama.Client.Services;

/// <summary>
/// Dosya tarama servisi implementasyonu
/// </summary>
public class FileScanService : IFileScanService
{
    private readonly ILogger<FileScanService> _logger;
    private readonly HashSet<string> _cadExtensions;
    private readonly Regex _partNameRegex;

    public FileScanService(ILogger<FileScanService> logger)
    {
        _logger = logger;

        _cadExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            ".sldprt", ".sldasm", ".slddrw",
            ".step", ".stp", ".igs", ".iges",
            ".stl", ".x_t", ".x_b"
        };

        // Parça adı çıkarma regex - çeşitli desenler
        _partNameRegex = new Regex(
            @"(?i)(?:[A-Z]{2,}_)?([A-Z0-9_]+)|(?:[A-Za-z0-9_]+)",
            RegexOptions.Compiled);
    }

    public async Task<List<ScannedPart>> ScanDirectoryAsync(string directoryPath, IProgress<ScanProgress>? progress = null, CancellationToken cancellationToken = default)
    {
        if (!Directory.Exists(directoryPath))
        {
            throw new DirectoryNotFoundException($"Dizin bulunamadı: {directoryPath}");
        }

        var startTime = DateTime.UtcNow;
        var foundParts = new List<ScannedPart>();
        var allFiles = new List<string>();

        _logger.LogInformation("Dizin taraması başlatılıyor: {Directory}", directoryPath);

        // Önce tüm dosyaları listele
        await Task.Run(() =>
        {
            allFiles = Directory.GetFiles(directoryPath, "*.*", SearchOption.AllDirectories)
                .Where(IsCadFile)
                .ToList();
        }, cancellationToken);

        _logger.LogInformation("{Count} adet CAD dosyası bulundu", allFiles.Count);

        for (int i = 0; i < allFiles.Count; i++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var filePath = allFiles[i];
            var fileDir = Path.GetDirectoryName(filePath) ?? string.Empty;

            // İlerleme bilgisini güncelle
            var elapsedTime = DateTime.UtcNow - startTime;
            var estimatedTotalTime = elapsedTime.TotalMilliseconds / (i + 1) * allFiles.Count;
            var estimatedRemaining = TimeSpan.FromMilliseconds(estimatedTotalTime - elapsedTime.TotalMilliseconds);

            progress?.Report(new ScanProgress
            {
                CurrentFileNumber = i + 1,
                TotalFiles = allFiles.Count,
                CurrentDirectory = fileDir,
                CurrentFileName = Path.GetFileName(filePath),
                ElapsedTime = elapsedTime,
                EstimatedTimeRemaining = estimatedRemaining,
                FoundParts = foundParts.Count
            });

            try
            {
                var scannedPart = AnalyzeFile(filePath);
                if (!string.IsNullOrEmpty(scannedPart.ParcaAdi))
                {
                    foundParts.Add(scannedPart);

                    if (foundParts.Count % 100 == 0)
                    {
                        _logger.LogDebug("{Count} parça bulundu...", foundParts.Count);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Dosya analiz edilirken hata: {File}", filePath);
            }
        }

        _logger.LogInformation("Dizin taraması tamamlandı: {Directory} - {FoundParts} parça bulundu",
            directoryPath, foundParts.Count);

        return foundParts.DistinctBy(p => p.ParcaAdi).ToList();
    }

    public bool IsCadFile(string filePath)
    {
        if (string.IsNullOrEmpty(filePath))
            return false;

        var extension = Path.GetExtension(filePath);
        return _cadExtensions.Contains(extension);
    }

    public string ExtractPartNameFromPath(string filePath)
    {
        if (string.IsNullOrEmpty(filePath))
            return string.Empty;

        var fileName = Path.GetFileNameWithoutExtension(filePath);

        // Regex ile parça adını çıkarmayı dene
        var match = _partNameRegex.Match(fileName);
        if (match.Success)
        {
            var partName = match.Groups[1].Value;
            if (!string.IsNullOrEmpty(partName))
                return partName.ToUpperInvariant();
        }

        // Başarısız olursa dosya adını temizle ve kullan
        return CleanFileName(fileName);
    }

    public ScannedPart AnalyzeFile(string filePath)
    {
        var fileInfo = new FileInfo(filePath);
        var fileName = Path.GetFileNameWithoutExtension(filePath);
        var partName = ExtractPartNameFromPath(filePath);

        var scannedPart = new ScannedPart
        {
            ParcaAdi = partName,
            FullPath = filePath,
            LastModified = fileInfo.LastWriteTime,
            FileSize = fileInfo.Length
        };

        // Dosya türüne göre özellikleri ayarla
        var extension = Path.GetExtension(filePath).ToLowerInvariant();
        switch (extension)
        {
            case ".sldprt":
                scannedPart.Has3D = true;
                scannedPart.SldprtFiles.Add(filePath);
                break;
            case ".slddrw":
                scannedPart.HasDrawing = true;
                scannedPart.SlddrwFiles.Add(filePath);
                break;
            case ".pdf":
                scannedPart.HasPDF = true;
                scannedPart.PdfFiles.Add(filePath);
                break;
            default:
                scannedPart.Has3D = true;
                scannedPart.SldprtFiles.Add(filePath);
                break;
        }

        return scannedPart;
    }

    private static string CleanFileName(string fileName)
    {
        // Özel karakterleri temizle
        var cleaned = Regex.Replace(fileName, @"[^a-zA-Z0-9_]", "_");

        // Birden fazla alt çizgiyi tek alt çizgiye çevir
        cleaned = Regex.Replace(cleaned, @"_+", "_");

        // Başlangıç ve sondaki alt çizgileri kaldır
        cleaned = cleaned.Trim('_');

        // Boş ise varsayılan bir ad ver
        if (string.IsNullOrEmpty(cleaned))
            cleaned = "UNKNOWN_PART";

        return cleaned.ToUpperInvariant();
    }
}