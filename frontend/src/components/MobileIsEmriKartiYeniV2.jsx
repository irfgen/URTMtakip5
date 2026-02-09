import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, Button, Stack, Chip, Snackbar, Alert } from '@mui/material';
import ImageWithFallbackV2 from './ImageWithFallbackV2';
import UretimPlaniEklemeModal from './UretimPlaniEklemeModal';
import axios from 'axios';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { getFotoPath } from '../utils/imageUtils'; // Ortak resim yolu işleyicisi
import { useDispatch } from 'react-redux';
import { isEmirleriAPI } from '../services/api';
import { fetchIsEmirleri } from '../store/slices/isEmirleriSlice';
import { isStatusCompleted, getStatusColor, getStatusDisplayText } from '../utils/statusUtils';

/**
 * Mobil için iş emri kartı bileşeni - Versiyon 2 (İyileştirilmiş)
 * 
 * @param {Object} props.isEmri - İş emri bilgileri
 * @param {string} props.parcaGorselUrl - Dışarıdan verilen parça görseli URL'i (isteğe bağlı)
 * @param {function} props.onTezgahAta - Tezgah ata butonuna tıklandığında çalışacak fonksiyon
 * @param {function} props.onEdit - Düzenle butonuna tıklandığında çalışacak fonksiyon
 * @param {function} props.onMoveCard - Kartı Taşı butonuna tıklandığında çalışacak fonksiyon
 */
