import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUygunsuzluklar, setFiltreler, clearFiltreler, deleteUygunsuzluk } from '../../store/slices/uygunsuzluklarSlice';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import socketService from '../../services/socket';
import { Snackbar, Alert } from '@mui/material';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const UygunsuzluklarPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { raporlar, loading, filtreler } = useSelector((state) => state.uygunsuzluklar);

  const [tabValue, setTabValue] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState({ ...filtreler });
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    dispatch(fetchUygunsuzluklar(filtreler));
  }, [dispatch, filtreler]);

  // Socket.IO event dinleyicileri
  useEffect(() => {
    // Yeni uygunsuzluk bildirimi
    socketService.on('uygunsuzluk:yeni', (data) => {
      setNotification({
        open: true,
        message: `Yeni uygunsuzluk raporu: ${data.baslik} (${data.rapor_no})`,
        severity: 'info'
      });
      dispatch(fetchUygunsuzluklar(filtreler));
    });

    // Sorumlu atama bildirimi
    socketService.on('uygunsuzluk:atandi', (data) => {
      setNotification({
        open: true,
        message: `Sorumlu atandı: ${data.rapor_no}`,
        severity: 'success'
      });
      dispatch(fetchUygunsuzluklar(filtreler));
    });

    // Rapor güncelleme bildirimi
    socketService.on('uygunsuzluk:guncellendi', (data) => {
      setNotification({
        open: true,
        message: `Rapor güncellendi: ${data.rapor_no}`,
        severity: 'info'
      });
      dispatch(fetchUygunsuzluklar(filtreler));
    });

    // Rapor kapatılma bildirimi
    socketService.on('uygunsuzluk:kapatildi', (data) => {
      setNotification({
        open: true,
        message: `Rapor kapatıldı: ${data.rapor_no}`,
        severity: 'success'
      });
      dispatch(fetchUygunsuzluklar(filtreler));
    });

    // Cleanup
    return () => {
      socketService.off('uygunsuzluk:yeni');
      socketService.off('uygunsuzluk:atandi');
      socketService.off('uygunsuzluk:guncellendi');
      socketService.off('uygunsuzluk:kapatildi');
    };
  }, [dispatch, filtreler]);

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Not: Yerel filtreleme (filteredRaporlar) kullanılıyor,
    // backend'e filtre göndermeye gerek yok
  };

  const handleFilterApply = () => {
    dispatch(setFiltreler(localFilters));
    setFilterOpen(false);
  };

  const handleFilterClear = () => {
    dispatch(clearFiltreler());
    setLocalFilters({
      durum: 'tumu',
      kategori: 'tumu',
      oncelik: 'tumu',
      sorumluId: null,
      tarihAraligi: null
    });
    setFilterOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Bu raporu silmek istediğinizden emin misiniz?')) {
      dispatch(deleteUygunsuzluk(id));
    }
  };

  const getDurumColor = (durum) => {
    const colors = {
      acik: '#9E9E9E',
      atandi: '#2196F3',
      inceleniyor: '#FF9800',
      cozum_bekliyor: '#9C27B0',
      cozum_surecinde: '#FF9800',
      onay: '#9C27B0',
      tamamlandi: '#4CAF50',
      kapatildi: '#4CAF50',
      iptal: '#F44336'
    };
    return colors[durum] || '#9E9E9E';
  };

  const getDurumLabel = (durum) => {
    const labels = {
      acik: 'Açık',
      atandi: 'Atandı',
      inceleniyor: 'İnceleniyor',
      cozum_bekliyor: 'Çözüm Bekliyor',
      kapatildi: 'Kapatıldı',
      iptal: 'İptal'
    };
    return labels[durum] || durum;
  };

  const getOncelikColor = (oncelik) => {
    const colors = {
      acil: '#D32F2F',
      yuksek: '#F57C00',
      orta: '#FBC02D',
      dusuk: '#388E3C'
    };
    return colors[oncelik] || '#9E9E9E';
  };

  const getKategoriIcon = (kategori) => {
    const icons = {
      is_guvenligi: '🛡️',
      kalite: '⭐',
      cevre: '🌿',
      surec: '⚙️',
      diger: '📁'
    };
    return icons[kategori] || '📁';
  };

  const filteredRaporlar = raporlar.filter(rapor => {
    if (tabValue === 0) return true; // Tümü
    if (tabValue === 1) return rapor.durum === 'acik' || rapor.durum === 'atandi';
    if (tabValue === 2) return rapor.durum === 'cozum_surecinde';
    if (tabValue === 3) return rapor.durum === 'onay';
    if (tabValue === 4) return rapor.durum === 'tamamlandi';
    return true;
  });

  const istatistikler = {
    toplam: raporlar.length,
    acik: raporlar.filter(r => r.durum === 'acik' || r.durum === 'atandi').length,
    cozum_surecinde: raporlar.filter(r => r.durum === 'cozum_surecinde').length,
    onay: raporlar.filter(r => r.durum === 'onay').length,
    tamamlandi: raporlar.filter(r => r.durum === 'tamamlandi').length
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        {/* Başlık ve İşlemler */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AssignmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Uygunsuzluk Raporları
              </Typography>
              <Typography variant="body2" color="text.secondary">
                PDCA döngüsüne dayalı uygunsuzluk yönetim sistemi
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setFilterOpen(true)}
            >
              Filtrele
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => dispatch(fetchUygunsuzluklar(filtreler))}
              disabled={loading}
            >
              Yenile
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/uygunsuzluklar/yeni')}
              color="primary"
            >
              Yeni Rapor
            </Button>
          </Box>
        </Box>

        {/* İstatistik Kartları */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Toplam Rapor
                </Typography>
                <Typography variant="h3" color="primary.main">
                  {istatistikler.toplam}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Açık Raporlar
                </Typography>
                <Typography variant="h3" sx={{ color: getDurumColor('acik') }}>
                  {istatistikler.acik}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  İnceleniyor
                </Typography>
                <Typography variant="h3" sx={{ color: getDurumColor('inceleniyor') }}>
                  {istatistikler.inceleniyor}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Kapatıldı
                </Typography>
                <Typography variant="h3" sx={{ color: getDurumColor('kapatildi') }}>
                  {istatistikler.kapatildi}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tablar */}
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tab label={`Tümü (${istatistikler.toplam})`} />
          <Tab label={`Açık (${istatistikler.acik})`} />
          <Tab label={`Çözüm Sürecinde (${istatistikler.cozum_surecinde})`} />
          <Tab label={`Onay (${istatistikler.onay})`} />
          <Tab label={`Tamamlandı (${istatistikler.tamamlandi})`} />
        </Tabs>

        {/* Rapor Listesi */}
        <TabPanel value={tabValue} index={tabValue}>
          {/* Always show the list, filtered by tab value */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Typography>Yükleniyor...</Typography>
            </Box>
          ) : filteredRaporlar.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <AssignmentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Henüz rapor bulunmuyor
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                İlk uygunsuzluk raporunu oluşturmak için "Yeni Rapor" butonuna tıklayın
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/uygunsuzluklar/yeni')}
              >
                İlk Raporu Oluştur
              </Button>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filteredRaporlar.map((rapor) => (
                <Grid item xs={12} md={6} lg={4} key={rapor.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      borderLeft: `4px solid ${getOncelikColor(rapor.oncelik)}`
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            {getKategoriIcon(rapor.kategori)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {rapor.rapor_no}
                          </Typography>
                        </Box>
                        <Chip
                          label={getDurumLabel(rapor.durum)}
                          size="small"
                          sx={{ backgroundColor: getDurumColor(rapor.durum), color: 'white' }}
                        />
                      </Box>

                      <Typography variant="h6" gutterBottom noWrap>
                        {rapor.baslik}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {rapor.aciklama?.substring(0, 100)}
                        {rapor.aciklama?.length > 100 ? '...' : ''}
                      </Typography>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            Raporlayan: {rapor.raporlayan?.personel_adi || 'Belirtilmedi'}
                          </Typography>
                        </Box>
                        {rapor.sorumlu && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AssignmentIcon fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary">
                              Sorumlu: {rapor.sorumlu.personel_adi}
                            </Typography>
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DateRangeIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {rapor.tespit_tarihi ? formatDistanceToNow(new Date(rapor.tespit_tarihi), { addSuffix: true, locale: tr }) : ''}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Chip
                          label={rapor.oncelik.toUpperCase()}
                          size="small"
                          sx={{ backgroundColor: getOncelikColor(rapor.oncelik), color: 'white' }}
                        />
                        {rapor.hedef_tarih && new Date(rapor.hedef_tarih) < new Date() && rapor.durum !== 'kapatildi' && (
                          <Chip
                            label="Süresi Geçmiş"
                            size="small"
                            color="error"
                          />
                        )}
                      </Box>
                    </CardContent>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, p: 1, borderTop: 1, borderColor: 'divider' }}>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/uygunsuzluklar/${rapor.id}`)}
                        color="primary"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/uygunsuzluklar/${rapor.id}/duzenle`)}
                        color="info"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(rapor.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      </Paper>

      {/* Filtre Dialog */}
      <Dialog open={filterOpen} onClose={() => setFilterOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Filtrele</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Durum</InputLabel>
                <Select
                  value={localFilters.durum}
                  label="Durum"
                  onChange={(e) => setLocalFilters({ ...localFilters, durum: e.target.value })}
                >
                  <MenuItem value="tumu">Tümü</MenuItem>
                  <MenuItem value="acik">Açık</MenuItem>
                  <MenuItem value="atandi">Atandı</MenuItem>
                  <MenuItem value="inceleniyor">İnceleniyor</MenuItem>
                  <MenuItem value="cozum_bekliyor">Çözüm Bekliyor</MenuItem>
                  <MenuItem value="kapatildi">Kapatıldı</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Kategori</InputLabel>
                <Select
                  value={localFilters.kategori}
                  label="Kategori"
                  onChange={(e) => setLocalFilters({ ...localFilters, kategori: e.target.value })}
                >
                  <MenuItem value="tumu">Tümü</MenuItem>
                  <MenuItem value="is_guvenligi">İş Güvenliği</MenuItem>
                  <MenuItem value="kalite">Kalite</MenuItem>
                  <MenuItem value="cevre">Çevre</MenuItem>
                  <MenuItem value="surec">Süreç</MenuItem>
                  <MenuItem value="diger">Diğer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Öncelik</InputLabel>
                <Select
                  value={localFilters.oncelik}
                  label="Öncelik"
                  onChange={(e) => setLocalFilters({ ...localFilters, oncelik: e.target.value })}
                >
                  <MenuItem value="tumu">Tümü</MenuItem>
                  <MenuItem value="acil">Acil</MenuItem>
                  <MenuItem value="yuksek">Yüksek</MenuItem>
                  <MenuItem value="orta">Orta</MenuItem>
                  <MenuItem value="dusuk">Düşük</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFilterClear}>Temizle</Button>
          <Button onClick={() => setFilterOpen(false)}>İptal</Button>
          <Button onClick={handleFilterApply} variant="contained">Uygula</Button>
        </DialogActions>
      </Dialog>

      {/* Socket.IO Bildirimleri */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UygunsuzluklarPage;
