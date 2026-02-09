import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import {
  Fullscreen,
  Close,
  Download,
  QrCode,
} from '@mui/icons-material';
import QRCodeComponent from 'react-qr-code';
import axios from 'axios';

const QRCodeDisplay = ({
  parcaKodu,
  parcaAdi,
  size = 128,
  showButton = true,
  variant = 'default' // 'default' | 'compact'
}) => {
  const theme = useTheme();
  const [qrCodeData, setQrCodeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  // QR kod verisini backend'den al
  useEffect(() => {
    if (!parcaKodu) return;

    const fetchQRCode = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`/api/parcalar/${parcaKodu}/qrcode?size=${size * 2}`);

        if (response.data.success) {
          setQrCodeData(response.data.data);
        } else {
          setError(response.data.error || 'QR kod oluşturulamadı');
        }
      } catch (err) {
        console.error('QR kod alma hatası:', err);
        setError(err.response?.data?.error || 'QR kod yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchQRCode();
  }, [parcaKodu, size]);

  // QR kodu indir
  const handleDownload = () => {
    if (!qrCodeData?.qrCodeDataUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeData.qrCodeDataUrl;
    link.download = `qr-code-${parcaKodu}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Tam ekran modal'da göster
  const handleFullscreen = () => {
    setFullscreenOpen(true);
  };

  // Compact variant için stil
  if (variant === 'compact') {
    return (
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        {loading && (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: size,
            height: size
          }}>
            <CircularProgress size={size * 0.3} />
          </Box>
        )}

        {error && (
          <Tooltip title={error}>
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: size,
              height: size,
              border: '2px dashed',
              borderColor: 'error.main',
              borderRadius: 1,
              color: 'error.main'
            }}>
              <QrCode sx={{ fontSize: size * 0.4 }} />
            </Box>
          </Tooltip>
        )}

        {qrCodeData && !loading && !error && (
          <Tooltip title={`QR Kod - ${parcaAdi || parcaKodu}`}>
            <Box
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  transform: 'scale(1.05)',
                  transition: 'transform 0.2s ease-in-out'
                }
              }}
              onClick={handleFullscreen}
            >
              <QRCodeComponent
                value={JSON.stringify(qrCodeData.qrData)}
                size={size}
                level="H"
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </Box>
          </Tooltip>
        )}
      </Box>
    );
  }

  // Default variant
  return (
    <Box sx={{ textAlign: 'center' }}>
      {loading && (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1
        }}>
          <CircularProgress />
          <Typography variant="caption" color="text.secondary">
            QR Kod yükleniyor...
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {qrCodeData && !loading && !error && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" gutterBottom>
            Parça QR Kodu
          </Typography>

          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {parcaAdi || parcaKodu}
          </Typography>

          <Box
            sx={{
              p: 2,
              border: '2px solid',
              borderColor: 'grey.300',
              borderRadius: 2,
              bgcolor: 'white',
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.main',
                boxShadow: 2
              }
            }}
            onClick={handleFullscreen}
          >
            <QRCodeComponent
              value={JSON.stringify(qrCodeData.qrData)}
              size={size}
              level="H"
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
          </Box>

          {showButton && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Tooltip title="Tam Ekran">
                <IconButton
                  onClick={handleFullscreen}
                  color="primary"
                  size="small"
                >
                  <Fullscreen />
                </IconButton>
              </Tooltip>

              <Tooltip title="İndir">
                <IconButton
                  onClick={handleDownload}
                  color="primary"
                  size="small"
                >
                  <Download />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      )}

      {/* Tam Ekran Modal */}
      <Dialog
        open={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">
            QR Kod - {parcaAdi || parcaKodu}
          </Typography>
          <IconButton onClick={() => setFullscreenOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          {qrCodeData && (
            <Box>
              <Box sx={{
                display: 'inline-block',
                p: 4,
                border: '3px solid',
                borderColor: 'grey.400',
                borderRadius: 3,
                bgcolor: 'white',
                mb: 3
              }}>
                <QRCodeComponent
                  value={JSON.stringify(qrCodeData.qrData)}
                  size={300}
                  level="H"
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </Box>

              <Typography variant="body1" gutterBottom>
                <strong>Parça Kodu:</strong> {qrCodeData.parcaKodu}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                <strong>Parça Adı:</strong> {qrCodeData.parcaAdi}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <strong>Sistem:</strong> {qrCodeData.qrData.sistem}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                <strong>Oluşturulma Tarihi:</strong> {new Date(qrCodeData.qrData.olusturulmaTarihi).toLocaleString('tr-TR')}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            onClick={handleDownload}
            variant="contained"
            startIcon={<Download />}
            sx={{ mr: 1 }}
          >
            İndir
          </Button>
          <Button
            onClick={() => setFullscreenOpen(false)}
            variant="outlined"
          >
            Kapat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QRCodeDisplay;