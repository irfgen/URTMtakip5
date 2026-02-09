// filepath: /home/irfan/Documents/PROJELER/URTMtakip/frontend/src/theme.mobile.js
import { createTheme } from '@mui/material/styles';

// Mobil cihazlar için özelleştirilmiş tema
const mobilTheme = createTheme({
  // Ana tema renkleriyle aynı renkler kullanılıyor ama mobil için bazı ayarlar değiştirildi
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    // Mobil için daha büyük fontlar
    h5: {
      fontSize: '1.4rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1.2rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.9rem',
    },
  },
  components: {
    // Bottom navigation için iyileştirmeler
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 60,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          padding: '6px 0',
          minWidth: 0,
        },
        label: {
          fontSize: '0.7rem',
        },
      },
    },
    // Card/Paper bileşenlerinde daha iyi okunabilirlik için
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    // Form alanları için dokunmatik ekrana uygun boyutlar
    MuiTextField: {
      defaultProps: {
        size: 'medium', // Normal boyuttan daha büyük
      },
    },
    MuiButton: {
      defaultProps: {
        size: 'large', // Büyük butonlar dokunmayı kolaylaştırır
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
      },
    },
    // Çipler için daha okunaklı stil
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});

export default mobilTheme;
