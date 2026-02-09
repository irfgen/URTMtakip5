import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  Chip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import axios from 'axios';
import { getFotoPath } from '../utils/imageUtils';

// TabPanel bileşeni - accessibility özellikleri ile
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`yeni-is-tabpanel-${index}`}
      aria-labelledby={`yeni-is-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// İş emri kartı bileşeni - radio selection ile
function IsEmriKarti({ isEmri, isSelected, onSelect, parcaGorselUrl }) {
  const handleClick = () => {
    onSelect(isEmri);
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        border: 2,
        borderColor: isSelected ? 'primary.main' : 'grey.300',
        borderRadius: 2,
        p: { xs: 1, sm: 2 }, // Mobilde daha az padding
        mb: { xs: 1, sm: 2 }, // Mobilde daha az margin
        cursor: 'pointer',
        bgcolor: isSelected ? 'primary.50' : 'background.paper',
        '&:hover': {
          bgcolor: isSelected ? 'primary.100' : 'grey.50',
          borderColor: isSelected ? 'primary.dark' : 'grey.400'
        },
        transition: 'all 0.2s ease-in-out'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1, sm: 2 }, flexDirection: { xs: 'row', sm: 'row' } }}>
        {/* Radio button */}
        <Radio
          checked={isSelected}
          onChange={() => onSelect(isEmri)}
          sx={{ mt: 0.5, flexShrink: 0 }}
          color="primary"
          size="small" // Mobilde küçük radio button
        />
        
        {/* Parça görseli */}
        {parcaGorselUrl && (
          <Box
            component="img"
            src={parcaGorselUrl}
            alt={`${isEmri.parca?.parca_kodu || 'Parça'} görseli`}
            sx={{
              width: { xs: 140, sm: 160, md: 200 }, // Mobilde daha büyük: 140px, tablet 160px, desktop 200px
              height: { xs: 140, sm: 160, md: 200 },
              objectFit: 'contain',
              borderRadius: 1,
              border: 1,
              borderColor: 'grey.300',
              background: '#f5f5f5',
              flexShrink: 0 // Resmin küçülmesini engelle
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}
        
        {/* İş emri bilgileri */}
        <Box sx={{ flex: 1, minWidth: 0, ml: { xs: 1, sm: 2 } }}> {/* minWidth: 0 text overflow için, ml for left margin */}
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 'bold', 
              mb: 0.5,
              fontSize: { xs: '1.1rem', sm: '1.25rem' } // Mobilde biraz daha büyük font
            }}
          >
            {isEmri.is_emri_no}
          </Typography>
          
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 1,
              fontSize: { xs: '0.85rem', sm: '0.875rem' } // Mobilde biraz daha büyük font
            }}
          >
            {isEmri.is_adi || 'İş adı belirtilmemiş'}
          </Typography>
          
          {isEmri.parca && (
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 1,
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                wordBreak: 'break-word' // Uzun parça kodları için
              }}
            >
              <strong>Parça:</strong> {isEmri.parca.parca_kodu}
              {isEmri.parca.parca_adi && ` - ${isEmri.parca.parca_adi}`}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              label={`${isEmri.adet || 0} adet`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }} // Mobilde biraz daha büyük chip
            />
            
            {isEmri.teslim_tarihi && (
              <Chip
                label={new Date(isEmri.teslim_tarihi).toLocaleDateString('tr-TR')}
                size="small"
                color="secondary"
                variant="outlined"
                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
              />
            )}
            
            {isEmri.setup_sayisi > 0 && (
              <Chip
                label={`Setup: ${isEmri.setup_sayisi}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
              />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

const YeniIsSecimiModali = ({ open, onClose, onSelectIsEmri, tezgahId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // sm altı mobil sayılır
  
  const [selectedTab, setSelectedTab] = useState(0);
  const [isEmirleri, setIsEmirleri] = useState({
    'beklemede': [],
    'freze': [],
    'torna': [],
    '3 metre': [],
    '5 metre': [],
    '6 metre': [],
    '8 metre': []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIsEmri, setSelectedIsEmri] = useState(null);
  const [parcaGorselleri, setParcaGorselleri] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Durum renkleri - dinamik durum tabları için
  const durumRenkleri = {
    'beklemede': '#ff5722',
    'freze': '#4caf50',
    'torna': '#ff9800', 
    '3 metre': '#e91e63',
    '5 metre': '#3f51b5',
    '6 metre': '#009688',
    '8 metre': '#9c27b0',
    'fason': '#795548',
    'tezgahta': '#607d8b',
    // Varsayılan renkler
    'default': '#666666'
  };
  
  // Dinamik sekmeler - Belirtilen sırayla düzenlenmiş durumlar
  const tabConfig = useMemo(() => {
    if (!isEmirleri) return [];
    
    // İstenen sıralama: beklemede, freze, torna, 3 metre, 5 metre, 6 metre, 8 metre
    const istenenSira = ['beklemede', 'freze', 'torna', '3 metre', '5 metre', '6 metre', '8 metre'];
    
    // Sadece belirtilen durumları göster (boş olsalar dahi)
    // Diğer durumları hiç gösterme
    return istenenSira.map(durum => ({
      key: durum,
      label: durum.charAt(0).toUpperCase() + durum.slice(1), // İlk harfi büyük yap
      color: durumRenkleri[durum] || durumRenkleri['default']
    }));
  }, [isEmirleri]);

  // API'den veri çekme
  const fetchAtanabilirIsEmirleri = useCallback(async () => {
    if (!open) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Modal için atanabilir iş emirleri çekiliyor...');
      // Tezgaha atanmış iş emirlerini hariç tutmak için excludeAssigned parametresi ekle
      const response = await axios.get('/api/is-emirleri/atanabilir-modal?excludeAssigned=true');
      
      console.log('Modal API response:', response.data);
      
      // Debug: Her durumdaki iş emri sayılarını logla
      Object.keys(response.data).forEach(durum => {
        const isEmirleriListesi = response.data[durum] || [];
        console.log(`${durum}: ${isEmirleriListesi.length} iş emri`);
        if (isEmirleriListesi.length > 0) {
          console.log(`${durum} iş emirleri:`, isEmirleriListesi.map(ie => `${ie.is_emri_no} (ID: ${ie.is_emri_id})`));
        }
      });
      
      setIsEmirleri(response.data);
      
      // Parça görsellerini yükle
      await loadParcaGorselleri(response.data);
      
    } catch (err) {
      console.error('Atanabilir iş emirleri çekilirken hata:', err);
      setError('İş emirleri yüklenirken bir hata oluştu: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }, [open]);

  // Parça görsellerini yükleme
  const loadParcaGorselleri = async (isEmirleriData) => {
    const newGorseller = {};
    
    try {
      // Tüm iş emirlerini tek bir listede topla
      const tumIsEmirleri = Object.values(isEmirleriData).flat();
      
      for (const isEmri of tumIsEmirleri) {
        const emriId = isEmri.id || isEmri.is_emri_id;
        
        // Parça kodu varsa görseli yükle
        if (isEmri.parca_kodu) {
          try {
            const response = await axios.get(`/api/parcalar/${isEmri.parca_kodu}`);
            const parcaData = response.data;
            
            if (parcaData && parcaData.foto_path) {
              const gorselUrl = getFotoPath(parcaData.foto_path);
              newGorseller[emriId] = gorselUrl;
            }
          } catch (error) {
            console.log(`Parça görseli bulunamadı: ${isEmri.parca_kodu}`);
          }
        }
      }
      
      setParcaGorselleri(newGorseller);
    } catch (error) {
      console.error('Parça görselleri yüklenirken hata:', error);
    }
  };

  // Modal açıldığında veri çek - her açılışta fresh data için dependency'den open'ı kaldırmadık
  useEffect(() => {
    if (open) {
      console.log('Modal açıldı, atanabilir iş emirleri çekiliyor...');
      fetchAtanabilirIsEmirleri();
    }
  }, [open, fetchAtanabilirIsEmirleri]);

  // Modal kapandığında state'leri temizle
  useEffect(() => {
    if (!open) {
      setSelectedIsEmri(null);
      setSelectedTab(0);
      setError(null);
    }
  }, [open]);

  // Sekme değiştirme
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // İş emri seçimi
  const handleIsEmriSelect = (isEmri) => {
    const currentId = selectedIsEmri?.id || selectedIsEmri?.is_emri_id;
    const newId = isEmri?.id || isEmri?.is_emri_id;
    
    console.log('İş emri seçimi:', { currentId, newId, isEmri });
    
    setSelectedIsEmri(currentId === newId ? null : isEmri);
  };

  // Seçimi onayla
  const handleConfirmSelection = async () => {
    if (!selectedIsEmri || !onSelectIsEmri) return;
    
    setSubmitLoading(true);
    try {
      await onSelectIsEmri(selectedIsEmri);
      onClose();
    } catch (error) {
      console.error('İş emri seçimi onaylanırken hata:', error);
      setError('İş emri seçimi onaylanamadı: ' + (error.response?.data?.error || error.message));
    } finally {
      setSubmitLoading(false);
    }
  };

  // Loading durumunu render et
  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>İş emirleri yükleniyor...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      fullScreen={isMobile} // Mobilde tam ekran
      PaperProps={{
        sx: { 
          height: isMobile ? '100vh' : '90vh', // Mobilde tam yükseklik, diğerlerinde 90%
          m: isMobile ? 0 : 2 // Mobilde margin yok
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h6">Yeni İş Seçimi</Typography>
        {tezgahId && (
          <Typography variant="body2" color="text.secondary">
            Tezgah: {tezgahId}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Sekmeler */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={selectedTab} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="İş emri durumları"
            sx={{
              '& .MuiTab-root': {
                fontSize: { xs: '0.75rem', sm: '0.875rem' }, // Mobilde daha küçük font
                minWidth: { xs: 80, sm: 120 }, // Mobilde daha dar tab
                px: { xs: 1, sm: 2 } // Mobilde daha az padding
              }
            }}
          >
            {tabConfig.map((tab, index) => (
              <Tab
                key={tab.key}
                label={`${tab.label} (${isEmirleri[tab.key]?.length || 0})`}
                id={`yeni-is-tab-${index}`}
                aria-controls={`yeni-is-tabpanel-${index}`}
                sx={{ 
                  color: tab.color,
                  '&.Mui-selected': { 
                    color: tab.color,
                    fontWeight: 'bold'
                  }
                }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Sekme içerikleri */}
        {tabConfig.map((tab, index) => (
          <TabPanel key={tab.key} value={selectedTab} index={index}>
            {isEmirleri[tab.key]?.length > 0 ? (
              <Box sx={{ maxHeight: '50vh', overflow: 'auto' }}>
                {isEmirleri[tab.key].map((isEmri) => {
                  const emriId = isEmri.id || isEmri.is_emri_id;
                  const selectedId = selectedIsEmri?.id || selectedIsEmri?.is_emri_id;
                  return (
                    <IsEmriKarti
                      key={emriId}
                      isEmri={isEmri}
                      isSelected={selectedId === emriId}
                      onSelect={handleIsEmriSelect}
                      parcaGorselUrl={parcaGorselleri[emriId]}
                    />
                  );
                })}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  {tab.label} durumunda atanabilir iş emri bulunmamaktadır.
                </Typography>
              </Box>
            )}
          </TabPanel>
        ))}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          disabled={submitLoading}
        >
          İptal
        </Button>
        
        <Button 
          onClick={handleConfirmSelection}
          variant="contained"
          disabled={!selectedIsEmri || submitLoading}
          startIcon={submitLoading ? <CircularProgress size={20} /> : null}
        >
          {submitLoading ? 'Atanıyor...' : 'Seç ve Ata'}
        </Button>
        
        {selectedIsEmri && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            Seçilen: {selectedIsEmri.is_emri_no}
          </Typography>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default YeniIsSecimiModali;
