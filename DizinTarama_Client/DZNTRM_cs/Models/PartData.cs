namespace URTM.DizinTarama.Client.Models;

/// <summary>
/// Taranmış parça verisi
/// </summary>
public class ScannedPart
{
    public string ParcaAdi { get; set; } = string.Empty;
    public bool Has3D { get; set; }
    public bool HasDrawing { get; set; }
    public bool HasPDF { get; set; }
    public List<string> SldprtFiles { get; set; } = new();
    public List<string> SlddrwFiles { get; set; } = new();
    public List<string> PdfFiles { get; set; } = new();
    public string Durum { get; set; } = "Bilinmeyen";
    public bool Selected { get; set; }
    public string FullPath { get; set; } = string.Empty;
    public DateTime LastModified { get; set; }
    public long FileSize { get; set; }
}

/// <summary>
/// Veritabanı parça bilgisi
/// </summary>
public class DatabasePartInfo
{
    public bool Found { get; set; }
    public PartData? PartData { get; set; }
    public string Reason { get; set; } = string.Empty;
    public List<PartSuggestion> Suggestions { get; set; } = new();
    public List<MissingField> MissingFields { get; set; } = new();
    public double CompletionRate { get; set; }
}

/// <summary>
/// Parça verisi
/// </summary>
public class PartData
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int StokAdeti { get; set; }
    public int KritikStok { get; set; }
    public decimal TedarikBedeli { get; set; }
    public bool ImalMi { get; set; }
    public string? FotoPath { get; set; }
    public string? TeknikResimPath { get; set; }
    public StockCard? StokKarti { get; set; }
}

/// <summary>
/// Stok kartı bilgisi
/// </summary>
public class StockCard
{
    public string MalzemeCinsi { get; set; } = string.Empty;
    public string Kesit { get; set; } = string.Empty;
    public string Boy { get; set; } = string.Empty;
    public string Birim { get; set; } = string.Empty;
}

/// <summary>
/// Parça önerisi
/// </summary>
public class PartSuggestion
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public double Similarity { get; set; }
}

/// <summary>
/// Eksik alan
/// </summary>
public class MissingField
{
    public string Field { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

/// <summary>
/// Toplu parça sorgusu sonucu
/// </summary>
public class BulkPartResponse
{
    public bool Success { get; set; }
    public BulkPartData? Data { get; set; }
    public ApiError? Error { get; set; }
}

/// <summary>
/// Toplu parça verisi
/// </summary>
public class BulkPartData
{
    public List<DatabasePartInfo> Parts { get; set; } = new();
    public int FoundCount { get; set; }
    public int NotFoundCount { get; set; }
    public ApiStatistics? Statistics { get; set; }
}

/// <summary>
/// API istatistikleri
/// </summary>
public class ApiStatistics
{
    public int CacheHitCount { get; set; }
    public int DatabaseQueryCount { get; set; }
    public TimeSpan TotalResponseTime { get; set; }
}

/// <summary>
/// API hatası
/// </summary>
public class ApiError
{
    public string Message { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public Dictionary<string, object>? Details { get; set; }
}