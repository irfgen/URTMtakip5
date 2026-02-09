using Microsoft.Extensions.Logging;
using URTM.DizinTarama.Client.Models;
using URTM.DizinTarama.Client.Services;
using URTM.DizinTarama.Client.Helpers;
using System.IO;

namespace URTM.DizinTarama.Client.UI;

/// <summary>
/// Ana form
/// </summary>
public partial class MainForm : Form
{
    private readonly ILogger<MainForm> _logger;
    private readonly IDatabaseService _databaseService;
    private readonly IFileScanService _fileScanService;
    private readonly IPartDetailService _partDetailService;
    private readonly UISettings _uiSettings;

    private List<ScannedPart> _scannedParts = new();
    private List<ScannedPart> _filteredParts = new();
    private CancellationTokenSource? _scanCancellationTokenSource;

    // UI Controls
    private TextBox txtDirectoryPath = null!;
    private Button btnBrowse = null!;
    private Button btnScan = null!;
    private Button btnStop = null!;
    private Button btnSendResults = null!;
    private Button btnShowDetails = null!;
    private Button btnRefresh = null!;
    private Button btnSettings = null!;
    private ProgressBar progressBar = null!;
    private Label lblStatus = null!;
    private Label lblProgress = null!;
    private DataGridView dgvParts = null!;
    private ComboBox cmbFilter = null!;
    private TextBox txtSearch = null!;
    private Label lblStats = null!;

    public MainForm(
        ILogger<MainForm> logger,
        IDatabaseService databaseService,
        IFileScanService fileScanService,
        IPartDetailService partDetailService,
        UISettings uiSettings)
    {
        _logger = logger;
        _databaseService = databaseService;
        _fileScanService = fileScanService;
        _partDetailService = partDetailService;
        _uiSettings = uiSettings;

        InitializeComponent();
        }

