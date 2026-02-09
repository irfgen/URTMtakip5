using Microsoft.Extensions.Logging;
using URTM.DizinTarama.Client.Models;
using URTM.DizinTarama.Client.Services;
using URTM.DizinTarama.Client.Helpers;

namespace URTM.DizinTarama.Client.UI;

/// <summary>
/// Parça detay formu
/// </summary>
public partial class PartDetailForm : Form
{
    private readonly ILogger<PartDetailForm> _logger;
    private readonly IDatabaseService _databaseService;
    private readonly IPartDetailService _partDetailService;

    private readonly ScannedPart _scannedPart;
    private DatabasePartInfo _databaseInfo = new();
    private CombinedPartData _combinedData = new();

    // UI Controls
    private TabControl tabControl = null!;
    private TabPage tabPageGeneral = null!;
    private TabPage tabPageFiles = null!;
    private TabPage tabPageDatabase = null!;
    private TabPage tabPageImages = null!;

    public PartDetailForm(
        ILogger<PartDetailForm> logger,
        IDatabaseService databaseService,
        IPartDetailService partDetailService,
        ScannedPart scannedPart)
    {
        _logger = logger;
        _databaseService = databaseService;
        _partDetailService = partDetailService;
        _scannedPart = scannedPart;

        InitializeComponent();
        LoadPartData();
    }

    private void InitializeComponent()
    {
        Text = $"Parça Detayları - {_scannedPart.ParcaAdi}";
        Size = new Size(900, 700);
        StartPosition = FormStartPosition.CenterParent;
        MinimumSize = new Size(800, 600);

        // Ana panel
        var mainPanel = new Panel
        {
            Dock = DockStyle.Fill,
            Padding = new Padding(10)
        };

        Controls.Add(mainPanel);

        // TabControl
        tabControl = new TabControl
        {
            Dock = DockStyle.Fill
        };

        mainPanel.Controls.Add(tabControl);

        // Tab sayfaları
        CreateGeneralTab();
        CreateFilesTab();
        CreateDatabaseTab();
        CreateImagesTab();

        // Buton paneli
        var buttonPanel = new Panel
        {
            Dock = DockStyle.Bottom,
            Height = 50,
            Padding = new Padding(0, 10, 0, 0)
        };

        mainPanel.Controls.Add(buttonPanel);

        var btnRefresh = new Button
        {
            Text = "Yenile",
            Size = new Size(100, 30),
            Location = new Point(buttonPanel.Width - 220, 10),
            Anchor = AnchorStyles.Top | AnchorStyles.Right,
            UseVisualStyleBackColor = true
        };

        var btnClose = new Button
        {
            Text = "Kapat",
            Size = new Size(100, 30),
            Location = new Point(buttonPanel.Width - 110, 10),
            Anchor = AnchorStyles.Top | AnchorStyles.Right,
            UseVisualStyleBackColor = true
        };

        btnRefresh.Click += BtnRefresh_Click;
        btnClose.Click += (s, e) => Close();

        buttonPanel.Controls.AddRange(new Control[] { btnRefresh, btnClose });
    }

    private void CreateGeneralTab()
    {
        tabPageGeneral = new TabPage("Genel Bilgiler");
        tabControl.TabPages.Add(tabPageGeneral);

        var panel = new Panel
        {
            Dock = DockStyle.Fill,
            Padding = new Padding(10)
        };

        tabPageGeneral.Controls.Add(panel);

        var y = 10;

        // Parça Adı
        AddLabel(panel, "Parça Adı:", 10, y);
        AddValueLabel(panel, _scannedPart.ParcaAdi, 150, y, panel.Width - 170);
        y += 30;

        // Durum
        AddLabel(panel, "Durum:", 10, y);
        var statusText = _scannedPart.Has3D || _scannedPart.HasDrawing || _scannedPart.HasPDF
            ? "✅ Taranmış"
            : "⚠️ Eksik Bilgi";
        AddValueLabel(panel, statusText, 150, y, panel.Width - 170);
        y += 30;

        // Dosya Özellikleri
        AddLabel(panel, "Tam Yol:", 10, y);
        AddValueLabel(panel, _scannedPart.FullPath, 150, y, panel.Width - 170);
        y += 30;

        AddLabel(panel, "Boyut:", 10, y);
        AddValueLabel(panel, FormatFileSize(_scannedPart.FileSize), 150, y, 200);
        y += 30;

        AddLabel(panel, "Son Değiştirme:", 10, y);
        AddValueLabel(panel, _scannedPart.LastModified.ToString("dd.MM.yyyy HH:mm"), 150, y, 200);
        y += 30;

        // Dosya Türleri
        AddLabel(panel, "Dosya Türleri:", 10, y);
        var fileTypes = new List<string>();
        if (_scannedPart.Has3D) fileTypes.Add("3D Model");
        if (_scannedPart.HasDrawing) fileTypes.Add("Teknik Çizim");
        if (_scannedPart.HasPDF) fileTypes.Add("PDF");
        AddValueLabel(panel, string.Join(", ", fileTypes), 150, y, panel.Width - 170);
    }

