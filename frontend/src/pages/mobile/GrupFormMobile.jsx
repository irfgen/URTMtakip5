import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';

function GrupFormMobile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    items: []
  });

  // Item ekleme modal state
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    parca_id: '',
    parca_kodu: '',
    parca_adi: '',
    miktar: 1,
    birim: 'adet'
  });

  // Parça listesi autocomplete için
  const [parcalar, setParcalar] = useState([]); // Boş array olarak başlat
  const [parcaLoading, setParcaLoading] = useState(false);

  // Form değişiklikleri
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Mevcut grup verilerini yükle (edit modunda)
  useEffect(() => {
    if (isEdit) {
      loadGrupData();
    }
  }, [id, isEdit]);

  // Parça listesini yükle
  useEffect(() => {
    loadParcalar();
  }, []);

  const loadGrupData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/boms/${id}`);
      
      if (!response.ok) {
        throw new Error('Grup verileri yüklenemedi');
      }

      const data = await response.json();
      setFormData({
        name: data.name || '',
        description: data.description || '',
        items: data.items || []
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadParcalar = async () => {
    try {
      setParcaLoading(true);
      const response = await fetch('/api/parcalar');
      
      if (!response.ok) {
        throw new Error('Parça listesi yüklenemedi');
      }

      const data = await response.json();
      // Data bir array değilse boş array olarak ayarla
      setParcalar(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Parça listesi yüklenirken hata:', err);
      // Hata durumunda boş array
      setParcalar([]);
    } finally {
      setParcaLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      // Validasyon
      if (!formData.name.trim()) {
        setError('Grup adı gereklidir');
        return;
      }

      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit ? `/api/boms/${id}` : '/api/boms';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Grup kaydedilemedi');
      }

      setSuccess(isEdit ? 'Grup güncellendi!' : 'Grup oluşturuldu!');
      
      // 1.5 saniye sonra liste sayfasına dön
      setTimeout(() => {
        navigate('/mobile/gruplar');
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = () => {
    if (!newItem.parca_id || !newItem.miktar) {
      setError('Parça ve miktar seçimi gereklidir');
      return;
    }

    // Aynı parça zaten ekli mi kontrol et
    const existingItem = formData.items.find(item => item.parca_id === newItem.parca_id);
    if (existingItem) {
      setError('Bu parça zaten ekli');
      return;
    }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { ...newItem }]
    }));

    // Modal'ı kapat ve formu temizle
    setItemDialogOpen(false);
    setNewItem({
      parca_id: '',
      parca_kodu: '',
      parca_adi: '',
      miktar: 1,
      birim: 'adet'
    });
    setError('');
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleParcaSelect = (selectedParca) => {
    if (selectedParca) {
      setNewItem(prev => ({
        ...prev,
        parca_id: selectedParca.id || selectedParca._id,
        parca_kodu: selectedParca.parca_kodu || selectedParca.parcaKodu || '',
        parca_adi: selectedParca.parca_adi || selectedParca.parcaAdi || ''
      }));
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 7 }}>
      {/* Header */}
      <AppBar position="sticky" sx={{ bgcolor: '#1976d2' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/mobile/gruplar')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {isEdit ? 'Grup Düzenle' : 'Yeni Grup'}
          </Typography>
          <IconButton
            color="inherit"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 2, px: 2 }}>
        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Temel Bilgiler */}
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Temel Bilgiler
          </Typography>
          
          <TextField
            fullWidth
            label="Grup Adı"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            margin="normal"
            required
            variant="outlined"
          />
          
          <TextField
            fullWidth
            label="Açıklama"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            margin="normal"
            multiline
            rows={3}
            variant="outlined"
          />
        </Paper>

        {/* Parçalar Listesi */}
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Parçalar ({formData.items.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setItemDialogOpen(true)}
              size="small"
            >
              Parça Ekle
            </Button>
          </Box>

          {formData.items.length === 0 ? (
            <Box textAlign="center" py={3}>
              <Typography color="textSecondary">
                Henüz parça eklenmemiş
              </Typography>
            </Box>
          ) : (
            <List>
              {formData.items.map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={item.parca_adi}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary" component="div">
                            Kod: {item.parca_kodu}
                            <Box mt={1}>
                              <Chip
                                label={`${item.miktar} ${item.birim}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </Box>
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveItem(index)}
                        color="error"
                      >
                        <RemoveIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < formData.items.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>

        {/* Kaydet Butonu (Mobil için büyük) */}
        <Box mt={3} mb={2}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={{ py: 1.5 }}
          >
            {saving ? 'Kaydediliyor...' : (isEdit ? 'Güncelle' : 'Kaydet')}
          </Button>
        </Box>
      </Container>

      {/* Parça Ekleme Modal */}
      <Dialog 
        open={itemDialogOpen} 
        onClose={() => setItemDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Parça Ekle</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Autocomplete
              options={Array.isArray(parcalar) ? parcalar : []}
              getOptionLabel={(option) => {
                if (!option) return '';
                return `${option.parca_kodu || ''} - ${option.parca_adi || option.parcaAdi || ''}`;
              }}
              loading={parcaLoading}
              onChange={(event, value) => value && handleParcaSelect(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Parça"
                  fullWidth
                  margin="normal"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {parcaLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            <TextField
              fullWidth
              label="Miktar"
              type="number"
              value={newItem.miktar}
              onChange={(e) => setNewItem(prev => ({ ...prev, miktar: Number(e.target.value) }))}
              margin="normal"
              inputProps={{ min: 1 }}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Birim</InputLabel>
              <Select
                value={newItem.birim}
                label="Birim"
                onChange={(e) => setNewItem(prev => ({ ...prev, birim: e.target.value }))}
              >
                <MenuItem value="adet">Adet</MenuItem>
                <MenuItem value="kg">Kg</MenuItem>
                <MenuItem value="mt">Metre</MenuItem>
                <MenuItem value="lt">Litre</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemDialogOpen(false)}>
            İptal
          </Button>
          <Button onClick={handleAddItem} variant="contained">
            Ekle
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default GrupFormMobile;
