import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/PlaylistAdd';
import RemoveIcon from '@mui/icons-material/PlaylistRemove';
import parcaTakipListeleriService from '../../services/parcaTakipListeleriService';

/**
 * Parçayı takip listesine ekleme/çıkarma için basit seçim modali
 */
const ParcaTakipSecimModal = ({ open, onClose, mode = 'add', parcaKodu, onCompleted }) => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadLists = async () => {
    try {
      setLoading(true);
      setError('');
      let data = [];
      if (mode === 'remove') {
        data = await parcaTakipListeleriService.getListsForParca(parcaKodu);
      } else {
        data = await parcaTakipListeleriService.list();
      }
      setLists(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Takip listeleri yüklenemedi');
      setLists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && parcaKodu) {
      loadLists();
    } else {
      setLists([]);
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, parcaKodu]);

  const handleAction = async (liste) => {
    try {
      setError('');
      setActionLoadingId(liste.id);
      if (mode === 'remove') {
        await parcaTakipListeleriService.removeItem(liste.id, parcaKodu);
      } else {
        const temizKod = String(parcaKodu || '').replace(/\s+/g, ' ').trim();
        await parcaTakipListeleriService.addItem(liste.id, { parca_kodu: temizKod, adet: 1 });
      }
      onCompleted && onCompleted(liste);
      onClose && onClose();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'İşlem başarısız');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {mode === 'remove' ? 'Takip listesinden çıkar' : 'Takip listesine ekle'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {lists.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                {mode === 'remove' ? 'Parça herhangi bir takip listesinde değil.' : 'Henüz takip listesi yok.'}
              </Typography>
            )}
            {lists.map(liste => (
              <ListItem key={liste.id} divider>
                <ListItemText
                  primary={liste.ad}
                  secondary={Array.isArray(liste.kalemler) ? `${liste.kalemler.length} kalem` : ''}
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    color={mode === 'remove' ? 'error' : 'primary'} 
                    onClick={() => handleAction(liste)}
                    disabled={actionLoadingId === liste.id}
                  >
                    {mode === 'remove' ? <RemoveIcon /> : <AddIcon />}
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Kapat</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ParcaTakipSecimModal;


