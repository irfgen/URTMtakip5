import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  IconButton,
  Chip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';

const ParcaKayitKarti = ({ kayit, onImageClick, onDelete }) => {
  // Dosya uzantısına göre ikon belirleme
  const getFileIcon = (filePath) => {
    const extension = filePath.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
        return <ImageIcon />;
      case 'pdf':
        return <PdfIcon />;
      case 'doc':
      case 'docx':
      case 'txt':
      case 'rtf':
        return <DocIcon />;
      default:
        return <FileIcon />;
    }
  };

  // Dosyanın resim olup olmadığını kontrol etme
  const isImage = (filePath) => {
    const extension = filePath.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension);
  };
  // Dosya adını path'den çıkarma (hem Windows hem Unix path'leri için)
  const getFileName = (filePath) => {
    if (!filePath) return '';
    // Hem / hem \ karakterlerini destekle
    return filePath.split(/[/\\]/).pop();
  };

  // Tarihi formatla
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };  // Dosya yolunu API endpoint'ine çevir
  const getFileUrl = (filePath) => {
    const fileName = getFileName(filePath);
    return `/api/parca-kayitlari/dosya/${fileName}`;
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        '&:hover': {
          boxShadow: 3
        }
      }}
    >
      {/* Önizleme Alanı */}
      <Box
        sx={{
          height: 150,
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isImage(kayit.dosyaYolu) ? 'pointer' : 'default',
          position: 'relative'
        }}
        onClick={() => isImage(kayit.dosyaYolu) && onImageClick(getFileUrl(kayit.dosyaYolu))}
      >
        {isImage(kayit.dosyaYolu) ? (
          <CardMedia
            component="img"
            height="150"
            image={getFileUrl(kayit.dosyaYolu)}
            alt="Parça Kayıt Önizleme"
            sx={{ 
              objectFit: 'contain',
              backgroundColor: 'white'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : (
          <Box sx={{ color: 'text.secondary', fontSize: 48 }}>
            {getFileIcon(kayit.dosyaYolu)}
          </Box>
        )}
        
        {/* Resim değilse alternatif ikon */}
        {isImage(kayit.dosyaYolu) && (
          <Box 
            sx={{ 
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              width: '100%',
              height: '100%',
              color: 'text.secondary',
              fontSize: 48
            }}
          >
            {getFileIcon(kayit.dosyaYolu)}
          </Box>
        )}
      </Box>

      {/* Kart İçeriği */}
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        {/* Parça Kodu */}
        <Typography variant="h6" component="div" sx={{ mb: 1, fontSize: '1rem' }}>
          {kayit.parcaKodu}
        </Typography>

        {/* Kayıt Tarihi */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {formatDate(kayit.kayitZamani)}
        </Typography>

        {/* Sıra Numarası */}
        <Chip 
          label={`#${kayit.siraNo}`} 
          size="small" 
          variant="outlined" 
          sx={{ mb: 1 }}
        />

        {/* Dosya Adı */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 1,
            wordBreak: 'break-all',
            fontSize: '0.75rem'
          }}
        >
          {getFileName(kayit.dosyaYolu)}
        </Typography>

        {/* Not varsa göster */}
        {kayit.not && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontStyle: 'italic',
              fontSize: '0.75rem'
            }}
          >
            "{kayit.not}"
          </Typography>
        )}
      </CardContent>

      {/* Sil Butonu */}
      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
        <IconButton
          onClick={onDelete}
          size="small"
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: 'error.main'
            }
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </Card>
  );
};

export default ParcaKayitKarti;
