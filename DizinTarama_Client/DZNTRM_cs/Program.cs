using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Serilog;
using System.Windows.Forms;
using URTM.DizinTarama.Client.Services;
using URTM.DizinTarama.Client.UI;
using URTM.DizinTarama.Client.Models;
using IHost = Microsoft.Extensions.Hosting.IHost;

namespace URTM.DizinTarama.Client;

internal static class Program
{
    /// <summary>
    /// The main entry point for the application.
    /// </summary>
    [STAThread]
    static void Main()
    {
        ApplicationConfiguration.Initialize();

        // Host oluştur
        var host = CreateHostBuilder().Build();

        // Logger al
        var logger = host.Services.GetRequiredService<ILogger<Program>>();

        try
        {
            logger.LogInformation("========================================");
            logger.LogInformation("   ÜRTM Dizin Tarama Client v1.0.0");
            logger.LogInformation("========================================");
            logger.LogInformation("Mevcut dizin: {Directory}", Environment.CurrentDirectory);

            // Application high DPI desteği
            Application.SetHighDpiMode(HighDpiMode.SystemAware);
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            // MainForm'u başlat
            using var scope = host.Services.CreateScope();
            var services = scope.ServiceProvider;
            var mainForm = services.GetRequiredService<MainForm>();

            logger.LogInformation("Client başlatılıyor...");
            Application.Run(mainForm);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Uygulama başlatma hatası");
            MessageBox.Show(
                $"Uygulama başlatılırken hata oluştu:\n\n{ex.Message}",
                "Hata",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error
            );
        }
    }

    static IHostBuilder CreateHostBuilder() =>
        Host.CreateDefaultBuilder(args)
            .UseSerilog()
            .ConfigureServices((context, services) =>
            {
                // Serilog yapılandırması
                Log.Logger = new LoggerConfiguration()
                    .ReadFrom.Configuration(context.Configuration)
                    .Enrich.FromLogContext()
                    .WriteTo.Console()
                    .WriteTo.File("Logs/Client_.log", rollingInterval: RollingInterval.Day)
                    .CreateLogger();

                // Settings
                services.Configure<ServerSettings>(context.Configuration.GetSection("ServerSettings"));
                services.Configure<ClientSettings>(context.Configuration.GetSection("ClientSettings"));
                services.Configure<UISettings>(context.Configuration.GetSection("UISettings"));

                // Services
                services.AddSingleton<IDatabaseService, DatabaseService>();
                services.AddSingleton<IFileScanService, FileScanService>();
                services.AddSingleton<IPartDetailService, PartDetailService>();

                // Forms
                services.AddSingleton<MainForm>();
                services.AddTransient<PartDetailForm>();
                services.AddTransient<SettingsForm>();

                // Logging
                services.AddLogging(builder =>
                {
                    builder.ClearProviders();
                    builder.AddSerilog();
                });
            });
}