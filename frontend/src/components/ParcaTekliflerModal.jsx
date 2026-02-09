import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Box,
  Typography,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  Paper
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import axios from 'axios';

/**
 * ParcaTekliflerModal
 *
 * Parçaya ait teklifleri görüntüler ve yönetir.
 *
 * @param {boolean} open - Modal açık/kapalı durumu
 * @param {function} onClose - Modal kapatma callback'i
 * @param {string} parcaKodu - Parça kodu
 * @param {string} parcaAdi - Parça adı (opsiyonel)
 */
export default function ParcaTekliflerModal({ open, onClose, parcaKodu, parcaAdi }) {
  const [teklifler, setTeklifler] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Yeni/düzenleme modal durumu
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTeklif, setSelectedTeklif] = useState(null);
  const [formData, setFormData] = useState({
    tedarikci: '',
    teklif_fiyati: '',
    teslim_suresi: '',
    aciklama: ''
  });
  const [formLoading, setFormLoading] = useState(false);

  // Doküman yükleme durumu
  const [activeStep, setActiveStep] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analyzedTeklifler, setAnalyzedTeklifler] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);

  // Parçaya ait teklifleri getir
  const fetchTeklifler = async () => {
    if (!parcaKodu) return;

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/fason/teklifler/parca/${encodeURIComponent(parcaKodu)}`);
      setTeklifler(response.data || []);
    } catch (err) {
      console.error('Teklifler yüklenirken hata:', err);
      setError('Teklifler yüklenirken bir hata oluştu.');
      setTeklifler([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && parcaKodu) {
      fetchTeklifler();
    }
  }, [open, parcaKodu]);

  // Yeni teklif modalını aç - seçim ekranı
  const handleAddNew = () => {
    setActiveStep(0); // Seçim ekranı
    setUploadedFiles([]);
    setAnalyzedTeklifler([]);
    setAnalyzeError(null);
    setEditModalOpen(true);
  };

  // Manuel giriş seçeneği
  const handleManualEntry = () => {
    setSelectedTeklif(null);
    setFormData({
      tedarikci: '',
      teklif_fiyati: '',
      teslim_suresi: '',
      aciklama: ''
    });
    setActiveStep(1); // Form doldurma adımı
  };

  // Doküman analizi seçeneği
  const handleDocumentAnalysis = () => {
    setActiveStep(2); // Doküman yükleme adımı
  };

  // Dosya yükleme handler
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);

    for (const file of files) {
      // Dosyayı base64'e çevir
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result.split(',')[1];
        setUploadedFiles(prev => [...prev, {
          name: file.name,
          base64Data: base64,
          mimeType: file.type
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  // Dokümanları analiz et
  const handleAnalyzeDocuments = async () => {
    if (uploadedFiles.length === 0) {
      setAnalyzeError('Lütfen en az bir doküman yükleyin');
      return;
    }

    setAnalyzing(true);
    setAnalyzeError(null);

    try {
      const response = await axios.post('/api/fason/teklifler/analyze-documents', {
        documents: uploadedFiles
      });

      if (response.data.success && response.data.teklifler) {
        setAnalyzedTeklifler(response.data.teklifler);
        setActiveStep(3); // Sonuçları görüntüleme adımı
      } else {
        setAnalyzeError('Analiz başarısız: ' + (response.data.message || 'Bilinmeyen hata'));
      }
    } catch (err) {
      console.error('Analiz hatası:', err);
      setAnalyzeError('Analiz sırasında hata oluştu: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  // Analiz edilen teklifleri kaydet
  const handleSaveAnalyzedTeklifler = async () => {
    try {
      setFormLoading(true);

      for (const teklif of analyzedTeklifler) {
        await axios.post('/api/fason/teklifler', {
          parca_kodu: parcaKodu,
          tedarikci: teklif.tedarikci,
          teklif_fiyati: Number(teklif.teklif_fiyati),
          teslim_suresi: Number(teklif.teslim_suresi),
          aciklama: teklif.aciklama || ''
        });
      }

      // Modalı kapat ve listeyi yenile
      setEditModalOpen(false);
      setActiveStep(0);
      setUploadedFiles([]);
      setAnalyzedTeklifler([]);
      fetchTeklifler();
    } catch (err) {
      console.error('Teklifler kaydedilirken hata:', err);
      setAnalyzeError('Teklifler kaydedilirken hata oluştu');
    } finally {
      setFormLoading(false);
    }
  };

  // Teklif düzenleme modalını aç
  const handleEdit = (teklif) => {
    setSelectedTeklif(teklif);
    setFormData({
      tedarikci: teklif.tedarikci,
      teklif_fiyati: teklif.teklif_fiyati,
      teslim_suresi: teklif.teslim_suresi,
      aciklama: teklif.aciklama || ''
    });
    setEditModalOpen(true);
  };

  // Teklif sil
  const handleDelete = async (teklifId) => {
    if (!window.confirm('Bu teklifi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await axios.delete(`/api/fason/teklifler/${teklifId}`);
      // Listeyi yenile
      fetchTeklifler();
    } catch (err) {
      console.error('Teklif silinirken hata:', err);
      setError('Teklif silinirken bir hata oluştu.');
    }
  };

  // Teklif kaydet/güncelle
  const handleSave = async () => {
    try {
      setFormLoading(true);

      const teklifData = {
        parca_kodu: parcaKodu,
        tedarikci: formData.tedarikci,
        teklif_fiyati: Number(formData.teklif_fiyati),
        teslim_suresi: Number(formData.teslim_suresi),
        aciklama: formData.aciklama || ''
      };

      if (selectedTeklif) {
        // Güncelleme
        await axios.put(`/api/fason/teklifler/${selectedTeklif.teklif_id}`, teklifData);
      } else {
        // Yeni kayıt
        await axios.post('/api/fason/teklifler', teklifData);
      }

      // Modalı kapat ve listeyi yenile
      setEditModalOpen(false);
      fetchTeklifler();
      setError(null);
    } catch (err) {
      console.error('Teklif kaydedilirken hata:', err);
      setError('Teklif kaydedilirken bir hata oluştu: ' + (err.response?.data?.message || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  // Durum rengi helper
  const getDurumColor = (durum) => {
    switch (durum) {
      case 'aktif': return 'info';
      case 'kabul_edildi': return 'success';
      case 'reddedildi': return 'error';
      default: return 'default';
    }
  };

  // Durum label helper
  const getDurumLabel = (durum) => {
    switch (durum) {
      case 'aktif': return 'Aktif';
      case 'kabul_edildi': return 'Kabul Edildi';
      case 'reddedildi': return 'Reddedildi';
      default: return durum;
    }
  };

  // Tarih formatla
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '80vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <MonetizationOnIcon color="success" />
              <Box>
                <Typography>
                  {parcaKodu} Parçanın Teklifleri
                </Typography>
                {parcaAdi && (
                  <Typography variant="body2" color="text.secondary">
                    {parcaAdi}
                  </Typography>
                )}
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddNew}
              color="success"
            >
              Yeni Teklif
            </Button>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {error && (
            <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
              <CircularProgress />
            </Box>
          ) : teklifler.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 5 }}>
              <MonetizationOnIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Bu parça için henüz teklif bulunmuyor.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                "Yeni Teklif" butonuna tıklayarak teklif ekleyebilirsiniz.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Tedarikçi</TableCell>
                    <TableCell align="right">Teklif Fiyatı</TableCell>
                    <TableCell align="center">Teslim Süresi</TableCell>
                    <TableCell>Teklif Tarihi</TableCell>
                    <TableCell>Durumu</TableCell>
                    <TableCell>Açıklama</TableCell>
                    <TableCell align="right">İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teklifler.map((teklif) => (
                    <TableRow key={teklif.teklif_id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {teklif.tedarikci}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          {Number(teklif.teklif_fiyati).toFixed(2)} ₺
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {teklif.teslim_suresi} gün
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(teklif.teklif_tarihi)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getDurumLabel(teklif.durumu)}
                          color={getDurumColor(teklif.durumu)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {teklif.aciklama || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(teklif)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(teklif.teklif_id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={onClose} variant="outlined">
            Kapat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Teklif Ekle/Düzenle Modal - Step Yapısı */}
      <Dialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '60vh' }
        }}
      >
        {/* Step 0: Seçim Ekranı */}
        {activeStep === 0 && (
          <>
            <DialogTitle>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesomeIcon color="primary" />
                Yeni Teklif Ekleme Yöntemi Seçin
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <Paper
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: 2,
                      borderColor: 'primary.main',
                      bgcolor: 'primary.50',
                      '&:hover': { bgcolor: 'primary.100' }
                    }}
                    onClick={handleManualEntry}
                  >
                    <EditIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Manuel Giriş
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Teklif bilgilerini elle girin
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: 2,
                      borderColor: 'success.main',
                      bgcolor: 'success.50',
                      '&:hover': { bgcolor: 'success.100' }
                    }}
                    onClick={handleDocumentAnalysis}
                  >
                    <UploadFileIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      📄 Doküman Analizi
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      AI ile teklif dokümanlarını analiz edin
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setEditModalOpen(false)} variant="outlined">
                İptal
              </Button>
            </DialogActions>
          </>
        )}

        {/* Step 1: Manuel Giriş Formu */}
        {activeStep === 1 && (
          <>
            <DialogTitle>
              {selectedTeklif ? 'Teklif Düzenle' : 'Manuel Teklif Girişi'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Parça Kodu"
                    value={parcaKodu}
                    disabled
                    variant="filled"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tedarikçi"
                    value={formData.tedarikci}
                    onChange={(e) => setFormData({ ...formData, tedarikci: e.target.value })}
                    required
                    autoFocus
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Teklif Fiyatı (₺)"
                    type="number"
                    value={formData.teklif_fiyati}
                    onChange={(e) => setFormData({ ...formData, teklif_fiyati: e.target.value })}
                    required
                    inputProps={{ min: 0, step: "0.01" }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₺</InputAdornment>
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Teslim Süresi (gün)"
                    type="number"
                    value={formData.teslim_suresi}
                    onChange={(e) => setFormData({ ...formData, teslim_suresi: e.target.value })}
                    required
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Açıklama"
                    multiline
                    rows={3}
                    value={formData.aciklama}
                    onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                    placeholder="Teklif hakkında açıklama..."
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 0 }}>
              <Button onClick={() => setActiveStep(0)} variant="outlined">
                ← Geri
              </Button>
              <Button
                onClick={handleSave}
                variant="contained"
                disabled={formLoading || !formData.tedarikci || !formData.teklif_fiyati || !formData.teslim_suresi}
              >
                {formLoading ? <CircularProgress size={20} /> : (selectedTeklif ? 'Güncelle' : 'Kaydet')}
              </Button>
            </DialogActions>
          </>
        )}

        {/* Step 2: Doküman Yükleme */}
        {activeStep === 2 && (
          <>
            <DialogTitle>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <UploadFileIcon color="success" />
                Teklif Dokümanlarını Yükleyin
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 3 }}>
                <input
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                  id="teklif-dokuman-upload"
                  multiple
                  type="file"
                  onChange={handleFileUpload}
                />
                <label htmlFor="teklif-dokuman-upload">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<UploadFileIcon />}
                    fullWidth
                    sx={{ py: 2, mb: 2 }}
                  >
                    Doküman Seç (PDF, JPEG, PNG)
                  </Button>
                </label>

                {uploadedFiles.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Yüklenen Dokümanlar:
                    </Typography>
                    {uploadedFiles.map((file, index) => (
                      <Paper key={index} sx={{ p: 2, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={file.name} size="small" />
                        <Typography variant="caption" color="text.secondary">
                          {(file.base64Data.length * 0.75 / 1024).toFixed(2)} KB
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                )}

                {analyzeError && (
                  <Alert severity="error" sx={{ mt: 2 }} onClose={() => setAnalyzeError(null)}>
                    {analyzeError}
                  </Alert>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 0 }}>
              <Button onClick={() => setActiveStep(0)} variant="outlined" disabled={analyzing}>
                ← Geri
              </Button>
              <Button
                onClick={handleAnalyzeDocuments}
                variant="contained"
                color="success"
                disabled={uploadedFiles.length === 0 || analyzing}
                startIcon={analyzing ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
              >
                {analyzing ? 'Analiz Ediliyor...' : 'Analiz Et'}
              </Button>
            </DialogActions>
          </>
        )}

        {/* Step 3: Analiz Sonuçları */}
        {activeStep === 3 && (
          <>
            <DialogTitle>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesomeIcon color="success" />
                Tespit Edilen Teklifler
              </Typography>
            </DialogTitle>
            <DialogContent>
              {analyzedTeklifler.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Tedarikçi</TableCell>
                        <TableCell align="right">Teklif Fiyatı</TableCell>
                        <TableCell align="center">Teslim Süresi</TableCell>
                        <TableCell>Açıklama</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analyzedTeklifler.map((teklif, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              value={teklif.tedarikci}
                              onChange={(e) => {
                                const updated = [...analyzedTeklifler];
                                updated[index].tedarikci = e.target.value;
                                setAnalyzedTeklifler(updated);
                              }}
                              variant="standard"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              value={teklif.teklif_fiyati}
                              onChange={(e) => {
                                const updated = [...analyzedTeklifler];
                                updated[index].teklif_fiyati = e.target.value;
                                setAnalyzedTeklifler(updated);
                              }}
                              variant="standard"
                              InputProps={{
                                startAdornment: <InputAdornment position="start">₺</InputAdornment>
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              value={teklif.teslim_suresi}
                              onChange={(e) => {
                                const updated = [...analyzedTeklifler];
                                updated[index].teslim_suresi = e.target.value;
                                setAnalyzedTeklifler(updated);
                              }}
                              variant="standard"
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              value={teklif.aciklama || ''}
                              onChange={(e) => {
                                const updated = [...analyzedTeklifler];
                                updated[index].aciklama = e.target.value;
                                setAnalyzedTeklifler(updated);
                              }}
                              variant="standard"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Hiç teklif tespit edilemedi. Lütfen dokümanları kontrol edin veya manuel giriş yapın.
                </Alert>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 0 }}>
              <Button onClick={() => setActiveStep(2)} variant="outlined" disabled={formLoading}>
                ← Geri
              </Button>
              <Button onClick={handleSaveAnalyzedTeklifler} variant="contained" color="success" disabled={analyzedTeklifler.length === 0 || formLoading}>
                {formLoading ? <CircularProgress size={20} /> : `${analyzedTeklifler.length} Teklifi Kaydet`}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}
