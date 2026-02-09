import React, { useState } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Chip,
  Box,
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Tooltip,
  useTheme,
  useMediaQuery,
  Skeleton,
  Badge,
  ImageList,
  ImageListItem
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Schedule as TimeIcon,
  Category as CategoryIcon,
  Collections as CollectionsIcon
} from '@mui/icons-material';
import useDeviceDetect from '../../hooks/useDeviceDetect';

import { formatGoreliTarih, getResimUrl, getTextColor } from '../../services/notlarService';
import * as notlarService from '../../services/notlarService';

const NotKarti = ({ not, kategoriler = [], onDuzenle, onGuncellendi, onSilindi }) => {
  const theme = useTheme();
  const { isMobile } = useDeviceDetect();

  // State
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [silmeDialogAcik, setSilmeDialogAcik] = useState(false);
  const [loading, setLoading] = useState(false);

  // Resimler için state
  const [seciliResimIndex, setSeciliResimIndex] = useState(0);
  const [resimDialogAcik, setResimDialogAcik] = useState(false);
  const [yuklenenResimler, setYuklenenResimler] = useState(new Set());

  // Resimler array'i
  const resimler = not.resimler || [];
  const resimSayisi = resimler.length;

  // Ana resim (ilk resim veya eski resim_yolu)
  const anaResim = resimler.length > 0 
    ? getResimUrl(resimler[0].resim_yolu)
    : getResimUrl(not.resim_yolu);

  // Menu handlers
  const handleMenuAc = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuKapat = () => {
    setMenuAnchor(null);
  };

  // Düzenleme handler
  const handleDuzenle = () => {
    handleMenuKapat();
    onDuzenle(not);
  };

  // Resim handlers
  const handleResimYuklendi = (index) => {
    setYuklenenResimler(prev => new Set([...prev, index]));
  };

  const handleResimTikla = () => {
    if (resimSayisi > 0) {
      setResimDialogAcik(true);
    }
  };

  const handleResimDialogKapat = () => {
    setResimDialogAcik(false);
    setSeciliResimIndex(0);
  };

  // Silme handlers
  const handleSilmeIsteği = () => {
    console.log('handleSilmeIsteği çağrıldı, not ID:', not.id);
    handleMenuKapat();
    setSilmeDialogAcik(true);
  };

  const handleSilmeIptal = () => {
    console.log('handleSilmeIptal çağrıldı');
    setSilmeDialogAcik(false);
  };

  const handleSilmeOnayla = async () => {
    console.log('handleSilmeOnayla çağrıldı, not ID:', not.id);
    try {
      setLoading(true);
      console.log('deleteNot API çağrısı yapılıyor...');
      await notlarService.deleteNot(not.id);
      console.log('deleteNot API çağrısı başarılı');
      setSilmeDialogAcik(false);
      if (onSilindi) {
        console.log('onSilindi callback çağrılıyor');
        onSilindi();
      }
    } catch (error) {
      console.error('Not silme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  // Kategori bilgilerini bul
  const kategori = kategoriler.find(k => k.id === not.kategori_id);

  // Not özeti oluştur
  const notOzeti = not.icerik ? (
    not.icerik.length > 120 
      ? not.icerik.substring(0, 120) + '...'
      : not.icerik
  ) : '';

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8],
          },
          position: 'relative'
        }}
        elevation={2}
      >
        {/* Kategori chip (üst sağ) */}
        {kategori && (
          <Chip
            label={kategori.kategori_adi}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: kategori.renk_kodu,
              color: getTextColor(kategori.renk_kodu),
              fontWeight: 500,
              zIndex: 1,
              fontSize: '0.75rem'
            }}
          />
        )}

        {/* Menu butonu (üst sağ) */}
        <IconButton
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
            zIndex: 2,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
            }
          }}
          size="small"
          onClick={handleMenuAc}
        >
          <MoreIcon fontSize="small" />
        </IconButton>

        {/* Resim */}
        {anaResim ? (
          <Box sx={{ position: 'relative' }}>
            <CardMedia
              component="img"
              height={isMobile ? "160" : "180"}
              image={anaResim}
              alt={not.baslik}
              onLoad={() => handleResimYuklendi(0)}
              onClick={handleResimTikla}
              sx={{
                objectFit: 'cover',
                backgroundColor: 'grey.100',
                cursor: resimSayisi > 0 ? 'pointer' : 'default',
                display: yuklenenResimler.has(0) ? 'block' : 'none'
              }}
              crossOrigin="anonymous"
            />
            
            {/* Çoklu resim badge */}
            {resimSayisi > 1 && (
              <Badge
                badgeContent={resimSayisi}
                color="primary"
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  '& .MuiBadge-badge': {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    fontSize: '0.75rem',
                    padding: '0 6px',
                    minWidth: '20px',
                    height: '20px'
                  }
                }}
              >
                <CollectionsIcon sx={{ color: 'white', fontSize: 20 }} />
              </Badge>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              height: isMobile ? 160 : 180,
              backgroundColor: 'grey.100',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'grey.400'
            }}
          >
            <ImageIcon sx={{ fontSize: 48 }} />
          </Box>
        )}

        {/* Loading skeleton for image */}
        {anaResim && !yuklenenResimler.has(0) && (
          <Skeleton 
            variant="rectangular" 
            height={isMobile ? 160 : 180}
            sx={{ backgroundColor: 'grey.100' }}
          />
        )}

        {/* İçerik */}
        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          {/* Başlık */}
          <Typography
            variant="h6"
            component="h3"
            sx={{
              fontWeight: 600,
              mb: 1,
              fontSize: isMobile ? '1rem' : '1.1rem',
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {not.baslik}
          </Typography>

          {/* İçerik özeti */}
          {notOzeti && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {notOzeti}
            </Typography>
          )}

          {/* Tarih */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: 'text.secondary',
              fontSize: '0.75rem'
            }}
          >
            <TimeIcon sx={{ fontSize: 14, mr: 0.5 }} />
            <Typography variant="caption">
              {formatGoreliTarih(not.olusturma_tarihi)}
            </Typography>
          </Box>
        </CardContent>

        {/* Alt action'lar */}
        <CardActions
          sx={{
            px: 2,
            pb: 2,
            pt: 0,
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          {/* Resim ikonu */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {resimSayisi > 0 && (
              <Tooltip title={`${resimSayisi} resim`}>
                <Box sx={{ display: 'flex', alignItems: 'center', color: 'primary.main' }}>
                  {resimSayisi > 1 ? (
                    <CollectionsIcon sx={{ fontSize: 16 }} />
                  ) : (
                    <ImageIcon sx={{ fontSize: 16 }} />
                  )}
                  <Typography variant="caption" sx={{ ml: 0.5 }}>
                    {resimSayisi}
                  </Typography>
                </Box>
              </Tooltip>
            )}
          </Box>

          {/* Action butonları */}
          <Box>
            <Tooltip title="Düzenle">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDuzenle();
                }}
                sx={{ mr: 0.5 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Sil">
              <IconButton
                size="small"
                onClick={(e) => {
                  console.log('Sil butonu tıklandı, not ID:', not.id);
                  e.stopPropagation();
                  handleSilmeIsteği();
                }}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </CardActions>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuKapat}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleDuzenle}>
          <EditIcon sx={{ mr: 1, fontSize: 18 }} />
          Düzenle
        </MenuItem>
        <MenuItem onClick={() => {
          console.log('Menu Sil tıklandı, not ID:', not.id);
          handleSilmeIsteği();
        }} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 18 }} />
          Sil
        </MenuItem>
      </Menu>

      {/* Silme Confirmation Dialog */}
      <Dialog
        open={silmeDialogAcik}
        onClose={handleSilmeIptal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Notu Sil
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>"{not.baslik}"</strong> başlıklı notu silmek istediğinizden emin misiniz?
            {resimSayisi > 0 && (
              <>
                <br />
                <br />
                <strong>Uyarı:</strong> Bu işlem notun {resimSayisi} adet resmini de kalıcı olarak silecektir.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleSilmeIptal}
            disabled={loading}
          >
            İptal
          </Button>
          <Button 
            onClick={handleSilmeOnayla}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Siliniyor...' : 'Sil'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resim Galeri Dialog */}
      <Dialog
        open={resimDialogAcik}
        onClose={handleResimDialogKapat}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {not.baslik} - Resimler ({seciliResimIndex + 1}/{resimSayisi})
            </Typography>
            <IconButton onClick={handleResimDialogKapat} sx={{ color: 'white' }}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {resimler.length > 0 && (
            <Box>
              {/* Ana resim */}
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <img
                  src={getResimUrl(resimler[seciliResimIndex]?.resim_yolu)}
                  alt={`Resim ${seciliResimIndex + 1}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '60vh',
                    objectFit: 'contain'
                  }}
                />
              </Box>
              
              {/* Thumbnail'lar */}
              {resimler.length > 1 && (
                <ImageList
                  sx={{ width: '100%', height: 120, m: 0 }}
                  cols={Math.min(resimler.length, 6)}
                  rowHeight={100}
                >
                  {resimler.map((resim, index) => (
                    <ImageListItem 
                      key={resim.id || index}
                      sx={{ 
                        cursor: 'pointer',
                        border: seciliResimIndex === index ? '2px solid white' : '2px solid transparent',
                        borderRadius: 1
                      }}
                      onClick={() => setSeciliResimIndex(index)}
                    >
                      <img
                        src={getResimUrl(resim.resim_yolu)}
                        alt={`Thumbnail ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotKarti;