    private void InitializeComponent()
    {
        Text = "ÜRTM Dizin Tarama Client v1.0.0";
        Size = new Size(_uiSettings.WindowWidth, _uiSettings.WindowHeight);
        StartPosition = FormStartPosition.CenterScreen;
        MinimumSize = new Size(800, 600);

        // Ana panel
        var mainPanel = new Panel
        {
            Dock = DockStyle.Fill,
            Padding = new Padding(10)
        };

        Controls.Add(mainPanel);

        // Üst panel - Dizin seçimi
        var topPanel = new Panel
        {
            Dock = DockStyle.Top,
            Height = 80,
            Padding = new Padding(0, 0, 0, 10)
        };

        mainPanel.Controls.Add(topPanel);

        // Dizin path textbox
        txtDirectoryPath = new TextBox
        {
            Location = new Point(0, 10),
            Size = new Size(topPanel.Width - 250, 25),
            Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right,
            Font = new Font("Segoe UI", 9f)
        };

        // Browse button
        btnBrowse = new Button
        {
            Text = "Gözat...",
            Location = new Point(txtDirectoryPath.Right + 10, 8),
            Size = new Size(80, 28),
            Anchor = AnchorStyles.Top | AnchorStyles.Right,
            UseVisualStyleBackColor = true
        };

        btnBrowse.Click += BtnBrowse_Click;

        topPanel.Controls.AddRange(new Control[] { txtDirectoryPath, btnBrowse });

        // Araç çubuğu paneli
        var toolbarPanel = new Panel
        {
            Dock = DockStyle.Top,
            Height = 40,
            Padding = new Padding(0, 0, 0, 10)
        };

        mainPanel.Controls.Add(toolbarPanel);

        // Butonlar
        btnScan = new Button
        {
            Text = "Taramayı Başlat",
            Location = new Point(0, 5),
            Size = new Size(120, 30),
            UseVisualStyleBackColor = true
        };

        btnStop = new Button
        {
            Text = "Durdur",
            Location = new Point(130, 5),
            Size = new Size(80, 30),
            Enabled = false,
            UseVisualStyleBackColor = true
        };

        btnSendResults = new Button
        {
            Text = "Sonuçları Gönder",
            Location = new Point(220, 5),
            Size = new Size(140, 30),
            Enabled = false,
            UseVisualStyleBackColor = true
        };

        btnShowDetails = new Button
        {
            Text = "Detayları Göster",
            Location = new Point(370, 5),
            Size = new Size(120, 30),
            Enabled = false,
            UseVisualStyleBackColor = true
        };

        btnRefresh = new Button
        {
            Text = "Yenile",
            Location = new Point(500, 5),
            Size = new Size(80, 30),
            UseVisualStyleBackColor = true
        };

        btnSettings = new Button
        {
            Text = "Ayarlar",
            Location = new Point(590, 5),
            Size = new Size(80, 30),
            UseVisualStyleBackColor = true
        };

        // Event handlers
        btnScan.Click += BtnScan_Click;
        btnStop.Click += BtnStop_Click;
        btnSendResults.Click += BtnSendResults_Click;
        btnShowDetails.Click += BtnShowDetails_Click;
        btnRefresh.Click += BtnRefresh_Click;
        btnSettings.Click += BtnSettings_Click;

        toolbarPanel.Controls.AddRange(new Control[] { btnScan, btnStop, btnSendResults, btnShowDetails, btnRefresh, btnSettings });

        // Progress panel
        var progressPanel = new Panel
        {
            Dock = DockStyle.Top,
            Height = 60
        };

        mainPanel.Controls.Add(progressPanel);

        progressBar = new ProgressBar
        {
            Location = new Point(0, 0),
            Size = new Size(progressPanel.Width - 200, 20),
            Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right
        };

        lblProgress = new Label
        {
            Text = "Hazır",
            Location = new Point(0, 25),
            Size = new Size(progressPanel.Width - 200, 20),
            Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right,
            Font = new Font("Segoe UI", 8.5f)
        };

        lblStats = new Label
        {
            Text = "Toplam: 0 | Seçili: 0",
            Location = new Point(progressBar.Right + 10, 0),
            Size = new Size(180, 40),
            Anchor = AnchorStyles.Top | AnchorStyles.Right,
            TextAlign = ContentAlignment.MiddleRight,
            Font = new Font("Segoe UI", 8.5f)
        };

        progressPanel.Controls.AddRange(new Control[] { progressBar, lblProgress, lblStats });

        // Filtre paneli
        var filterPanel = new Panel
        {
            Dock = DockStyle.Top,
            Height = 35,
            Padding = new Padding(0, 0, 0, 5)
        };

        mainPanel.Controls.Add(filterPanel);

        var lblFilter = new Label
        {
            Text = "Filtre:",
            Location = new Point(0, 8),
            Size = new Size(40, 20),
            TextAlign = ContentAlignment.MiddleLeft
        };

        cmbFilter = new ComboBox
        {
            Location = new Point(45, 5),
            Size = new Size(150, 25),
            DropDownStyle = ComboBoxStyle.DropDownList
        };

        cmbFilter.Items.AddRange(new[]
        {
            "Tümü",
            "Sadece 3D olanlar",
            "Sadece Çizim olanlar",
            "Sadece PDF olanlar",
            "Tüm dosyalara sahip olanlar"
        });
        cmbFilter.SelectedIndex = 0;

        var lblSearch = new Label
        {
            Text = "Ara:",
            Location = new Point(200, 8),
            Size = new Size(40, 20),
            TextAlign = ContentAlignment.MiddleLeft
        };

        txtSearch = new TextBox
        {
            Location = new Point(245, 5),
            Size = new Size(200, 25),
            Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right
        };

        txtSearch.TextChanged += TxtSearch_TextChanged;
        cmbFilter.SelectedIndexChanged += CmbFilter_SelectedIndexChanged;

        filterPanel.Controls.AddRange(new Control[] { lblFilter, cmbFilter, lblSearch, txtSearch });

        // DataGrid
        dgvParts = new DataGridView
        {
            Dock = DockStyle.Fill,
            AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.DisplayedCells,
            SelectionMode = DataGridViewSelectionMode.FullRowSelect,
            MultiSelect = true,
            ReadOnly = true,
            AllowUserToAddRows = false,
            AllowUserToDeleteRows = false,
            RowHeadersVisible = false,
            ColumnHeadersHeight = 30
        };

        SetupDataGridView();
        mainPanel.Controls.Add(dgvParts);

        // Durum çubuğu
        lblStatus = new Label
        {
            Text = "Hazır",
            Dock = DockStyle.Bottom,
            Height = 25,
            BackColor = SystemColors.Control,
            Padding = new Padding(5, 0, 0, 0),
            TextAlign = ContentAlignment.MiddleLeft
        };

        Controls.Add(lblStatus);
    }

