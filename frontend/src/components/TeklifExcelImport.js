import React, { useState, useRef } from 'react';
import './TeklifExcelImport.css';

const TeklifExcelImport = () => {
    const [file, setFile] = useState(null);
    const [parseResult, setParseResult] = useState(null);
    const [importResult, setImportResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: file upload, 2: preview, 3: results
    const fileInputRef = useRef(null);

    // Dosya seçme
    const handleFileSelect = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            const validTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel'
            ];
            
            if (validTypes.includes(selectedFile.type)) {
                setFile(selectedFile);
                setParseResult(null);
                setImportResult(null);
                setStep(1);
            } else {
                alert('Lütfen sadece Excel dosyası (.xlsx veya .xls) seçin.');
            }
        }
    };

    // Excel'i parse et
    const handleParseExcel = async () => {
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('excel', file);

        try {
            const response = await fetch('/api/fason-teklifler/upload-excel', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            
            if (response.ok) {
                setParseResult(result);
                setStep(2);
            } else {
                alert(`Hata: ${result.message}`);
            }
        } catch (error) {
            console.error('Parse hatası:', error);
            alert('Excel dosyası işlenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    // Teklifleri veritabanına kaydet
    const handleSaveTeklifler = async () => {
        if (!parseResult || !parseResult.data) return;

        setLoading(true);
        
        // Parse edilen veriyi veritabanı formatına dönüştür
        const teklifData = [];
        parseResult.data.forEach(item => {
            item.firmalar.forEach(firma => {
                teklifData.push({
                    parca_kodu: item.parca_kodu,
                    firma_adi: firma.firma_adi,
                    teklif_fiyati: firma.teklif_fiyati,
                    adet: item.adet,
                    teslim_suresi: 30, // Default 30 gün
                    aciklama: `Kesit: ${item.malzeme_kesiti || ''}, Boy: ${item.uzunluk || ''}, Malzeme: ${item.malzeme_cinsi || ''}`.trim(),
                    satir_no: item.satir_no
                });
            });
        });

        try {
            const response = await fetch('/api/fason-teklifler/bulk-create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ teklifData }),
            });

            const result = await response.json();
            
            if (response.ok) {
                setImportResult(result);
                setStep(3);
            } else {
                alert(`Kayıt hatası: ${result.message}`);
            }
        } catch (error) {
            console.error('Kayıt hatası:', error);
            alert('Teklifler kaydedilirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    // Yeni import başlat
    const handleNewImport = () => {
        setFile(null);
        setParseResult(null);
        setImportResult(null);
        setStep(1);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="teklif-excel-import">
            <div className="import-container">
                <h2>📊 Teklif Excel Import Sistemi</h2>
                
                {/* Step Indicator */}
                <div className="step-indicator">
                    <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                        <span className="step-number">1</span>
                        <span className="step-label">Dosya Seç</span>
                    </div>
                    <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                        <span className="step-number">2</span>
                        <span className="step-label">Önizleme</span>
                    </div>
                    <div className={`step ${step >= 3 ? 'active' : ''}`}>
                        <span className="step-number">3</span>
                        <span className="step-label">Sonuç</span>
                    </div>
                </div>

                {/* Step 1: File Upload */}
                {step === 1 && (
                    <div className="upload-section">
                        <div className="file-upload-area">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileSelect}
                                className="file-input"
                                id="excel-file"
                            />
                            <label htmlFor="excel-file" className="file-upload-label">
                                📁 Excel Dosyası Seç
                                <span className="file-info">
                                    (.xlsx veya .xls formatında)
                                </span>
                            </label>
                        </div>

                        {file && (
                            <div className="file-details">
                                <h3>Seçilen Dosya:</h3>
                                <div className="file-info-card">
                                    <p><strong>Dosya Adı:</strong> {file.name}</p>
                                    <p><strong>Boyut:</strong> {(file.size / 1024).toFixed(2)} KB</p>
                                    <p><strong>Tip:</strong> {file.type}</p>
                                </div>
                                
                                <button 
                                    onClick={handleParseExcel}
                                    disabled={loading}
                                    className="btn btn-primary"
                                >
                                    {loading ? '⏳ İşleniyor...' : '🔍 Excel\'i Analiz Et'}
                                </button>
                            </div>
                        )}

                        <div className="format-info">
                            <h3>📋 Beklenen Excel Formatı:</h3>
                            <div className="format-example">
                                <table className="format-table">
                                    <thead>
                                        <tr>
                                            <th colSpan="5">TEKLIF GRUBU ADI</th>
                                        </tr>
                                        <tr>
                                            <th>ADET</th>
                                            <th>PARÇA ADI</th>
                                            <th>KESIT</th>
                                            <th>BOY</th>
                                            <th>MAZLEME</th>
                                            <th>FİRMA 1</th>
                                            <th>FİRMA 2</th>
                                            <th>...</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>20</td>
                                            <td>EPEO_KSC-002</td>
                                            <td>40X25</td>
                                            <td>45</td>
                                            <td>SOĞUK</td>
                                            <td>180</td>
                                            <td>200</td>
                                            <td>...</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Preview */}
                {step === 2 && parseResult && (
                    <div className="preview-section">
                        <h3>📄 Excel Önizleme</h3>
                        
                        <div className="parse-summary">
                            <div className="summary-card">
                                <h4>📊 Özet Bilgiler</h4>
                                <p><strong>Teklif Grubu:</strong> {parseResult.teklifGrubuAdi}</p>
                                <p><strong>Toplam Satır:</strong> {parseResult.totalRows}</p>
                                <p><strong>Firma Sayısı:</strong> {parseResult.firmaColumns.length}</p>
                                <p><strong>Toplam Teklif:</strong> {parseResult.data.reduce((sum, item) => sum + item.firmalar.length, 0)}</p>
                            </div>
                        </div>

                        <div className="firms-list">
                            <h4>🏢 Bulunan Firmalar:</h4>
                            <div className="firms-grid">
                                {parseResult.firmaColumns.map((firma, index) => (
                                    <span key={index} className="firm-tag">
                                        {firma.firmaAdi}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="data-preview">
                            <h4>📋 Veri Önizleme (İlk 10 Satır):</h4>
                            <div className="preview-table-container">
                                <table className="preview-table">
                                    <thead>
                                        <tr>
                                            <th>Satır</th>
                                            <th>Adet</th>
                                            <th>Parça Kodu</th>
                                            <th>Kesit</th>
                                            <th>Boy</th>
                                            <th>Malzeme</th>
                                            <th>Teklifler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parseResult.data.slice(0, 10).map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.satir_no}</td>
                                                <td>{item.adet}</td>
                                                <td className="parca-kodu">{item.parca_kodu}</td>
                                                <td>{item.malzeme_kesiti}</td>
                                                <td>{item.uzunluk}</td>
                                                <td>{item.malzeme_cinsi}</td>
                                                <td>
                                                    <div className="teklifler">
                                                        {item.firmalar.map((firma, fIndex) => (
                                                            <span key={fIndex} className="teklif-item">
                                                                {firma.firma_adi}: {firma.teklif_fiyati} ₺
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="preview-actions">
                            <button 
                                onClick={handleNewImport}
                                className="btn btn-secondary"
                            >
                                ← Geri Dön
                            </button>
                            <button 
                                onClick={handleSaveTeklifler}
                                disabled={loading}
                                className="btn btn-success"
                            >
                                {loading ? '⏳ Kaydediliyor...' : '💾 Teklifleri Kaydet'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Results */}
                {step === 3 && importResult && (
                    <div className="results-section">
                        <h3>✅ Import Sonuçları</h3>
                        
                        <div className="results-summary">
                            <div className="result-card success">
                                <h4>✅ Başarılı Kayıtlar</h4>
                                <p className="result-count">{importResult.results.basarili.length}</p>
                            </div>
                            <div className="result-card error">
                                <h4>❌ Başarısız Kayıtlar</h4>
                                <p className="result-count">{importResult.results.basarisiz.length}</p>
                            </div>
                            <div className="result-card total">
                                <h4>📊 Toplam</h4>
                                <p className="result-count">{importResult.results.toplam}</p>
                            </div>
                        </div>

                        {importResult.results.basarili.length > 0 && (
                            <div className="success-details">
                                <h4>✅ Başarıyla Kaydedilen Teklifler:</h4>
                                <div className="results-table-container">
                                    <table className="results-table">
                                        <thead>
                                            <tr>
                                                <th>Satır</th>
                                                <th>Parça Kodu</th>
                                                <th>Firma</th>
                                                <th>Fiyat</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {importResult.results.basarili.slice(0, 20).map((item, index) => (
                                                <tr key={index}>
                                                    <td>{item.satir_no}</td>
                                                    <td>{item.parca_kodu}</td>
                                                    <td>{item.firma_adi}</td>
                                                    <td>{item.teklif_fiyati} ₺</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {importResult.results.basarili.length > 20 && (
                                    <p className="more-info">... ve {importResult.results.basarili.length - 20} kayıt daha</p>
                                )}
                            </div>
                        )}

                        {importResult.results.basarisiz.length > 0 && (
                            <div className="error-details">
                                <h4>❌ Başarısız Kayıtlar:</h4>
                                <div className="results-table-container">
                                    <table className="results-table error-table">
                                        <thead>
                                            <tr>
                                                <th>Satır</th>
                                                <th>Parça Kodu</th>
                                                <th>Firma</th>
                                                <th>Hata</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {importResult.results.basarisiz.map((item, index) => (
                                                <tr key={index}>
                                                    <td>{item.satir_no}</td>
                                                    <td>{item.parca_kodu}</td>
                                                    <td>{item.firma_adi}</td>
                                                    <td className="error-message">{item.hata}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="results-actions">
                            <button 
                                onClick={handleNewImport}
                                className="btn btn-primary"
                            >
                                🔄 Yeni Import
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeklifExcelImport;
