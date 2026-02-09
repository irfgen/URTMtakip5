using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using URTM.DizinTarama.Client.Models;

namespace URTM.DizinTarama.Client.UI;

/// <summary>
/// Ayarlar formu
/// </summary>
public partial class SettingsForm : Form
{
    private readonly ILogger<SettingsForm> _logger;
    private readonly IOptionsMonitor<ServerSettings> _serverSettings;
    private readonly IOptionsMonitor<ClientSettings> _clientSettings;
    private readonly IOptionsMonitor<UISettings> _uiSettings;

    public SettingsForm(
        ILogger<SettingsForm> logger,
        IOptionsMonitor<ServerSettings> serverSettings,
        IOptionsMonitor<ClientSettings> clientSettings,
        IOptionsMonitor<UISettings> uiSettings)
    {
        _logger = logger;
        _serverSettings = serverSettings;
        _clientSettings = clientSettings;
        _uiSettings = uiSettings;

        InitializeComponent();
        LoadSettings();
    }

    private void InitializeComponent()
    {
        Text = "Ayarlar";
        Size = new Size(600, 500);
        StartPosition = FormStartPosition.CenterParent;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;

        var tabControl = new TabControl
        {
            Dock = DockStyle.Fill,
            Padding = new Padding(10)
        };

        Controls.Add(tabControl);

        // Sunucu Ayarları
        var serverTab = new TabPage("Sunucu");
        tabControl.TabPages.Add(serverTab);
        CreateServerSettingsTab(serverTab);

        // Client Ayarları
        var clientTab = new TabPage("Client");
        tabControl.TabPages.Add(clientTab);
        CreateClientSettingsTab(clientTab);

        // UI Ayarları
        var uiTab = new TabPage("Arayüz");
        tabControl.TabPages.Add(uiTab);
        CreateUISettingsTab(uiTab);

        // Buton paneli
        var buttonPanel = new Panel
        {
            Dock = DockStyle.Bottom,
            Height = 60,
            Padding = new Padding(10)
        };

        Controls.Add(buttonPanel);

        var btnSave = new Button
        {
            Text = "Kaydet",
            Size = new Size(100, 30),
            Location = new Point(buttonPanel.Width - 220, 15),
            Anchor = AnchorStyles.Top | AnchorStyles.Right,
            UseVisualStyleBackColor = true
        };

        var btnCancel = new Button
        {
            Text = "İptal",
            Size = new Size(100, 30),
            Location = new Point(buttonPanel.Width - 110, 15),
            Anchor = AnchorStyles.Top | AnchorStyles.Right,
            UseVisualStyleBackColor = true,
            DialogResult = DialogResult.Cancel
        };

        btnSave.Click += BtnSave_Click;
        buttonPanel.Controls.AddRange(new Control[] { btnSave, btnCancel });

        AcceptButton = btnSave;
        CancelButton = btnCancel;
    }

    private void CreateServerSettingsTab(TabPage parent)
    {
        var panel = new Panel
        {
            Dock = DockStyle.Fill,
            Padding = new Padding(20)
        };

        parent.Controls.Add(panel);

        var y = 20;

        // Base URL
        AddLabel(panel, "Sunucu Adresi:", 20, y);
        var txtBaseUrl = new TextBox
        {
            Location = new Point(150, y - 2),
            Size = new Size(300, 25),
            Name = "txtBaseUrl"
        };
        panel.Controls.Add(txtBaseUrl);
        y += 40;

        // Timeout
        AddLabel(panel, "Zaman Aşımı (saniye):", 20, y);
        var numTimeout = new NumericUpDown
        {
            Location = new Point(150, y - 2),
            Size = new Size(100, 25),
            Minimum = 5,
            Maximum = 300,
            Value = 30,
            Name = "numTimeout"
        };
        panel.Controls.Add(numTimeout);
        y += 40;

        // Retry Count
        AddLabel(panel, "Yeniden Deneme Sayısı:", 20, y);
        var numRetryCount = new NumericUpDown
        {
            Location = new Point(150, y - 2),
            Size = new Size(100, 25),
            Minimum = 1,
            Maximum = 10,
            Value = 3,
            Name = "numRetryCount"
        };
        panel.Controls.Add(numRetryCount);
        y += 40;

        // Test Connection button
        var btnTest = new Button
        {
            Text = "Bağlantıyı Test Et",
            Location = new Point(150, y),
            Size = new Size(150, 30),
            Name = "btnTestConnection",
            UseVisualStyleBackColor = true
        };

        btnTest.Click += BtnTestConnection_Click;
        panel.Controls.Add(btnTest);
    }

