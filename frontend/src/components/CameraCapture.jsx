import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogContent,
  Card,
  CardMedia,
  Fab
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  CameraAlt as CameraAltIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  FlipCameraIos as FlipCameraIcon,
  Check as CheckIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

const CameraCapture = ({ 
  open = false, 
  onClose, 
  onCapture, 
  onError,
  aspectRatio = 'auto' // 'auto', '4:3', '16:9', 'square'
}) => {
  const [stream, setStream] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' (front) or 'environment' (back)
  const [isCapturing, setIsCapturing] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Kamera akışını başlat
  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Mevcut stream'i durdur
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Kamera kısıtlamaları
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          aspectRatio: aspectRatio === '4:3' ? 4/3 : 
                      aspectRatio === '16:9' ? 16/9 :
                      aspectRatio === 'square' ? 1 : undefined
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

    } catch (err) {
      console.error('Kamera erişim hatası:', err);
      let errorMessage = 'Kameraya erişilemiyor';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Kamera erişimi reddedildi. Lütfen tarayıcı ayarlarından kamera iznini etkinleştirin.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'Kamera bulunamadı. Lütfen cihazınızda kamera olduğundan emin olun.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Tarayıcınız kamera erişimini desteklemiyor.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Kamera ayarları desteklenmiyor. Farklı ayarlarla tekrar deneyiniz.';
      }
      
      setError(errorMessage);
      onError && onError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Kamera akışını durdur
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Fotoğraf çek
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Video kaynağı bulunamadı');
      return;
    }

    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Canvas boyutlarını video boyutlarına ayarla
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Videodan fotoğraf yakala
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Canvas'ı base64 string'e dönüştür
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      // Blob formatında da al (API gönderimi için)
      canvas.toBlob((blob) => {
        const imageData = {
          dataUrl: imageDataUrl,
          blob: blob,
          width: canvas.width,
          height: canvas.height,
          timestamp: new Date().toISOString()
        };

        setCapturedImage(imageData);
        setIsCapturing(false);
      }, 'image/jpeg', 0.8);

    } catch (err) {
      console.error('Fotoğraf çekme hatası:', err);
      setError('Fotoğraf çekilirken hata oluştu');
      setIsCapturing(false);
    }
  };

  // Kamera yönünü değiştir (ön/arka)
  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Çekilen fotoğrafı onayla
  const confirmCapture = () => {
    if (capturedImage && onCapture) {
      onCapture(capturedImage);
      setCapturedImage(null);
      onClose && onClose();
    }
  };

  // Çekilen fotoğrafı iptal et
  const cancelCapture = () => {
    setCapturedImage(null);
  };

  // Modal açıldığında kamerayı başlat
  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
      setError(null);
    }

    return () => {
      stopCamera();
    };
  }, [open, facingMode]);

  // Mobil cihaz kontrolü
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          bgcolor: 'black',
          m: 0,
          ...(isMobile && {
            height: '100%',
            maxHeight: '100%',
            borderRadius: 0
          })
        }
      }}
    >
      <DialogContent sx={{ p: 0, position: 'relative', bgcolor: 'black' }}>
        {/* Üst kontrol çubuğu */}
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 2,
          p: 1,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <IconButton onClick={onClose} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
            
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
              Teknik Resim Çek
            </Typography>
            
            <IconButton onClick={toggleCamera} sx={{ color: 'white' }}>
              <FlipCameraIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Ana kamera görünümü */}
        <Box sx={{ 
          position: 'relative', 
          width: '100%', 
          height: isMobile ? '100vh' : '70vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'black'
        }}>
          {isLoading && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: 2,
              color: 'white'
            }}>
              <CircularProgress sx={{ color: 'white' }} />
              <Typography>Kamera açılıyor...</Typography>
            </Box>
          )}

          {error && (
            <Box sx={{ p: 3, maxWidth: 400 }}>
              <Alert 
                severity="error" 
                action={
                  <Button color="inherit" size="small" onClick={startCamera}>
                    Tekrar Dene
                  </Button>
                }
              >
                {error}
              </Alert>
            </Box>
          )}

          {/* Çekilen fotoğraf önizlemesi */}
          {capturedImage && (
            <Box sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'black'
            }}>
              <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                <img 
                  src={capturedImage.dataUrl}
                  alt="Çekilen Fotoğraf"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
              </Box>
              
              {/* Fotoğraf onay kontrolleri */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 3, 
                p: 3,
                bgcolor: 'rgba(0,0,0,0.8)'
              }}>
                <Fab 
                  onClick={cancelCapture}
                  sx={{ bgcolor: 'error.main', color: 'white' }}
                >
                  <CancelIcon />
                </Fab>
                
                <Fab 
                  onClick={confirmCapture}
                  sx={{ bgcolor: 'success.main', color: 'white' }}
                >
                  <CheckIcon />
                </Fab>
              </Box>
            </Box>
          )}

          {/* Video stream */}
          {stream && !capturedImage && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              
              {/* Alt kontrol çubuğu */}
              <Box sx={{ 
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                right: 0, 
                p: 3,
                background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                display: 'flex',
                justifyContent: 'center'
              }}>
                <Fab 
                  onClick={capturePhoto}
                  disabled={isCapturing}
                  sx={{ 
                    bgcolor: 'white', 
                    color: 'black',
                    width: 80,
                    height: 80,
                    '&:hover': {
                      bgcolor: 'grey.200'
                    }
                  }}
                >
                  {isCapturing ? <CircularProgress size={30} /> : <PhotoCameraIcon sx={{ fontSize: 40 }} />}
                </Fab>
              </Box>
            </>
          )}
        </Box>

        {/* Gizli canvas (fotoğraf yakalama için) */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </DialogContent>
    </Dialog>
  );
};

export default CameraCapture; 