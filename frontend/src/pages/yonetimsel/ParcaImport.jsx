import React, { useState, useRef, useEffect } from 'react';
import { 
  Button, Typography, Box, Snackbar, Alert, Card, CardContent, CardMedia, 
  Grid, CircularProgress, Stack, Divider, TextField, InputAdornment,
  FormControlLabel, Switch, FormGroup, Paper, Link 
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import { apiClient } from '../../utils';
import { useNavigate } from 'react-router-dom';


function ParcaImport() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [images, setImages] = useState({});
  const navigate = useNavigate();
  
  // Grup oluşturma kaldırıldı
  
  // ApiClient'in hazır olup olmadığını takip et
  useEffect(() => {
    // Backend port keşfi
    const discoverBackend = async () => {
      try {
        await apiClient.initialize();
        console.log("Backend portu tespit edildi:", apiClient.getPort());
      } catch (error) {
        console.error("Backend port keşfi başarısız:", error);
        showMessage("Sunucu bağlantısı kurulurken bir hata oluştu. Lütfen sayfayı yenileyin.", "error");
      }
    };
    
    discoverBackend();
  }, []);

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const showMessage = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };


  // Sadece Excel dosyası yükle
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Excel dosyası kontrolü
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (!isExcel) {
      showMessage('Lütfen geçerli bir Excel dosyası (.xlsx veya .xls) yükleyin', 'error');
      return;
    }
    
    setLoading(true);
    try {
      console.log("Excel yükleniyor:", file.name, file.size);
      
      const formData = new FormData();
      formData.append('excel', file);
      
      // API istemcisiyle formdatayı gönder
      const response = await fetch('/api/parcalar/import-excel', {
        method: 'POST',
        body: formData,
      });
      
      console.log("Sunucu yanıtı:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Yanıt metni alınamadı');
        console.error("Hata yanıtı:", errorText);
        throw new Error(`Sunucu hatası: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      setRows(data.parcalar || []);
      showMessage(`${(data.parcalar || []).length} parça başarıyla içe aktarıldı`, 'success');
    } catch (error) {
      console.error("Excel yükleme hatası:", error);
      showMessage('Excel yüklenirken hata: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (rowId, parcaKodu, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const newName = generateImageFileName(parcaKodu, file.name);
      setImages((prev) => ({
        ...prev,
        [rowId]: { file, name: newName, preview: URL.createObjectURL(file) }
      }));
      showMessage(`"${parcaKodu}" parçası için resim yüklendi`, 'success');
    } catch (error) {
      console.error('Resim yüklenirken hata:', error);
      showMessage('Resim yüklenirken bir hata oluştu', 'error');
    }
  };

  const handleBulkImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      const newImages = { ...images };
      let matchCount = 0;
      
      files.forEach(file => {
        const fileName = file.name.toLowerCase();
        
        rows.forEach(row => {
          const parcaKodu = row['parça adı']?.toString().toLowerCase() || '';
          if (parcaKodu && fileName.includes(parcaKodu)) {
            const newName = generateImageFileName(row['parça adı'], file.name);
            newImages[row.id] = { 
              file, 
              name: newName, 
              preview: URL.createObjectURL(file) 
            };
            matchCount++;
          }
        });
      });
      
      setImages(newImages);
      showMessage(`${matchCount} resim başarıyla eşleştirildi`, matchCount > 0 ? 'success' : 'warning');
    } catch (error) {
      console.error('Toplu resim yüklenirken hata:', error);
      showMessage('Toplu resim yüklenirken bir hata oluştu', 'error');
    }
  };

  // ZIP dosyasını işleyecek fonksiyon
  const handleZipUpload = async (e) => {
    const zipFile = e.target.files[0];
    if (!zipFile) return;

    setLoading(true);
    try {
      // Zip dosyasını oku
      const zip = new JSZip();
      const zipData = await zip.loadAsync(zipFile);
      
      let excelFile = null;
      const imageFiles = [];
      
      // Zip içindeki dosyaları incele
      for (const [filename, file] of Object.entries(zipData.files)) {
        if (file.dir) continue; // Klasörleri atla
        
        const lowerName = filename.toLowerCase();
        // Excel dosyasını bul
        if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
          const content = await file.async('arraybuffer');
          excelFile = { name: filename, content };
        } 
        // Resim dosyalarını bul
        else if (
          lowerName.endsWith('.jpg') || 
          lowerName.endsWith('.jpeg') || 
          lowerName.endsWith('.png') || 
          lowerName.endsWith('.gif')
        ) {
          const content = await file.async('blob');
          imageFiles.push({ 
            name: filename, 
            file: new File([content], filename, { type: content.type }) 
          });
        }
      }
      
      // Excel dosyası yoksa hata ver
      if (!excelFile) {
        showMessage('ZIP dosyasında Excel dosyası bulunamadı!', 'error');
        setLoading(false);
        return;
      }
      
      // Excel dosyasını işle
      const wb = XLSX.read(excelFile.content, { type: 'array' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      if (data.length > 0) {
        setColumns(['adet', 'parça adı', 'malzeme', 'foto']);
        
        const newRows = data.slice(1)
          .filter((row) => Array.isArray(row) && row.some((cell) => cell !== undefined && cell !== null && cell !== ''))
          .map((row, idx) => {
            return {
              id: idx,
              'adet': row[0] !== undefined ? row[0] : '',
              'parça adı': row[1] !== undefined ? row[1] : '',
              'malzeme': row[2] !== undefined ? row[2] : '',
              'foto': row[3] !== undefined ? row[3] : ''
            };
          });
        
        setRows(newRows);
        
        // Resim eşleştirme
        const newImages = {};
        let matchCount = 0;
        
        // Excel'de belirtilen foto sütunundaki dosya adlarına göre eşleştir
        newRows.forEach(row => {
          if (!row['foto']) return;
          
          // Tam dosya adı eşleşmesi
          const exactMatch = imageFiles.find(img => 
            img.name.toLowerCase() === row['foto'].toString().toLowerCase() ||
            img.name.toLowerCase().includes(row['foto'].toString().toLowerCase())
          );
          
          if (exactMatch) {
            const newName = generateImageFileName(row['parça adı'], exactMatch.name);
            newImages[row.id] = {
              file: exactMatch.file,
              name: newName,
              preview: URL.createObjectURL(exactMatch.file)
            };
            matchCount++;
          } else {
            // Parça adına göre eşleştir
            const nameMatch = imageFiles.find(img => 
              img.name.toLowerCase().includes(row['parça adı'].toString().toLowerCase())
            );
            
            if (nameMatch) {
              const newName = generateImageFileName(row['parça adı'], nameMatch.name);
              newImages[row.id] = {
                file: nameMatch.file,
                name: newName,
                preview: URL.createObjectURL(nameMatch.file)
              };
              matchCount++;
            }
          }
        });
        
        setImages(newImages);
        showMessage(
          `${newRows.length} parça verisi ve ${matchCount} resim dosyası içe aktarıldı.`, 
          'success'
        );
      } else {
        showMessage('Excel dosyasında veri bulunamadı', 'warning');
      }
    } catch (error) {
      console.error('ZIP dosyası işlenirken hata:', error);
      showMessage('ZIP dosyası işlenirken bir hata oluştu: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Excel şablonu oluştur
  const generateExcelTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['adet', 'parça adı', 'malzeme', 'foto'],
      [10, 'Parça-001', 'Çelik', 'parca001.jpg'],
      [5, 'Parça-002', 'Alüminyum', 'parca002.jpg'],
      [2, 'Parça-003', 'Plastik', 'parca003.jpg'],
    ]);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Parçalar');
    
    // Excel dosyasını indirme
    XLSX.writeFile(wb, 'parca_import_sablonu.xlsx');
    
    showMessage('Excel şablonu indirildi', 'success');
  };

  // Örnek ZIP dosyası hazırla
  const generateZipExample = () => {
    window.open('https://example.com/parca_sablonu.zip');
    showMessage('Örnek ZIP dosyası indirme bağlantısı açıldı', 'info');
  };

  const handleSave = async () => {
    if (rows.length === 0) {
      showMessage('Kaydedilecek parça verisi bulunamadı', 'warning');
      return;
    }

    setLoading(true);
    
    try {
      // FormData objesi oluşturup resimleri ve verileri ekleyelim
      const formData = new FormData();
      
      // Satır verilerini JSON olarak formData'ya ekleyelim
      const rowsToSave = rows.map(row => {
        return {
          ...row,
          imageName: images[row.id] ? images[row.id].name : null,
        };
      });
      
      formData.append('data', JSON.stringify(rowsToSave));
      
      // Resimleri formData'ya ekleyelim
      Object.keys(images).forEach(rowId => {
        if (images[rowId] && images[rowId].file) {
          formData.append('images', images[rowId].file, images[rowId].name);
        }
      });
      
      // Backend API'sine gönderin
      const response = await fetch('/api/parcalar/import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Sunucu hatası: ${response.status}`);
      }
      
      const result = await response.json();
      showMessage(`${rowsToSave.length} parça başarıyla kaydedildi`, 'success');
      
      // Başarılı kayıttan sonra formu sıfırlayabiliriz
      // setRows([]);
      // setImages({});
    } catch (error) {
      console.error('Veri kaydedilirken hata:', error);
      showMessage('Veri kaydedilirken bir hata oluştu: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Excel'den içe aktarılan parçaları kaydet
  const saveParcalar = async () => {
    if (rows.length === 0) {
      showMessage('Kaydedilecek parça bulunamadı', 'warning');
      return;
    }
    
    // Grup oluşturma seçeneği aktif ama grup adı girilmemişse uyarı ver
    // Grup oluşturma kaldırıldı
    
    setLoading(true);
    try {
      // Backend'e parçaları gönder
      const response = await fetch('/api/parcalar/save-excel-parcalar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          parcalar: rows
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Yanıt metni alınamadı');
        throw new Error(`Sunucu hatası: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      
      // Başarı mesajı göster
      let successMessage = result.mesaj || `${rows.length} parça başarıyla kaydedildi`;
      showMessage(successMessage, 'success');
      // Başarılı kayıt sonrası form sıfırlanabilir
      setRows([]);
    } catch (error) {
      console.error('Parçalar kaydedilirken hata:', error);
      showMessage(`Parçalar kaydedilemedi: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // İptal et ve listeyi temizle
  const handleCancel = () => {
    if (rows.length > 0) {
      if (window.confirm('Excel verilerini iptal etmek istediğinize emin misiniz?')) {
        setRows([]);
        // Grup oluşturma kaldırıldı
        showMessage('Excel içe aktarma işlemi iptal edildi', 'info');
      }
    }
  };

  // Parça değerlerini güncelle
  const handleParcaChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index] = {
      ...updatedRows[index],
      [field]: value
    };
    setRows(updatedRows);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Parça İçe Aktarma (Excel'den)
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          component="label"
          disabled={loading}
        >
          Excel Dosyası Yükle
          <input
            type="file"
            accept=".xlsx,.xls"
            hidden
            onChange={handleExcelUpload}
          />
        </Button>
        {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
      </Box>
      
      {rows.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
          {/* Grup oluşturma seçeneği kaldırıldı */}
        </Paper>
      )}
      
      {rows.length > 0 && (
        <Grid container spacing={2}>
          {rows.map((row, idx) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
              <Card>
                {row.resim && (
                  <>
                    <CardMedia
                      component="img"
                      height="140"
                      image={`/importlar/${row.resim}`}
                      alt={row.parcaAdi}
                    />
                    <Typography variant="caption" color="textSecondary" sx={{ p: 1 }}>
                      Resim yolu: /importlar/{row.resim}
                    </Typography>
                  </>
                )}
                <CardContent>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Parça Adı"
                    variant="outlined"
                    size="small"
                    value={row.parcaAdi || ''}
                    onChange={(e) => handleParcaChange(idx, 'parcaAdi', e.target.value)}
                  />
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Adet"
                    variant="outlined"
                    size="small"
                    type="number"
                    value={row.adet || ''}
                    onChange={(e) => handleParcaChange(idx, 'adet', e.target.value)}
                    InputProps={{
                      inputProps: { min: 0 }
                    }}
                  />
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Malzeme"
                    variant="outlined"
                    size="small"
                    value={row.malzeme || ''}
                    onChange={(e) => handleParcaChange(idx, 'malzeme', e.target.value)}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {rows.length > 0 && (
        <Box mt={4} p={2} borderTop={1} borderColor="divider">
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={saveParcalar}
              disabled={loading}
              size="large"
            >
              Parçaları Kaydet
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={loading}
              size="large"
            >
              İptal Et
            </Button>
          </Stack>
        </Box>
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ParcaImport;