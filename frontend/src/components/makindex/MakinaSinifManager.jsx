import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  Typography,
  Chip,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Colorize as ColorIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  createSinif,
  updateSinif,
  deleteSinif,
  getSinifById,
  clearSinifError,
} from '../../store/slices/makindexSlice';

const MakinaSinifManager = ({ open, onClose, editingSinif, mode = 'create' }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.makindex);

  // Get the relevant error message based on mode
  const getErrorMessage = () => {
    if (mode === 'create') return error.createSinif;
    if (mode === 'edit') return error.updateSinif;
    return error.sinifDetail;
  };

  const errorMessage = getErrorMessage();

  const [formData, setFormData] = useState({
    ad: '',
    aciklama: '',
    renk: '#1976d2',
  });

  const [formErrors, setFormErrors] = useState({});

  // Renk seçenekleri
  const colorOptions = [
    '#1976d2', '#dc004e', '#2e7d32', '#ed6c02',
    '#9c27b0', '#795548', '#0288d1', '#c2185b',
    '#388e3c', '#f57c00', '#6a1b9a', '#5d4037',
    '#0277bd', '#d32f2f', '#689f38', '#f9a825',
  ];

  useEffect(() => {
    if (mode === 'edit' && editingSinif) {
      setFormData({
        ad: editingSinif.ad || '',
        aciklama: editingSinif.aciklama || '',
        renk: editingSinif.renk || '#1976d2',
      });
      dispatch(clearSinifError());
    } else {
      setFormData({
        ad: '',
        aciklama: '',
        renk: '#1976d2',
      });
    }
    setFormErrors({});
  }, [mode, editingSinif, dispatch]);

  const validateForm = () => {
    const errors = {};

    if (!formData.ad || formData.ad.trim().length < 2) {
      errors.ad = 'Sınıf adı en az 2 karakter olmalıdır';
    }

    if (formData.ad && formData.ad.trim().length > 50) {
      errors.ad = 'Sınıf adı en fazla 50 karakter olabilir';
    }

    if (formData.aciklama && formData.aciklama.length > 255) {
      errors.aciklama = 'Açıklama en fazla 255 karakter olabilir';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (mode === 'create') {
        await dispatch(createSinif(formData)).unwrap();
        onClose();
      } else if (mode === 'edit') {
        await dispatch(updateSinif({
          id: editingSinif.id,
          data: formData
        })).unwrap();
        onClose();
      }
    } catch (error) {
      // Error handled by Redux slice
    }
  };

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));

    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleColorSelect = (color) => {
    console.log('Renk seçildi:', color); // Debug için
    setFormData(prev => ({
      ...prev,
      renk: color
    }));
  };

  const handleColorInputChange = (e) => {
    const color = e.target.value;
    console.log('Renk input:', color); // Debug için
    setFormData(prev => ({
      ...prev,
      renk: color
    }));
  };

  const title = mode === 'create' ? 'Yeni Makina Sınıfı Ekle' : 'Makina Sınıfı Düzenle';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: mode === 'create' ? 'auto' : 400,
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {mode === 'create' ? <AddIcon /> : <EditIcon />}
          <Typography variant="h6">{title}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 2 }}>
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearSinifError())}>
              {errorMessage}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Sınıf Adı"
                value={formData.ad}
                onChange={handleInputChange('ad')}
                error={!!formErrors.ad}
                helperText={formErrors.ad}
                fullWidth
                required
                autoFocus
                placeholder="Örn: CNC Torna, Pres, Taşlama..."
                InputProps={{
                  startAdornment: <ColorIcon sx={{ mr: 1, color: formData.renk, fontSize: 20 }} />,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Açıklama"
                value={formData.aciklama}
                onChange={handleInputChange('aciklama')}
                error={!!formErrors.aciklama}
                helperText={formErrors.aciklama}
                fullWidth
                multiline
                rows={2}
                placeholder="Makina sınıfı hakkında açıklama (opsiyonel)"
              />
            </Grid>

            <Grid item xs={12}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
                  Renk Kodu
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {colorOptions.map((color) => (
                    <Tooltip key={color} title={color}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          backgroundColor: color,
                          borderRadius: 1,
                          cursor: 'pointer',
                          border: formData.renk === color ? 3 : 2,
                          borderColor: formData.renk === color ? 'primary.main' : 'grey.300',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            boxShadow: 2
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                        onClick={() => handleColorSelect(color)}
                      />
                    </Tooltip>
                  ))}
                </Box>
                <TextField
                  label="Özel Renk"
                  value={formData.renk}
                  onChange={handleColorInputChange}
                  fullWidth
                  size="small"
                  placeholder="#1976d2"
                  InputProps={{
                    type: 'color',
                    sx: { height: 40, cursor: 'pointer' }
                  }}
                  helperText={`Mevcut renk: ${formData.renk}`}
                />
              </Box>
            </Grid>

            {/* Önizleme */}
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  backgroundColor: 'grey.50'
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
                  Önizleme
                </Typography>
                <Chip
                  label={formData.ad || 'Sınıf Adı'}
                  sx={{
                    backgroundColor: formData.renk,
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    padding: '8px 12px',
                    height: 'auto',
                    '&:hover': {
                      backgroundColor: formData.renk,
                      filter: 'brightness(1.1)'
                    },
                    '& .MuiChip-label': {
                      color: '#fff'
                    }
                  }}
                />
                {formData.aciklama && (
                  <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                    {formData.aciklama}
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button
            onClick={onClose}
            disabled={loading.createSinif || loading.updateSinif}
          >
            İptal
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading.createSinif || loading.updateSinif}
            startIcon={loading.createSinif || loading.updateSinif ?
              <CircularProgress size={16} /> :
              (mode === 'create' ? <AddIcon /> : <SaveIcon />)
            }
          >
            {mode === 'create' ? 'Oluştur' : 'Kaydet'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MakinaSinifManager;