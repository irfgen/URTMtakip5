import React from 'react';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import BuildIcon from '@mui/icons-material/Build';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SettingsIcon from '@mui/icons-material/Settings';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import ConstructionIcon from '@mui/icons-material/Construction';
import DescriptionIcon from '@mui/icons-material/Description';
import EngineeringIcon from '@mui/icons-material/Engineering';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import GroupIcon from '@mui/icons-material/Group';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import AssessmentIcon from '@mui/icons-material/Assessment';
import InventoryIcon from '@mui/icons-material/Inventory';
import NoteIcon from '@mui/icons-material/Note';
import FactoryIcon from '@mui/icons-material/Factory';
import TimelineIcon from '@mui/icons-material/Timeline';
import HubIcon from '@mui/icons-material/Hub';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

import ViewSwitcher from './ViewSwitcher'; // Görünüm değiştirici

const drawerWidth = 180;

const menuItems = [
  { text: 'Tezgahlar', path: '/tezgahlar', icon: <BuildIcon /> },
  { text: 'İş Emirleri', path: '/is-emirleri', icon: <AssignmentIcon /> },
  { text: 'Parçalar & Stok', path: '/parcalar', icon: <ConstructionIcon /> },
  { text: 'Stok Kartları', path: '/stok-kartlari', icon: <InventoryIcon /> },
  { text: 'Tedarik', path: '/tedarik', icon: <ShoppingCartIcon /> },
  { text: 'Sevkiyat', path: '/sevkiyat', icon: <LocalShippingIcon /> },
  { text: 'Faturalar', path: '/faturalar', icon: <ReceiptIcon /> },
  { text: 'İrsaliyeler', path: '/irsaliyeler', icon: <DescriptionIcon /> },
  { text: 'Ürün Ağaçları (BOM)', path: '/boms', icon: <AccountTreeIcon /> },
  { text: 'Makinalar', path: '/makinalar', icon: <EngineeringIcon /> },
  { text: 'Üretim Planı', path: '/uretim-plani', icon: <PrecisionManufacturingIcon /> },
  { text: 'Tezgah İş Planı', path: '/tezgah-is-plani', icon: <TimelineIcon /> },
  { text: 'Arıza ve Bakım', path: '/ariza-bakim', icon: <BuildCircleIcon /> },
  { text: 'Uygunsuzluk Yönetimi', path: '/uygunsuzluklar', icon: <ReportProblemIcon /> },
  { text: 'Notlar', path: '/notlar', icon: <NoteIcon /> },
  { text: 'Raporlar', path: '/raporlar', icon: <AssessmentIcon /> },
  { text: 'MAKINDEX', path: '/makindex', icon: <HubIcon /> },
  // Yönetimsel modül menüye eklendi
  { text: 'Yönetim', path: '/yonetimsel', icon: <SettingsIcon /> }
];

function Layout({ children }) {
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            URTM Takip
          </Typography>
          <ViewSwitcher currentLayout="desktop" />
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List sx={{ py: 0 }}>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{ 
                  py: 0.5, 
                  px: 1,
                  minHeight: '36px',
                  '& .MuiListItemIcon-root': {
                    minWidth: '36px'
                  },
                  '& .MuiListItemText-primary': {
                    fontSize: '0.875rem'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: '36px' }}>{item.icon}</ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontSize: '0.875rem',
                    fontWeight: location.pathname === item.path ? 500 : 400
                  }} 
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: '16px',
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          marginTop: '64px'
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default Layout;