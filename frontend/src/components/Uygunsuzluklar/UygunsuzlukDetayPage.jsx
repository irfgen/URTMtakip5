import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Divider,
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Tabs,
  Tab,
  Checkbox,
  Stepper,
  Step,
  StepLabel,
  LinearProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  DateRange as DateRangeIcon,
  LocationOn as LocationOnIcon,
  Add as AddIcon,
  Send as SendIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUygunsuzlukById,
  guncelleDurum,
  atamaSorumlu,
  notEkle,
  kapatRapor,
  deleteUygunsuzluk,
  cozumAdimEkle,
  cozumAdimTamamla,
  onayVer
} from '../../store/slices/uygunsuzluklarSlice';
import { fetchPersonel } from '../../store/slices/personelSlice';
import { formatDistanceToNow, format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { getCozumAdimlari } from '../../utils/parseHelper';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const UygunsuzlukDetayPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentRapor, detailLoading, loading } = useSelector((state) => state.uygunsuzluklar);
  const { personelListesi } = useSelector((state) => state.personel);

  const [tabValue, setTabValue] = useState(0);
  const [notDialogOpen, setNotDialogOpen] = useState(false);
  const [kapatmaDialogOpen, setKapatmaDialogOpen] = useState(false);

  const [selectedSorumlu, setSelectedSorumlu] = useState('');
  const [hedefTarih, setHedefTarih] = useState('');
  const [notMetni, setNotMetni] = useState('');
  const [maliyet, setMaliyet] = useState('');
  const [etkinlikPuan, setEtkinlikPuan] = useState(3);
  const [cozumAdimDialogOpen, setCozumAdimDialogOpen] = useState(false);
  const [yeniCozumAdimi, setYeniCozumAdimi] = useState('');
  const [onayNotu, setOnayNotu] = useState('');

  // Stepper state - PDCA workflow statuses
  const durumSira = ['acik', 'atandi', 'cozum_surecinde', 'onay', 'tamamlandi'];
  const aktifStep = currentRapor ? durumSira.indexOf(currentRapor.durum) : 0;

  useEffect(() => {
    dispatch(fetchUygunsuzlukById(id));
    dispatch(fetchPersonel({ aktif: 'true' })); // Sadece aktif personelleri getir
  }, [dispatch, id]);

  const handleNotEkle = () => {
    dispatch(notEkle({
      id,
      not: notMetni
    }));
    setNotDialogOpen(false);
    setNotMetni('');
  };

  const handleKapatma = () => {
    dispatch(kapatRapor({
      id,
      maliyet,
      etkinlikPuan
    }));
    setKapatmaDialogOpen(false);
  };

  const handleSil = () => {
    if (window.confirm('Bu raporu silmek istediğinizden emin misiniz?')) {
      dispatch(deleteUygunsuzluk(id));
      navigate('/uygunsuzluklar');
    }
  };

  const handleCozumAdimEkle = () => {
    if (!yeniCozumAdimi || yeniCozumAdimi.trim() === '') {
      return;
    }
    dispatch(cozumAdimEkle({ id, adim: yeniCozumAdimi }));
    setCozumAdimDialogOpen(false);
    setYeniCozumAdimi('');
  };

  const handleCozumAdimTamamla = (adimIndex) => {
    dispatch(cozumAdimTamamla({ id, adimIndex }));
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
      acik: 'Yeni',
      atandi: 'Atandı',
      inceleniyor: 'İnceleniyor',
      cozum_bekliyor: 'Çözüm Bekliyor',
      cozum_surecinde: 'Çözüm Sürecinde',
      onay: 'Onay',
      tamamlandi: 'Tamamlandı',
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

  // Render status-specific content based on current report status
  const renderDurumSekmesi = () => {
    if (!currentRapor) return null;

    switch(currentRapor.durum) {
      case 'acik':
        return <YeniSekmeIcerik />;
      case 'atandi':
        return <AtandiSekmeIcerik />;
      case 'cozum_surecinde':
        return <CozumSurecindeSekmeIcerik />;
      case 'onay':
        return <OnaySekmeIcerik />;
      case 'tamamlandi':
        return <TamamlandiSekmeIcerik />;
      default:
        return null;
    }
  };

  // Yeni (acik) Sekmesi İçeriği
  const YeniSekmeIcerik = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Yeni Rapor - Sorumlu Atama</Typography>
        <Divider sx={{ mb: 2 }} />

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Bu raporu işlemek için sorumlu personel atayın ve hedef tarih belirleyin.
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Sorumlu Personel</InputLabel>
          <Select
            value={selectedSorumlu}
            label="Sorumlu Personel"
            onChange={(e) => setSelectedSorumlu(e.target.value)}
          >
            {personelListesi && personelListesi.map((personel) => (
              <MenuItem key={personel.id} value={personel.id}>
                {personel.personel_adi}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          type="date"
          label="Hedef Tarih"
          value={hedefTarih}
          onChange={(e) => setHedefTarih(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />

        <Button
          variant="contained"
          fullWidth
          disabled={!selectedSorumlu || !hedefTarih}
          onClick={() => {
            dispatch(atamaSorumlu({ id, sorumluId: selectedSorumlu, hedefTarih }));
          }}
        >
          Sorumlu Ata ve İlerle
        </Button>
      </CardContent>
    </Card>
  );

  // Atandı (atandi) Sekmesi İçeriği
  const AtandiSekmeIcerik = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Atama Bilgileri</Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="subtitle2" color="text.secondary">Sorumlu:</Typography>
            <Typography>{currentRapor.sorumlu?.personel_adi || 'Atanmadı'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2" color="text.secondary">Hedef Tarih:</Typography>
            <Typography>
              {currentRapor.hedef_tarih ? format(new Date(currentRapor.hedef_tarih), 'PPP', { locale: tr }) : '-'}
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Sorumlu personel atandı. Çözüm sürecine başlamak için aşağıdaki butona tıklayın.
          </Typography>
          <Button
            variant="contained"
            fullWidth
            onClick={() => dispatch(guncelleDurum({ id, durum: 'cozum_surecinde' }))}
          >
            Çözüm Sürecine Başla
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  // Çözüm Sürecinde (cozum_surecinde) Sekmesi İçeriği
  const CozumSurecindeSekmeIcerik = () => {
    const cozumAdimlari = getCozumAdimlari(currentRapor);
    const tamamlananAdimlar = cozumAdimlari.filter(a => a.tamamlandi).length;
    const ilerleme = cozumAdimlari.length > 0 ? (tamamlananAdimlar / cozumAdimlari.length) * 100 : 0;

    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Çözüm Adımları</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCozumAdimDialogOpen(true)}
            >
              Adım Ekle
            </Button>
          </Box>

          {/* İlerleme Çubuğu */}
          {cozumAdimlari.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                İlerleme: {tamamlananAdimlar} / {cozumAdimlari.length} adım tamamlandı
              </Typography>
              <LinearProgress variant="determinate" value={ilerleme} />
            </Box>
          )}

          {/* Adım Listesi */}
          {cozumAdimlari.length > 0 ? (
            <List>
              {cozumAdimlari.map((adim, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Checkbox
                      checked={adim.tamamlandi}
                      onChange={() => dispatch(cozumAdimTamamla({ id, adimIndex: index }))}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={adim.adim}
                    sx={{ textDecoration: adim.tamamlandi ? 'line-through' : 'none' }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              Henüz çözüm adımı eklenmemiş. Yukarıdaki butona tıklayarak adım ekleyin.
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  // Onay (onay) Sekmesi İçeriği
  const OnaySekmeIcerik = () => {
    const cozumAdimlari = getCozumAdimlari(currentRapor);

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Onay Bekleniyor</Typography>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1, mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              ✓ Tüm çözüm adımları tamamlandı
            </Typography>
          </Box>

          <Typography variant="subtitle1" gutterBottom>Çözüm Özeti:</Typography>
          <List>
            {cozumAdimlari.map((adim, i) => (
              <ListItem key={i}>
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                <ListItemText primary={adim.adim} />
              </ListItem>
            ))}
          </List>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Onay Notu"
            value={onayNotu}
            onChange={(e) => setOnayNotu(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => dispatch(guncelleDurum({ id, durum: 'cozum_surecinde' }))}
            >
              Geri Dön
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => dispatch(onayVer({ id, onayNotu }))}
            >
              Onayla ve Tamamla
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Tamamlandı (tamamlandi) Sekmesi İçeriği - Tam Özet
  const TamamlandiSekmeIcerik = () => {
    const cozumAdimlari = getCozumAdimlari(currentRapor);

    return (
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ color: '#4CAF50' }}>
            ✓ Rapor Tamamlandı
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {/* Rapor Bilgileri Özeti */}
          <Typography variant="h6" gutterBottom>Rapor Bilgileri</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}><Typography variant="subtitle2">Rapor No:</Typography></Grid>
            <Grid item xs={6}><Typography>{currentRapor.rapor_no}</Typography></Grid>

            <Grid item xs={6}><Typography variant="subtitle2">Kategori:</Typography></Grid>
            <Grid item xs={6}><Typography>{currentRapor.kategori.replace('_', ' ').toUpperCase()}</Typography></Grid>

            <Grid item xs={6}><Typography variant="subtitle2">Öncelik:</Typography></Grid>
            <Grid item xs={6}><Typography>{currentRapor.oncelik.toUpperCase()}</Typography></Grid>

            <Grid item xs={6}><Typography variant="subtitle2">Raporlayan:</Typography></Grid>
            <Grid item xs={6}><Typography>{currentRapor.raporlayan?.personel_adi || '-'}</Typography></Grid>

            <Grid item xs={6}><Typography variant="subtitle2">Sorumlu:</Typography></Grid>
            <Grid item xs={6}><Typography>{currentRapor.sorumlu?.personel_adi || '-'}</Typography></Grid>
          </Grid>

          {/* Zaman Çizelgesi */}
          <Typography variant="h6" gutterBottom>İşlem Zaman Çizelgesi</Typography>
          <List sx={{ mb: 3 }}>
            <ListItem>
              <ListItemIcon><DateRangeIcon color="action" /></ListItemIcon>
              <ListItemText
                primary="Tespit Tarihi"
                secondary={format(new Date(currentRapor.tespit_tarihi), 'PPPp', { locale: tr })}
              />
            </ListItem>
            {currentRapor.atama_tarihi && (
              <ListItem>
                <ListItemIcon><PersonIcon color="action" /></ListItemIcon>
                <ListItemText
                  primary="Atama Tarihi"
                  secondary={format(new Date(currentRapor.atama_tarihi), 'PPPp', { locale: tr })}
                />
              </ListItem>
            )}
            {currentRapor.kapanma_tarihi && (
              <ListItem>
                <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                <ListItemText
                  primary="Kapanma Tarihi"
                  secondary={format(new Date(currentRapor.kapanma_tarihi), 'PPPp', { locale: tr })}
                />
              </ListItem>
            )}
          </List>

          {/* Çözüm Adımları Özeti */}
          <Typography variant="h6" gutterBottom>Çözüm Adımları</Typography>
          <List sx={{ mb: 3 }}>
            {cozumAdimlari.map((adim, i) => (
              <ListItem key={i}>
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                <ListItemText
                  primary={adim.adim}
                  secondary={adim.tamamlanma_tarihi ? format(new Date(adim.tamamlanma_tarihi), 'PPP', { locale: tr }) : '-'}
                />
              </ListItem>
            ))}
          </List>

          {/* Maliyet ve Etkinlik */}
          {currentRapor.maliyet && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Maliyet</Typography>
              <Typography variant="h4">{currentRapor.maliyet} TL</Typography>
            </Box>
          )}

          {currentRapor.etkinlik_puani && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Etkinlik Puanı</Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {[1, 2, 3, 4, 5].map((puan) => (
                  <StarIcon key={puan} sx={{ color: puan <= currentRapor.etkinlik_puani ? '#FFC107' : '#BDBDBD' }} />
                ))}
              </Box>
            </Box>
          )}

          {/* Notlar Özeti */}
          {currentRapor.notlar && currentRapor.notlar.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>Notlar</Typography>
              <List>
                {currentRapor.notlar.map((not) => (
                  <ListItem key={not.id} alignItems="flex-start">
                    <ListItemText
                      primary={not.yazan?.personel_adi || 'Belirtilmedi'}
                      secondary={not.not}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  if (detailLoading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>Yükleniyor...</Typography>
        </Paper>
      </Container>
    );
  }

  if (!currentRapor) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">Rapor bulunamadı</Typography>
          <Button onClick={() => navigate('/uygunsuzluklar')} sx={{ mt: 2 }}>
            Geri Dön
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        {/* Üst Bilgi Çubuğu */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/uygunsuzluklar')}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="h4" fontWeight="bold">
                  {currentRapor.rapor_no}
                </Typography>
                <Chip
                  label={getDurumLabel(currentRapor.durum)}
                  size="small"
                  sx={{ backgroundColor: getDurumColor(currentRapor.durum), color: 'white' }}
                />
                <Chip
                  label={currentRapor.oncelik.toUpperCase()}
                  size="small"
                  sx={{ backgroundColor: getOncelikColor(currentRapor.oncelik), color: 'white' }}
                />
              </Box>
              <Typography variant="h6" color="text.secondary">
                {currentRapor.baslik}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/uygunsuzluklar/${id}/duzenle`)}
            >
              Düzenle
            </Button>
            {currentRapor.durum !== 'kapatildi' && currentRapor.durum !== 'iptal' && (
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => setKapatmaDialogOpen(true)}
              >
                Raporu Kapat
              </Button>
            )}
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleSil}
            >
              Sil
            </Button>
          </Box>
        </Box>

        {/* Stepper - İş Akışı Durumları */}
        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={aktifStep} alternativeLabel>
            {durumSira.map((durum) => {
              const label = getDurumLabel(durum);
              return (
                <Step key={durum}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </Box>

        {/* Aktif Durum Sekmesi */}
        {renderDurumSekmesi()}

        {/* İçerik Tab'ları */}
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Genel Bilgiler" />
          <Tab label="İnceleme Notları" />
          <Tab label="Çözüm Adımları" />
          <Tab label="Tedbirler" />
          <Tab label="Dosyalar" />
        </Tabs>

        {/* Genel Bilgiler Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Rapor Detayları</Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <AssignmentIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Kategori
                        </Typography>
                      </Box>
                      <Typography variant="body1">
                        {getKategoriIcon(currentRapor.kategori)} {currentRapor.kategori.replace('_', ' ').toUpperCase()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <LocationOnIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Lokasyon
                        </Typography>
                      </Box>
                      <Typography variant="body1">
                        {currentRapor.lokasyon || 'Belirtilmedi'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Raporlayan
                        </Typography>
                      </Box>
                      <Typography variant="body1">
                        {currentRapor.raporlayan?.personel_adi || 'Belirtilmedi'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <AssignmentIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Sorumlu
                        </Typography>
                      </Box>
                      <Typography variant="body1">
                        {currentRapor.sorumlu?.personel_adi || 'Atanmadı'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <DateRangeIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Tespit Tarihi
                        </Typography>
                      </Box>
                      <Typography variant="body1">
                        {format(new Date(currentRapor.tespit_tarihi), 'PPP', { locale: tr })}
                      </Typography>
                    </Grid>
                    {currentRapor.hedef_tarih && (
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <DateRangeIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            Hedef Tarih
                          </Typography>
                        </Box>
                        <Typography variant="body1">
                          {format(new Date(currentRapor.hedef_tarih), 'PPP', { locale: tr })}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom>Açıklama</Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {currentRapor.aciklama}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>İşlemler</Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<AddIcon />}
                      onClick={() => setNotDialogOpen(true)}
                    >
                      Not Ekle
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* İnceleme Notları Tab */}
        <TabPanel value={tabValue} index={1}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">İnceleme Notları</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setNotDialogOpen(true)}
                >
                  Not Ekle
                </Button>
              </Box>

              {currentRapor.notlar && currentRapor.notlar.length > 0 ? (
                <List>
                  {currentRapor.notlar.map((not) => (
                    <ListItem key={not.id} alignItems="flex-start">
                      <Avatar sx={{ mr: 2 }}>
                        {not.yazan?.personel_adi?.charAt(0) || '?'}
                      </Avatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2">
                              {not.yazan?.personel_adi || 'Belirtilmedi'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {not.createdAt ? formatDistanceToNow(new Date(not.createdAt), { addSuffix: true, locale: tr }) : ''}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                            {not.not}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Henüz not eklenmemiş
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        {/* Çözüm Adımları Tab */}
        <TabPanel value={tabValue} index={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Çözüm Adımları</Typography>
                {currentRapor.durum === 'cozum_surecinde' && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setCozumAdimDialogOpen(true)}
                  >
                    Adım Ekle
                  </Button>
                )}
              </Box>

              {(() => {
                const cozumAdimlari = getCozumAdimlari(currentRapor);
                return cozumAdimlari && cozumAdimlari.length > 0 ? (
                  <List>
                    {cozumAdimlari.map((adim, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Checkbox
                            checked={adim.tamamlandi}
                            disabled={currentRapor.durum !== 'cozum_surecinde'}
                            onChange={() => handleCozumAdimTamamla(index)}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={adim.adim}
                          sx={{ textDecoration: adim.tamamlandi ? 'line-through' : 'none' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Henüz çözüm adımı eklenmemiş
                    </Typography>
                  </Box>
                );
              })()}

              {/* Onay Butonu - Tüm adımlar tamamlandığında göster */}
              {currentRapor.durum === 'onay' && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Tüm çözüm adımları tamamlandı. Raporu onaylayarak "Tamamlandı" durumuna getirebilirsiniz.
                  </Typography>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => setOnayDialogOpen(true)}
                  >
                    Raporu Onayla
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        {/* Tedbirler Tab */}
        <TabPanel value={tabValue} index={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Alınan Tedbirler</Typography>
              </Box>

              {currentRapor.tedbirler && currentRapor.tedbirler.length > 0 ? (
                <List>
                  {currentRapor.tedbirler.map((tedbir) => (
                    <ListItem key={tedbir.id} alignItems="flex-start">
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Chip
                                label={tedbir.tedbir_turu === 'duzeltici' ? 'Düzeltici' : 'Önleyici'}
                                size="small"
                                color={tedbir.tedbir_turu === 'duzeltici' ? 'warning' : 'info'}
                              />
                              <Chip
                                label={tedbir.durum}
                                size="small"
                              />
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {tedbir.createdAt ? formatDistanceToNow(new Date(tedbir.createdAt), { addSuffix: true, locale: tr }) : ''}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                            {tedbir.aciklama}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Henüz tedbir eklenmemiş
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        {/* Dosyalar Tab */}
        <TabPanel value={tabValue} index={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Dosyalar</Typography>

              {currentRapor.dosyalar && currentRapor.dosyalar.length > 0 ? (
                <List>
                  {currentRapor.dosyalar.map((dosya) => (
                    <ListItem key={dosya.id}>
                      <ListItemText
                        primary={dosya.dosya_adi}
                        secondary={dosya.dosya_tipi}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Henüz dosya yüklenmemiş
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>

      {/* Not Ekleme Dialog */}
      <Dialog open={notDialogOpen} onClose={() => setNotDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Not Ekle</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Not"
            value={notMetni}
            onChange={(e) => setNotMetni(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotDialogOpen(false)}>İptal</Button>
          <Button onClick={handleNotEkle} variant="contained" disabled={loading}>
            Ekle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Kapatma Dialog */}
      <Dialog open={kapatmaDialogOpen} onClose={() => setKapatmaDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Raporu Kapat</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="number"
            label="Maliyet (TL)"
            value={maliyet}
            onChange={(e) => setMaliyet(e.target.value)}
            sx={{ mt: 2 }}
          />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Etkinlik Puanı: {etkinlikPuan}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            {[1, 2, 3, 4, 5].map((puan) => (
              <Button
                key={puan}
                variant={etkinlikPuan === puan ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setEtkinlikPuan(puan)}
              >
                {puan}
              </Button>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setKapatmaDialogOpen(false)}>İptal</Button>
          <Button onClick={handleKapatma} variant="contained" color="success" disabled={loading}>
            Kapat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Çözüm Adımı Ekle Dialog */}
      <Dialog open={cozumAdimDialogOpen} onClose={() => setCozumAdimDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Çözüm Adımı Ekle</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Yapılacak İşlem"
            value={yeniCozumAdimi}
            onChange={(e) => setYeniCozumAdimi(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCozumAdimDialogOpen(false)}>İptal</Button>
          <Button onClick={handleCozumAdimEkle} variant="contained">
            Ekle
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UygunsuzlukDetayPage;
