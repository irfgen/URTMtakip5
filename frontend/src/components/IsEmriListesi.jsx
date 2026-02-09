import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  Avatar
} from '@mui/material';
import axios from 'axios';

const oncelikRenkleri = {
  dusuk: 'info',
  normal: 'success',
  yuksek: 'warning',
  acil: 'error'
};

const IsEmriListesi = ({ isEmirleri }) => {
  const [parcaGorselleri, setParcaGorselleri] = useState({});

  // İş emirleri için parça görsellerini yükle
  useEffect(() => {
    const tumIsEmirleri = [
      ...(isEmirleri?.Beklemede || []),
      ...(isEmirleri?.Siparis || []),
      ...(isEmirleri?.Iptal || [])
    ];

    const yukleGorseller = async () => {
      const gorseller = {};
      
      for (const isEmri of tumIsEmirleri) {
        if (isEmri.parca_kodu || isEmri.is_adi) {
          try {
            const searchTerm = isEmri.parca_kodu || isEmri.is_adi;
            const response = await axios.get(`/api/parcalar?aramaMetni=${searchTerm}`);
            
            let parcaData = [];
            // Handle different API response formats (paginated or direct array)
            if (response.data && response.data.parcalar && Array.isArray(response.data.parcalar)) {
              parcaData = response.data.parcalar;
            } else if (Array.isArray(response.data)) {
              parcaData = response.data;
            }
            
            if (parcaData.length > 0) {
              const parca = isEmri.parca_kodu 
                ? parcaData.find(p => p.parcaKodu === isEmri.parca_kodu)
                : parcaData[0];
                
              if (parca && parca.foto_path) {
                gorseller[isEmri.is_emri_id] = parca.foto_path;
              }
            }
          } catch (error) {
            console.error(`${isEmri.is_emri_no} için parça görseli alınamadı:`, error);
          }
        }
      }
      
      setParcaGorselleri(gorseller);
    };
    
    if (tumIsEmirleri.length > 0) {
      yukleGorseller();
    }
  }, [isEmirleri]);

  // Fotoğraf yolu için yardımcı fonksiyon
  const getGorselPath = (foto_path) => {
    if (!foto_path) return null;
    if (foto_path.includes('://')) return foto_path; 
    if (foto_path.startsWith('/uploads/')) return foto_path;
    if (foto_path.startsWith('/fotograflar/')) return '/uploads' + foto_path;
    if (foto_path.includes('/')) return '/uploads/fotograflar/' + foto_path.split('/').pop();
    return '/uploads/fotograflar/' + foto_path;
  };

  const renderIsEmriKarti = (isEmri, bgColor) => {
    const gorselPath = parcaGorselleri[isEmri.is_emri_id];
    
    return (
      <Card key={isEmri.is_emri_id} sx={{ mb: 1, bgcolor: bgColor, position: 'relative' }}>
        <CardContent sx={{ py: 1, '&:last-child': { pb: 1 }, position: 'relative' }}>
          {gorselPath && (
            <Box sx={{ 
              position: 'absolute', 
              top: 8, 
              right: 8, 
              width: 50, 
              height: 50, 
              zIndex: 1 
            }}>
              <Avatar 
                variant="rounded"
                sx={{ 
                  width: 50, 
                  height: 50, 
                  boxShadow: 1
                }}
                src={getGorselPath(gorselPath)}
                alt={isEmri.is_adi}
              />
            </Box>
          )}
          <Stack spacing={1} sx={{ pr: gorselPath ? 7 : 0 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2">
                #{isEmri.is_emri_no}
              </Typography>
              <Chip
                size="small"
                label={isEmri.oncelik.toUpperCase()}
                color={oncelikRenkleri[isEmri.oncelik]}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {isEmri.is_adi}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Üretim Planı: {isEmri.uretim_plani_aciklama || isEmri.plan_liste_no || (isEmri.uretim_plani_id ? `Plan #${isEmri.uretim_plani_id}` : 'Plan Dışı')}
            </Typography>
            {isEmri.setup_sayisi !== undefined && (
              <Typography variant="body2" color="text.secondary">
                Setup Sayısı: {isEmri.setup_sayisi}
              </Typography>
            )}
            {isEmri.cnc_suresi !== undefined && (
              <Typography variant="body2" color="text.secondary">
                CNC Süresi: {isEmri.cnc_suresi} dk
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
      {/* Bekleyen İş Emirleri */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Typography variant="subtitle1" sx={{ p: 1, bgcolor: 'grey.100', textAlign: 'center' }}>
          Bekleyen İş Emirleri
        </Typography>
        <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
          {isEmirleri?.Beklemede?.map((isEmri) => renderIsEmriKarti(isEmri, 'grey.50'))}
        </Box>
      </Box>

      {/* Siparişte Olan İş Emirleri */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Typography variant="subtitle1" sx={{ p: 1, bgcolor: 'grey.100', textAlign: 'center' }}>
          Siparişte
        </Typography>
        <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
          {isEmirleri?.Siparis?.map((isEmri) => renderIsEmriKarti(isEmri, '#e8f5e9'))}
        </Box>
      </Box>

      {/* İptal Edilen İş Emirleri */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Typography variant="subtitle1" sx={{ p: 1, bgcolor: 'grey.100', textAlign: 'center' }}>
          İptal
        </Typography>
        <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
          {isEmirleri?.Iptal?.map((isEmri) => renderIsEmriKarti(isEmri, '#ffebee'))}
        </Box>
      </Box>
    </Box>
  );
};

export default IsEmriListesi;