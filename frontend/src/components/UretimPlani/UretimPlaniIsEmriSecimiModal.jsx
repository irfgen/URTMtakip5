import React, { useState, useEffect, useCallback } from 'react';
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
  Checkbox,
  FormControlLabel,
  Chip,
  useMediaQuery,
  useTheme,
  Badge,
  Divider,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import { 
  Add as AddIcon, 
  Search as SearchIcon, 
  Clear as ClearIcon 
} from '@mui/icons-material';
import axios from 'axios';
import { getFotoPath } from '../../utils/imageUtils';
import { isStatusCompleted } from '../../utils/statusUtils';
import IsEmriEkleForm from '../IsEmriEkleForm';

// TabPanel bileşeni
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`uretim-plani-tabpanel-${index}`}
      aria-labelledby={`uretim-plani-tab-${index}`}
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

// İş emri kartı bileşeni - çoklu seçim için checkbox
function IsEmriKarti({ isEmri, isSelected, onToggleSelect, parcaGorselUrl, isFromSiparis = false }) {
  const handleClick = () => {
    onToggleSelect(isEmri);
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        border: 2,
        borderColor: isSelected ? 'primary.main' : 'grey.300',
        borderRadius: 2,
        p: { xs: 1, sm: 2 },
        mb: { xs: 1, sm: 2 },
        cursor: 'pointer',
        bgcolor: isSelected ? 'primary.50' : 'background.paper',
        '&:hover': {
          bgcolor: isSelected ? 'primary.100' : 'grey.50',
          borderColor: isSelected ? 'primary.dark' : 'grey.400'
        },
        transition: 'all 0.2s ease-in-out',
        position: 'relative'
      }}
    >
      {/* Sipariş badge */}
      {isFromSiparis && (
        <Chip
          label="Sipariş"
          size="small"
          color="info"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1
          }}
        />
      )}

      {/* Tamamlandı badge */}
      {isStatusCompleted(isEmri.durum) && !isFromSiparis && (
        <Chip
          label="Tamamlandı"
          size="small"
          color="success"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1
          }}
        />
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1, sm: 2 } }}>
        {/* Checkbox */}
        <Checkbox
          checked={isSelected}
          onChange={() => onToggleSelect(isEmri)}
          sx={{ mt: 0.5, flexShrink: 0 }}
          color="primary"
          size="small"
        />
        
        {/* Parça görseli */}
        {parcaGorselUrl && (
          <Box
            component="img"
            src={parcaGorselUrl}
            alt={`${isEmri.parca?.parca_kodu || 'Parça'} görseli`}
            sx={{
              width: { xs: 120, sm: 140, md: 160 },
              height: { xs: 120, sm: 140, md: 160 },
              objectFit: 'cover',
              borderRadius: 1,
              border: 1,
              borderColor: 'grey.300',
              flexShrink: 0
            }}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x200?text=Resim+Yok';
            }}
          />
        )}
        
        {/* İş emri bilgileri */}
        <Box sx={{ flex: 1, minWidth: 0, ml: { xs: 1, sm: 2 } }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 'bold', 
              mb: 0.5,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            {isEmri.is_emri_no}
          </Typography>
          
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 1,
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            }}
          >
            {isEmri.is_adi || 'İş adı belirtilmemiş'}
          </Typography>
          
          {isEmri.parca && (
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 1,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                wordBreak: 'break-word'
              }}
            >
              <strong>Parça:</strong> {isEmri.parca.parca_kodu}
              {isEmri.parca.parca_adi && ` - ${isEmri.parca.parca_adi}`}
            </Typography>
          )}

          {/* Sipariş bilgisi */}
          {isFromSiparis && isEmri.siparis && (
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 1,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                color: 'info.main'
              }}
            >
              <strong>Sipariş:</strong> {isEmri.siparis.siparis_no}
              {isEmri.siparis.musteri_adi && ` - ${isEmri.siparis.musteri_adi}`}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              label={`${isEmri.adet || 0} adet`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
            />
            
            {isEmri.teslim_tarihi && (
              <Chip
                label={new Date(isEmri.teslim_tarihi).toLocaleDateString('tr-TR')}
                size="small"
                color="secondary"
                variant="outlined"
                sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
              />
            )}
            
            {isEmri.setup_sayisi > 0 && (
              <Chip
                label={`Setup: ${isEmri.setup_sayisi}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
              />
            )}

            {/* Durum chip'i */}
            <Chip
              label={isEmri.durum || 'Beklemede'}
              size="small"
              color={
                isFromSiparis ? 'info' : 
                (isStatusCompleted(isEmri.durum) ? 'success' : 'default')
              }
              sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

const UretimPlaniIsEmriSecimiModal = ({ open, onClose, onSelectIsEmirleri }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [selectedTab, setSelectedTab] = useState(0);
  const [isEmirleri, setIsEmirleri] = useState({
    'beklemede': [],
    'freze': [],
    'torna': [],
    '5 metre': [],
    '6 metre': [],
    'tezgahta': [], // Yeni durum kategorisi
    'tamamlandı': [], // Tamamlanan işler de dahil edilebilir
    'siparisler': [] // Sipariş listesi için yeni sekme
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIsEmirleri, setSelectedIsEmirleri] = useState([]);
  const [parcaGorselleri, setParcaGorselleri] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Yeni İş Emri Form state'leri
  const [yeniIsEmriFormOpen, setYeniIsEmriFormOpen] = useState(false);
  const [yeniIsEmriLoading, setYeniIsEmriLoading] = useState(false);
  
  // Arama/Filtreleme state'leri
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredIsEmirleri, setFilteredIsEmirleri] = useState({});
  const [tamamlananlariGoster, setTamamlananlariGoster] = useState(false);

  // Sekmeler için konfigürasyon
  const tabConfig = [
    { key: 'beklemede', label: 'Beklemede', color: '#2196f3' },
    { key: 'freze', label: 'Freze', color: '#4caf50' },
    { key: 'torna', label: 'Torna', color: '#ff9800' },
    { key: '5 metre', label: '5 Metre', color: '#3f51b5' },
    { key: '6 metre', label: '6 Metre', color: '#009688' },
    { key: 'tezgahta', label: 'Tezgahta', color: '#9c27b0' }, // Yeni durum
    { key: 'tamamlandı', label: 'Tamamlandı', color: '#388e3c' }, // Tamamlanan işler - daha koyu yeşil
    { key: 'siparisler', label: 'Siparişler', color: '#e91e63' }
  ];

  // API'den veri çekme
  const fetchAtanabilirIsEmirleri = useCallback(async () => {
    if (!open) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Üretim planı için atanabilir iş emirleri çekiliyor...');
      
      // İş emirlerini çek
      const response = await axios.get(`/api/is-emirleri/atanabilir-modal?excludeAssigned=true&tamamlananlari_goster=${tamamlananlariGoster}`);
      console.log('İş emirleri API response:', response.data);

      // Siparişleri çek
      const siparisResponse = await axios.get('/api/siparisler/aktif-is-emirleri');
      console.log('Sipariş iş emirleri API response:', siparisResponse.data);
      
      // Veriyi birleştir
      const combinedData = {
        ...response.data,
        siparisler: siparisResponse.data || []
      };
      
      setIsEmirleri(combinedData);
      
      // Parça görsellerini yükle
      await loadParcaGorselleri(combinedData);
      
    } catch (err) {
      console.error('İş emirleri çekilirken hata:', err);
      setError('İş emirleri yüklenirken bir hata oluştu: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }, [open, tamamlananlariGoster]);

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

  // Modal açıldığında veri çek
  useEffect(() => {
    if (open) {
      console.log('Üretim planı modal açıldı, iş emirleri çekiliyor...');
      fetchAtanabilirIsEmirleri();
    }
  }, [open, fetchAtanabilirIsEmirleri]);

  // Modal kapandığında state'leri temizle
  useEffect(() => {
    if (!open) {
      setSelectedIsEmirleri([]);
      setSelectedTab(0);
      setError(null);
      setSearchTerm(''); // Arama terimini temizle
      setTamamlananlariGoster(false); // Tamamlanan işleri gösterme durumunu sıfırla
    }
  }, [open]);

  // Arama işlevi - iş emirlerini parça koduna göre filtrele
  useEffect(() => {
    if (!searchTerm.trim()) {
      // Arama terimi boşsa tüm iş emirlerini göster
      setFilteredIsEmirleri(isEmirleri);
    } else {
      // Arama terimine göre filtrele
      const filtered = {};
      const searchLower = searchTerm.toLowerCase().trim();
      
      Object.keys(isEmirleri).forEach(kategori => {
        filtered[kategori] = isEmirleri[kategori].filter(isEmri => {
          // Parça kodu, iş emri numarası ve iş adı alanlarında ara
          const parcaKodu = isEmri.parca_kodu || '';
          const isEmriNo = isEmri.is_emri_no || '';
          const isAdi = isEmri.is_adi || '';
          const parcaAdi = isEmri.parca?.parca_adi || '';
          
          return (
            parcaKodu.toLowerCase().includes(searchLower) ||
            isEmriNo.toLowerCase().includes(searchLower) ||
            isAdi.toLowerCase().includes(searchLower) ||
            parcaAdi.toLowerCase().includes(searchLower)
          );
        });
      });
      
      setFilteredIsEmirleri(filtered);
    }
  }, [searchTerm, isEmirleri]);

  // Arama terimi değiştirme
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Arama temizleme
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Tamamlanan işleri gösterme/gizleme toggle
  const handleTamamlananlariGosterToggle = () => {
    setTamamlananlariGoster(prev => !prev);
  };

  // Sekme değiştirme
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // İş emri seçimini toggle et (çoklu seçim)
  const handleIsEmriToggleSelect = (isEmri) => {
    const emriId = isEmri.id || isEmri.is_emri_id;
    const isCurrentlySelected = selectedIsEmirleri.some(ie => (ie.id || ie.is_emri_id) === emriId);
    
    if (isCurrentlySelected) {
      // Seçili ise kaldır
      setSelectedIsEmirleri(selectedIsEmirleri.filter(ie => (ie.id || ie.is_emri_id) !== emriId));
    } else {
      // Seçili değilse ekle
      setSelectedIsEmirleri([...selectedIsEmirleri, isEmri]);
    }
  };

  // Seçimi onayla
  const handleConfirmSelection = async () => {
    if (selectedIsEmirleri.length === 0 || !onSelectIsEmirleri) return;
    
    setSubmitLoading(true);
    try {
      await onSelectIsEmirleri(selectedIsEmirleri);
      onClose();
    } catch (error) {
      console.error('İş emirleri seçimi onaylanırken hata:', error);
      setError('İş emirleri seçimi onaylanamadı: ' + (error.response?.data?.error || error.message));
    } finally {
      setSubmitLoading(false);
    }
  };

  // Tümünü seç/kaldır
  const handleSelectAll = () => {
    // Filtrelenmiş veriyi kullan
    const currentTabData = filteredIsEmirleri[tabConfig[selectedTab].key] || [];
    const currentTabIds = currentTabData.map(ie => ie.id || ie.is_emri_id);
    
    // Mevcut sekmedeki tüm iş emirleri seçili mi kontrol et
    const allSelected = currentTabIds.every(id => 
      selectedIsEmirleri.some(ie => (ie.id || ie.is_emri_id) === id)
    );
    
    if (allSelected) {
      // Tümünü kaldır
      setSelectedIsEmirleri(selectedIsEmirleri.filter(ie => 
        !currentTabIds.includes(ie.id || ie.is_emri_id)
      ));
    } else {
      // Tümünü ekle
      const newSelections = currentTabData.filter(ie => 
        !selectedIsEmirleri.some(selected => 
          (selected.id || selected.is_emri_id) === (ie.id || ie.is_emri_id)
        )
      );
      setSelectedIsEmirleri([...selectedIsEmirleri, ...newSelections]);
    }
  };

  // Yeni İş Emri butonu tıklama
  const handleYeniIsEmriClick = () => {
    setYeniIsEmriFormOpen(true);
  };

  // Yeni İş Emri formu kapatma
  const handleYeniIsEmriFormClose = () => {
    setYeniIsEmriFormOpen(false);
  };

  // Yeni İş Emri oluşturulduğunda
  const handleYeniIsEmriOlusturuldu = async (yeniIsEmriData) => {
    try {
      setYeniIsEmriLoading(true);
      
      console.log('Form\'dan gelen ham veri:', yeniIsEmriData);
      
      // IsEmriEkleForm'dan gelen veri formatını API formatına dönüştür
      const apiData = {
        parca_kodu: yeniIsEmriData.parca_kodu || yeniIsEmriData.parcaKodu,
        is_adi: yeniIsEmriData.is_adi || (typeof yeniIsEmriData.parcaKodu === 'string' 
          ? yeniIsEmriData.parcaKodu 
          : yeniIsEmriData.parcaKodu?.parcaKodu),
        adet: parseInt(yeniIsEmriData.adet),
        plan_liste_no: yeniIsEmriData.plan_liste_no || 'Genel',
        malzeme: yeniIsEmriData.malzeme || '',
        teslim_tarihi: yeniIsEmriData.teslim_tarihi || yeniIsEmriData.teslimTarihi,
        oncelik: yeniIsEmriData.oncelik || 'normal',
        durum: 'beklemede', // Varsayılan durum
        aciklama: yeniIsEmriData.aciklama || '',
        uretim_plani_id: null, // Modal üzerinden oluşturulan iş emirleri henüz plana ait değil
        setup_sayisi: yeniIsEmriData.setup_sayisi || 0,
        cnc_suresi: yeniIsEmriData.cnc_suresi || 0,
        malzemesi_siparis_edilecekmi: yeniIsEmriData.malzemesi_siparis_edilecekmi || false,
        malzeme_siparis_tarihi: yeniIsEmriData.malzeme_siparis_tarihi || yeniIsEmriData.malzemeSiparisTarihi,
        stok_karti_id: yeniIsEmriData.stok_karti_id
      };
      
      console.log('API\'ye gönderilecek düzenlenmiş veri:', apiData);
      
      // Yeni iş emrini oluştur
      const response = await axios.post('/api/is-emirleri', apiData);

      const yeniIsEmri = response.data;
      
      // Backend'den dönen iş emri verisini normalize et
      const normalizedIsEmri = {
        ...yeniIsEmri,
        id: yeniIsEmri.is_emri_id, // Frontend'de id alanı bekleniyor
      };
      
      console.log('Backend\'den dönen yeni iş emri:', yeniIsEmri);
      console.log('Normalize edilmiş iş emri:', normalizedIsEmri);
      
      // Yeni oluşturulan iş emrini otomatik olarak seçili listeye ekle
      setSelectedIsEmirleri(prev => [...prev, normalizedIsEmri]);
      
      // Formu kapat
      setYeniIsEmriFormOpen(false);
      
      // İş emri listesini yenile
      await fetchAtanabilirIsEmirleri();
      
      // Başarı mesajı göster
      console.log('Yeni iş emri başarıyla oluşturuldu ve seçili listeye eklendi:', yeniIsEmri.is_emri_no);
      
    } catch (error) {
      console.error('Yeni iş emri oluşturulurken hata:', error);
      setError('Yeni iş emri oluşturulurken bir hata oluştu: ' + (error.response?.data?.error || error.message));
    } finally {
      setYeniIsEmriLoading(false);
    }
  };

  // Loading durumunu render et
  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
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
      maxWidth="xl" 
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: { 
          height: isMobile ? '100vh' : '90vh',
          m: isMobile ? 0 : 2
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">Üretim Planı İş Emri Seçimi</Typography>
            <Typography variant="body2" color="text.secondary">
              Çoklu seçim yapabilirsiniz
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedIsEmirleri.length > 0 && (
              <Badge badgeContent={selectedIsEmirleri.length} color="primary">
                <Typography variant="body2" color="primary">
                  Seçilen: {selectedIsEmirleri.length}
                </Typography>
              </Badge>
            )}
            <FormControlLabel
              control={
                <Checkbox
                  checked={tamamlananlariGoster}
                  onChange={handleTamamlananlariGosterToggle}
                  size="small"
                />
              }
              label="Tamamlanan işleri göster"
              sx={{ 
                fontSize: '0.875rem',
                '& .MuiFormControlLabel-label': {
                  fontSize: '0.875rem'
                }
              }}
            />
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleYeniIsEmriClick}
              size="small"
              sx={{ ml: 1 }}
            >
              Yeni İş Emri
            </Button>
          </Box>
        </Box>
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
                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                minWidth: { xs: 70, sm: 100 },
                px: { xs: 0.5, sm: 2 }
              }
            }}
          >
            {tabConfig.map((tab, index) => (
              <Tab
                key={tab.key}
                label={`${tab.label} (${filteredIsEmirleri[tab.key]?.length || 0})`}
                id={`uretim-plani-tab-${index}`}
                aria-controls={`uretim-plani-tabpanel-${index}`}
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

        {/* Arama Çubuğu */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Parça kodu, iş emri numarası veya iş adı ile arayın..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleClearSearch}
                    edge="end"
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'background.paper'
              }
            }}
          />
          {searchTerm && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              "{searchTerm}" için arama sonuçları gösteriliyor
            </Typography>
          )}
        </Box>

        {/* Tümünü seç butonu */}
        {filteredIsEmirleri[tabConfig[selectedTab]?.key]?.length > 0 && (
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleSelectAll}
            >
              {(() => {
                const currentTabData = filteredIsEmirleri[tabConfig[selectedTab].key] || [];
                const currentTabIds = currentTabData.map(ie => ie.id || ie.is_emri_id);
                const allSelected = currentTabIds.every(id => 
                  selectedIsEmirleri.some(ie => (ie.id || ie.is_emri_id) === id)
                );
                return allSelected ? 'Tümünü Kaldır' : 'Tümünü Seç';
              })()}
            </Button>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary">
                Bu sekmede {filteredIsEmirleri[tabConfig[selectedTab]?.key]?.length || 0} iş emri
                {searchTerm && (
                  <span> (filtrelenmiş: {isEmirleri[tabConfig[selectedTab]?.key]?.length || 0} toplam)</span>
                )}
              </Typography>
            </Box>
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* Sekme içerikleri */}
        {tabConfig.map((tab, index) => (
          <TabPanel key={tab.key} value={selectedTab} index={index}>
            {filteredIsEmirleri[tab.key]?.length > 0 ? (
              <Box sx={{ maxHeight: '50vh', overflow: 'auto' }}>
                {filteredIsEmirleri[tab.key].map((isEmri) => {
                  const emriId = isEmri.id || isEmri.is_emri_id;
                  const isSelected = selectedIsEmirleri.some(ie => (ie.id || ie.is_emri_id) === emriId);
                  const isFromSiparis = tab.key === 'siparisler';
                  
                  return (
                    <IsEmriKarti
                      key={emriId}
                      isEmri={isEmri}
                      isSelected={isSelected}
                      onToggleSelect={handleIsEmriToggleSelect}
                      parcaGorselUrl={parcaGorselleri[emriId]}
                      isFromSiparis={isFromSiparis}
                    />
                  );
                })}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  {searchTerm ? (
                    `"${searchTerm}" araması için ${tab.label} sekmesinde sonuç bulunamadı.`
                  ) : (
                    tab.key === 'siparisler' 
                      ? 'Aktif sipariş iş emri bulunmamaktadır.'
                      : `${tab.label} durumunda atanabilir iş emri bulunmamaktadır.`
                  )}
                </Typography>
                {searchTerm && (
                  <Button
                    variant="text"
                    onClick={handleClearSearch}
                    sx={{ mt: 1 }}
                  >
                    Aramayı Temizle
                  </Button>
                )}
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
          disabled={selectedIsEmirleri.length === 0 || submitLoading}
          startIcon={submitLoading ? <CircularProgress size={20} /> : null}
        >
          {submitLoading 
            ? 'Ekleniyor...' 
            : `Seç ve Ekle (${selectedIsEmirleri.length})`
          }
        </Button>
        
        {selectedIsEmirleri.length > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            {selectedIsEmirleri.map(ie => ie.is_emri_no).join(', ')}
          </Typography>          )}
        </DialogActions>

        {/* Yeni İş Emri Oluşturma Formu */}
        <IsEmriEkleForm
          open={yeniIsEmriFormOpen}
          onClose={handleYeniIsEmriFormClose}
          onSubmit={handleYeniIsEmriOlusturuldu}
          preSelectedUretimPlaniId={null} // Üretim planı seçimi yapmıyoruz çünkü bu form üretim planı için kullanılıyor
          hideUretimPlaniSelection={true} // Üretim planı seçimini gizle
        />
      </Dialog>
    );
  };

export default UretimPlaniIsEmriSecimiModal;
