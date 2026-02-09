import React from 'react';
import { Badge, Tooltip } from '@mui/material';

/**
 * Durum bilgisini gösteren badge bileşeni
 * @param {object} props - Bileşen props'ları
 * @param {string} props.durum - Durum değeri
 * @param {string} props.type - Badge tipi (makina, tezgah, vb.)
 * @param {boolean} props.showTooltip - Tooltip gösterilsin mi
 * @param {string} props.size - Badge boyutu
 * @returns {JSX.Element} - Durum badge bileşeni
 */
const DurumBadge = ({ 
  durum, 
  type = 'default', 
  showTooltip = true, 
  size = 'small' 
}) => {
  // Makina durumları için renk ve metin mapping
  const makinaDurumMap = {
    aktif: { color: 'success', text: 'Aktif' },
    pasif: { color: 'error', text: 'Pasif' },
    bakim: { color: 'warning', text: 'Bakımda' },
  };

  // Tezgah durumları için renk ve metin mapping
  const tezgahDurumMap = {
    musait: { color: 'success', text: 'Müsait' },
    calisiyor: { color: 'info', text: 'Çalışıyor' },
    bakim: { color: 'warning', text: 'Bakımda' },
    arizada: { color: 'error', text: 'Arızada' },
  };

  // İş emri durumları için renk ve metin mapping
  const isEmriDurumMap = {
    beklemede: { color: 'default', text: 'Beklemede' },
    planlandi: { color: 'primary', text: 'Planlandı' },
    tezgahta: { color: 'info', text: 'Tezgahta' },
    tamamlandi: { color: 'success', text: 'Tamamlandı' },
    iptal: { color: 'error', text: 'İptal' },
    ara_verildi: { color: 'warning', text: 'Ara Verildi' },
  };

  // Tip'e göre uygun map'i seç
  let durumMap = {};
  switch (type) {
    case 'makina':
      durumMap = makinaDurumMap;
      break;
    case 'tezgah':
      durumMap = tezgahDurumMap;
      break;
    case 'isEmri':
      durumMap = isEmriDurumMap;
      break;
    default:
      durumMap = {
        // Varsayılan durumlar
        aktif: { color: 'success', text: 'Aktif' },
        pasif: { color: 'error', text: 'Pasif' },
        musait: { color: 'success', text: 'Müsait' },
        calisiyor: { color: 'info', text: 'Çalışıyor' },
        tamamlandi: { color: 'success', text: 'Tamamlandı' },
      };
  }

  // Durum bilgisini al
  const durumInfo = durumMap[durum] || { 
    color: 'default', 
    text: durum || 'Bilinmeyen' 
  };

  const badge = (
    <Badge 
      color={durumInfo.color} 
      variant="dot"
      sx={{ 
        marginRight: 1,
        '& .MuiBadge-dot': {
          width: size === 'small' ? 6 : 8,
          height: size === 'small' ? 6 : 8,
        }
      }}
    >
      <span style={{ 
        fontSize: size === 'small' ? '0.75rem' : '0.875rem',
        color: durumInfo.color === 'default' ? '#666' : 'inherit'
      }}>
        {durumInfo.text}
      </span>
    </Badge>
  );

  // Tooltip gösterilecekse wrap et
  if (showTooltip) {
    return (
      <Tooltip title={durumInfo.text} placement="top">
        {badge}
      </Tooltip>
    );
  }

  return badge;
};

export default DurumBadge;