    private void SetupDataGridView()
    {
        // Checkbox column
        var checkboxColumn = new DataGridViewCheckBoxColumn
        {
            Name = "Selected",
            HeaderText = "Seç",
            Width = 50,
            AutoSizeMode = DataGridViewAutoSizeColumnMode.None
        };

        dgvParts.Columns.Add(checkboxColumn);

        // Diğer sütunlar
        dgvParts.Columns.AddRange(new DataGridViewColumn[]
        {
            new DataGridViewTextBoxColumn { Name = "ParcaAdi", HeaderText = "Parça Adı", AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill },
            new DataGridViewTextBoxColumn { Name = "Has3D", HeaderText = "3D", Width = 50 },
            new DataGridViewTextBoxColumn { Name = "HasDrawing", HeaderText = "Çizim", Width = 60 },
            new DataGridViewTextBoxColumn { Name = "HasPDF", HeaderText = "PDF", Width = 50 },
            new DataGridViewTextBoxColumn { Name = "FullPath", HeaderText = "Dosya Yolu", AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill, Visible = false },
            new DataGridViewTextBoxColumn { Name = "FileSize", HeaderText = "Boyut", Width = 80 },
            new DataGridViewTextBoxColumn { Name = "LastModified", HeaderText = "Değiştirme", Width = 130 }
        });

        dgvParts.CellValueChanged += DgvParts_CellValueChanged;
        dgvParts.CellContentClick += DgvParts_CellContentClick;
        dgvParts.DoubleClick += DgvParts_DoubleClick;
    }

    private void LoadSettings()
    {
        txtDirectoryPath.Text = AppSettings.Settings.DefaultDirectory ?? "";
        WindowState = AppSettings.Settings.WindowState;
        if (AppSettings.Settings.WindowSize.Width > 0)
        {
            Size = AppSettings.Settings.WindowSize;
            Location = AppSettings.Settings.WindowLocation;
        }
    }

