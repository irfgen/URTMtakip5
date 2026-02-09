using System.Text.Json;

namespace URTM.DizinTarama.Client.Helpers;

/// <summary>
/// Basit uygulama ayarları yönetimi
/// </summary>
public static class AppSettings
{
    private static readonly string SettingsPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "URTM_DizinTarama_Client",
        "settings.json"
    );

    private static ApplicationSettings? _settings;
    private static readonly object _lock = new object();

    public static ApplicationSettings Settings
    {
        get
        {
            lock (_lock)
            {
                _settings ??= LoadSettings();
                return _settings;
            }
        }
    }

    private static ApplicationSettings LoadSettings()
    {
        try
        {
            var directory = Path.GetDirectoryName(SettingsPath);
            if (!Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            if (File.Exists(SettingsPath))
            {
                var json = File.ReadAllText(SettingsPath);
                var settings = JsonSerializer.Deserialize<ApplicationSettings>(json);
                return settings ?? new ApplicationSettings();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ayarlar yüklenirken hata: {ex.Message}");
        }

        return new ApplicationSettings();
    }

    public static void SaveSettings()
    {
        try
        {
            var directory = Path.GetDirectoryName(SettingsPath);
            if (!Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            var json = JsonSerializer.Serialize(_settings ?? new ApplicationSettings(), new JsonSerializerOptions
            {
                WriteIndented = true
            });

            File.WriteAllText(SettingsPath, json);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ayarlar kaydedilirken hata: {ex.Message}");
        }
    }
}

public class ApplicationSettings
{
    public string DefaultDirectory { get; set; } = string.Empty;
    public FormWindowState WindowState { get; set; } = FormWindowState.Normal;
    public Size WindowSize { get; set; } = new Size(1200, 800);
    public Point WindowLocation { get; set; } = new Point(100, 100);
}