import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Tabs, Tab, CircularProgress, Alert, Container, Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Snackbar, IconButton, AppBar, Toolbar, TextField, InputAdornment } from '@mui/material';
import { Settings as SettingsIcon, FilterList as FilterListIcon, Search as SearchIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { isEmirleriAPI, tezgahAPI, tezgahPlanAPI, isEmriDurumAPI } from '../../services/api';
import MobileIsEmriKartiYeniV2 from '../../components/MobileIsEmriKartiYeniV2';
import IsEmriDuzenleForm from '../../components/IsEmriDuzenleForm';
import IsEmriDurumYonetimiMobile from '../../components/mobile/IsEmriDurumYonetimiMobile';
import IsEmriFiltreleMobile from '../../components/mobile/IsEmriFiltreleMobile';
import axios from 'axios';
import { getFotoPath } from '../../utils/imageUtils';
import imageTestUtils from '../../utils/imageTestUtils';



function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

/**
 * Görsel URL'lerini test etmek için yardımcı fonksiyon
 * Bu fonksiyon window.testParcaGorselleri olarak global kapsamda yer alır
 * Böylece tarayıcı konsolundan çağrılabilir
 */
/**
 * Parça görsellerini kapsamlı test eden ve aktif olarak URL'leri kontrol eden fonksiyon
 * Bu fonksiyon çağrıldığında hem alternatif URL'leri listeler hem de her görsel URL'nin
 * gerçekten yüklenip yüklenemediğini kontrol eder
 * @returns {Promise<object>} Test sonuçları
 */
async function testParcaGorselleri() {
  // Mevcut parça görsellerini ve iş emirlerini al
  const currentIsEmirleri = window.appState?.isEmirleri || [];
  const currentParcaGorselleri = window.appState?.parcaGorselleri || {};
  
  console.log('=== PARÇA GÖRSELLERİ TEST ARACI (Gelişmiş) ===');
  console.log('Toplam iş emri sayısı:', currentIsEmirleri.length);
  console.log('Kayıtlı görsel sayısı:', Object.keys(currentParcaGorselleri).length);
  
  // İş emirlerinde bulunan tüm parçaların temel bilgilerini topla
  const parcaDetaylari = {};
  currentIsEmirleri.forEach(isEmri => {
    const emriId = isEmri.id || isEmri.is_emri_id;
    if (!emriId) return;
    
    if (isEmri.parca) {
      parcaDetaylari[emriId] = {
        isEmriNo: isEmri.is_emri_no,
        parcaKodu: isEmri.parca.parca_kodu,
        parcaAdi: isEmri.parca.parca_adi,
        gorselUrl: currentParcaGorselleri[emriId],
        fotoPath: isEmri.parca.foto_path
      };
    }
  });
  
  console.log('Parça detayları:', parcaDetaylari);
  
  // Mevcut görsellerin doğruluğunu test et
  console.log('Görsellerin doğruluğu test ediliyor...');
  const testResults = await imageTestUtils.testIsEmriImages(
    currentIsEmirleri, 
    currentParcaGorselleri
  );
  
  // Tüm alternatif yolları içeren kapsamlı test tablosu oluştur
  const detayliSonuclar = [];
  
  currentIsEmirleri.forEach(isEmri => {
    const emriId = isEmri.id || isEmri.is_emri_id;
    if (!emriId) return;
    
    const emriNo = isEmri.is_emri_no || `#${emriId}`;
    const parcaKodu = isEmri.parca?.parca_kodu;
    const currentUrl = currentParcaGorselleri[emriId];
    
    const sonuc = {
      isEmriNo: emriNo,
      parcaKodu: parcaKodu || 'YOK',
      currentUrl: currentUrl || 'YOK',
      fotoPath: isEmri.parca?.foto_path || 'YOK'
    };
    
    // Alternatif yollar
    if (parcaKodu) {
      sonuc.alternatif1 = `/uploads/fotograflar/${parcaKodu}.jpg`;
      sonuc.alternatif2 = `/uploads/fotograflar/${parcaKodu.replace(/[^a-zA-Z0-9]/g, '')}.jpg`;
    }
    
    detayliSonuclar.push(sonuc);
  });
  
  console.table(detayliSonuclar);
  console.log('Görsel test sonuçları:', testResults);
  console.log('Görsel test aracı başarıyla çalıştı.');
  console.log('Lütfen sorunlu görselleri inceleyip doğru yolda olduğundan emin olun.');
  
  return {
    parcaDetaylari,
    testResults,
    detayliSonuclar
  };
}

// Global kapsamda test fonksiyonunu tanımla
if (typeof window !== 'undefined') {
  window.testParcaGorselleri = testParcaGorselleri;
}

function IsEmirleriMobileYeni() {
  // Tezgaha Ata dialog state ve fonksiyonları (COMPONENT İÇİNE TAŞINDI)
  const [isAtaDialogOpen, setIsAtaDialogOpen] = useState(false);
  const [isAtaLoading, setIsAtaLoading] = useState(false);
  const [isAtaSelectedTezgah, setIsAtaSelectedTezgah] = useState('');
  const [isAtaSelectedIsEmri, setIsAtaSelectedIsEmri] = useState(null);
  const [tezgahlar, setTezgahlar] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [isEmirleri, setIsEmirleri] = useState([]);
  const [filteredIsEmirleri, setFilteredIsEmirleri] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [showDurumYonetimi, setShowDurumYonetimi] = useState(false);
  const [parcaGorselleri, setParcaGorselleri] = useState({});
  const [atanmislariGizle, setAtanmislariGizle] = useState(false);
  const [durumlar, setDurumlar] = useState([]);
  
  // Filtreleme state'leri
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uretimPlanlari, setUretimPlanlari] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    uretimPlaniId: '',
    statusFilters: [],
    dateFilters: {
      teslimTarihiStart: '',
      teslimTarihiEnd: '',
      siparisTarihiStart: '',
      siparisTarihiEnd: ''
    },
    showCompleted: false,
    hideAssigned: false
  });
  // const [gorsellerYukleniyor, setGorsellerYukleniyor] = useState(false); // Gerekirse eklenebilir

  // Düzenle modal state
  const [editDialog, setEditDialog] = useState({ open: false, isEmri: null });
  const [editLoading, setEditLoading] = useState(false);

  // Kartı Taşı modal state
  const [moveDialog, setMoveDialog] = useState({ open: false, isEmri: null });
  const [moveTargetStatus, setMoveTargetStatus] = useState('');
  const [moveLoading, setMoveLoading] = useState(false);

  // Global state'e erişim için (test aracı için)
  if (typeof window !== 'undefined') {
    window.appState = { isEmirleri, parcaGorselleri };
  }

  // Filtreleme fonksiyonları - moved to top to avoid conditional hooks
  const loadUretimPlanlari = useCallback(async () => {
    try {
      const response = await axios.get('/api/uretim-plani');
      setUretimPlanlari(response.data);
    } catch (error) {
      console.error('Üretim planları yüklenirken hata:', error);
    }
  }, []);

  const applyFilters = useCallback((data) => {
    let filtered = data;

    // Arama filtresi
    if (filters.search?.trim()) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(isEmri => 
        (isEmri.is_emri_no?.toLowerCase().includes(searchLower)) ||
        (isEmri.is_adi?.toLowerCase().includes(searchLower)) ||
        (isEmri.parca_kodu?.toLowerCase().includes(searchLower)) ||
        (isEmri.parca?.parca_kodu?.toLowerCase().includes(searchLower)) ||
        (isEmri.parca?.parca_adi?.toLowerCase().includes(searchLower))
      );
    }

    // Üretim planı filtresi
    if (filters.uretimPlaniId) {
      filtered = filtered.filter(isEmri => 
        isEmri.uretim_plani_id === parseInt(filters.uretimPlaniId)
      );
    }

    // Durum filtreleri
    if (filters.statusFilters?.length > 0) {
      filtered = filtered.filter(isEmri => 
        filters.statusFilters.includes(isEmri.durum)
      );
    }

    // Tarih filtreleri
    if (filters.dateFilters?.teslimTarihiStart || filters.dateFilters?.teslimTarihiEnd) {
      filtered = filtered.filter(isEmri => {
        if (!isEmri.teslim_tarihi) return false;
        const teslimDate = new Date(isEmri.teslim_tarihi);
        const startDate = filters.dateFilters.teslimTarihiStart ? new Date(filters.dateFilters.teslimTarihiStart) : null;
        const endDate = filters.dateFilters.teslimTarihiEnd ? new Date(filters.dateFilters.teslimTarihiEnd) : null;
        
        if (startDate && teslimDate < startDate) return false;
        if (endDate && teslimDate > endDate) return false;
        return true;
      });
    }

    return filtered;
  }, [filters]);

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: '',
      uretimPlaniId: '',
      statusFilters: [],
      dateFilters: {
        teslimTarihiStart: '',
        teslimTarihiEnd: '',
        siparisTarihiStart: '',
        siparisTarihiEnd: ''
      },
      showCompleted: false,
      hideAssigned: false
    });
    setSearchTerm('');
  }, []);

  // Durumları yükle
  const loadDurumlar = useCallback(async () => {
    try {
      const response = await isEmriDurumAPI.getAll();
      const aktivDurumlar = response.data
        .filter(durum => durum.aktif)
        .sort((a, b) => a.sira_no - b.sira_no);
      
      setDurumlar(aktivDurumlar);
      return aktivDurumlar;
    } catch (error) {
      console.error('Durumlar yüklenirken hata:', error);
      setError('Durumlar yüklenirken bir hata oluştu');
      return [];
    }
  }, []);

  // Tezgahları yükle (bir kere)
  useEffect(() => {
    async function fetchTezgahlar() {
      try {
        const res = await tezgahAPI.getAll();
        const data = res.data;
        // Gelen verinin array olup olmadığını kontrol et
        if (Array.isArray(data)) {
          setTezgahlar(data);
        } else if (data && Array.isArray(data.data)) {
          setTezgahlar(data.data);
        } else {
          console.warn('Tezgahlar API beklenmeyen format:', data);
          setTezgahlar([]);
        }
      } catch (error) {
        console.error('Tezgahlar yüklenirken hata:', error);
        setTezgahlar([]);
      }
    }
    fetchTezgahlar();
  }, []);

  // Tezgaha Ata butonuna tıklanınca
  const handleTezgahAta = (isEmri) => {
    setIsAtaSelectedIsEmri(isEmri);
    setIsAtaSelectedTezgah('');
    setIsAtaDialogOpen(true);
  };

  // Dialog kapat
  const handleIsAtaDialogClose = () => {
    setIsAtaDialogOpen(false);
    setIsAtaSelectedTezgah('');
    setIsAtaSelectedIsEmri(null);
  };

  // Atama işlemi
  const handleIsAtaOnayla = async () => {
    if (!isAtaSelectedTezgah || !isAtaSelectedIsEmri) return;
    setIsAtaLoading(true);
    try {
      const isEmriId = isAtaSelectedIsEmri.is_emri_id || isAtaSelectedIsEmri.id;
      await tezgahPlanAPI.addPlanlananIs(isAtaSelectedTezgah, isEmriId);
      setSnackbar({ open: true, message: 'İş emri başarıyla tezgaha atandı', severity: 'success' });
      handleIsAtaDialogClose();
      fetchIsEmirleriData(atanmislariGizle); // Listeyi güncelle
    } catch (error) {
      setSnackbar({ open: true, message: 'İş emri atanamadı: ' + (error.response?.data?.error || error.message), severity: 'error' });
    } finally {
      setIsAtaLoading(false);
    }
  };

  // loadParcaGorselleri'nin fetchIsEmirleriData'dan önce tanımlanması gerekebilir
  // veya fetchIsEmirleriData'nın useCallback bağımlılığından çıkarılabilir (eğer sadece bir kere çağrılıyorsa)
  // Şimdilik loadParcaGorselleri'nin bağımlılığını düzeltelim.
  const loadParcaGorselleri = useCallback(async (currentIsEmirleriData) => {
    if (!currentIsEmirleriData || currentIsEmirleriData.length === 0) {
      setParcaGorselleri({}); // Veri yoksa görselleri sıfırla
      return;
    }
    // setGorsellerYukleniyor(true); // İsteğe bağlı
    try {
      const newGorseller = {}; // Her seferinde yeni bir nesne oluştur
      console.log('İş emirleri parça görselleri yükleniyor:', currentIsEmirleriData.length, 'adet iş emri için');
      
      for (const isEmri of currentIsEmirleriData) {
        // İş emri ID'yi doğru şekilde belirle (debug bilgisi ekle)
        const emriId = isEmri.id || isEmri.is_emri_id;
        console.log(`İş emri [${isEmri.is_emri_no || 'Numara yok'}] için ID: ${emriId}, Parça bilgisi:`, isEmri.parca);
        
        // Önce doğrudan iş emrinde parça foto_path var mı kontrol et
        if (isEmri.parca?.foto_path) {
          console.log(`İş emri ${emriId} için doğrudan parça.foto_path bulundu:`, isEmri.parca.foto_path);
          newGorseller[emriId] = getFotoPath(isEmri.parca.foto_path);
          continue; // Doğrudan fotoğraf bulunduysa API'ye gerek yok
        }
        
        // Parça kodu varsa API'den fotoğraf detayı al
        if (isEmri.parca?.parca_kodu && emriId) {
          try {
            const parcaKodu = isEmri.parca.parca_kodu.trim();
            console.log(`${emriId} için ${parcaKodu} parça kodu ile API sorgusu yapılıyor...`);
            
            const response = await axios.get(`/api/parcalar?aramaMetni=${encodeURIComponent(parcaKodu)}`);
            console.log(`Parça API yanıtı (${parcaKodu}):`, response.data);
            
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
              const parcaDetay = response.data.find(p => p.parcaKodu === parcaKodu) || response.data[0];
              if (parcaDetay && parcaDetay.foto_path) {
                const gorselUrl = getFotoPath(parcaDetay.foto_path);
                console.log(`${emriId} için görsel URL: ${gorselUrl} (${parcaKodu})`);
                newGorseller[emriId] = gorselUrl;
              } else {
                console.log(`${emriId} için parça detayında foto_path bulunamadı`);
              }
            } else {
              console.log(`${emriId} için ${parcaKodu} kodlu parça bulunamadı`);
            }
          } catch (error) {
            console.error(`${isEmri.is_emri_no || emriId} için parça görseli alınamadı:`, error);
          }
        }
      }
      
      console.log('Yüklenen parça görselleri:', newGorseller);
      setParcaGorselleri(newGorseller);
    } finally {
      // setGorsellerYukleniyor(false);
    }
  }, []); // Bağımlılık dizisi boş

  const fetchIsEmirleriData = useCallback(async (gizleAktifIsler = true) => {
    setLoading(true);
    setError(null);
    try {
      // Önce durumları yükle
      await loadDurumlar();
      
      // Aktif işleri gizlemek/göstermek için parametre ayarla
      const params = new URLSearchParams();
      if (!gizleAktifIsler) {
        // Aktif işleri göstermek için showAssigned=true parametresi gönder
        params.append('showAssigned', 'true');
      }
      // gizleAktifIsler true ise (varsayılan), hiç parametre gönderilmez çünkü backend varsayılan olarak gizler
      
      const url = params.toString() ? `/api/is-emirleri?${params.toString()}` : '/api/is-emirleri';
      const response = await axios.get(url); // Doğrudan axios kullan
      console.log('API Response Data:', response.data);
      let data = [];
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (typeof response.data === 'object' && response.data !== null && Object.keys(response.data).length > 0) {
        data = Object.values(response.data).flat();
      } else {
        console.warn('İş emirleri verisi beklenen formatta değil:', response.data);
      }
      console.log('Processed isEmirleri Data:', data);
      setIsEmirleri(data);
      if (data.length > 0) {
        // loadParcaGorselleri çağrısı burada kalabilir, çünkü artık bağımlılığı düzgün.
        loadParcaGorselleri(data);
      }
    } catch (err) {
      console.error('İş emirleri alınamadı:', err);
      setError('İş emirleri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [loadParcaGorselleri, loadDurumlar]); // loadParcaGorselleri artık stabil olmalı

  // Handler functions
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleAtanmislariGizleToggle = () => {
    const yeniDurum = !atanmislariGizle;
    setAtanmislariGizle(yeniDurum);
    // Eğer yeniDurum false ise (aktif işleri göster), gizleAktifIsler false olmalı
    // Eğer yeniDurum true ise (aktif işleri gizle), gizleAktifIsler true olmalı
    fetchIsEmirleriData(yeniDurum);
  };

  // Düzenle butonuna tıklanınca
  const handleEditIsEmri = (isEmri) => {
    setEditDialog({ open: true, isEmri });
  };

  // Düzenle modal kapat
  const handleEditDialogClose = () => {
    setEditDialog({ open: false, isEmri: null });
  };

  // Düzenle kaydet
  const handleEditDialogSave = async (formData) => {
    if (!editDialog.isEmri) return;
    setEditLoading(true);
    try {
      await isEmirleriAPI.update(editDialog.isEmri.id || editDialog.isEmri.is_emri_id, formData);
      setSnackbar({ open: true, message: 'İş emri başarıyla güncellendi', severity: 'success' });
      handleEditDialogClose();
      fetchIsEmirleriData(atanmislariGizle);
    } catch (error) {
      setSnackbar({ open: true, message: 'Güncelleme başarısız: ' + (error.response?.data?.error || error.message), severity: 'error' });
    } finally {
      setEditLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchIsEmirleriData(!atanmislariGizle); // atanmislariGizle false ise (aktif işleri göster), parametre true olmalı
  }, [fetchIsEmirleriData, atanmislariGizle]);

  // Üretim planlarını yükle
  useEffect(() => {
    loadUretimPlanlari();
  }, [loadUretimPlanlari]);

  // Filtreleri uygula
  useEffect(() => {
    const filtered = applyFilters(isEmirleri);
    setFilteredIsEmirleri(filtered);
  }, [isEmirleri, filters, applyFilters]);


  // Kartı Taşı butonuna tıklanınca
  const handleMoveCard = (isEmri) => {
    setMoveDialog({ open: true, isEmri });
    setMoveTargetStatus('');
  };

  // Kartı Taşı modal kapat
  const handleMoveDialogClose = () => {
    setMoveDialog({ open: false, isEmri: null });
    setMoveTargetStatus('');
  };

  // Kartı Taşı onayla
  const handleMoveDialogConfirm = async () => {
    if (!moveDialog.isEmri || !moveTargetStatus) return;
    setMoveLoading(true);
    try {
      await isEmirleriAPI.update(moveDialog.isEmri.id || moveDialog.isEmri.is_emri_id, { durum: moveTargetStatus });
      setSnackbar({ open: true, message: 'İş emri başarıyla taşındı', severity: 'success' });
      handleMoveDialogClose();
      fetchIsEmirleriData(atanmislariGizle);
    } catch (error) {
      setSnackbar({ open: true, message: 'Taşıma başarısız: ' + (error.response?.data?.error || error.message), severity: 'error' });
    } finally {
      setMoveLoading(false);
    }
  };

  // Dinamik durum filtreleme
  const filterIsEmirleriByStatus = (statusArray) => {
    return isEmirleri.filter(isEmri => {
      // Büyük/küçük harf duyarsız karşılaştırma
      const normalizedDurum = isEmri.durum ? isEmri.durum.toLowerCase().trim() : '';
      return statusArray.some(status => status.toLowerCase().trim() === normalizedDurum);
    });
  };

  // Dinamik durum grupları oluştur (filtrelenmiş veriler ile)
  const durumGruplari = durumlar.reduce((acc, durum) => {
    const grupIsmı = durum.durum_kodu.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '') + 'IsEmirleri';
    // Filtrelenmiş verileri kullan
    const filteredForStatus = filteredIsEmirleri.filter(isEmri => {
      const normalizedDurum = isEmri.durum ? isEmri.durum.toLowerCase().trim() : '';
      const normalizedTargetDurum = durum.durum_kodu ? durum.durum_kodu.toLowerCase().trim() : '';
      return normalizedDurum === normalizedTargetDurum;
    });
    
    acc[grupIsmı] = {
      isEmirleri: filteredForStatus,
      durum: durum
    };
    return acc;
  }, {});

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 2 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={fetchIsEmirleriData} sx={{ mt: 2 }}>Yeniden Dene</Button>
      </Container>
    );
  }

  // Durum yönetimi gösteriliyorsa onu render et
  if (showDurumYonetimi) {
    return (
      <IsEmriDurumYonetimiMobile 
        onBack={() => setShowDurumYonetimi(false)} 
      />
    );
  }


  return (
    <Box sx={{ width: '100%', bgcolor: 'background.paper', pb: 10 }}>
      {/* Header with Search and Filter */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <TextField
            fullWidth
            placeholder="İş no, iş adı, parça kodu ara..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setFilters(prev => ({ ...prev, search: e.target.value }));
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { border: 'none' },
              },
            }}
          />
          <IconButton onClick={() => setShowFilterDrawer(true)}>
            <FilterListIcon />
          </IconButton>
          <IconButton onClick={() => fetchIsEmirleriData(atanmislariGizle)} disabled={loading}>
            <RefreshIcon />
          </IconButton>
          <IconButton 
            color="primary" 
            onClick={() => setShowDurumYonetimi(true)}
            title="Durum Yönetimi"
          >
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1 }}>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleAtanmislariGizleToggle} 
            sx={{ fontSize: '0.75rem' }}
          >
            {atanmislariGizle ? 'Aktif İşleri Göster' : 'Aktif İşleri Gizle'}
          </Button>
          <Typography variant="body2" color="text.secondary">
            {filteredIsEmirleri.length} iş emri
          </Typography>
        </Box>
        <Tabs value={selectedTab} onChange={handleTabChange} aria-label="İş emri durumları" variant="scrollable" scrollButtons="auto">
          {durumlar.map((durum, index) => {
            const grupIsmı = durum.durum_kodu.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '') + 'IsEmirleri';
            const isEmirleriCount = durumGruplari[grupIsmı]?.isEmirleri.length || 0;
            return (
              <Tab 
                key={durum.durum_id}
                label={`${durum.durum_adi} (${isEmirleriCount})`} 
                id={`tab-${durum.durum_kodu.replace(/\s+/g, '-')}`} 
                aria-controls={`tabpanel-${durum.durum_kodu.replace(/\s+/g, '-')}`} 
              />
            );
          })}
        </Tabs>
      </Box>

      {durumlar.map((durum, index) => {
        const grupIsmı = durum.durum_kodu.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '') + 'IsEmirleri';
        const durumIsEmirleri = durumGruplari[grupIsmı]?.isEmirleri || [];
        
        return (
          <TabPanel key={durum.durum_id} value={selectedTab} index={index}>
            {durumIsEmirleri.length > 0 ? (
              durumIsEmirleri.map(isEmri => (
                <MobileIsEmriKartiYeniV2
                  key={isEmri.id || isEmri.is_emri_id}
                  isEmri={isEmri}
                  parcaGorselUrl={parcaGorselleri[isEmri.id || isEmri.is_emri_id]}
                  onTezgahAta={handleTezgahAta}
                  onEdit={handleEditIsEmri}
                  onMoveCard={handleMoveCard}
                />
              ))
            ) : (
              <Typography sx={{ textAlign: 'center', p: 2, color: 'text.secondary' }}>
                {durum.durum_adi} durumunda iş emri bulunmamaktadır.
              </Typography>
            )}
          </TabPanel>
        );
      })}

      {/* Düzenle Dialog */}
      <Dialog open={editDialog.open} onClose={handleEditDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>İş Emri Düzenle</DialogTitle>
        <DialogContent>
          {editDialog.isEmri && (
            <IsEmriDuzenleForm
              open={true}
              initialData={editDialog.isEmri}
              onClose={handleEditDialogClose}
              onSubmit={handleEditDialogSave}
              loading={editLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Kartı Taşı Dialog */}
      <Dialog open={moveDialog.open} onClose={handleMoveDialogClose} maxWidth="xs" fullWidth>
        <DialogTitle>Kartı Taşı</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            İş emrini hangi duruma taşımak istiyorsunuz?
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="move-status-select-label">Durum Seç</InputLabel>
            <Select
              labelId="move-status-select-label"
              value={moveTargetStatus}
              label="Durum Seç"
              onChange={e => setMoveTargetStatus(e.target.value)}
            >
              {/* Dinamik durum sistemi */}
              {durumlar.filter(durum => moveDialog.isEmri && moveDialog.isEmri.durum !== durum.durum_kodu).map(durum => (
                <MenuItem key={durum.durum_id} value={durum.durum_kodu}>
                  {durum.durum_adi}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleMoveDialogClose} disabled={moveLoading}>İptal</Button>
          <Button onClick={handleMoveDialogConfirm} variant="contained" color="primary" disabled={!moveTargetStatus || moveLoading}>
            {moveLoading ? 'Taşınıyor...' : 'Taşı'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tezgaha Ata Dialog */}
      <Dialog open={isAtaDialogOpen} onClose={handleIsAtaDialogClose} maxWidth="xs" fullWidth>
        <DialogTitle>İş Emrini Tezgaha Ata</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Hangi tezgaha atamak istiyorsunuz?
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="is-ata-tezgah-select-label">Tezgah Seç</InputLabel>
            <Select
              labelId="is-ata-tezgah-select-label"
              value={isAtaSelectedTezgah}
              label="Tezgah Seç"
              onChange={e => setIsAtaSelectedTezgah(e.target.value)}
            >
              {Array.isArray(tezgahlar) ? tezgahlar.map(tezgah => (
                <MenuItem key={tezgah.tezgah_id} value={tezgah.tezgah_id}>{tezgah.tezgah_tanimi || tezgah.ad || tezgah.tezgah_id}</MenuItem>
              )) : null}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleIsAtaDialogClose} disabled={isAtaLoading}>İptal</Button>
          <Button onClick={handleIsAtaOnayla} variant="contained" color="primary" disabled={!isAtaSelectedTezgah || isAtaLoading}>
            {isAtaLoading ? 'Atanıyor...' : 'Ata'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filter Drawer */}
      <IsEmriFiltreleMobile
        open={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        uretimPlanlari={uretimPlanlari}
        durumOptions={durumlar}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
}

export default IsEmirleriMobileYeni;
