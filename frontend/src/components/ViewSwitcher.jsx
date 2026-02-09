// filepath: /home/irfan/Documents/PROJELER/URTMtakip/frontend/src/components/ViewSwitcher.jsx
import React from 'react';
import { Box, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import MobileIcon from '@mui/icons-material/PhoneAndroid';
import DesktopIcon from '@mui/icons-material/Laptop';
import useDeviceOverride from '../hooks/useDeviceOverride';
import { useState } from 'react';

function ViewSwitcher({ currentLayout }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setDevicePreference } = useDeviceOverride();
  
  const handleDialogOpen = () => {
    setDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setDialogOpen(false);
  };
  
  const handleSwitchToMobile = () => {
    setDevicePreference('mobile');
    window.location.href = '/mobile'; // Mobil anasayfaya yönlendir
    handleDialogClose();
  };
  
  const handleSwitchToDesktop = () => {
    setDevicePreference('desktop');
    window.location.href = '/'; // Desktop anasayfaya yönlendir
    handleDialogClose();
  };
  
  return (
    <>
      <Box>
        <Tooltip title={currentLayout === 'desktop' ? 'Mobil görünüme geç' : 'Masaüstü görünüme geç'}>
          <IconButton 
            color="inherit" 
            onClick={handleDialogOpen} 
            size={currentLayout === 'desktop' ? 'medium' : 'large'}
          >
            {currentLayout === 'desktop' ? <MobileIcon /> : <DesktopIcon />}
          </IconButton>
        </Tooltip>
      </Box>
      
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Görünüm Değiştir</DialogTitle>
        <DialogContent>
          <Typography>
            {currentLayout === 'desktop' 
              ? 'Mobil görünüme geçmek istiyor musunuz?' 
              : 'Masaüstü görünüme geçmek istiyor musunuz?'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>İptal</Button>
          {currentLayout === 'desktop' ? (
            <Button onClick={handleSwitchToMobile} variant="contained" color="primary" startIcon={<MobileIcon />}>
              Mobil Görünüm
            </Button>
          ) : (
            <Button onClick={handleSwitchToDesktop} variant="contained" color="primary" startIcon={<DesktopIcon />}>
              Masaüstü Görünüm
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ViewSwitcher;
