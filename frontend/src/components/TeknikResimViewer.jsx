import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import ImageWithFallback from '../components/ImageWithFallback';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import WarningIcon from '@mui/icons-material/Warning';
import { getFileType } from '../utils/imageUtils';

/**
 * Component to intelligently display technical drawings, whether they're images or PDFs
 * 
 * @param {Object} props Component props
 * @param {string} props.path Path to the technical drawing file
 * @param {Object} [props.sx={}] Additional styles for the container
 */
const TeknikResimViewer = ({ path, sx = {} }) => {
  const [fileType, setFileType] = useState('loading');
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!path) {
      setFileType('error');
      setError('Dosya yolu belirtilmemiş');
      return;
    }
    
    // Dosya türünü tespit etme
    const detectFileType = async () => {
      try {
        // İlk önce dosya uzantısına göre bir tahminde bulunalım
        const initialType = getFileType(path);
        
        if (initialType !== 'unknown') {
          // Eğer uzantıdan tanıyabildiysek direkt kullan
          setFileType(initialType);
        } else {
          // Uzantı yok veya bilinmiyorsa HEAD isteği ile dosya türünü kontrol et
          try {
            const response = await fetch(path, { method: 'HEAD' });
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('image/')) {
              setFileType('image');
            } else if (contentType && contentType.includes('application/pdf')) {
              setFileType('pdf');
            } else {
              setFileType('unknown');
            }
          } catch (err) {
            console.error('Dosya türü tespit edilirken hata:', err);
            setFileType('unknown'); // Başarısız olursa bilinmeyen olarak işaretle
          }
        }
      } catch (err) {
        console.error('Dosya türü tespit edilirken hata:', err);
        setFileType('error');
        setError('Dosya türü belirlenirken bir hata oluştu');
      }
    };
    
    detectFileType();
  }, [path]);
  
  // Yükleniyor durumu
  if (fileType === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', ...sx }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Hata durumu veya bilinmeyen dosya türü
  if (fileType === 'error' || fileType === 'unknown') {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        p: 2,
        ...sx
      }}>
        <WarningIcon color="warning" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Dosya görüntülenemiyor
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          {error || 'Bu dosya formatı görüntülenemedi. Alternatif bir program kullanarak açmayı deneyin.'}
        </Typography>
        <Button 
          variant="outlined" 
          component="a" 
          href={path} 
          target="_blank" 
          rel="noopener noreferrer"
          sx={{ mt: 2 }}
        >
          İndir
        </Button>
      </Box>
    );
  }
  
  // Resim dosyası
  if (fileType === 'image') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', bgcolor: '#f5f5f5', ...sx }}>
        <ImageWithFallback
          src={path}
          alt="Teknik Resim"
          sx={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }}
          fallbackStyle={{
            minHeight: '50vh'
          }}
          fallbackText="Teknik resim yüklenemedi"
        />
      </Box>
    );
  }
  
  // PDF dosyası
  if (fileType === 'pdf') {
    return (
      <iframe 
        src={path} 
        style={{ width: '100%', height: '100%', border: 'none', ...sx }}
        title="Teknik Resim PDF"
      />
    );
  }
  
  // CAD dosyası (dwg/dxf)
  if (fileType === 'cad') {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        p: 2,
        ...sx
      }}>
        <PictureAsPdfIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          CAD Dosyası
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          Bu CAD dosyası (.dwg/.dxf) tarayıcıda görüntülenemez. Dosyayı indirip uygun bir CAD programı ile açabilirsiniz.
        </Typography>
        <Button 
          variant="contained" 
          component="a" 
          href={path} 
          download
          sx={{ mt: 2 }}
        >
          İndir
        </Button>
      </Box>
    );
  }
  
  // Fallback
  return (
    <Box sx={{ p: 3, textAlign: 'center', ...sx }}>
      <Typography>Dosya görüntülenemiyor</Typography>
    </Box>
  );
};

export default TeknikResimViewer;
