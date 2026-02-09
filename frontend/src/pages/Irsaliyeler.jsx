import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Visibility as ViewIcon, Upload as UploadIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

function Irsaliyeler() {
  const navigate = useNavigate();
  const location = useLocation();
  const [irsaliyeler, setIrsaliyeler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState({
    durum: '',
    tur: '',
    firma: ''
  });
  const [detayDialogOpen, setDetayDialogOpen] = useState(false);
  const [seciliIrsaliye, setSeciliIrsaliye] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    irsaliyeleriYukle();

    // Eğer navigation state'inden openUploadDialog bilgisi geldiyse dialog'u aç
    if (location.state?.openUploadDialog) {
      setUploadDialogOpen(true);
      console.log('İrsaliye Yükle dialog otomatik açılıyor...', location.state);
    }
  }, [filtre, location]);

  const irsaliyeleriYukle = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtre.durum) params.append('durum', filtre.durum);
      if (filtre.tur) params.append('tur', filtre.tur);

      const response = await api.get(`/irsaliyeler?${params.toString()}`);
      // Backend yanıtı: { success: true, data: [], pagination: {} }
      const data = response.data?.data || [];
      setIrsaliyeler(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('İrsaliyeler yüklenirken hata:', error);
      setIrsaliyeler([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDetayGor = (irsaliye) => {
    setSeciliIrsaliye(irsaliye);
    setDetayDialogOpen(true);
  };

  const handleYeniIrsaliye = () => {
    navigate('/irsaliyeler/yeni');
  };

  const handleDuzenle = (irsaliye) => {
    navigate(`/irsaliyeler/${irsaliye.id}/duzenle`);
  };

  const getDurumColor = (durum) => {
    switch (durum) {
      case 'tamamlandi': return 'success';
      case 'beklemede': return 'warning';
      case 'iptal': return 'error';
      default: return 'default';
    }
  };

  const getTurLabel = (tur) => {
    return tur === 'satis' ? 'Satış' : 'Alış';
  };

  const handleIrsaliyeYukle = () => {
    setUploadDialogOpen(true);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // PDF veya resim formatı kontrolü
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        alert('Lütfen PDF veya resim dosyası seçin (JPG, PNG)');
        return;
      }
      // Maksimum dosya boyutu kontrolü (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Dosya boyutu 10MB\'dan küçük olmalıdır');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadConfirm = async () => {
    if (!selectedFile) {
      alert('Lütfen bir dosya seçin');
      return;
    }

    setUploading(true);
    try {
      // Dosyayı Base64'e çevir
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result;

        // DEBUG: Log image info before sending
        console.log('[DEBUG FRONTEND] Sending image:', {
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.type,
          base64Length: base64Data.length,
          base64Prefix: base64Data.substring(0, 50) + '...'
        });

        // Yeni Hibrit Analiz V2 API
        const apiUrl = '/api/irsaliyeler/analiz/v2';

        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: base64Data,
              strategy: 'ai_based', // Use Gemini API directly for better accuracy (rule_based, ai_based, hybrid)
              force_ai: true, // Force AI analysis, skip rule-based fallback
              context: {
                language: 'tr',
                documentType: 'irsaliye'
              }
            }),
          });

          const responseText = await response.text();

          if (!response.ok) {
            console.error('Analiz hatası - Status:', response.status, 'Body:', responseText);
            throw new Error(`Sunucu hatası: ${response.status} ${response.statusText}`);
          }

          let result;
          try {
            result = JSON.parse(responseText);
          } catch (parseError) {
            console.error('JSON parse hatası:', parseError, 'Response:', responseText);
            throw new Error('Geçersiz yanıt formatı.');
          }

          console.log('Analiz yanıtı:', result);

          if (result.success && result.data) {
            setUploadDialogOpen(false);
            setSelectedFile(null);

            if (location.state?.openUploadDialog) {
              navigate(location.pathname, { replace: true });
            }

            alert('İrsaliye başarıyla analiz edildi! Form sayfasına yönlendiriliyorsunuz...');

            // Response formatını IrsaliyeForm'a uygun formata çevir
            // Helper function to extract value from potentially nested objects
            const extractValue = (val) => {
              if (val === null || val === undefined) return null;
              if (typeof val === 'object' && val !== null) {
                // Try to get .value property first
                if (val.value !== undefined) {
                  return val.value;
                }
                // If no .value property, check if it's a plain object and try to extract first string value
                const keys = Object.keys(val);
                for (const key of keys) {
                  if (key !== 'confidence' && typeof val[key] === 'string' && val[key]) {
                    return val[key];
                  }
                }
                // Last resort: return string representation
                return String(val);
              }
              return val;
            };

            const formData = {
              irsaliye_no: extractValue(result.data.irsaliyeNo) || `IRS-${Date.now()}`,
              tedarikci_adi: extractValue(result.data.tedarikci) || null,
              belge_tarih: extractValue(result.data.tarih) || new Date().toISOString().split('T')[0],
              tur: 'satis',
              kalemler: result.data.kalemler?.map(k => ({
                mal_hizmet_adi: extractValue(k.malHizmetAdi) || extractValue(k.mal_hizmet_adi) || '',
                stok_kodu: extractValue(k.stokKodu) || extractValue(k.stok_kodu) || '',
                miktar: extractValue(k.miktar) || 0,
                birim: extractValue(k.birim) || 'Adet',
                aciklama: extractValue(k.aciklama) || ''
              })) || []
            };

            navigate('/irsaliyeler/yeni', {
              state: {
                extractedData: formData,
                irsaliyeImage: base64Data
              }
            });
          } else {
            const errorMessage = result.error || result.message || 'Bilinmeyen hata';
            console.error('Analiz hata yanıtı:', result);
            throw new Error(`Analiz hatası: ${errorMessage}`);
          }
        } catch (error) {
          console.error('Analiz hatası:', error);

          let hataMesaji = 'Dosya analiz edilirken bir hata oluştu.\n\n';
          hataMesaji += `Detay: ${error.message}`;

          alert(hataMesaji);
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Dosya okuma hatası:', error);
      alert('Dosya okunurken bir hata oluştu');
      setUploading(false);
    }
  };

  const handleUploadCancel = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);

    // Navigation state'ini temizle
    if (location.state?.openUploadDialog) {
      navigate(location.pathname, { replace: true });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          İrsaliyeler
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={handleIrsaliyeYukle}
            color="primary"
          >
            İrsaliye Yükle
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleYeniIrsaliye}
          >
            Yeni İrsaliye
          </Button>
        </Box>
      </Box>

      {/* Filtre Paneli */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            select
            label="Durum"
            value={filtre.durum}
            onChange={(e) => setFiltre({ ...filtre, durum: e.target.value })}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Tümü</MenuItem>
            <MenuItem value="taslak">Taslak</MenuItem>
            <MenuItem value="beklemede">Beklemede</MenuItem>
            <MenuItem value="tamamlandi">Tamamlandı</MenuItem>
            <MenuItem value="iptal">İptal</MenuItem>
          </TextField>

          <TextField
            select
            label="Tür"
            value={filtre.tur}
            onChange={(e) => setFiltre({ ...filtre, tur: e.target.value })}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">Tümü</MenuItem>
            <MenuItem value="satis">Satış</MenuItem>
            <MenuItem value="alis">Alış</MenuItem>
          </TextField>
        </Box>
      </Paper>

      {/* İrsaliyeler Tablosu */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>İrsaliye No</TableCell>
              <TableCell>Tarih</TableCell>
              <TableCell>Firma</TableCell>
              <TableCell>Tür</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell>Kalem Sayısı</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {irsaliyeler.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body1" sx={{ py: 3 }}>
                    İrsaliye bulunmamaktadır.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              irsaliyeler.map((irsaliye) => (
                <TableRow key={irsaliye.id} hover>
                  <TableCell>{irsaliye.irsaliyeNo}</TableCell>
                  <TableCell>
                    {new Date(irsaliye.irsaliyeTarihi).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell>{irsaliye.firmaAdi}</TableCell>
                  <TableCell>{getTurLabel(irsaliye.tur)}</TableCell>
                  <TableCell>
                    <Chip label={irsaliye.durum} color={getDurumColor(irsaliye.durum)} size="small" />
                  </TableCell>
                  <TableCell>{irsaliye.kalemSayisi || 0}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleDetayGor(irsaliye)}
                      title="Detay"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDuzenle(irsaliye)}
                      title="Düzenle"
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Detay Dialog */}
      <Dialog
        open={detayDialogOpen}
        onClose={() => setDetayDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>İrsaliye Detayı</DialogTitle>
        <DialogContent>
          {seciliIrsaliye && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                <strong>İrsaliye No:</strong> {seciliIrsaliye.irsaliyeNo}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Tarih:</strong> {new Date(seciliIrsaliye.irsaliyeTarihi).toLocaleDateString('tr-TR')}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Firma:</strong> {seciliIrsaliye.firmaAdi}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Tür:</strong> {getTurLabel(seciliIrsaliye.tur)}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Durum:</strong> {seciliIrsaliye.durum}
              </Typography>
              {seciliIrsaliye.aciklama && (
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Açıklama:</strong> {seciliIrsaliye.aciklama}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetayDialogOpen(false)}>Kapat</Button>
          {seciliIrsaliye && (
            <Button
              variant="contained"
              onClick={() => {
                setDetayDialogOpen(false);
                handleDuzenle(seciliIrsaliye);
              }}
            >
              Düzenle
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* İrsaliye Yükle Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={handleUploadCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>İrsaliye Yükle</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              PDF veya resim formatında irsaliye dosyasını yükleyin. Dosya AI ile analiz edilerek form otomatik doldurulacaktır.
            </Typography>

            <input
              accept="application/pdf,image/jpeg,image/jpg,image/png"
              style={{ display: 'none' }}
              id="irsaliye-file-input"
              type="file"
              onChange={handleFileSelect}
            />
            <label htmlFor="irsaliye-file-input">
              <Button
                variant="outlined"
                component="span"
                fullWidth
                sx={{ mt: 2 }}
              >
                Dosya Seç
              </Button>
            </label>

            {selectedFile && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Seçilen Dosya:
                </Typography>
                <Typography variant="body2">
                  <strong>{selectedFile.name}</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}
                </Typography>
              </Box>
            )}

            {uploading && (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2">Dosya yükleniyor ve analiz ediliyor...</Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleUploadCancel}
            disabled={uploading}
          >
            İptal
          </Button>
          <Button
            onClick={handleUploadConfirm}
            variant="contained"
            disabled={!selectedFile || uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
          >
            {uploading ? 'Yükleniyor...' : 'Yükle ve Analiz Et'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Irsaliyeler;
