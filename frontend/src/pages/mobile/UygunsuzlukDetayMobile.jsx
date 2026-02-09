import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Divider,
  Fab
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
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUygunsuzlukById,
  guncelleDurum,
  notEkle,
  kapatRapor,
  deleteUygunsuzluk
} from '../../store/slices/uygunsuzluklarSlice';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

function UygunsuzlukDetayMobile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentRapor, detailLoading, loading } = useSelector((state) => state.uygunsuzluklar);

  const [activeTab, setActiveTab] = useState('bilgiler');
  const [durumDialogOpen, setDurumDialogOpen] = useState(false);
  const [notDialogOpen, setNotDialogOpen] = useState(false);
  const [kapatmaDialogOpen, setKapatmaDialogOpen] = useState(false);

  const [selectedDurum, setSelectedDurum] = useState('');
  const [notMetni, setNotMetni] = useState('');
  const [maliyet, setMaliyet] = useState('');
  const [etkinlikPuan, setEtkinlikPuan] = useState(3);

  useEffect(() => {
    dispatch(fetchUygunsuzlukById(id));
  }, [dispatch, id]);

  const handleDurumGuncelle = () => {
    dispatch(guncelleDurum({ id, durum: selectedDurum, not: notMetni }));
    setDurumDialogOpen(false);
    setNotMetni('');
  };

  const handleNotEkle = () => {
    dispatch(notEkle({ id, not: notMetni }));
    setNotDialogOpen(false);
    setNotMetni('');
  };

  const handleKapatma = () => {
    dispatch(kapatRapor({ id, maliyet, etkinlikPuan }));
    setKapatmaDialogOpen(false);
  };

  const handleSil = () => {
    if (window.confirm('Bu raporu silmek istediğinizden emin misiniz?')) {
      dispatch(deleteUygunsuzluk(id));
      navigate('/mobile/uygunsuzluklar');
    }
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

  if (detailLoading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>Yükleniyor...</Typography>
      </Box>
    );
  }

  if (!currentRapor) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6">Rapor bulunamadı</Typography>
        <Button onClick={() => navigate('/mobile/uygunsuzluklar')} sx={{ mt: 2 }}>
          Geri Dön
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 8 }}>
      {/* Üst Bar */}
      <Box sx={{ p: 2, backgroundColor: 'primary.main', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton sx={{ color: 'white' }} onClick={() => navigate('/mobile/uygunsuzluklar')}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap>
              {currentRapor.rapor_no}
            </Typography>
            <Typography variant="caption" noWrap>
              {currentRapor.baslik}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Durum ve Öncelik */}
      <Box sx={{ p: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          label={getDurumLabel(currentRapor.durum)}
          sx={{ backgroundColor: getDurumColor(currentRapor.durum), color: 'white' }}
        />
        <Chip
          label={currentRapor.oncelik.toUpperCase()}
          sx={{ backgroundColor: getOncelikColor(currentRapor.oncelik), color: 'white' }}
        />
      </Box>

      {/* Tab Seçimi */}
      <Box sx={{ px: 2, display: 'flex', gap: 1, mb: 2 }}>
        <Button
          size="small"
          variant={activeTab === 'bilgiler' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('bilgiler')}
          sx={{ flexGrow: 1 }}
        >
          Bilgiler
        </Button>
        <Button
          size="small"
          variant={activeTab === 'notlar' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('notlar')}
          sx={{ flexGrow: 1 }}
        >
          Notlar
        </Button>
        <Button
          size="small"
          variant={activeTab === 'tedbirler' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('tedbirler')}
          sx={{ flexGrow: 1 }}
        >
          Tedbirler
        </Button>
      </Box>

      {/* Bilgiler Tab */}
      {activeTab === 'bilgiler' && (
        <Box sx={{ px: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="body2">{getKategoriIcon(currentRapor.kategori)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentRapor.kategori.replace('_', ' ').toUpperCase()}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <PersonIcon fontSize="small" color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Raporlayan
                  </Typography>
                  <Typography variant="body2">
                    {currentRapor.raporlayan?.personel_adi || 'Belirtilmedi'}
                  </Typography>
                </Box>
              </Box>

              {currentRapor.sorumlu && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <AssignmentIcon fontSize="small" color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Sorumlu
                    </Typography>
                    <Typography variant="body2">
                      {currentRapor.sorumlu.personel_adi}
                    </Typography>
                  </Box>
                </Box>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <DateRangeIcon fontSize="small" color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Tespit Tarihi
                  </Typography>
                  <Typography variant="body2">
                    {format(new Date(currentRapor.tespit_tarihi), 'PPP', { locale: tr })}
                  </Typography>
                </Box>
              </Box>

              {currentRapor.lokasyon && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <LocationOnIcon fontSize="small" color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Lokasyon
                    </Typography>
                    <Typography variant="body2">
                      {currentRapor.lokasyon}
                    </Typography>
                  </Box>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Açıklama
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {currentRapor.aciklama}
              </Typography>
            </CardContent>
          </Card>

          {/* İşlem Butonları */}
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<AssignmentIcon />}
              onClick={() => setDurumDialogOpen(true)}
            >
              Durum Güncelle
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<AddIcon />}
              onClick={() => setNotDialogOpen(true)}
            >
              Not Ekle
            </Button>
            {currentRapor.durum !== 'kapatildi' && currentRapor.durum !== 'iptal' && (
              <Button
                variant="contained"
                fullWidth
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => setKapatmaDialogOpen(true)}
              >
                Raporu Kapat
              </Button>
            )}
            <Button
              variant="outlined"
              fullWidth
              color="info"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/mobile/uygunsuzluklar/${id}/duzenle`)}
            >
              Düzenle
            </Button>
            <Button
              variant="outlined"
              fullWidth
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleSil}
            >
              Sil
            </Button>
          </Box>
        </Box>
      )}

      {/* Notlar Tab */}
      {activeTab === 'notlar' && (
        <Box sx={{ px: 2 }}>
          <Card>
            <CardContent>
              {currentRapor.notlar && currentRapor.notlar.length > 0 ? (
                <List>
                  {currentRapor.notlar.map((not) => (
                    <React.Fragment key={not.id}>
                      <ListItem alignItems="flex-start">
                        <Avatar sx={{ mr: 2 }}>
                          {not.yazan?.personel_adi?.charAt(0) || '?'}
                        </Avatar>
                        <ListItemText
                          primary={not.yazan?.personel_adi || 'Belirtilmedi'}
                          secondary={
                            <>
                              <Typography variant="caption" color="text.secondary">
                                {format(new Date(not.createdAt), 'PPP p', { locale: tr })}
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                                {not.not}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
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
        </Box>
      )}

      {/* Tedbirler Tab */}
      {activeTab === 'tedbirler' && (
        <Box sx={{ px: 2 }}>
          <Card>
            <CardContent>
              {currentRapor.tedbirler && currentRapor.tedbirler.length > 0 ? (
                <List>
                  {currentRapor.tedbirler.map((tedbir) => (
                    <React.Fragment key={tedbir.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Chip
                                label={tedbir.tedbir_turu === 'duzeltici' ? 'Düzeltici' : 'Önleyici'}
                                size="small"
                                color={tedbir.tedbir_turu === 'duzeltici' ? 'warning' : 'info'}
                              />
                              <Chip label={tedbir.durum} size="small" />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="caption" color="text.secondary">
                                {format(new Date(tedbir.createdAt), 'PPP p', { locale: tr })}
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                                {tedbir.aciklama}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
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
        </Box>
      )}

      {/* Durum Güncelleme Dialog */}
      <Dialog open={durumDialogOpen} onClose={() => setDurumDialogOpen(false)} fullWidth>
        <DialogTitle>Durum Güncelle</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            label="Yeni Durum"
            value={selectedDurum}
            onChange={(e) => setSelectedDurum(e.target.value)}
            sx={{ mt: 2 }}
            SelectProps={{ native: true }}
          >
            <option value="">Seçiniz</option>
            <option value="acik">Açık</option>
            <option value="atandi">Atandı</option>
            <option value="inceleniyor">İnceleniyor</option>
            <option value="cozum_bekliyor">Çözüm Bekliyor</option>
          </TextField>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Not (Opsiyonel)"
            value={notMetni}
            onChange={(e) => setNotMetni(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDurumDialogOpen(false)}>İptal</Button>
          <Button onClick={handleDurumGuncelle} variant="contained" disabled={loading}>
            Güncelle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Not Ekleme Dialog */}
      <Dialog open={notDialogOpen} onClose={() => setNotDialogOpen(false)} fullWidth>
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
      <Dialog open={kapatmaDialogOpen} onClose={() => setKapatmaDialogOpen(false)} fullWidth>
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
    </Box>
  );
}

export default UygunsuzlukDetayMobile;
