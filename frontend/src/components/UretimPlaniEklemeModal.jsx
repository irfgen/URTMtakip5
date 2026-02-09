import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Alert,
  Box,
  Chip,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FactoryIcon from '@mui/icons-material/Factory';
import { uretimPlaniAPI } from '../services/api';

const UretimPlaniEklemeModal = ({ open, onClose, isEmriId, isEmriAdi, onSuccess, onError }) => {
  const [uretimPlanlari, setUretimPlanlari] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      loadUretimPlanlari();
    }
  }, [open]);

  const loadUretimPlanlari = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await uretimPlaniAPI.getAll();
      setUretimPlanlari(response.data || []);
    } catch (err) {
      console.error('Üretim planları yüklenirken hata:', err);
      setError('Üretim planları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToUretimPlani = async (uretimPlaniId) => {
    try {
      setAdding(uretimPlaniId);
      setError('');
      
      await uretimPlaniAPI.addIsEmri(uretimPlaniId, isEmriId);
      
      if (onSuccess) {
        onSuccess(`İş emri başarıyla üretim planına eklendi`);
      }
      
      onClose();
    } catch (err) {
      console.error('İş emri üretim planına eklenirken hata:', err);
      const errorMessage = err.response?.data?.error || 'İş emri üretim planına eklenirken bir hata oluştu';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setAdding(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getDurumColor = (durum) => {
    switch (durum?.toLowerCase()) {
      case 'aktif':
        return 'success';
      case 'tamamlandi':
        return 'default';
      case 'iptal':
        return 'error';
      case 'beklemede':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <CalendarTodayIcon />
          <Typography variant="h6">Üretim Planına Ekle</Typography>
        </Box>
        {isEmriAdi && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            İş Emri: {isEmriAdi}
          </Typography>
        )}
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        ) : uretimPlanlari.length === 0 ? (
          <Alert severity="info">
            Henüz üretim planı bulunmuyor. Önce bir üretim planı oluşturun.
          </Alert>
        ) : (
          <List>
            {uretimPlanlari.map((plan, index) => (
              <React.Fragment key={plan.id}>
                <ListItem
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: 'background.paper'
                  }}
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1" fontWeight="medium" component="span">
                          {plan.plan_adi}
                        </Typography>
                        <Chip
                          label={plan.durum || 'Aktif'}
                          size="small"
                          color={getDurumColor(plan.durum)}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary" component="div">
                          <CalendarTodayIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                          Başlangıç: {formatDate(plan.baslangic_tarihi)}
                          {plan.bitis_tarihi && ` • Bitiş: ${formatDate(plan.bitis_tarihi)}`}
                        </Typography>
                        {plan.aciklama && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }} component="div">
                            {plan.aciklama}
                          </Typography>
                        )}
                        {plan.is_emri_sayisi && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }} component="div">
                            <FactoryIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                            Toplam İş Emri: {plan.is_emri_sayisi}
                          </Typography>
                        )}
                      </Box>
                    }
                    primaryTypographyProps={{ component: 'div' }}
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleAddToUretimPlani(plan.id)}
                      disabled={adding === plan.id}
                      color="primary"
                    >
                      {adding === plan.id ? (
                        <CircularProgress size={20} />
                      ) : (
                        <AddIcon />
                      )}
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < uretimPlanlari.length - 1 && <Divider sx={{ my: 1 }} />}
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          İptal
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UretimPlaniEklemeModal;
