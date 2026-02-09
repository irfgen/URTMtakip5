namespace URTM.DizinTarama.Client.Models;

/// <summary>
/// Sunucu ayarları
/// </summary>
public class ServerSettings
{
    public string BaseUrl { get; set; } = "http://localhost:3000";
    public int Timeout { get; set; } = 30;
    public int RetryCount { get; set; } = 3;
}

/// <summary>
/// Client ayarları
/// </summary>
public class ClientSettings
{
    public int ScanTimeout { get; set; } = 300;
    public int MaxConcurrentScans { get; set; } = 5;
    public bool CacheEnabled { get; set; } = true;
    public int CacheExpiryMinutes { get; set; } = 30;
}

/// <summary>
/// UI ayarları
/// </summary>
public class UISettings
{
    public int WindowWidth { get; set; } = 1200;
    public int WindowHeight { get; set; } = 800;
    public string Theme { get; set; } = "Default";
    public string Language { get; set; } = "tr-TR";
}