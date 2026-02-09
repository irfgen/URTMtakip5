import React, { useState } from 'react';
import {
  Box,
  Typography,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import IsEmriKanbanBoard from '../components/IsEmriKanbanBoard';
import IsEmriEkleForm from '../components/IsEmriEkleForm';

const UretimPanosu = () => {
  const [isEmriEkleOpen, setIsEmriEkleOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleAddIsEmri = () => {
    setIsEmriEkleOpen(true);
  };

  const handleEditIsEmri = (isEmri) => {
    // Edit modal açılacak (şimdilik log)
    console.log('Edit iş emri:', isEmri);
    setSnackbar({
      open: true,
      message: 'İş emri düzenleme özelliği yakında eklenecek',
      severity: 'info'
    });
  };

  const handleDeleteIsEmri = (isEmriId) => {
    // Delete confirmation dialog açılacak (şimdilik log)
    console.log('Delete iş emri:', isEmriId);
    setSnackbar({
      open: true,
      message: 'İş emri silme özelliği yakında eklenecek',
      severity: 'info'
    });
  };

  const handleCloseIsEmriEkle = () => {
    setIsEmriEkleOpen(false);
  };

  const handleIsEmriEklendi = () => {
    setIsEmriEkleOpen(false);
    setSnackbar({
      open: true,
      message: 'İş emri başarıyla eklendi',
      severity: 'success'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ width: '100%', height: '100vh' }}>
      {/* Kanban Board */}
      <IsEmriKanbanBoard
        onAddIsEmri={handleAddIsEmri}
        onEditIsEmri={handleEditIsEmri}
        onDeleteIsEmri={handleDeleteIsEmri}
      />

      {/* İş Emri Ekleme Dialog */}
      <Dialog 
        open={isEmriEkleOpen} 
        onClose={handleCloseIsEmriEkle}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Yeni İş Emri Ekle</Typography>
        </DialogTitle>
        <DialogContent>
          <IsEmriEkleForm 
            onClose={handleCloseIsEmriEkle}
            onSuccess={handleIsEmriEklendi}
          />
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UretimPanosu;
