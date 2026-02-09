import React from 'react';
import { Dialog, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const FullScreenImageModal = ({ open, onClose, src, alt }) => {
  return (
    <Dialog open={open} onClose={onClose} fullScreen PaperProps={{ sx: { background: 'rgba(0,0,0,0.95)' } }}>
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
        <IconButton onClick={onClose} sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.4)' }}>
          <CloseIcon fontSize="large" />
        </IconButton>
      </Box>
      <Box sx={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={src} alt={alt} style={{ maxWidth: '95vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 0 24px #0008' }} />
      </Box>
    </Dialog>
  );
};

export default FullScreenImageModal;
