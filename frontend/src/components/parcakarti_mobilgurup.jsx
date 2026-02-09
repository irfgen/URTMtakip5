import React, { useEffect, useState } from 'react';
import { Card, CardActionArea, Box, Typography, Chip, Paper } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import ImageWithFallback from './ImageWithFallback';
import getFotoPath from './getFotoPath';
import axios from 'axios';

// Parça kartı (mobil grup için)

// partCode = parca_kodu
function ParcaKartiMobilGrup({ partCode, partName, quantity, partDetail, onClick }) {
  const [imageUrl, setImageUrl] = useState('');

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  useEffect(() => {
    if (partCode) {
      const apiUrl = `/api/parcalar/resim-yolu/${encodeURIComponent(partCode)}`;
      axios.get(apiUrl)
        .then(res => {
          const apiResimYolu = res.data?.resimYolu || '';
          const normalizedUrl = getFotoPath(apiResimYolu);
          setImageUrl(normalizedUrl || apiResimYolu);
        })
        .catch(() => {
          setImageUrl('');
        });
    }
  }, [partCode]);

  return (
    <Card sx={{ mb: 2, overflow: 'visible' }}>
      <CardActionArea onClick={handleClick}>
        <Box sx={{ display: 'flex', p: 1.5 }}>
          {/* Sol: Resim */}
          <Box sx={{ flexShrink: 0, width: 100, mr: 1.5, position: 'relative' }}>
            {imageUrl ? (
              <ImageWithFallback
                src={imageUrl}
                alt={partName}
                imgStyle={{ width: '100%', height: 100, objectFit: 'contain', borderRadius: '4px', background: '#f5f5f5', border: '1px solid #eaeaea' }}
                fallbackText={`Resim yüklenemedi!\nURL: ${imageUrl}`}
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 100, bgcolor: '#f5f5f5', borderRadius: '4px', border: '1px solid #eaeaea' }}>
                <BuildIcon sx={{ color: '#bdbdbd', fontSize: '2rem' }} />
              </Box>
            )}
          </Box>
          {/* Sağ: Bilgiler */}
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" fontWeight="bold">{partName}</Typography>
            <Chip size="small" label={`${quantity || 1} adet`} color="primary" variant="outlined" sx={{ mt: 1, mb: 1 }} />
            {partDetail && partDetail.parca_kodu && (
              <Typography variant="body2">Kod: {partDetail.parca_kodu}</Typography>
            )}
            {/* Diğer özellikler eklenebilir */}
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  );
}

export default ParcaKartiMobilGrup;