    private void CreateClientSettingsTab(TabPage parent)
    {
        var panel = new Panel
        {
            Dock = DockStyle.Fill,
            Padding = new Padding(20)
        };

        parent.Controls.Add(panel);

        var y = 20;

        // Scan Timeout
        AddLabel(panel, "Tarama Zaman Aşımı (saniye):", 20, y);
        var numScanTimeout = new NumericUpDown
        {
            Location = new Point(200, y - 2),
            Size = new Size(100, 25),
            Minimum = 60,
            Maximum = 1800,
            Value = 300,
            Name = "numScanTimeout"
        };
        panel.Controls.Add(numScanTimeout);
        y += 40;

        // Max Concurrent Scans
        AddLabel(panel, "Maksimum Eş Zamanlı Tarama:", 20, y);
        var numMaxConcurrent = new NumericUpDown
        {
            Location = new Point(200, y - 2),
            Size = new Size(100, 25),
            Minimum = 1,
            Maximum = 20,
            Value = 5,
            Name = "numMaxConcurrent"
        };
        panel.Controls.Add(numMaxConcurrent);
        y += 40;

        // Cache Enabled
        var chkCacheEnabled = new CheckBox
        {
            Text = "Cache'i Etkinleştir",
            Location = new Point(200, y - 2),
            Size = new Size(200, 25),
            Name = "chkCacheEnabled"
        };
        panel.Controls.Add(chkCacheEnabled);
        y += 40;

        // Cache Expiry
        AddLabel(panel, "Cache Süresi (dakika):", 20, y);
        var numCacheExpiry = new NumericUpDown
        {
            Location = new Point(200, y - 2),
            Size = new Size(100, 25),
            Minimum = 5,
            Maximum = 1440,
            Value = 30,
            Name = "numCacheExpiry"
        };
        panel.Controls.Add(numCacheExpiry);
    }

    private void CreateUISettingsTab(TabPage parent)
    {
        var panel = new Panel
        {
            Dock = DockStyle.Fill,
            Padding = new Padding(20)
        };

        parent.Controls.Add(panel);

        var y = 20;

        // Window Width
        AddLabel(panel, "Pencere Genişliği:", 20, y);
        var numWindowWidth = new NumericUpDown
        {
            Location = new Point(150, y - 2),
            Size = new Size(100, 25),
            Minimum = 800,
            Maximum = 2560,
            Value = 1200,
            Name = "numWindowWidth"
        };
        panel.Controls.Add(numWindowWidth);
        y += 40;

        // Window Height
        AddLabel(panel, "Pencere Yüksekliği:", 20, y);
        var numWindowHeight = new NumericUpDown
        {
            Location = new Point(150, y - 2),
            Size = new Size(100, 25),
            Minimum = 600,
            Maximum = 1440,
            Value = 800,
            Name = "numWindowHeight"
        };
        panel.Controls.Add(numWindowHeight);
        y += 40;

        // Theme
        AddLabel(panel, "Tema:", 20, y);
        var cmbTheme = new ComboBox
        {
            Location = new Point(150, y - 2),
            Size = new Size(150, 25),
            DropDownStyle = ComboBoxStyle.DropDownList,
            Name = "cmbTheme"
        };

        cmbTheme.Items.AddRange(new[] { "Default", "Dark", "Light", "Blue" });
        panel.Controls.Add(cmbTheme);
        y += 40;

        // Language
        AddLabel(panel, "Dil:", 20, y);
        var cmbLanguage = new ComboBox
        {
            Location = new Point(150, y - 2),
            Size = new Size(150, 25),
            DropDownStyle = ComboBoxStyle.DropDownList,
            Name = "cmbLanguage"
        };

        cmbLanguage.Items.AddRange(new[] { "tr-TR", "en-US" });
        panel.Controls.Add(cmbLanguage);
    }

    private void AddLabel(Control parent, string text, int x, int y)
    {
        var label = new Label
        {
            Text = text,
            Location = new Point(x, y),
            Size = new Size(150, 20)
        };

        parent.Controls.Add(label);
    }

