import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';

/**
 * İyileştirilmiş ImageWithFallback komponenti
 * - Gelişmiş hata yönetimi
 * - Detaylı loglama
 */
const ImageWithFallbackV2 = ({ 
  src, 
  alt = '', 
  imgStyle = {}, 
  fallbackStyle = {}, 
  fallbackText = 'Görüntü yüklenemedi',
  sx = {},
  ...props 
}) => {
  // Görsel URL değeri durumunu başlangıçta kontrol et
  const initialErrorState = !src || typeof src !== 'string';
  const [hasError, setHasError] = useState(initialErrorState);
  const [errorDetail, setErrorDetail] = useState(initialErrorState ? 'missing_src' : null);
  const [imgAttempted, setImgAttempted] = useState(false);
  
  // Görsel yüklenme hatası için handler
  const handleError = (e) => {
    const errorSrc = e?.target?.src || src;
    // Maksimum bir kere log yapalım
    if (!imgAttempted) {
      console.warn(`Görsel yüklenemedi: ${errorSrc || 'URL belirtilmemiş'}`);
    }
    setErrorDetail(e?.type || 'load_error');
    setHasError(true);
    setImgAttempted(true);
  };

  // Kaynak URL yoksa veya geçersizse yedek göster
  if (!src || typeof src !== 'string') {
    // Her render'da log göstermeyi engelleyelim
    if (!imgAttempted) {
      console.warn('Görsel kaynağı geçersiz veya belirtilmemiş');
      setImgAttempted(true);
    }
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 1,
          border: '1px dashed #ccc',
          borderRadius: 1,
          backgroundColor: '#f8f8f8',
          minHeight: '80px',
          ...sx,
          ...fallbackStyle
        }}
      >
        <BrokenImageIcon color="disabled" sx={{ fontSize: 30, mb: 0.5 }} />
        <Typography variant="caption" color="text.secondary" align="center">
          {fallbackText}
        </Typography>
      </Box>
    );
  }

  // Hata durumunda yedek görünümü göster
  if (hasError) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 1,
          border: '1px dashed #ccc',
          borderRadius: 1,
          backgroundColor: '#f8f8f8',
          minHeight: '80px',
          ...sx,
          ...fallbackStyle
        }}
      >
        <BrokenImageIcon color="action" sx={{ fontSize: 30, mb: 0.5 }} />
        <Typography variant="caption" color="text.secondary" align="center">
          {fallbackText}
        </Typography>
        <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 0.5, fontSize: '0.7rem' }}>
          {alt || (src && typeof src === 'string' ? src.split('/').pop() : 'Görsel yok')}
        </Typography>
      </Box>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      onError={handleError} 
      style={{ maxWidth: '100%', maxHeight: '100%', ...imgStyle }} 
      loading="lazy" // Performans için lazy loading
      {...props} 
    />
  );
};

export default ImageWithFallbackV2;
