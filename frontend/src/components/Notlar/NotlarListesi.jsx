import React from 'react';
import {
  Grid,
  Typography,
  Pagination,
  Box,
  Skeleton,
  Card,
  CardContent,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  StickyNote2 as NoteIcon
} from '@mui/icons-material';
import useDeviceDetect from '../../hooks/useDeviceDetect';

import NotKarti from './NotKarti';

const NotlarListesi = ({
  notlar = [],
  loading = false,
  sayfalama = {},
  onSayfaDegisti,
  onNotDuzenle,
  onNotGuncellendi,
  onNotSilindi,
  kategoriler = []
}) => {
  const theme = useTheme();
  const { isMobile } = useDeviceDetect();

  // Loading skeleton
  const renderSkeletons = () => {
    return Array.from({ length: sayfalama.limit || 12 }).map((_, index) => (
      <Grid 
        item 
        xs={12} 
        sm={isMobile ? 12 : 6} 
        md={isMobile ? 12 : 4} 
        lg={isMobile ? 12 : 3} 
        key={`skeleton-${index}`}
      >
        <Card>
          <Skeleton variant="rectangular" height={200} />
          <CardContent>
            <Skeleton variant="text" height={28} sx={{ mb: 1 }} />
            <Skeleton variant="text" height={20} />
            <Skeleton variant="text" height={20} width="60%" />
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton variant="circular" width={24} height={24} />
              <Skeleton variant="rectangular" width={60} height={24} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    ));
  };

  // Empty state
  const renderEmptyState = () => (
    <Grid item xs={12}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
          textAlign: 'center'
        }}
      >
        <NoteIcon
          sx={{
            fontSize: 80,
            color: 'text.secondary',
            mb: 2,
            opacity: 0.5
          }}
        />
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Henüz not bulunamadı
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          İlk notunuzu oluşturmak için sağ alttaki + butonuna tıklayın.
        </Typography>
        <Alert severity="info" sx={{ maxWidth: 400 }}>
          <Typography variant="body2">
            <strong>İpucu:</strong> Notlarınızı kategorilere ayırarak daha organize hale getirebilirsiniz.
          </Typography>
        </Alert>
      </Box>
    </Grid>
  );

  // Sayfa değiştirme handler
  const handleSayfaDegisti = (event, page) => {
    if (onSayfaDegisti) {
      onSayfaDegisti(page);
    }
    // Sayfanın en üstüne kaydır
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box>
      {/* Header bilgileri */}
      {!loading && notlar.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            {sayfalama.toplam_kayit} nottan {' '}
            {((sayfalama.mevcut_sayfa - 1) * sayfalama.limit) + 1}-
            {Math.min(sayfalama.mevcut_sayfa * sayfalama.limit, sayfalama.toplam_kayit)} 
            {' '}arası gösteriliyor
          </Typography>
        </Box>
      )}

      {/* Not kartları grid */}
      <Grid container spacing={isMobile ? 2 : 3}>
        {loading ? (
          renderSkeletons()
        ) : notlar.length === 0 ? (
          renderEmptyState()
        ) : (
          notlar.map((not) => (
            <Grid 
              item 
              xs={12}
              sm={isMobile ? 12 : 6}
              md={isMobile ? 12 : 4}
              lg={isMobile ? 12 : 3}
              key={not.id}
            >
              <NotKarti
                not={not}
                kategoriler={kategoriler}
                onDuzenle={onNotDuzenle}
                onGuncellendi={onNotGuncellendi}
                onSilindi={onNotSilindi}
              />
            </Grid>
          ))
        )}
      </Grid>

      {/* Pagination */}
      {!loading && notlar.length > 0 && sayfalama.toplam_sayfa > 1 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 4,
            mb: 2
          }}
        >
          <Pagination
            count={sayfalama.toplam_sayfa}
            page={sayfalama.mevcut_sayfa}
            onChange={handleSayfaDegisti}
            color="primary"
            size={isMobile ? "small" : "medium"}
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPaginationItem-root': {
                fontSize: isMobile ? '0.75rem' : '0.875rem'
              }
            }}
          />
        </Box>
      )}

      {/* Sayfa bilgileri (mobile için) */}
      {!loading && notlar.length > 0 && sayfalama.toplam_sayfa > 1 && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Sayfa {sayfalama.mevcut_sayfa} / {sayfalama.toplam_sayfa}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default NotlarListesi;
