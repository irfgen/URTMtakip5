import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import axios from 'axios';

const KayitEkleModal = ({ open, onClose, parcaKodu, onKayitEklendi }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [not, setNot] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError('');
    }
  };

  const handleUpload = async () => {
    // Validasyon kontrolü
    if (!parcaKodu) {
      setError('Parça kodu bulunamadı. Lütfen önce parçayı kaydedin.');
      return;
    }

    if (!selectedFile) {
      setError('Lütfen bir dosya seçin.');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('dosya', selectedFile);
      formData.append('not', not);

      const response = await axios.post(`/api/parca-kayitlari/parca/${parcaKodu}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onKayitEklendi(response.data);
      handleClose();
    } catch (err) {
      console.error('Dosya yükleme hatası:', err);
      setError(err.response?.data?.error || 'Dosya yüklenirken bir hata oluştu.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setNot('');
    setError('');
    onClose();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setError('');
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Kayıt Ekle</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {/* Dosya Yükleme Alanı */}
        <Box
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          sx={{
            border: '2px dashed #ccc',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            mb: 2,
            '&:hover': {
              borderColor: '#999',
              bgcolor: '#f9f9f9'
            }
          }}
          component="label"
        >
          <input
            type="file"
            hidden
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileChange}
          />
          <CloudUpload sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
          <Typography variant="h6" gutterBottom>
            Dosya Seç veya Sürükle
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Resim, PDF, Word veya metin dosyası seçebilirsiniz
          </Typography>
        </Box>

        {selectedFile && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Seçilen dosya: {selectedFile.name}
          </Alert>
        )}

        {/* Not Alanı */}
        <TextField
          label="Not (Opsiyonel)"
          multiline
          rows={3}
          fullWidth
          value={not}
          onChange={(e) => setNot(e.target.value)}
          placeholder="Bu kayıt hakkında bir not ekleyebilirsiniz..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          İptal
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!selectedFile || uploading}
          startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
        >
          {uploading ? 'Yükleniyor...' : 'Yükle'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default KayitEkleModal;
