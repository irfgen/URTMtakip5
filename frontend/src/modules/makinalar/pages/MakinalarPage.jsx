import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Container } from '@mui/material';
import MakinaForm from '../components/forms/MakinaForm';

/**
 * Makinalar sayfa bileşeni
 * Yeni makina ekleme ve mevcut makina düzenleme işlemlerini yönetir
 */
const MakinalarPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? 'Makina Düzenle' : 'Yeni Makina Ekle'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isEditMode 
            ? 'Makina bilgilerini güncellemek için aşağıdaki formu kullanın.' 
            : 'Yeni bir makina eklemek için aşağıdaki formu doldurun.'
          }
        </Typography>
      </Box>
      
      <MakinaForm />
    </Container>
  );
};

export default MakinalarPage;