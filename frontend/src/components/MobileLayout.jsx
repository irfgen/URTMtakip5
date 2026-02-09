// filepath: /home/irfan/Documents/PROJELER/URTMtakip/frontend/src/components/MobileLayout.jsx
import React from 'react';
import { Box, AppBar, Toolbar, Typography, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import BuildIcon from '@mui/icons-material/Build';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ConstructionIcon from '@mui/icons-material/Construction';
import FolderIcon from '@mui/icons-material/Folder';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import NoteIcon from '@mui/icons-material/Note'; // Notlar için ikon
import FactoryIcon from '@mui/icons-material/Factory'; // Üretim Planı V2 için ikon
import AccountTreeIcon from '@mui/icons-material/AccountTree'; // MAKINDEX için ikon
import ReportProblemIcon from '@mui/icons-material/ReportProblem'; // Uygunsuzluk için ikon
import ViewSwitcher from './ViewSwitcher';

// Ana navigasyon öğeleri (sadece mobilde en önemli olanlar)
const navItems = [
  { text: 'Tezgahlar', path: '/mobile/tezgahlar', icon: <BuildIcon /> },
  { text: 'İş Emri', path: '/mobile/is-emirleri', icon: <AssignmentIcon /> },
  { text: 'Üretim', path: '/mobile/uretim-plani', icon: <FolderIcon /> },
  { text: 'Parçalar', path: '/mobile/parcalar', icon: <ConstructionIcon /> },
  { text: 'MAKINDEX', path: '/mobile/makindex', icon: <AccountTreeIcon /> },
  { text: 'Notlar', path: '/mobile/notlar', icon: <NoteIcon /> },
  { text: 'Sevkiyat', path: '/mobile/sevkiyat', icon: <LocalShippingIcon /> },
  { text: 'İç Sevk', path: '/mobile/ic-sevkiyatlar', icon: <SwapHorizIcon /> },
  { text: 'Uygunsuzluk', path: '/mobile/uygunsuzluklar', icon: <ReportProblemIcon /> },
  { text: 'Arıza', path: '/mobile/ariza-bakim', icon: <BuildCircleIcon /> }
];

function MobileLayout({ children }) {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Mevcut seçili sekmeyi bul
  const currentPathWithoutParams = currentPath.split('/').slice(0, 3).join('/');
  const currentNavValue = navItems.findIndex(item => item.path === currentPathWithoutParams);
  
  return (
    <Box sx={{ pb: 7 }}>
      {/* Üst Başlık Çubuğu */}
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            URTM Takip Mobile
          </Typography>
          <ViewSwitcher currentLayout="mobile" />
        </Toolbar>
      </AppBar>
      
      {/* Ana İçerik */}
      <Box sx={{ 
        mt: 8, 
        mb: 8, 
        p: 2,
        width: '100%', 
        boxSizing: 'border-box' 
      }}>
        {children}
      </Box>
      
      {/* Alt Navigasyon Çubuğu - Yatay Kaydırılabilir */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          overflowX: 'auto',
          overflowY: 'hidden',
          '&::-webkit-scrollbar': {
            height: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
        }}
        elevation={3}
      >
        <Box
          sx={{
            display: 'flex',
            minWidth: 'min-content',
          }}
        >
          <BottomNavigation
            showLabels
            value={currentNavValue !== -1 ? currentNavValue : 0}
            sx={{
              minWidth: 'max-content',
              '& .MuiBottomNavigationAction-root': {
                minWidth: '70px',
                maxWidth: 'none',
                padding: '6px 12px',
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.7rem',
                  '&.Mui-selected': {
                    fontSize: '0.75rem',
                  },
                },
              },
            }}
          >
            {navItems.map((item, index) => (
              <BottomNavigationAction
                key={item.text}
                label={item.text}
                icon={item.icon}
                component={Link}
                to={item.path}
              />
            ))}
          </BottomNavigation>
        </Box>
      </Paper>
    </Box>
  );
}

export default MobileLayout;