    private void CreateFilesTab()
    {
        tabPageFiles = new TabPage("CAD Dosyaları");
        tabControl.TabPages.Add(tabPageFiles);

        var panel = new Panel
        {
            Dock = DockStyle.Fill,
            Padding = new Padding(10),
            AutoScroll = true
        };

        tabPageFiles.Controls.Add(panel);

        var y = 10;

        // 3D Model Dosyaları
        if (_scannedPart.SldprtFiles.Any())
        {
            AddLabel(panel, "3D Model Dosyaları (.sldprt):", 10, y, FontStyle.Bold);
            y += 25;

            foreach (var file in _scannedPart.SldprtFiles)
            {
                AddFileLink(panel, file, 30, y);
                y += 25;
            }
            y += 10;
        }

        // Çizim Dosyaları
        if (_scannedPart.SlddrwFiles.Any())
        {
            AddLabel(panel, "Çizim Dosyaları (.slddrw):", 10, y, FontStyle.Bold);
            y += 25;

            foreach (var file in _scannedPart.SlddrwFiles)
            {
                AddFileLink(panel, file, 30, y);
                y += 25;
            }
            y += 10;
        }

        // PDF Dosyaları
        if (_scannedPart.PdfFiles.Any())
        {
            AddLabel(panel, "PDF Dosyaları:", 10, y, FontStyle.Bold);
            y += 25;

            foreach (var file in _scannedPart.PdfFiles)
            {
                AddFileLink(panel, file, 30, y);
                y += 25;
            }
        }

        if (!(_scannedPart.SldprtFiles.Any() || _scannedPart.SlddrwFiles.Any() || _scannedPart.PdfFiles.Any()))
        {
            var lblNoFiles = new Label
            {
                Text = "⚠️ Bu parçaya ait CAD dosyası bulunamadı",
                Location = new Point(10, 10),
                Size = new Size(panel.Width - 20, 30),
                ForeColor = Color.Orange
            };

            panel.Controls.Add(lblNoFiles);
        }
    }

    private void CreateDatabaseTab()
    {
        tabPageDatabase = new TabPage("Veritabanı Bilgileri");
        tabControl.TabPages.Add(tabPageDatabase);

        var panel = new Panel
        {
            Dock = DockStyle.Fill,
            Padding = new Padding(10),
            AutoScroll = true
        };

        tabPageDatabase.Controls.Add(panel);
    }

    private void CreateImagesTab()
    {
        tabPageImages = new TabPage("Görseller");
        tabControl.TabPages.Add(tabPageImages);

        var panel = new Panel
        {
            Dock = DockStyle.Fill,
            Padding = new Padding(10),
            AutoScroll = true
        };

        tabPageImages.Controls.Add(panel);
    }

