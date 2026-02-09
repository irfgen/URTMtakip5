import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, Button, Stack, Chip, Avatar, Snackbar, Alert } from '@mui/material';
import ImageWithFallback from './ImageWithFallback';
import UretimPlaniEklemeModal from './UretimPlaniEklemeModal';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { getFotoPath } from '../utils/imageUtils'; // Ortak resim yolu işleyicisi
import { useDispatch } from 'react-redux';
import { isEmirleriAPI } from '../services/api';
import { fetchIsEmirleri } from '../store/slices/isEmirleriSlice';

const MobileIsEmriKartiYeni = ({ isEmri, parcaGorselUrl, onTezgahAta, onEdit, onMoveCard }) => {
  const dispatch = useDispatch();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [uretimPlaniModalOpen, setUretimPlaniModalOpen] = useState(false);
  const {
    is_emri_no,
    is_adi,
    parca,
    tezgah,
    teslim_tarihi,
    durum,
    adet,
    plan_liste_no
  } = isEmri;

  const durumMetni = {
    'bekliyor': 'Bekliyor',
    'devam_ediyor': 'Üretimde',
    'tamamlandi': 'Tamamlandı',
    'gecikti': 'Gecikti',
    'iptal_edildi': 'İptal Edildi',
    'beklemede': 'Beklemede'
  };

  const durumRenkleri = {
    'bekliyor': 'default',
    'devam_ediyor': 'primary',
    'tamamlandi': 'success',
    'gecikti': 'warning', // Gecikti warning olabilir
    'iptal_edildi': 'error',
    'beklemede': 'warning'
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Belirtilmemiş';
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: tr });
    } catch (e) {
      return 'Geçersiz Tarih';
    }
  };

  // Props'dan gelen veya doğrudan parça nesnesinden alınan görsel URL
  const finalParcaGorselUrl = parcaGorselUrl || (parca && parca.foto_path ? getFotoPath(parca.foto_path) : null);
  
  // Component mount edildiğinde görsel URL'lerini loglayalım
  useEffect(() => {
    console.log(`İş Emri Kartı (${is_emri_no || "ID: " + (isEmri.id || isEmri.is_emri_id)}):`, { 
      parcaGorselProps: parcaGorselUrl,
      parcaFotoPath: parca?.foto_path,
      finalUrl: finalParcaGorselUrl 
    });
  }, [is_emri_no, isEmri.id, isEmri.is_emri_id, parcaGorselUrl, parca?.foto_path]);

  const handleIsiTamamla = async () => {
    setLoading(true);
    try {
      await isEmirleriAPI.update(isEmri.is_emri_id, {
        ...isEmri,
        durum: 'tamamlandı'
      });
      
      // Redux store'u güncelle
      dispatch(fetchIsEmirleri());
      
      setSnackbar({
        open: true,
        message: 'İş emri başarıyla tamamlandı!',
        severity: 'success'
      });
    } catch (error) {
      console.error('İş emri tamamlama hatası:', error);
      setSnackbar({
        open: true,
        message: 'İş emri tamamlanırken hata oluştu!',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleUretimPlaniModalOpen = () => {
    setUretimPlaniModalOpen(true);
  };

  const handleUretimPlaniModalClose = () => {
    setUretimPlaniModalOpen(false);
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" flexDirection="row" gap={2}>
          {/* Sol Taraf: Büyük Parça Görseli */}
          <Box sx={{ 
            width: { xs: 80, sm: 100, md: 120 }, 
            height: { xs: 80, sm: 100, md: 120 }, 
            flexShrink: 0,
            border: '1px solid #eee',
            borderRadius: 1,
            overflow: 'hidden',
            position: 'relative'
          }}>
            <ImageWithFallback
              src={finalParcaGorselUrl}
              alt={parca?.parca_adi || is_adi || 'Parça görseli'}
              imgStyle={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) scale(1.8)', // Büyütülmüş ölçek
                width: '100%',
                height: '100%',
                objectFit: 'contain', 
                borderRadius: 1,
              }}
              fallbackStyle={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                borderRadius: 1,
              }}
              fallbackText={parca?.parca_kodu || "Görsel Yok"}
            />
          </Box>

          {/* Sağ Taraf: Detaylar ve Butonlar */}
          <Box flexGrow={1} display="flex" flexDirection="column" justifyContent="space-between">
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                  {is_emri_no || `#${isEmri.id}`}
                </Typography>
                <Chip
                  label={durumMetni[durum] || durum || 'Belirsiz'}
                  color={durumRenkleri[durum] || 'default'}
                  size="small"
                />
              </Box>
              <Typography variant="body1" gutterBottom sx={{ fontSize: '0.9rem' }}>
                {is_adi}
              </Typography>
              {parca && (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  <strong>Parça:</strong> {parca.parca_kodu} ({parca.parca_adi})
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                <strong>Adet:</strong> {adet || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                <strong>Tezgah:</strong> {tezgah?.tezgah_tanimi || 'Belirlenmemiş'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                <strong>Teslim:</strong> {formatDate(teslim_tarihi)}
              </Typography>
               {plan_liste_no && (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              <strong>Üretim Planı:</strong> {isEmri?.uretim_plani_id ? `Plan #${isEmri.uretim_plani_id}` : (plan_liste_no || 'Plan Dışı')}
                </Typography>
              )}
            </Box>
            
            <Stack direction="row" spacing={1} mt={1.5} justifyContent="flex-start" flexWrap="wrap">
              <Button variant="outlined" size="small" onClick={() => onTezgahAta(isEmri)} sx={{ fontSize: '0.7rem', p: '2px 8px' }}>
                Tezgaha Ata
              </Button>
              <Button variant="outlined" size="small" onClick={() => onEdit(isEmri)} sx={{ fontSize: '0.7rem', p: '2px 8px' }}>
                Düzenle
              </Button>
              <Button variant="outlined" size="small" onClick={() => onMoveCard(isEmri)} sx={{ fontSize: '0.7rem', p: '2px 8px' }}>
                Kartı Taşı
              </Button>
              <Button 
                variant={isEmri.durum === 'tamamlandı' ? "contained" : "outlined"}
                size="small" 
                onClick={handleIsiTamamla}
                disabled={loading || isEmri.durum === 'tamamlandı'}
                color={isEmri.durum === 'tamamlandı' ? 'success' : 'primary'}
                sx={{ fontSize: '0.7rem', p: '2px 8px' }}
              >
                {loading ? 'İşleniyor...' : isEmri.durum === 'tamamlandı' ? 'Tamamlandı' : 'Tamamla'}
              </Button>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleUretimPlaniModalOpen}
                sx={{ fontSize: '0.7rem', p: '2px 8px' }}
              >
                Plana Ekle
              </Button>
            </Stack>
          </Box>
        </Box>
      </CardContent>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      <UretimPlaniEklemeModal
        open={uretimPlaniModalOpen}
        onClose={handleUretimPlaniModalClose}
        isEmriId={isEmri.is_emri_id}
        isEmriAdi={isEmri.is_adi}
        onSuccess={(message) => {
          setSnackbar({
            open: true,
            message: message,
            severity: 'success'
          });
        }}
        onError={(message) => {
          setSnackbar({
            open: true,
            message: message,
            severity: 'error'
          });
        }}
      />
    </Card>
  );
};

export default MobileIsEmriKartiYeni;
