import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  CircularProgress,
  Typography,
  Box,
  Alert,
  IconButton,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon
} from '@mui/icons-material';
import axios from 'axios';
import ParcaKayitKarti from './ParcaKayitKarti';
import KayitEkleModal from './KayitEkleModal';

const ParcaKayitlariModal = ({ open, onClose, parcaKodu }) => {
  const [kayitlar, setKayitlar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [kayitEkleModalOpen, setKayitEkleModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Kayıtları yükle
  const kayitlariYukle = async () => {
    if (!parcaKodu) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/parca-kayitlari/parca/${parcaKodu}`);
      setKayitlar(response.data);
      setError('');
    } catch (err) {
      console.error('Kayıtları yükleme hatası:', err);
      setError('Kayıtlar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && parcaKodu) {
      kayitlariYukle();
    }
  }, [open, parcaKodu]);

  // Kayıt silme
  const handleKayitSil = async (kayitId) => {
    if (!window.confirm('Bu kaydı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await axios.delete(`/api/parca-kayitlari/${kayitId}`);
      setKayitlar(prev => prev.filter(k => k.id !== kayitId));
    } catch (err) {
      console.error('Kayıt silme hatası:', err);
      setError('Kayıt silinirken bir hata oluştu.');
    }
  };

  // Resim modalı aç
  const handleImageClick = (imagePath) => {
    setSelectedImage(imagePath);
    setImageModalOpen(true);
  };

  // Yeni kayıt eklendikten sonra listeyi güncelle
  const handleKayitEklendi = () => {
    setKayitEkleModalOpen(false);
    kayitlariYukle();
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        sx={{ zIndex: 1300 }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Parça Kayıtları - {parcaKodu}
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {/* Kayıt Ekle Butonu */}
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setKayitEkleModalOpen(true)}
              sx={{ 
                backgroundColor: '#1976d2',
                '&:hover': { backgroundColor: '#1565c0' }
              }}
            >
              Kayıt Ekle
            </Button>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {kayitlar.length === 0 ? (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      Bu parça için henüz kayıt bulunmuyor.
                    </Typography>
                  </Box>
                </Grid>
              ) : (
                kayitlar.map((kayit) => (
                  <Grid item xs={12} sm={6} md={4} key={kayit.id}>
                    <ParcaKayitKarti
                      kayit={kayit}
                      onImageClick={handleImageClick}
                      onDelete={() => handleKayitSil(kayit.id)}
                    />
                  </Grid>
                ))
              )}
            </Grid>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Kapat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Kayıt Ekle Modal */}
      <KayitEkleModal
        open={kayitEkleModalOpen}
        onClose={() => setKayitEkleModalOpen(false)}
        parcaKodu={parcaKodu}
        onKayitEklendi={handleKayitEklendi}
      />

      {/* Resim Önizleme Modal */}
      <Dialog
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        maxWidth="lg"
        fullWidth
        sx={{ zIndex: 1400 }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Önizleme</Typography>
            <IconButton onClick={() => setImageModalOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={selectedImage}
                alt="Önizleme"
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain'
                }}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ParcaKayitlariModal;
