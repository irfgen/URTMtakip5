/**
 * İş Emri Rapor Kartı Component
 *
 * Bu component, günlük vardiya raporunda iş emirlerini
 * resimli kartlar halinde gösterir.
 *
 * @author PM Agent
 * @version 1.1.0
 * @since 2026-01-08
 */

import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Sync as SyncIcon,
  Error as ErrorIcon,
  Cancel as CancelIcon,
  Image as ImageIcon,
  AccessTime as AccessTimeIcon,
  Snooze as SnoozeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ImageWithFallback from '../ImageWithFallback';

// Teknik resim yolu için yardımcı fonksiyon - SADECE resim dosyalarını göster
const getTeknikResimPath = (teknik_resim_path) => {
  if (!teknik_resim_path) return '';

  // Sadece resim dosyalarını göster (PDF, DOC vb. gösterme)
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
  const hasImageExtension = imageExtensions.some(ext =>
    teknik_resim_path.toLowerCase().endsWith(ext)
  );

  if (!hasImageExtension) return '';

  if (teknik_resim_path.includes('://')) return teknik_resim_path;
  if (teknik_resim_path.startsWith('/uploads/')) return teknik_resim_path;
  if (teknik_resim_path.startsWith('/teknik_resimler/')) return '/uploads' + teknik_resim_path;
  if (teknik_resim_path.includes('/')) return '/uploads/teknik_resimler/' + teknik_resim_path.split('/').pop();
  return '/uploads/teknik_resimler/' + teknik_resim_path;
};

const IsEmriRaporKarti = ({ isEmri, onClick, calismaBilgileri }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (onClick) {
      onClick(isEmri);
    } else {
      // Varsayılan: İş emri detay sayfasına git
      navigate(`/is-emirleri/${isEmri.is_emri_id}`);
    }
  };

  // Durum renkleri ve icon'ları
  const durumConfig = {
    tamamlandi: {
      color: 'success',
      borderColor: '#4caf50',
      icon: <CheckCircleIcon />,
      label: 'Tamamlandı'
    },
    aktif: {
      color: 'primary',
      borderColor: '#2196f3',
      icon: <SyncIcon />,
      label: 'Aktif'
    },
    beklemede: {
      color: 'warning',
      borderColor: '#ff9800',
      icon: <ErrorIcon />,
      label: 'Beklemede'
    },
    iptal: {
      color: 'error',
      borderColor: '#f44336',
      icon: <CancelIcon />,
      label: 'İptal'
    },
    planlanmis: {
      color: 'default',
      borderColor: '#9e9e9e',
      icon: <SyncIcon />,
      label: 'Planlandı'
    }
  };

  const durum = durumConfig[isEmri.durum] || durumConfig.planlanmis;

  // İlerleme yüzdesi
  const ilerlemeYuzdesi = isEmri.adet > 0
    ? Math.round((isEmri.tamamlanan_adet / isEmri.adet) * 100)
    : 0;

  const resimPath = getTeknikResimPath(isEmri.teknik_resim);

  // Çalışma bilgileri formatlama
  const formatSureDakika = (dk) => {
    if (!dk || dk <= 0) return '-';
    const saat = Math.floor(dk / 60);
    const dakika = Math.round(dk % 60);
    if (saat > 0 && dakika > 0) return `${saat}s ${dakika}d`;
    if (saat > 0) return `${saat} saat`;
    return `${dakika} dk`;
  };

  return (
    <Card
      sx={{
        border: 2,
        borderColor: durum.borderColor,
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        },
        opacity: isEmri.durum === 'iptal' ? 0.6 : 1
      }}
      onClick={handleCardClick}
    >
      <CardContent>
        <Box display="flex" flexDirection="column" gap={1}>
          {/* Resim ve Başlık */}
          <Box display="flex" alignItems="center" gap={2}>
            {/* Resim/Thumbnail */}
            <Box
              sx={{
                width: 80,
                height: 80,
                flexShrink: 0,
                borderRadius: 2,
                overflow: 'hidden',
                backgroundColor: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {resimPath ? (
                <ImageWithFallback
                  src={resimPath}
                  alt={isEmri.parca_adi || isEmri.is_adi}
                  imgStyle={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover'
                  }}
                  fallbackStyle={{
                    width: '80px',
                    height: '80px'
                  }}
                  fallbackText="Resim yok"
                  sx={{ width: 80, height: 80 }}
                />
              ) : (
                <ImageIcon color="action" sx={{ fontSize: 40 }} />
              )}
            </Box>

            {/* İş Emri Bilgileri */}
            <Box flex={1}>
              <Typography variant="subtitle2" color="text.secondary">
                {isEmri.is_emri_no}
              </Typography>
              <Typography variant="h6" noWrap>
                {isEmri.parca_adi || isEmri.is_adi || 'İs Adı Belirtilmemiş'}
              </Typography>

              {/* Durum Chip */}
              <Chip
                icon={durum.icon}
                label={durum.label}
                color={durum.color}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>

          {/* Adet ve İlerleme */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {isEmri.tamamlanan_adet || 0} / {isEmri.adet || 0} adet
            </Typography>
            <LinearProgress
              variant="determinate"
              value={ilerlemeYuzdesi}
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: 'grey.200'
              }}
            />
            <Box display="flex" justifyContent="space-between" mt={0.5}>
              <Typography variant="caption" color="text.secondary">
                %{ilerlemeYuzdesi} tamamlandı
              </Typography>
              <Typography variant="caption" color={durum.color}>
                {isEmri.durum === 'tamamlandi' ? '✅' : '🔄'}
              </Typography>
            </Box>
          </Box>

          {/* YENİ: Vardiya Çalışma Bilgileri */}
          {calismaBilgileri && (
            <Box
              sx={{
                mt: 1,
                p: 1,
                backgroundColor: 'action.hover',
                borderRadius: 1
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom fontWeight={600}>
                Bu Vardiyada:
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center" gap={1}>
                  <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="body2" fontWeight={500}>
                    {formatSureDakika(calismaBilgileri.sure_dakika)}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <SnoozeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="body2" fontWeight={500}>
                    {calismaBilgileri.islem_sayisi} işlem
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default IsEmriRaporKarti;