    private void SaveSettings()
    {
        AppSettings.Settings.DefaultDirectory = txtDirectoryPath.Text;
        AppSettings.Settings.WindowState = WindowState;
        AppSettings.Settings.WindowSize = Size;
        AppSettings.Settings.WindowLocation = Location;
        AppSettings.SaveSettings();
    }

    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        SaveSettings();
        _scanCancellationTokenSource?.Cancel();
        base.OnFormClosing(e);
    }

    protected override async void OnLoad(EventArgs e)
    {
        base.OnLoad(e);

        try
        {
            lblStatus.Text = "Sunucu bağlantısı kontrol ediliyor...";
            var connected = await _databaseService.TestConnectionAsync();

            if (connected)
            {
                lblStatus.Text = "✅ Sunucu bağlantısı başarılı";
                _logger.LogInformation("Sunucu bağlantısı başarılı: {BaseUrl}", _databaseService.GetType().Name);
            }
            else
            {
                lblStatus.Text = "❌ Sunucu bağlantısı başarısız";
                _logger.LogWarning("Sunucu bağlantısı başarısız");
            }
        }
        catch (Exception ex)
        {
            lblStatus.Text = "❌ Bağlantı hatası";
            _logger.LogError(ex, "Sunucu bağlantısı kontrol edilirken hata");
        }
    }

    // Event handler metotları buraya gelecek...
    private async void BtnBrowse_Click(object? sender, EventArgs e)
    {
        using var dialog = new FolderBrowserDialog
        {
            Description = "CAD dosyalarını içeren dizini seçin",
            ShowNewFolderButton = false,
            SelectedPath = txtDirectoryPath.Text
        };

        if (dialog.ShowDialog() == DialogResult.OK)
        {
            txtDirectoryPath.Text = dialog.SelectedPath;
            AppSettings.Settings.DefaultDirectory = dialog.SelectedPath;
            AppSettings.SaveSettings();
        }
    }

    private async void BtnScan_Click(object? sender, EventArgs e)
    {
        await StartScanAsync();
    }

    private void BtnStop_Click(object? sender, EventArgs e)
    {
        _scanCancellationTokenSource?.Cancel();
        btnStop.Enabled = false;
        btnScan.Enabled = true;
    }

    private async void BtnSendResults_Click(object? sender, EventArgs e)
    {
        await SendResultsAsync();
    }

    private void BtnShowDetails_Click(object? sender, EventArgs e)
    {
        ShowSelectedPartDetails();
    }

    private async void BtnRefresh_Click(object? sender, EventArgs e)
    {
        await RefreshDataAsync();
    }

    private void BtnSettings_Click(object? sender, EventArgs e)
    {
        ShowSettings();
    }

    private void TxtSearch_TextChanged(object? sender, EventArgs e)
    {
        ApplyFilters();
    }

    private void CmbFilter_SelectedIndexChanged(object? sender, EventArgs e)
    {
        ApplyFilters();
    }

    private void DgvParts_CellValueChanged(object? sender, DataGridViewCellEventArgs e)
    {
        if (e.RowIndex >= 0 && e.ColumnIndex == 0) // Checkbox column
        {
            var part = (ScannedPart)dgvParts.Rows[e.RowIndex].DataBoundItem;
            part.Selected = Convert.ToBoolean(dgvParts[e.ColumnIndex, e.RowIndex].Value);
            UpdateStats();
        }
    }

    private void DgvParts_CellContentClick(object? sender, DataGridViewCellEventArgs e)
    {
        if (e.RowIndex >= 0 && e.ColumnIndex == 0) // Checkbox column
        {
            dgvParts.CommitEdit(DataGridViewDataErrorContexts.Commit);
        }
    }

    private void DgvParts_DoubleClick(object? sender, EventArgs e)
    {
        ShowSelectedPartDetails();
    }

    // Diğer metotlar...
    private async Task StartScanAsync()
    {
        // Tarama metodu implementasyonu...
        _logger.LogInformation("Dizin taraması başlatılıyor...");
    }

    private async Task SendResultsAsync()
    {
        // Sonuçları gönderme metodu...
        _logger.LogInformation("Tarama sonuçları gönderiliyor...");
    }

    private void ShowSelectedPartDetails()
    {
        // Detay gösterme metodu...
        _logger.LogInformation("Parça detayları gösteriliyor...");
    }

    private async Task RefreshDataAsync()
    {
        // Veri yenileme metodu...
        _logger.LogInformation("Veriler yenileniyor...");
    }

    private void ShowSettings()
    {
        // Ayarlar formunu gösterme metodu...
        _logger.LogInformation("Ayarlar formu gösteriliyor...");
    }

    private void ApplyFilters()
    {
        // Filtreleme metodu...
        _logger.LogDebug("Filtreler uygulanıyor...");
    }

    private void UpdateStats()
    {
        // İstatistikleri güncelleme metodu...
        var total = _filteredParts.Count;
        var selected = _filteredParts.Count(p => p.Selected);
        lblStats.Text = $"Toplam: {total} | Seçili: {selected}";
    }
}