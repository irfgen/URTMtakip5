import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import VardiyaListesi from './VardiyaListesi';
import PersonelListesi from './PersonelListesi';
import VardiyaTakvimi from './VardiyaTakvimi';
import VardiyaRaporlari from './VardiyaRaporlari';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vardiya-tabpanel-${index}`}
      aria-labelledby={`vardiya-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function VardiyaYonetimi() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const showMessage = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={2} sx={{ mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="vardiya yönetimi sekmeleri"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Vardiyalar" />
            <Tab label="Personel" />
            <Tab label="Vardiya Takvimi" />
            <Tab label="Raporlar" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <VardiyaListesi 
            onMessage={showMessage}
            setLoading={setLoading}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <PersonelListesi 
            onMessage={showMessage}
            setLoading={setLoading}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <VardiyaTakvimi 
            onMessage={showMessage}
            setLoading={setLoading}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <VardiyaRaporlari 
            onMessage={showMessage}
            setLoading={setLoading}
          />
        </TabPanel>
      </Paper>

      {/* Loading Indicator */}
      {loading && (
        <Box 
          sx={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: 'rgba(255, 255, 255, 0.8)', 
            zIndex: 9999 
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* Snackbar for messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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
}

export default VardiyaYonetimi;