const MobileIsEmriKartiYeniV2 = ({ isEmri, parcaGorselUrl, onTezgahAta, onEdit, onMoveCard }) => {
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

  // Durum metni ve renk için state
  const [durumMetni, setDurumMetni] = useState(String(durum || 'Bilinmiyor'));
  const [durumRengi, setDurumRengi] = useState('default');

  const formatDate = (dateString) => {
    if (!dateString) return 'Belirtilmemiş';
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: tr });
    } catch (e) {
      return 'Geçersiz Tarih';
    }
  };

  // Web ile aynı mantık: Her kart kendi parça bilgisini yükler
  const emriId = isEmri.id || isEmri.is_emri_id;
  const [parcaBilgisi, setParcaBilgisi] = useState(null);
  const [gorselUrl, setGorselUrl] = useState('');
  const defaultImageUrl = '/default-part.svg';

  // İş emrini tamamlandı olarak işaretle
  const handleIsiTamamla = async () => {
    try {
      setLoading(true);
      
      // İş emrinin durumunu doğrudan 'tamamlandı' olarak güncelle
      await isEmirleriAPI.update(isEmri.is_emri_id, {
        ...isEmri,
        durum: 'tamamlandı'
      });
      
      // Redux store'u güncelle
      await dispatch(fetchIsEmirleri()).unwrap();
      
      setSnackbar({
        open: true,
        message: `İş emri #${isEmri.is_emri_no} başarıyla tamamlandı olarak işaretlendi`,
        severity: 'success'
      });
      
    } catch (error) {
      console.error('İş tamamlama hatası:', error);
      setSnackbar({
        open: true,
        message: 'İş tamamlama işlemi başarısız oldu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleUretimPlaniModalOpen = () => {
    setUretimPlaniModalOpen(true);
  };

  const handleUretimPlaniModalClose = () => {
    setUretimPlaniModalOpen(false);
  };

  useEffect(() => {
    let aktif = true;
    async function fetchParca() {
      // Web mantığı: önce işEmri.parca_kodu, sonra parca?.parca_kodu, sonra is_adi
      const aramaMetni = isEmri.parca_kodu || parca?.parca_kodu || is_adi;
      console.log('Parça arama metni:', aramaMetni);

      if (parca && parca.foto_path) {
        setParcaBilgisi(parca);
        setGorselUrl(getFotoPath(parca.foto_path));
        return;
      }
      if (!aramaMetni) {
        setGorselUrl(defaultImageUrl);
        return;
      }
      try {
        const response = await axios.get(`/api/parcalar?aramaMetni=${encodeURIComponent(aramaMetni)}`);
        let parcaData = [];
        if (response.data && response.data.parcalar && Array.isArray(response.data.parcalar)) {
          parcaData = response.data.parcalar;
        } else if (Array.isArray(response.data)) {
          parcaData = response.data;
        }
        const matched = parcaData.find(p => p.parcaKodu === aramaMetni) || parcaData[0];
        console.log('API yanıtı:', response.data, 'Eşleşen parça:', matched);
        if (aktif) {
          setParcaBilgisi(matched);
          setGorselUrl(
            matched && matched.foto_path && matched.foto_path.trim() !== ''
              ? getFotoPath(matched.foto_path)
              : defaultImageUrl
          );
        }
      } catch (e) {
        if (aktif) setGorselUrl(defaultImageUrl);
      }
    }
    fetchParca();
    return () => { aktif = false; };
  }, [isEmri.parca_kodu, parca?.parca_kodu, is_adi, parca]);
  
  // Durum metni ve renk bilgilerini async olarak yükle
  useEffect(() => {
    const loadStatusInfo = async () => {
      if (durum) {
        try {
          const [displayText, color] = await Promise.all([
            getStatusDisplayText(durum),
            getStatusColor(durum)
          ]);
          
          // String olarak güvenli değer set et
          const safeDisplayText = String(displayText || durum || 'Bilinmiyor');
          setDurumMetni(safeDisplayText);
          
          // Renk için MUI uyumlu değer set et
          const materialUIColors = ['default', 'primary', 'secondary', 'error', 'info', 'success', 'warning'];
          const safeColor = materialUIColors.includes(color) ? color : 'default';
          setDurumRengi(safeColor);
          
        } catch (error) {
          console.error('Status info loading error:', error);
          setDurumMetni(String(durum || 'Bilinmiyor'));
          setDurumRengi('default');
        }
      } else {
        // durum yoksa güvenli default değer set et
        setDurumMetni('Bilinmiyor');
        setDurumRengi('default');
      }
    };
    loadStatusInfo();
  }, [durum]);

  // Debug log (isteğe bağlı)
  // useEffect(() => { console.log('Mobil kart görsel:', gorselUrl, parcaBilgisi); }, [gorselUrl, parcaBilgisi]);

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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f8f8',
            position: 'relative' // Eklendi - pozisyon ayarı için
          }}>
            <ImageWithFallbackV2
              src={gorselUrl || defaultImageUrl}
              alt={parcaBilgisi?.parca_adi || parca?.parca_adi || is_adi || 'Parça görseli'}
              imgStyle={{
                position: 'absolute', // Absolute pozisyon
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) scale(1.5)', // Merkeze hizalama ve büyütme
                width: '100%',
                height: '100%',
                objectFit: 'contain', // İçeriğin tümünü göstermeye çalış
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
              fallbackText={parcaBilgisi?.parca_kodu || parca?.parca_kodu || "Görsel Yok"}
            />
          </Box>

          {/* Sağ Taraf: Detaylar ve Butonlar */}
          <Box flexGrow={1} display="flex" flexDirection="column" justifyContent="space-between">
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                  {is_emri_no || `#${emriId}`}
                </Typography>
                <Chip
                  label={durumMetni}
                  color={durumRengi}
                  size="small"
                />
              </Box>
              <Typography variant="body1" gutterBottom sx={{ fontSize: '0.9rem' }}>
                {is_adi}
              </Typography>
              {parca && (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  <strong>Parça:</strong> {parca.parca_kodu} {parca.parca_adi ? `(${parca.parca_adi})` : ''}
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
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleIsiTamamla} 
                disabled={loading || isStatusCompleted(isEmri.durum)}
                color={isStatusCompleted(isEmri.durum) ? 'success' : 'primary'}
                sx={{ fontSize: '0.7rem', p: '2px 8px' }}
              >
                {loading ? 'İşleniyor...' : isStatusCompleted(isEmri.durum) ? 'Tamamlandı' : 'Tamamla'}
              </Button>
              <Button variant="outlined" size="small" onClick={() => onEdit(isEmri)} sx={{ fontSize: '0.7rem', p: '2px 8px' }}>
                Düzenle
              </Button>
              <Button variant="outlined" size="small" onClick={() => onMoveCard(isEmri)} sx={{ fontSize: '0.7rem', p: '2px 8px' }}>
                Kartı Taşı
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
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default MobileIsEmriKartiYeniV2;
