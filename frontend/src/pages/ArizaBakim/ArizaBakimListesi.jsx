import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Container,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Breadcrumbs,
  Link as MuiLink,
  CircularProgress
} from '@mui/material';
import { Add, Edit, Delete, Refresh, FilterList, Home, Check, BuildRounded, ErrorOutline, FileDownload } from '@mui/icons-material';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

import { 
  fetchArizaBakimKayitlari, 
  deleteArizaBakim, 
  clearError, 
  clearSuccess 
} from '../../store/slices/arizaBakimSlice';

// tezgahAPI import edildi
import { tezgahAPI } from '../../services/api';

const ArizaBakimListesi = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation(); // Location hook'u eklendi
  const { kayitlar, loading, error, success } = useSelector(state => state.arizaBakim);
  
  // URL'den veya state'den gelen tezgah_id'yi al
  const initialTezgahId = location.state?.tezgah_id || '';
  const [selectedTezgah, setSelectedTezgah] = useState(null);
  
  const [filters, setFilters] = useState({
    kayit_tipi: '',
    tezgah_id: initialTezgahId,
    durum: '',
    baslangic_tarihi: '',
    bitis_tarihi: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedKayitId, setSelectedKayitId] = useState(null);
  const [tezgahlar, setTezgahlar] = useState([]); // Tezgah listesi için state
  
  // Yeni state tanımları
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [finishLoading, setFinishLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [finishFormData, setFinishFormData] = useState({
    yapilan_islemler: '',
    sonuc: '',
    maliyet: '',
    bitis_tarihi: new Date().toISOString().slice(0, 16)
  });
  const [finishFormErrors, setFinishFormErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Tezgah listesini getir
  useEffect(() => {
    const fetchTezgahlar = async () => {
      try {
        const response = await axios.get('/api/tezgahlar');
        let tezgahlarData = [];
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          tezgahlarData = response.data.data;
        } else if (Array.isArray(response.data)) {
          tezgahlarData = response.data;
        }
        setTezgahlar(tezgahlarData);

        // Eğer bir tezgah_id varsa, o tezgahın bilgilerini bul
        if (initialTezgahId) {
          const tezgah = tezgahlarData.find(t => t.tezgah_id === parseInt(initialTezgahId));
          setSelectedTezgah(tezgah);
        }
      } catch (error) {
        console.error('Tezgah listesi alınırken hata oluştu:', error);
      }
    };
    
    fetchTezgahlar();
  }, [initialTezgahId]);
  
  // Sayfa yüklendiğinde veya filtreler değiştiğinde kayıtları getir
  useEffect(() => {
    dispatch(fetchArizaBakimKayitlari(filters));
    
    return () => {
      dispatch(clearError());
      dispatch(clearSuccess());
    };
  }, [dispatch, filters.tezgah_id]); // tezgah_id değişince otomatik filtrele
  
  // Başarı veya hata mesajı görüntülendikten sonra temizle
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        dispatch(clearSuccess());
        dispatch(clearError());
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [success, error, dispatch]);
  
  // Filtreleri uygula
  const applyFilters = () => {
    dispatch(fetchArizaBakimKayitlari(filters));
  };
  
  // Filtreleri temizle
  const clearFilters = () => {
    setFilters({
      kayit_tipi: '',
      tezgah_id: '',
      durum: '',
      baslangic_tarihi: '',
      bitis_tarihi: ''
    });
    dispatch(fetchArizaBakimKayitlari({}));
  };
  
  // Yeni kayıt ekleme sayfasına git
  const handleAddNew = () => {
    navigate('/ariza-bakim/ekle');
  };
  
  // Kayıt detay sayfasına git
  const handleEdit = (id) => {
    navigate(`/ariza-bakim/${id}`);
  };
  
  // Silme dialog'unu aç
  const handleDeleteClick = (id) => {
    setSelectedKayitId(id);
    setDeleteDialogOpen(true);
  };
  
  // Kayıt silme işlemi
  const confirmDelete = () => {
    if (selectedKayitId) {
      dispatch(deleteArizaBakim(selectedKayitId));
      setDeleteDialogOpen(false);
    }
  };
  
  // Tarih formatlama fonksiyonu
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'd MMMM yyyy HH:mm', { locale: tr });
  };
  
  // Durum chip'i rengi
  const getStatusChipColor = (durum) => {
    return durum === 'devam_ediyor' ? 'warning' : 'success';
  };
  
  // Kayıt tipi chip'i rengi
  const getTypeChipColor = (kayitTipi) => {
    return kayitTipi === 'ariza' ? 'error' : 'info';
  };

  // Arıza/Bakım sonlandırma formunu aç
  const handleFinishOpen = (kayit) => {
    setSelectedRecord(kayit);
    setFinishFormData({
      yapilan_islemler: '',
      sonuc: '',
      maliyet: '',
      bitis_tarihi: new Date().toISOString().slice(0, 16)
    });
    setFinishDialogOpen(true);
  };

  // Arıza-Bakım Bitir form değişiklikleri
  const handleFinishFormChange = (e) => {
    const { name, value } = e.target;
    setFinishFormData({
      ...finishFormData,
      [name]: value
    });
    
    // Hata mesajını temizle
    if (finishFormErrors[name]) {
      setFinishFormErrors({
        ...finishFormErrors,
        [name]: null
      });
    }
  };

  // Form doğrulama
  const validateFinishForm = () => {
    const errors = {};
    
    if (!finishFormData.yapilan_islemler) {
      errors.yapilan_islemler = 'Yapılan işlemleri belirtmeniz zorunludur';
    }
    
    if (!finishFormData.sonuc) {
      errors.sonuc = 'Sonuç bilgisini belirtmeniz zorunludur';
    }
    
    setFinishFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Arıza/Bakım sonlandırma işlemi
  const handleFinishSubmit = async () => {
    if (!validateFinishForm()) {
      return;
    }
    
    try {
      setFinishLoading(true);
      
      // Maliyet alanı sayıya dönüştürülüyor
      const maliyetValue = finishFormData.maliyet !== '' ? parseFloat(finishFormData.maliyet) : null;
      
      // Tezgah API'sine arıza/bakımı sonlandırma isteği gönder
      await tezgahAPI.endArizaBakim(
        selectedRecord.tezgah_id, 
        selectedRecord.id, 
        finishFormData.yapilan_islemler + "\nSonuç: " + finishFormData.sonuc, 
        maliyetValue
      );
      
      // Dialog'u kapat
      setFinishDialogOpen(false);
      
      // Başarı mesajı göster
      setSnackbar({
        open: true,
        message: `${selectedRecord.kayit_tipi === 'ariza' ? 'Arıza' : 'Bakım'} kaydı başarıyla sonlandırıldı`,
        severity: 'success'
      });
      
      // Listeyi yenile
      dispatch(fetchArizaBakimKayitlari(filters));
      
    } catch (error) {
      console.error('Arıza/Bakım sonlandırma hatası:', error);
      setFinishFormErrors({ 
        submit: error.response?.data?.error || 'Arıza/Bakım sonlandırma işlemi başarısız oldu'
      });
    } finally {
      setFinishLoading(false);
    }
  };

  // Excel'e aktarma fonksiyonu
  const handleExportExcel = () => {
    // Excel için veriyi hazırla
    const dataToExport = kayitlar.map(kayit => ({
      'ID': kayit.id,
      'Tezgah': kayit.tezgah?.tezgah_tanimi || `#${kayit.tezgah_id}`,
      'Tip': kayit.kayit_tipi === 'ariza' ? 'Arıza' : 'Bakım',
      'Başlangıç Tarihi': formatDate(kayit.baslangic_tarihi),
      'Bitiş Tarihi': formatDate(kayit.bitis_tarihi),
      'Durum': kayit.durum === 'devam_ediyor' ? 'Devam Ediyor' : 'Tamamlandı',
      'Sorumlu': kayit.sorumlu || '-',
      'Açıklama': kayit.aciklama || '-',
      'Yapılan İşlemler': kayit.yapilan_islemler || '-',
      'Maliyet (TL)': kayit.maliyet ? kayit.maliyet.toFixed(2) : '-'
    }));

    // Excel çalışma kitabı ve sayfası oluştur
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ArizaBakimKayitlari');

    // Sütun genişliklerini ayarla
    const maxWidth = 50;
    worksheet['!cols'] = [
      { wch: 8 },  // ID
      { wch: 30 }, // Tezgah
      { wch: 15 }, // Tip
      { wch: 25 }, // Başlangıç Tarihi
      { wch: 25 }, // Bitiş Tarihi
      { wch: 15 }, // Durum
      { wch: 20 }, // Sorumlu
      { wch: maxWidth }, // Açıklama
      { wch: maxWidth }, // Yapılan İşlemler
      { wch: 15 }  // Maliyet
    ];

    // Excel dosyasını oluştur ve indir
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    
    // Dosya adını hazırla
    const today = new Date().toISOString().slice(0, 10);
    saveAs(data, `ArizaBakimKayitlari_${today}.xlsx`);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        {/* Breadcrumbs eklendi */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <MuiLink
            component="button"
            variant="body1"
            onClick={() => navigate('/')}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <Home sx={{ mr: 0.5 }} fontSize="inherit" />
            Ana Sayfa
          </MuiLink>
          <Typography color="text.primary">Arıza ve Bakım Kayıtları</Typography>
          {selectedTezgah && (
            <Typography color="text.primary">
              {selectedTezgah.tezgah_tanimi}
            </Typography>
          )}
        </Breadcrumbs>
        
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h4" gutterBottom>
              {selectedTezgah 
                ? `${selectedTezgah.tezgah_tanimi} - Arıza ve Bakım Kayıtları`
                : 'Arıza ve Bakım Kayıtları'}
            </Typography>
          </Grid>
          <Grid item>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined" 
                startIcon={<FilterList />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filtreler
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<Refresh />}
                onClick={() => dispatch(fetchArizaBakimKayitlari(filters))}
              >
                Yenile
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileDownload />}
                onClick={handleExportExcel}
                disabled={loading || kayitlar.length === 0}
              >
                Excel'e Aktar
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<Add />}
                onClick={handleAddNew}
              >
                Yeni Kayıt
              </Button>
            </Box>
          </Grid>
        </Grid>
        
        {/* Uyarı Mesajları */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </Box>
      
      {/* Filtre Alanı */}
      {showFilters && (
        <Card sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filtreler
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Tezgah</InputLabel>
                <Select
                  value={filters.tezgah_id}
                  onChange={(e) => setFilters({...filters, tezgah_id: e.target.value})}
                  label="Tezgah"
                >
                  <MenuItem value="">Tümü</MenuItem>
                  {Array.isArray(tezgahlar) && tezgahlar.map(tezgah => (
                    <MenuItem key={tezgah.tezgah_id} value={tezgah.tezgah_id}>
                      {tezgah.tezgah_tanimi}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Kayıt Tipi</InputLabel>
                <Select
                  value={filters.kayit_tipi}
                  onChange={(e) => setFilters({...filters, kayit_tipi: e.target.value})}
                  label="Kayıt Tipi"
                >
                  <MenuItem value="">Tümü</MenuItem>
                  <MenuItem value="ariza">Arıza</MenuItem>
                  <MenuItem value="bakim">Bakım</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Durum</InputLabel>
                <Select
                  value={filters.durum}
                  onChange={(e) => setFilters({...filters, durum: e.target.value})}
                  label="Durum"
                >
                  <MenuItem value="">Tümü</MenuItem>
                  <MenuItem value="devam_ediyor">Devam Ediyor</MenuItem>
                  <MenuItem value="tamamlandi">Tamamlandı</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Başlangıç Tarihi"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filters.baslangic_tarihi}
                onChange={(e) => setFilters({...filters, baslangic_tarihi: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Bitiş Tarihi"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filters.bitis_tarihi}
                onChange={(e) => setFilters({...filters, bitis_tarihi: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={clearFilters}>
                  Temizle
                </Button>
                <Button variant="contained" onClick={applyFilters}>
                  Filtrele
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Card>
      )}
      
      {/* Tablo */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Tezgah</TableCell>
              <TableCell>Tip</TableCell>
              <TableCell>Başlangıç Tarihi</TableCell>
              <TableCell>Bitiş Tarihi</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell>Sorumlu</TableCell>
              <TableCell align="right">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Yükleniyor...
                </TableCell>
              </TableRow>
            ) : kayitlar.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Kayıt bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              kayitlar.map((kayit) => (
                <TableRow key={kayit.id}>
                  <TableCell>{kayit.id}</TableCell>
                  <TableCell>{kayit.tezgah?.tezgah_tanimi || `#${kayit.tezgah_id}`}</TableCell>
                  <TableCell>
                    <Chip 
                      label={kayit.kayit_tipi === 'ariza' ? 'Arıza' : 'Bakım'}
                      color={getTypeChipColor(kayit.kayit_tipi)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(kayit.baslangic_tarihi)}</TableCell>
                  <TableCell>{formatDate(kayit.bitis_tarihi)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={kayit.durum === 'devam_ediyor' ? 'Devam Ediyor' : 'Tamamlandı'}
                      color={getStatusChipColor(kayit.durum)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{kayit.sorumlu || '-'}</TableCell>
                  <TableCell align="right">
                    {kayit.durum === 'devam_ediyor' && (
                      <IconButton 
                        size="small" 
                        color="success" 
                        title="Çalışır Duruma Getir" 
                        onClick={() => handleFinishOpen(kayit)}
                        sx={{ mr: 1 }}
                      >
                        <Check fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton size="small" onClick={() => handleEdit(kayit.id)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteClick(kayit.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Silme Onay Dialog'u */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Kaydı Sil</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bu arıza/bakım kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>İptal</Button>
          <Button onClick={confirmDelete} color="error" autoFocus>
            Sil
          </Button>
        </DialogActions>
      </Dialog>

      {/* Arıza/Bakım Sonlandırma Dialog'u */}
      <Dialog
        open={finishDialogOpen}
        onClose={() => !finishLoading && setFinishDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {selectedRecord?.kayit_tipi === 'ariza' ? 'Arıza' : 'Bakım'} Kaydını Sonlandır
          {selectedRecord && (
            <Typography variant="subtitle2" color="text.secondary">
              Tezgah: {selectedRecord?.tezgah?.tezgah_tanimi || `#${selectedRecord?.tezgah_id}`}
            </Typography>
          )}
        </DialogTitle>
        
        <DialogContent>
          {finishFormErrors.submit && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {finishFormErrors.submit}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="bitis_tarihi"
                label="Sonlandırma Tarihi"
                type="datetime-local"
                fullWidth
                value={finishFormData.bitis_tarihi}
                onChange={handleFinishFormChange}
                InputLabelProps={{ shrink: true }}
                disabled={finishLoading}
                error={!!finishFormErrors.bitis_tarihi}
                helperText={finishFormErrors.bitis_tarihi}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="yapilan_islemler"
                label="Yapılan İşlemler"
                multiline
                rows={4}
                fullWidth
                value={finishFormData.yapilan_islemler}
                onChange={handleFinishFormChange}
                placeholder="Arıza/bakım için yapılan işlemleri detaylı olarak belirtin"
                disabled={finishLoading}
                error={!!finishFormErrors.yapilan_islemler}
                helperText={finishFormErrors.yapilan_islemler || "Yapılan işlemleri detaylı açıklayın"}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="sonuc"
                label="Sonuç"
                fullWidth
                value={finishFormData.sonuc}
                onChange={handleFinishFormChange}
                placeholder="İşlem sonucu"
                disabled={finishLoading}
                error={!!finishFormErrors.sonuc}
                helperText={finishFormErrors.sonuc}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="maliyet"
                label="Maliyet (TL)"
                type="number"
                fullWidth
                value={finishFormData.maliyet}
                onChange={handleFinishFormChange}
                placeholder="Opsiyonel"
                disabled={finishLoading}
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={() => setFinishDialogOpen(false)}
            disabled={finishLoading}
          >
            İptal
          </Button>
          <Button 
            onClick={handleFinishSubmit} 
            color="success" 
            variant="contained"
            disabled={finishLoading}
            startIcon={finishLoading ? <CircularProgress size={20} /> : <Check />}
          >
            {finishLoading ? 'İşleniyor...' : 'Çalışır Duruma Getir'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Başarı/Hata Snackbar */}
      {snackbar.open && (
        <Alert 
          severity={snackbar.severity} 
          sx={{ 
            position: 'fixed', 
            bottom: 24, 
            right: 24, 
            zIndex: 9999,
            boxShadow: 3 
          }}
          onClose={() => setSnackbar({...snackbar, open: false})}
        >
          {snackbar.message}
        </Alert>
      )}
    </Container>
  );
};

export default ArizaBakimListesi;