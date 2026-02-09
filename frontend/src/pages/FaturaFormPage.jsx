import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Alert, Snackbar } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import FaturaForm from '../components/FaturaForm';
import { faturaAPI } from '../services/api';

function FaturaFormPage({ mode = 'create' }) {
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleSubmit = async (data) => {
    try {
      if (mode === 'create') {
        await faturaAPI.create(data);
        setSnackbar({
          open: true,
          message: 'Fatura başarıyla oluşturuldu',
          severity: 'success'
        });
        setTimeout(() => navigate('/faturalar'), 1000);
      }
    } catch (error) {
      console.error('Fatura kaydı hatası:', error);
      throw error;
    }
  };

  const handleClose = () => {
    navigate('/faturalar');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleClose} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          {/* FaturaForm kendi Dialog içinde başlık gösteriyor */}
        </Box>
      </Box>

      {/* Fatura Form */}
      <FaturaForm
        open={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
        initialData={null}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default FaturaFormPage;