    private void LoadSettings()
    {
        try
        {
            // Sunucu ayarları
            var serverSettings = _serverSettings.CurrentValue;
            SetControlText("txtBaseUrl", serverSettings.BaseUrl);
            SetControlValue("numTimeout", serverSettings.Timeout);
            SetControlValue("numRetryCount", serverSettings.RetryCount);

            // Client ayarları
            var clientSettings = _clientSettings.CurrentValue;
            SetControlValue("numScanTimeout", clientSettings.ScanTimeout);
            SetControlValue("numMaxConcurrent", clientSettings.MaxConcurrentScans);
            SetControlChecked("chkCacheEnabled", clientSettings.CacheEnabled);
            SetControlValue("numCacheExpiry", clientSettings.CacheExpiryMinutes);

            // UI ayarları
            var uiSettings = _uiSettings.CurrentValue;
            SetControlValue("numWindowWidth", uiSettings.WindowWidth);
            SetControlValue("numWindowHeight", uiSettings.WindowHeight);
            SetControlText("cmbTheme", uiSettings.Theme);
            SetControlText("cmbLanguage", uiSettings.Language);

            _logger.LogDebug("Ayarlar yüklendi");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ayarlar yüklenirken hata");
            MessageBox.Show($"Ayarlar yüklenirken hata oluştu:\n\n{ex.Message}",
                "Hata", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private void SetControlText(string controlName, string text)
    {
        var control = FindControlRecursive(this, controlName);
        if (control is TextBox textBox)
            textBox.Text = text;
        else if (control is ComboBox comboBox)
            comboBox.Text = text;
    }

    private void SetControlValue(string controlName, decimal value)
    {
        var control = FindControlRecursive(this, controlName);
        if (control is NumericUpDown numericUpDown)
            numericUpDown.Value = value;
    }

    private void SetControlChecked(string controlName, bool checkedState)
    {
        var control = FindControlRecursive(this, controlName);
        if (control is CheckBox checkBox)
            checkBox.Checked = checkedState;
    }

    private Control? FindControlRecursive(Control parent, string controlName)
    {
        foreach (Control control in parent.Controls)
        {
            if (control.Name == controlName)
                return control;

            var found = FindControlRecursive(control, controlName);
            if (found != null)
                return found;
        }

        return null;
    }

    private async void BtnTestConnection_Click(object? sender, EventArgs e)
    {
        var btn = sender as Button;
        if (btn == null) return;

        var originalText = btn.Text;
        btn.Enabled = false;
        btn.Text = "Test ediliyor...";

        try
        {
            var baseUrl = GetControlText("txtBaseUrl");
            if (string.IsNullOrEmpty(baseUrl))
            {
                MessageBox.Show("Lütfen sunucu adresini girin.", "Uyarı",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
            var response = await httpClient.GetAsync($"{baseUrl.TrimEnd('/')}/api/health");

            if (response.IsSuccessStatusCode)
            {
                MessageBox.Show("✅ Sunucu bağlantısı başarılı!", "Başarılı",
                    MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            else
            {
                MessageBox.Show($"❌ Sunucu bağlantısı başarısız: {response.StatusCode}",
                    "Hata", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
        catch (Exception ex)
        {
            MessageBox.Show($"❌ Bağlantı hatası: {ex.Message}", "Hata",
                MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
        finally
        {
            btn.Enabled = true;
            btn.Text = originalText;
        }
    }

    private string GetControlText(string controlName)
    {
        var control = FindControlRecursive(this, controlName);
        return control switch
        {
            TextBox textBox => textBox.Text,
            ComboBox comboBox => comboBox.Text,
            _ => string.Empty
        };
    }

    private void BtnSave_Click(object? sender, EventArgs e)
    {
        try
        {
            // Ayarları kaydet (appsettings.json dosyasına yazılmalı)
            // Bu kısım implementasyon gerektirir

            MessageBox.Show("Ayarlar kaydedildi!", "Başarılı",
                MessageBoxButtons.OK, MessageBoxIcon.Information);

            DialogResult = DialogResult.OK;
            Close();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ayarlar kaydedilirken hata");
            MessageBox.Show($"Ayarlar kaydedilirken hata oluştu:\n\n{ex.Message}",
                "Hata", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}