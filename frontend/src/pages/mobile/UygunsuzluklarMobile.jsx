import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Grid,
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { fetchUygunsuzluklar, setFiltreler } from '../../store/slices/uygunsuzluklarSlice';
import socketService from '../../services/socket';
import { Snackbar, Alert } from '@mui/material';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function UygunsuzluklarMobile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { raporlar, loading, filtreler } = useSelector((state) => state.uygunsuzluklar);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [localFilters, setLocalFilters] = useState({ ...filtreler });
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    dispatch(fetchUygunsuzluklar(filtreler));
  }, [dispatch, filtreler]);

  // Socket.IO event dinleyicileri
  useEffect(() => {
    socketService.on('uygunsuzluk:yeni', (data) => {
      setNotification({
        open: true,
        message: `Yeni: ${data.baslik}`,
        severity: 'info'
      });
      dispatch(fetchUygunsuzluklar(filtreler));
    });

    socketService.on('uygunsuzluk:atandi', (data) => {
      setNotification({
        open: true,
        message: `Atandı: ${data.rapor_no}`,
        severity: 'success'
      });
      dispatch(fetchUygunsuzluklar(filtreler));
    });

    socketService.on('uygunsuzluk:guncellendi', () => {
      dispatch(fetchUygunsuzluklar(filtreler));
    });

    socketService.on('uygunsuzluk:kapatildi', () => {
      dispatch(fetchUygunsuzluklar(filtreler));
    });

    return () => {
      socketService.off('uygunsuzluk:yeni');
      socketService.off('uygunsuzluk:atandi');
      socketService.off('uygonsuzluk:guncellendi');
      socketService.off('uygunsuzluk:kapatildi');
    };
  }, [dispatch, filtreler]);

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    const durumFilters = ['tumu', 'acik', 'inceleniyor'];
    if (newValue < durumFilters.length) {
      dispatch(setFiltreler({ durum: durumFilters[newValue] }));
    }
  };

  const handleFilterApply = () => {
    dispatch(setFiltreler(localFilters));
    setFilterOpen(false);
  };

  const getDurumColor = (durum) => {
    const colors = {
      acik: '#9E9E9E',
      atandi: '#2196F3',
      inceleniyor: '#FF9800',
      cozum_bekliyor: '#9C27B0',
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

  const filteredRaporlar = raporlar.filter((rapor) => {
    const searchMatch =
      rapor.baslik?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rapor.aciklama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rapor.rapor_no?.toLowerCase().includes(searchTerm.toLowerCase());

    if (tabValue === 0) return searchMatch; // Tümü
    if (tabValue === 1) return searchMatch && (rapor.durum === 'acik' || rapor.durum === 'atandi');
    if (tabValue === 2) return searchMatch && (rapor.durum === 'inceleniyor' || rapor.durum === 'cozum_bekliyor');
    if (tabValue === 3) return searchMatch && rapor.durum === 'kapatildi';
    return searchMatch;
  });

  const istatistikler = {
    toplam: raporlar.length,
    acik: raporlar.filter((r) => r.durum === 'acik' || r.durum === 'atandi').length,
    inceleniyor: raporlar.filter((r) => r.durum === 'inceleniyor' || r.durum === 'cozum_bekliyor').length,
    kapatildi: raporlar.filter((r) => r.durum === 'kapatildi').length
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 8 }}>
      {/* Başlık */}
      <Box sx={{ p: 2, backgroundColor: 'primary.main', color: 'white' }}>
        <Typography variant="h5" fontWeight="bold">
          Uygunsuzluklar
        </Typography>
        <Typography variant="body2">
          {istatistikler.toplam} rapor
        </Typography>
      </Box>

      {/* Arama */}
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Rapor ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </Box>

      {/* Tablar */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label={`Tümü (${istatistikler.toplam})`} />
        <Tab label={`Açık (${istatistikler.acik})`} />
        <Tab label={`İnceleniyor (${istatistikler.inceleniyor})`} />
        <Tab label={`Kapatıldı (${istatistikler.kapatildi})`} />
      </Tabs>

      {/* Rapor Listesi */}
      <TabPanel value={tabValue} index={tabValue}>
        {filteredRaporlar.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <AssignmentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Henüz rapor bulunmuyor
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              İlk uygunsuzluk raporunu oluşturmak için + butonuna tıklayın
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            {filteredRaporlar.map((rapor) => (
              <Card
                key={rapor.id}
                sx={{
                  mb: 2,
                  borderLeft: `4px solid ${getOncelikColor(rapor.oncelik)}`
                }}
              >
                <CardActionArea onClick={() => navigate(`/mobile/uygunsuzluklar/${rapor.id}`)}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">{getKategoriIcon(rapor.kategori)}</Typography>
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
                          {rapor.raporlayan?.personel_adi || 'Belirtilmedi'}
                        </Typography>
                      </Box>
                      {rapor.sorumlu && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AssignmentIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {rapor.sorumlu.personel_adi}
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DateRangeIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(rapor.tespit_tarihi), { addSuffix: true, locale: tr })}
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
                        <Chip label="Süresi Geçmiş" size="small" color="error" />
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        )}
      </TabPanel>

      {/* Filtre Dialog */}
      <Dialog open={filterOpen} onClose={() => setFilterOpen(false)} fullWidth>
        <DialogTitle>Filtrele</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
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
            <Grid item xs={12}>
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
            <Grid item xs={12}>
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
          <Button onClick={() => setFilterOpen(false)}>İptal</Button>
          <Button onClick={handleFilterApply} variant="contained">
            Uygula
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB - Yeni Rapor */}
      <Fab
        color="primary"
        aria-label="yeni-rapor"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16
        }}
        onClick={() => navigate('/mobile/uygunsuzluklar/yeni')}
      >
        <AddIcon />
      </Fab>

      {/* Socket.IO Bildirimleri */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default UygunsuzluklarMobile;