    private async void LoadPartData()
    {
        try
        {
            _logger.LogInformation("Parça verisi yükleniyor: {PartName}", _scannedPart.ParcaAdi);

            // Veritabanı bilgisini al
            _databaseInfo = await _databaseService.GetPartInfoAsync(_scannedPart.ParcaAdi);
            _combinedData = _partDetailService.CombinePartData(_scannedPart, _databaseInfo);

            // Veritabanı tabını güncelle
            UpdateDatabaseTab();

            // Görseller tabını güncelle
            UpdateImagesTab();

            _logger.LogInformation("Parça verisi yüklendi: {PartName} - Bulundu: {Found}",
                _scannedPart.ParcaAdi, _databaseInfo.Found);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Parça verisi yüklenirken hata: {PartName}", _scannedPart.ParcaAdi);
            MessageBox.Show($"Parça verisi yüklenirken hata oluştu:\n\n{ex.Message}",
                "Hata", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private void UpdateDatabaseTab()
    {
        var panel = tabPageDatabase.Controls[0] as Panel;
        panel?.Controls.Clear();

        var y = 10;

        if (_databaseInfo.Found && _databaseInfo.PartData != null)
        {
            var data = _databaseInfo.PartData;

            AddLabel(panel, "Durum:", 10, y, FontStyle.Bold);
            AddValueLabel(panel, "✅ Sistemde kayıtlı", 150, y, 200, Color.Green);
            y += 30;

            AddLabel(panel, "Kod:", 10, y);
            AddValueLabel(panel, data.Code, 150, y, 200);
            y += 30;

            AddLabel(panel, "Ad:", 10, y);
            AddValueLabel(panel, data.Name, 150, y, 300);
            y += 30;

            AddLabel(panel, "Stok Adedi:", 10, y);
            AddValueLabel(panel, data.StokAdeti.ToString(), 150, y, 100);
            y += 30;

            AddLabel(panel, "Kritik Stok:", 10, y);
            AddValueLabel(panel, data.KritikStok.ToString(), 150, y, 100);
            y += 30;

            AddLabel(panel, "Tedarik Bedeli:", 10, y);
            AddValueLabel(panel, $"{data.TedarikBedeli:C2}", 150, y, 100);
            y += 30;

            AddLabel(panel, "Üretim Türü:", 10, y);
            AddValueLabel(panel, data.ImalMi ? "İmal" : "Satın Alma", 150, y, 150);
            y += 30;

            if (_databaseInfo.MissingFields?.Any() == true)
            {
                AddLabel(panel, "Eksik Bilgiler:", 10, y, FontStyle.Bold);
                y += 25;

                foreach (var field in _databaseInfo.MissingFields)
                {
                    AddValueLabel(panel, $"• {field.Description}", 30, y, panel.Width - 50, Color.Orange);
                    y += 20;
                }
            }
        }
        else
        {
            AddLabel(panel, "Durum:", 10, y, FontStyle.Bold);
            AddValueLabel(panel, "❌ Sistemde bulunamadı", 150, y, 200, Color.Red);
            y += 30;

            AddLabel(panel, "Sebep:", 10, y);
            AddValueLabel(panel, _databaseInfo.Reason, 150, y, panel.Width - 170);
            y += 30;

            if (_databaseInfo.Suggestions?.Any() == true)
            {
                AddLabel(panel, "Öneriler:", 10, y, FontStyle.Bold);
                y += 25;

                foreach (var suggestion in _databaseInfo.Suggestions)
                {
                    AddValueLabel(panel, $"• {suggestion.Code} ({suggestion.Similarity:P1})",
                        30, y, panel.Width - 50, Color.Blue);
                    y += 20;
                }
            }
        }
    }

    private void UpdateImagesTab()
    {
        var panel = tabPageImages.Controls[0] as Panel;
        panel?.Controls.Clear();

        var y = 10;

        if (_databaseInfo.Found && _databaseInfo.PartData != null)
        {
            var data = _databaseInfo.PartData;

            // Parça Resmi
            if (!string.IsNullOrEmpty(data.FotoPath))
            {
                AddImageSection(panel, "Parça Resmi", data.FotoPath, 10, y);
                y += 220;
            }

            // Teknik Resim
            if (!string.IsNullOrEmpty(data.TeknikResimPath))
            {
                AddImageSection(panel, "Teknik Çizim", data.TeknikResimPath, 10, y);
                y += 220;
            }
        }

        if (y == 10)
        {
            var lblNoImages = new Label
            {
                Text = "⚠️ Bu parçaya ait görsel bulunamadı",
                Location = new Point(10, 10),
                Size = new Size(panel.Width - 20, 30),
                ForeColor = Color.Orange
            };

            panel.Controls.Add(lblNoImages);
        }
    }

    private void AddFileLink(Panel parent, string filePath, int x, int y)
    {
        var linkLabel = new LinkLabel
        {
            Text = $"📂 {Path.GetFileName(filePath)}",
            Location = new Point(x, y),
            Size = new Size(parent.Width - x - 20, 20),
            LinkColor = Color.Blue,
            ActiveLinkColor = Color.DarkBlue
        };

        linkLabel.LinkClicked += async (s, e) => await _partDetailService.OpenFileAsync(filePath);
        parent.Controls.Add(linkLabel);

        // ToolTip ile tam dosya yolu
        var toolTip = new ToolTip();
        toolTip.SetToolTip(linkLabel, filePath);
    }

    private void AddImageSection(Panel parent, string title, string imagePath, int x, int y)
    {
        var groupBox = new GroupBox
        {
            Text = title,
            Location = new Point(x, y),
            Size = new Size(parent.Width - x - 20, 200)
        };

        // Resim placeholder
        var pictureBox = new PictureBox
        {
            Location = new Point(10, 25),
            Size = new Size(150, 150),
            BorderStyle = BorderStyle.FixedSingle,
            SizeMode = PictureBoxSizeMode.Zoom,
            BackColor = Color.LightGray
        };

        // Resmi yükle
        _ = Task.Run(async () => await LoadImageAsync(pictureBox, imagePath));

        groupBox.Controls.Add(pictureBox);

        // URL link
        var imageUrl = _partDetailService.GetImageUrl(imagePath);
        if (!string.IsNullOrEmpty(imageUrl))
        {
            var urlLabel = new LinkLabel
            {
                Text = "🌐 Tarayıcıda Aç",
                Location = new Point(170, 25),
                Size = new Size(100, 23),
                LinkColor = Color.Blue
            };

            urlLabel.LinkClicked += async (s, e) => await _partDetailService.OpenUrlAsync(imageUrl);
            groupBox.Controls.Add(urlLabel);
        }

        parent.Controls.Add(groupBox);
    }

    private async Task LoadImageAsync(PictureBox pictureBox, string imagePath)
    {
        try
        {
            var imageUrl = _partDetailService.GetImageUrl(imagePath);
            if (string.IsNullOrEmpty(imageUrl))
                return;

            using var httpClient = new HttpClient();
            var imageBytes = await httpClient.GetByteArrayAsync(imageUrl);
            using var ms = new MemoryStream(imageBytes);

            if (InvokeRequired)
            {
                Invoke(() =>
                {
                    pictureBox.Image = Image.FromStream(ms);
                    pictureBox.BackColor = Color.White;
                });
            }
            else
            {
                pictureBox.Image = Image.FromStream(ms);
                pictureBox.BackColor = Color.White;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Resim yüklenemedi: {ImagePath}", imagePath);
        }
    }

    private void AddLabel(Control parent, string text, int x, int y, FontStyle style = FontStyle.Regular)
    {
        var label = new Label
        {
            Text = text,
            Location = new Point(x, y),
            Size = new Size(130, 20),
            Font = new Font("Segoe UI", 9f, style)
        };

        parent.Controls.Add(label);
    }

    private void AddValueLabel(Control parent, string text, int x, int y, int width, Color? color = null)
    {
        var label = new Label
        {
            Text = text,
            Location = new Point(x, y),
            Size = new Size(width, 20),
            Font = new Font("Segoe UI", 9f),
            ForeColor = color ?? Color.Black
        };

        parent.Controls.Add(label);
    }

    private string FormatFileSize(long bytes)
    {
        string[] sizes = { "B", "KB", "MB", "GB" };
        double len = bytes;
        int order = 0;
        while (len >= 1024 && order < sizes.Length - 1)
        {
            order++;
            len = len / 1024;
        }
        return $"{len:0.##} {sizes[order]}";
    }

    private async void BtnRefresh_Click(object? sender, EventArgs e)
    {
        await LoadPartData();
        _logger.LogInformation("Parça verisi yenilendi: {PartName}", _scannedPart.ParcaAdi);
    }
}