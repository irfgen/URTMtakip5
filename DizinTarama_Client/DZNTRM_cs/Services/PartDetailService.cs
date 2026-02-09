using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Diagnostics;
using URTM.DizinTarama.Client.Models;

namespace URTM.DizinTarama.Client.Services;

/// <summary>
/// Parça detay servisi implementasyonu
/// </summary>
public class PartDetailService : IPartDetailService
{
    private readonly ServerSettings _settings;
    private readonly ILogger<PartDetailService> _logger;

    public PartDetailService(
        IOptions<ServerSettings> settings,
        ILogger<PartDetailService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public CombinedPartData CombinePartData(ScannedPart scannedPart, DatabasePartInfo databaseInfo)
    {
        var combined = new CombinedPartData
        {
            ParcaAdi = scannedPart.ParcaAdi,
            Has3D = scannedPart.Has3D,
            HasDrawing = scannedPart.HasDrawing,
            HasPDF = scannedPart.HasPDF,
            SldprtFiles = new List<string>(scannedPart.SldprtFiles),
            SlddrwFiles = new List<string>(scannedPart.SlddrwFiles),
            PdfFiles = new List<string>(scannedPart.PdfFiles),
            FullPath = scannedPart.FullPath,
            LastModified = scannedPart.LastModified,
            FileSize = scannedPart.FileSize,
            Database = databaseInfo
        };

        _logger.LogDebug("Parça verileri birleştirildi: {PartName}", scannedPart.ParcaAdi);
        return combined;
    }

    public string? GetImageUrl(string? relativePath)
    {
        if (string.IsNullOrEmpty(relativePath))
            return null;

        try
        {
            var baseUrl = _settings.BaseUrl.TrimEnd('/');
            var imagePath = relativePath.TrimStart('/');

            return $"{baseUrl}/{imagePath}";
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Resim URL'i oluşturulamadı: {Path}", relativePath);
            return null;
        }
    }

    public async Task<bool> OpenFileAsync(string filePath)
    {
        try
        {
            if (!File.Exists(filePath))
            {
                _logger.LogWarning("Dosya bulunamadı: {FilePath}", filePath);
                return false;
            }

            _logger.LogDebug("Dosya açılıyor: {FilePath}", filePath);

            // Platform'a uygun komut
            var startInfo = new ProcessStartInfo
            {
                FileName = Environment.OSVersion.Platform switch
                {
                    PlatformID.Win32NT => "explorer",
                    PlatformID.Unix => "xdg-open",
                    PlatformID.MacOSX => "open",
                    _ => "cmd"
                },
                Arguments = Environment.OSVersion.Platform switch
                {
                    PlatformID.Win32NT => $"/select,\"{filePath}\"",
                    _ => $"\"{filePath}\""
                },
                UseShellExecute = true,
                WindowStyle = ProcessWindowStyle.Normal
            };

            var process = Process.Start(startInfo);

            if (process != null)
            {
                await Task.Run(() => process.WaitForExit(5000)); // 5 saniye bekle
                _logger.LogInformation("Dosya açıldı: {FilePath}", filePath);
                return true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Dosya açılırken hata: {FilePath}", filePath);
            return false;
        }
    }

    public async Task<bool> OpenUrlAsync(string url)
    {
        try
        {
            _logger.LogDebug("URL açılıyor: {Url}", url);

            var startInfo = new ProcessStartInfo
            {
                FileName = Environment.OSVersion.Platform switch
                {
                    PlatformID.Win32NT => url,
                    PlatformID.Unix => "xdg-open",
                    PlatformID.MacOSX => "open",
                    _ => url
                },
                Arguments = Environment.OSVersion.Platform == PlatformID.Win32NT ? "" : url,
                UseShellExecute = true
            };

            var process = Process.Start(startInfo);

            if (process != null)
            {
                await Task.Run(() => process.WaitForExit(5000));
                _logger.LogInformation("URL açıldı: {Url}", url);
                return true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "URL açılırken hata: {Url}", url);
            return false;
        }
    }
}