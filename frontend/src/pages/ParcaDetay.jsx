import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchIsEmirleri } from '../store/slices/isEmirleriSlice';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  AppBar,
  Toolbar,
  TextField,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Tabs,
  Tab,
  InputAdornment,
  CircularProgress,
  Alert,
  Snackbar,
  Checkbox
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import WarningIcon from '@mui/icons-material/Warning';
import InventoryIcon from '@mui/icons-material/Inventory';
import FolderIcon from '@mui/icons-material/Folder';
import VisibilityIcon from '@mui/icons-material/Visibility';
import QRCodeDisplay from '../components/common/QRCodeDisplay';
import AddTaskIcon from '@mui/icons-material/AddTask';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import IsEmriEkleForm from '../components/IsEmriEkleForm';
import ParcaTekliflerModal from '../components/ParcaTekliflerModal';
import { isEmirleriAPI, isEmriDurumAPI } from '../services/api';
import ImageWithFallback from '../components/ImageWithFallback';
import TeknikResimViewer from '../components/TeknikResimViewer';
import ParcaUretimGecmisiModal from '../components/ParcaUretimGecmisiModal';
import SiparisDokumanlariModal from '../components/SiparisDokumanlariModal';
import StokKartiSecimModal from '../components/StokKartiSecimModal';
import ParcaDuzenleFormu from '../components/ParcaDuzenleFormu';
import stokKartlariService from '../services/stokKartlariService';
import TedarikTalepForm from '../components/tedarik/TedarikTalepForm';
import { getFotoPath, getTeknikResimPath, getFileType } from '../utils/imageUtils';


import apiClient from '../utils/apiClient';// Sekme panel bileşeni
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`parca-tabpanel-${index}`}
      aria-labelledby={`parca-tab-${index}`}
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

export default function ParcaDetay() {
  const { parcaKodu } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Existing states
  const [parca, setParca] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [teknikResimDialogOpen, setTeknikResimDialogOpen] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // İş emri oluşturma state'leri
  const [isEmriModalOpen, setIsEmriModalOpen] = useState(false);
  const [uretimGecmisiModalOpen, setUretimGecmisiModalOpen] = useState(false);
  const [parcaDuzenleModalOpen, setParcaDuzenleModalOpen] = useState(false);

  // Tedarik talebi oluşturma state'leri
  const [tedarikModalOpen, setTedarikModalOpen] = useState(false);

  // Teklifler modal state
  const [tekliflerModalOpen, setTekliflerModalOpen] = useState(false);
  const [isEmriForm, setIsEmriForm] = useState({
    miktar: 1,
    teslimTarihi: '',
    aciklama: '',
    oncelik: 'Normal',
    malzemesi_siparis_edilecekmi: false,
    malzeme_siparis_tarihi: '',
    siparis_dokumani: null,
    stok_karti_id: null,
    uretim_plani_id: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [dokumanModalOpen, setDokumanModalOpen] = useState(false);
  const [stokKartiModalOpen, setStokKartiModalOpen] = useState(false);
  const [selectedStokKarti, setSelectedStokKarti] = useState(null);
  const [parcaStokKarti, setParcaStokKarti] = useState(null);
  const [stokKartiLoading, setStokKartiLoading] = useState(false);
  const [uretimPlanlari, setUretimPlanlari] = useState([]);
  const [loadingUretimPlanlari, setLoadingUretimPlanlari] = useState(false);

  useEffect(() => {
    const fetchParca = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/parcalar/${encodeURIComponent(parcaKodu)}`);
        const parcaData = response.data;
        setParca(parcaData);

        // Eğer parçanın stok kartı ID'si varsa, stok kartı bilgisini getir
        if (parcaData?.stok_karti_id) {
          try {
            setStokKartiLoading(true);
            const stokKartiResponse = await stokKartlariService.getStokKarti(parcaData.stok_karti_id);
            if (stokKartiResponse.success) {
              setParcaStokKarti(stokKartiResponse.data);
            }
          } catch (stokKartiError) {
            console.error('Stok kartı bilgisi alınamadı:', stokKartiError);
          } finally {
            setStokKartiLoading(false);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Parça detayları alınamadı:', err);
        setError('Parça bilgileri yüklenirken bir hata oluştu.');
        setLoading(false);
      }
    };

    if (parcaKodu) {
      fetchParca();
    }
  }, [parcaKodu]);

  // Debug: üretim planları state değişimini takip et
  useEffect(() => {
    console.log('Üretim planları state değişti:', uretimPlanlari);
  }, [uretimPlanlari]);

  // Debug: loading state değişimini takip et
  useEffect(() => {
    console.log('Loading üretim planları state değişti:', loadingUretimPlanlari);
  }, [loadingUretimPlanlari]);

  // Parça düzenleme modalı başarı callback'i
  const handleParcaGuncellemeBasarili = (updatedParca) => {
    setParca(updatedParca);
    setParcaDuzenleModalOpen(false);
    setSnackbar({
      open: true,
      message: 'Parça başarıyla güncellendi',
      severity: 'success'
    });
  };

  // Parça düzenleme modalını aç
  const handleParcaDuzenleModalAc = () => {
    setParcaDuzenleModalOpen(true);
  };

  // Üretim planlarını getir
  const fetchUretimPlanlari = async () => {
    try {
      setLoadingUretimPlanlari(true);
      console.log('Üretim planları getiriliyor...');
      const response = await axios.get('/api/uretim-plani');
      console.log('Üretim planları yanıtı:', response.data);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      // API yanıtını kontrol et
      let plans = [];
      if (Array.isArray(response.data)) {
        plans = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        plans = response.data.data;
      } else if (response.data && typeof response.data === 'object') {
        console.log('Response.data object keys:', Object.keys(response.data));
        plans = [];
      }
      
      // Eğer planlar boşsa mock data kullan (test amaçlı)
      if (plans.length === 0) {
        console.log('Planlar boş, mock data kullanılıyor...');
        plans = [
          { id: 1, ozel_liste_adi: 'Test Plan 1', miktar: 10 },
          { id: 2, ozel_liste_adi: 'Test Plan 2', miktar: 20 },
          { id: 3, makina: { name: 'CNC Makina 1' }, miktar: 15 }
        ];
      }
      
      console.log('İşlenmiş planlar:', plans);
      setUretimPlanlari(plans);
    } catch (error) {
      console.error('Üretim planları yüklenirken hata:', error);
      // Hata durumunda mock data kullan
      console.log('Hata durumunda mock data kullanılıyor...');
      setUretimPlanlari([
        { id: 1, ozel_liste_adi: 'Mock Plan 1', miktar: 5 },
        { id: 2, ozel_liste_adi: 'Mock Plan 2', miktar: 8 }
      ]);
    } finally {
      setLoadingUretimPlanlari(false);
    }
  };

  
  // CAD dosyası URL'ini HTTP formatına dönüştür
  const getCadFileUrl = (filePath) => {
    if (!filePath) return null;

    // Eğer zaten HTTP URL ise aynı şekilde kullan
    if (filePath.startsWith('http')) {
      return filePath;
    }

    // Dosya adını al
    const filename = filePath.split(/[\\/]/).pop();
    if (!filename) return null;

    // HTTP URL oluştur
    return `/api/cad-files/${filename}`;
  };

  // CAD dosyasını aç
  const handleCadFileClick = async (filePath, fileType) => {
    try {
      const filename = filePath.split(/[\\/]/).pop();
      const response = await axios.get(`/api/cad-files/info/${filename}`);

      if (response.data.success && response.data.data.exists) {
        // Yeni sekmede aç
        window.open(response.data.data.httpUrl, '_blank');
      } else {
        // Dosya bulunamazsa veya erişilemezse kullanıcı bilgilendir
        alert(`CAD dosyasına erişilemiyor:\n\n${filePath}\n\nDosya yolu: ${response.data?.data?.filePath || 'Bilinmiyor'}\n\nÇözüm: CAD dosyalarını sunucunun erişebileceği bir dizine kopyalayın veya ağ yolunu doğrulayın.`);
      }
    } catch (error) {
      console.error('CAD dosyası açılırken hata:', error);

      // Hata mesajını kullanıcıya göster
      const errorMessage = error.response?.data?.message || error.message || 'Bilinmeyen hata';
      alert(`CAD dosyası açılırken hata oluştu:\n\n${filePath}\n\nHata: ${errorMessage}\n\nCAD dosyasının sunucu tarafından erişilebilir olduğundan emin olun.`);
    }
  };

  // İş emri modal fonksiyonları
  const handleOpenIsEmriModal = () => {
    console.log('İş emri modal açılıyor...');
    console.log('Parça bilgisi:', parca);
    console.log('Parça stok kartı:', parcaStokKarti);

    setIsEmriForm({
      miktar: 1,
      teslimTarihi: '',
      aciklama: '',
      oncelik: 'Normal',
      malzemesi_siparis_edilecekmi: false,
      malzeme_siparis_tarihi: '',
      siparis_dokumani: null,
      stok_karti_id: parca?.stok_karti_id || null,
      uretim_plani_id: ''
    });

    // Eğer parçanın stok kartı varsa otomatik seç
    if (parcaStokKarti) {
      console.log('Stok kartı otomatik seçiliyor:', parcaStokKarti);
      setSelectedStokKarti(parcaStokKarti);
      setIsEmriForm(prev => ({ ...prev, stok_karti_id: parcaStokKarti.id }));
    } else if (parca?.stok_karti_id) {
      console.log('Stok kartı ID var ama obje yok, API den getiriliyor:', parca.stok_karti_id);
      // Eğer stok kartı objesi yok ama ID varsa, state'i ayarla
      setIsEmriForm(prev => ({ ...prev, stok_karti_id: parca.stok_karti_id }));
    }

    // Üretim planlarını getir
    console.log('Üretim planları çağırılıyor...');
    fetchUretimPlanlari();
    setIsEmriModalOpen(true);
  };

  const handleOpenFasonModal = () => {
    // Fason sayfasına yönlendir ve parça bilgisini gönder
    navigate('/fason', {
      state: {
        selectedParca: {
          parcaKodu: parca.parcaKodu,
          parcaAdi: parca.parcaAdi,
          hamMalzemeCinsi: parca.hamMalzemeCinsi,
          hamMalzemeOlculeri: parca.hamMalzemeOlculeri,
          sirketIciMaliyeti: parca.sirketIciMaliyeti,
          foto_path: parca.foto_path,
          teknik_resim_path: parca.teknik_resim_path
        },
        fromParcaDetay: true
      }
    });
  };

  // Tedarik talebi modal fonksiyonları
  const handleOpenTedarikModal = () => {
    setTedarikModalOpen(true);
  };

  const handleCloseTedarikModal = () => {
    setTedarikModalOpen(false);
  };

  // Teklifler modal fonksiyonları
  const handleOpenTekliflerModal = () => {
    setTekliflerModalOpen(true);
  };

  const handleCloseTekliflerModal = () => {
    setTekliflerModalOpen(false);
  };

  const handleTedarikTalebiOlustur = async (talepData) => {
    try {
      setFormLoading(true);

      // Parçadan tedarik talebi oluştur
      const enrichedTalep = {
        kaynak_tipi: 'parca',
        parca_kodu: parca.parcaKodu,
        aciklama: `${parca.parcaAdi} parçası için tedarik talebi`,
        talep_eden_kullanici: 'Sistem Kullanıcısı',
        detaylar: talepData.detaylar || []
      };

      // tedarikService'i kullanarak talep oluştur
      const response = await import('../services/tedarikService').then(module =>
        module.default.createFromParca(parca.parcaKodu, enrichedTalep)
      );

      setSnackbar({
        open: true,
        message: 'Tedarik talebi başarıyla oluşturuldu',
        severity: 'success'
      });

      handleCloseTedarikModal();
    } catch (error) {
      console.error('Tedarik talebi oluşturulurken hata:', error);
      setSnackbar({
        open: true,
        message: 'Tedarik talebi oluşturulurken bir hata oluştu',
        severity: 'error'
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleCloseIsEmriModal = () => {
    setIsEmriModalOpen(false);
    setIsEmriForm({
      miktar: 1,
      teslimTarihi: '',
      aciklama: '',
      oncelik: 'Normal',
      malzemesi_siparis_edilecekmi: false,
      malzeme_siparis_tarihi: '',
      siparis_dokumani: null,
      stok_karti_id: null,
      uretim_plani_id: ''
    });
    setSelectedStokKarti(null);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      setIsEmriForm(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'file') {
      setIsEmriForm(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setIsEmriForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Stok kartı seçim fonksiyonları
  const handleStokKartiModalAc = () => {
    setStokKartiModalOpen(true);
  };

  const handleStokKartiSec = (stokKarti) => {
    setSelectedStokKarti(stokKarti);
    setIsEmriForm(prev => ({ ...prev, stok_karti_id: stokKarti.id }));
    setStokKartiModalOpen(false);
  };

  const handleIsEmriSubmit = async () => {
    try {
      setFormLoading(true);
      
      let siparisDocumentPath = null;
      
      // Eğer sipariş dokümanı varsa önce yükle
      if (isEmriForm.malzemesi_siparis_edilecekmi && isEmriForm.siparis_dokumani) {
        try {
          const formData = new FormData();
          formData.append('siparis_dokumani', isEmriForm.siparis_dokumani);
          formData.append('parcaKodu', parca.parcaKodu || 'BILINMEYEN_PARCA');
          
          const uploadResponse = await axios.post('/api/upload/siparis-dokumani', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          siparisDocumentPath = uploadResponse.data.siparis_dokumani_path;
          console.log('Sipariş dokümanı yüklendi:', siparisDocumentPath);
        } catch (uploadError) {
          console.error('Sipariş dokümanı yüklenirken hata:', uploadError);
          console.warn('Dosya yüklenemedi, iş emri doküman olmadan oluşturuluyor');
        }
      }
      
      // Backend'den aktif durumları al ve doğru durumu belirle
      let durum = 'beklemede'; // Varsayılan
      try {
        const durumlarResponse = await isEmriDurumAPI.getAll();
        const durumlar = durumlarResponse.data || [];
        
        if (isEmriForm.malzemesi_siparis_edilecekmi) {
          // Sipariş verilecek durumu ara
          const siparisVerilecekDurum = durumlar.find(d => 
            d.durum_kodu === 'sipariş verilecek' || 
            d.durum_kodu === 'siparis_verilecek' ||
            d.durum_adi?.toLowerCase().includes('sipariş')
          );
          durum = siparisVerilecekDurum ? siparisVerilecekDurum.durum_kodu : 'sipariş verilecek';
        } else {
          // Beklemede durumu ara
          const beklemedeDurum = durumlar.find(d => 
            d.durum_kodu === 'beklemede' || 
            d.durum_adi?.toLowerCase().includes('beklemede')
          );
          durum = beklemedeDurum ? beklemedeDurum.durum_kodu : 'beklemede';
        }
        
        console.log('Seçilen durum:', durum, 'Sipariş edilecek mi:', isEmriForm.malzemesi_siparis_edilecekmi);
      } catch (durumError) {
        console.error('Durumlar alınırken hata:', durumError);
        // Hata durumunda varsayılan değerleri kullan
        durum = isEmriForm.malzemesi_siparis_edilecekmi ? 'sipariş verilecek' : 'beklemede';
      }
      
      const isEmriData = {
        plan_liste_no: 'WEB-' + Date.now(),
        is_adi: parca.parcaKodu, // İş adı olarak parça kodu
        adet: Number(isEmriForm.miktar),
        malzeme: selectedStokKarti?.malzeme_cinsi || parca?.hamMalzemeCinsi || '',
        teslim_tarihi: isEmriForm.teslimTarihi,
        durum: durum,
        aciklama: isEmriForm.aciklama,
        parca_kodu: parca.parcaKodu,
        oncelik: isEmriForm.oncelik || 'Normal',
        setup_sayisi: parca.setupSayisi || 0,
        cnc_suresi: parca.cncIslemeSuresi || 0,
        malzemesi_siparis_edilecekmi: isEmriForm.malzemesi_siparis_edilecekmi,
        malzeme_siparis_tarihi: isEmriForm.malzemesi_siparis_edilecekmi ? isEmriForm.malzeme_siparis_tarihi : null,
        siparis_dokumani_dosya_yolu: siparisDocumentPath,
        stok_karti_id: selectedStokKarti?.id || null,
        uretim_plani_id: isEmriForm.uretim_plani_id || null
      };

      console.log('İş emri oluşturuluyor:', isEmriData);
      const response = await isEmirleriAPI.create(isEmriData);
      console.log('İş emri oluşturuldu:', response);
      
      setSnackbar({
        open: true,
        message: 'İş emri başarıyla oluşturuldu',
        severity: 'success'
      });
      
      // İş emirleri listesini güncelle
      try {
        await dispatch(fetchIsEmirleri()).unwrap();
        console.log('İş emirleri listesi güncellendi');
      } catch (error) {
        console.error('İş emirleri listesi güncellenemedi:', error);
      }
      
      handleCloseIsEmriModal();
    } catch (error) {
      console.error('İş emri oluşturulurken hata:', error);
      setSnackbar({
        open: true,
        message: 'İş emri oluşturulurken bir hata oluştu',
        severity: 'error'
      });
    } finally {
      setFormLoading(false);
    }
  };

  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/parcalar')}
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Parçalar Listesine Dön
        </Button>
      </Box>
    );
  }

  if (!parca) return null;

  return (
    <Box sx={{ p: 3 }}>
      {/* Üst başlık ve işlem butonları */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/parcalar')}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5">Parça Detayı</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleParcaDuzenleModalAc}
            >
              Düzenle
            </Button>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Sol taraf - Parça görseli ve temel bilgiler */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            {/* Parça görseli */}
            <Box sx={{ 
              position: 'relative', 
              mb: 2,
              height: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#f5f5f5',
              borderRadius: 1
            }}>
              {parca.foto_path ? (
                <ImageWithFallback
                  src={getFotoPath(parca.foto_path)}
                  alt={parca.parcaAdi}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setSelectedImage(getFotoPath(parca.foto_path));
                    setPhotoDialogOpen(true);
                  }}
                />
              ) : (
                <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                  <DesignServicesIcon sx={{ fontSize: 60, opacity: 0.5, mb: 1 }} />
                  <Typography variant="body2">Resim Bulunmuyor</Typography>
                </Box>
              )}
            </Box>

            {/* Parça kodu ve temel bilgiler */}
            <Typography variant="h6" gutterBottom>
              {parca.parcaKodu}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {parca.parcaAdi}
            </Typography>

            {/* Stok durumu */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <InventoryIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                <strong>Stok:</strong> {parca.stokAdeti || 0} adet
              </Typography>
              
              {parca.stokAdeti <= parca.kritik_stok && parca.kritik_stok > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                  <WarningIcon fontSize="small" color="error" />
                  <Typography variant="body2" color="error.main" sx={{ ml: 0.5 }}>
                    Kritik seviye ({parca.kritik_stok})
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Parça türü */}
            <Chip 
              label={parca.imalMi ? 'İmal Edilir' : 'Tedarik Edilir'} 
              color={parca.imalMi ? 'primary' : 'default'}
              size="small"
              sx={{ mb: 2 }}
            />

            {/* Teknik resim butonu */}
            {parca.teknik_resim_path && (
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={(() => {
                    const fileType = getFileType(parca.teknik_resim_path);
                    switch (fileType) {
                      case 'pdf':
                        return <PictureAsPdfIcon />;
                      case 'image':
                        return <ImageIcon />;
                      default:
                        return <DesignServicesIcon />;
                    }
                  })()}
                  onClick={() => setTeknikResimDialogOpen(true)}
                  fullWidth
                >
                  Teknik Resmi Görüntüle
                </Button>
              </Box>
            )}

            {/* İş emri oluştur butonu */}
            {true && (
              <Box>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleOpenIsEmriModal}
                  startIcon={<AddTaskIcon />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark'
                    }
                  }}
                >
                  Bu Parçadan İş Emri Oluştur
                </Button>

                {/* Parçadan Tedarik Talebi Oluştur Butonu */}
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleOpenTedarikModal}
                  startIcon={<ShoppingCartIcon />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    bgcolor: 'warning.main',
                    color: 'white',
                    mt: 1,
                    '&:hover': {
                      bgcolor: 'warning.dark'
                    }
                  }}
                >
                  Parçadan Tedarik Talebi Oluştur
                </Button>

                {/* Parçadan Fason Oluştur Butonu */}
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleOpenFasonModal}
                  startIcon={<AddTaskIcon />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    bgcolor: 'secondary.main',
                    color: 'white',
                    mt: 1,
                    '&:hover': {
                      bgcolor: 'secondary.dark'
                    }
                  }}
                >
                  Parçadan Fason Oluştur
                </Button>

                {/* Parça Üretim Geçmişi Butonu */}
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => setUretimGecmisiModalOpen(true)}
                  startIcon={<FolderIcon />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    mt: 1
                  }}
                >
                  Parça Üretim Geçmişi
                </Button>

                {/* Parça Teklifleri Butonu */}
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleOpenTekliflerModal}
                  startIcon={<MonetizationOnIcon />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    bgcolor: 'success.main',
                    color: 'white',
                    mt: 1,
                    '&:hover': {
                      bgcolor: 'success.dark'
                    }
                  }}
                >
                  Parçanın Tekliflerini Görüntüle
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Sağ taraf - Detaylı bilgiler */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 0 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Temel Bilgiler" />
              <Tab label="Üretim" />
              <Tab label="Maliyet" />
              <Tab label="QR Kod" />
              <Tab label="CAD Dosyaları" />
            </Tabs>

            {/* Temel Bilgiler Sekmesi */}
            <TabPanel value={activeTab} index={0}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Parça Kodu"
                    name="parcaKodu"
                    value={parca.parcaKodu || ''}
                    fullWidth
                    variant="filled"
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Parça Adı"
                    name="parcaAdi"
                    value={parca.parcaAdi || ''}
                    fullWidth
                    variant="filled"
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Stok Miktarı"
                    name="stokAdeti"
                    type="number"
                    value={parca.stokAdeti || ''}
                    fullWidth
                    variant="filled"
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Kritik Stok"
                    name="kritik_stok"
                    type="number"
                    value={parca.kritik_stok || ''}
                    fullWidth
                    variant="filled"
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="imalMi"
                        checked={!!parca.imalMi}
                        disabled
                      />
                    }
                    label="İmal Edilen Parça"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Tedarik Bedeli"
                    name="tedarikBedeli"
                    type="number"
                    value={parca.tedarikBedeli || ''}
                    fullWidth
                    variant="filled"
                    disabled
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₺</InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            {/* Üretim Sekmesi */}
            <TabPanel value={activeTab} index={1}>
              {parca.imalMi ? (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Ham malzeme bilgileri artık stok kartları üzerinden yönetiliyor. 
                      Düzenlemek için "Düzenle" butonunu kullanın.
                    </Alert>
                    
                    {/* Stok Kartı Bilgisi */}
                    {parcaStokKarti ? (
                      <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <InventoryIcon color="primary" sx={{ mt: 0.5 }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                              Bağlı Stok Kartı
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Malzeme Cinsi:</strong> {parcaStokKarti.malzeme_cinsi}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Kesit:</strong> {parcaStokKarti.kesit}
                                  {parcaStokKarti.boy && ` x ${parcaStokKarti.boy}mm`}
                                </Typography>
                              </Grid>
                              {parcaStokKarti.malzeme_adi && (
                                <Grid item xs={12}>
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Malzeme Adı:</strong> {parcaStokKarti.malzeme_adi}
                                  </Typography>
                                </Grid>
                              )}
                              <Grid item xs={12} sm={4}>
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Mevcut Adet:</strong> {parcaStokKarti.adet}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Kritik Stok:</strong> {parcaStokKarti.kritik_stok_miktari}
                                </Typography>
                              </Grid>
                              {parcaStokKarti.lokasyon && (
                                <Grid item xs={12} sm={4}>
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Lokasyon:</strong> {parcaStokKarti.lokasyon}
                                  </Typography>
                                </Grid>
                              )}
                              {parcaStokKarti.firma && (
                                <Grid item xs={12}>
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Firma:</strong> {parcaStokKarti.firma}
                                  </Typography>
                                </Grid>
                              )}
                            </Grid>
                            
                            {/* Stok durumu uyarısı */}
                            {parcaStokKarti.adet <= parcaStokKarti.kritik_stok_miktari && (
                              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <WarningIcon fontSize="small" color="warning" />
                                <Typography variant="body2" color="warning.main" sx={{ fontWeight: 'bold' }}>
                                  Kritik stok seviyesinde!
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Paper>
                    ) : stokKartiLoading ? (
                      <Paper sx={{ p: 2, mb: 2, textAlign: 'center' }}>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Stok kartı bilgisi yükleniyor...
                        </Typography>
                      </Paper>
                    ) : parca?.stok_karti_id ? (
                      <Paper sx={{ p: 2, mb: 2, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WarningIcon color="warning" />
                          <Typography variant="body2" color="warning.main">
                            Stok kartı bilgisi yüklenemedi (ID: {parca.stok_karti_id})
                          </Typography>
                        </Box>
                      </Paper>
                    ) : (
                      <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.300' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <InventoryIcon color="disabled" />
                          <Typography variant="body2" color="text.secondary">
                            Bu parçaya henüz stok kartı atanmamış.
                          </Typography>
                        </Box>
                      </Paper>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Setup Sayısı"
                      name="setupSayisi"
                      type="number"
                      value={parca.setupSayisi || ''}
                      fullWidth
                      variant="filled"
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="CNC İşleme Süresi (dk)"
                      name="cncIslemeSuresi"
                      type="number"
                      value={parca.cncIslemeSuresi || ''}
                      fullWidth
                      variant="filled"
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="siyah"
                          checked={!!parca.siyah}
                          disabled
                        />
                      }
                      label="Siyah Parça"
                    />
                  </Grid>
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    Bu parça üretilmemektedir. Üretim bilgileri girebilmek için parçayı "İmal Edilen Parça" olarak işaretleyin.
                  </Typography>
                </Box>
              )}
            </TabPanel>

            {/* Maliyet Sekmesi - YENİ MANTIK */}
            <TabPanel value={activeTab} index={2}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom color="primary.main">
                  💰 Parça Maliyet Bilgileri
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Parçanın birim maliyeti ve maliyet kaynağı hakkında detaylı bilgiler
                </Typography>
              </Box>

              {/* Birim Maliyet Özeti */}
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="h6" sx={{ color: 'primary.main' }}>
                    Birim Maliyet Özeti
                  </Typography>
                  <Chip
                    label={parca.imalMi ? 'İmal Edilen' : 'Tedarik Edilen'}
                    color={parca.imalMi ? 'primary' : 'default'}
                    size="small"
                  />
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        Birim Maliyet (USD):
                      </Typography>
                      <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                        ${(parca.imalMi ?
                          (parca.sirketIciMaliyeti || parca.fasonMaliyeti || 0) :
                          parca.tedarikBedeli || 0
                        ).toFixed(2)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        Birim Maliyet (TL):
                      </Typography>
                      <Typography variant="h5" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                        ₺{((parca.imalMi ?
                          (parca.sirketIciMaliyeti || parca.fasonMaliyeti || 0) :
                          parca.tedarikBedeli || 0
                        ) * 32).toFixed(2)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Maliyet Detayları */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
                📊 Maliyet Detayları
              </Typography>

              {parca.imalMi ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, border: '1px solid #e0e0e0', height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle2" color="primary.main">
                          🏭 Şirket İçi Maliyeti
                        </Typography>
                        {parca.sirketIciMaliyeti && (
                          <Chip
                            label="Öncelikli"
                            color="success"
                            size="small"
                          />
                        )}
                      </Box>
                      <Typography variant="h4" sx={{ color: 'success.main', fontWeight: 'bold', textAlign: 'center', py: 2 }}>
                        ${parca.sirketIciMaliyeti ? parseFloat(parca.sirketIciMaliyeti).toFixed(2) : '0.00'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                        ₺{parca.sirketIciMaliyeti ? (parseFloat(parca.sirketIciMaliyeti) * 32).toFixed(2) : '0.00'}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, border: '1px solid #e0e0e0', height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle2" color="info.main">
                          🏪 Fason Maliyeti
                        </Typography>
                        {!parca.sirketIciMaliyeti && parca.fasonMaliyeti && (
                          <Chip
                            label="Öncelikli"
                            color="info"
                            size="small"
                          />
                        )}
                      </Box>
                      <Typography variant="h4" sx={{ color: 'info.main', fontWeight: 'bold', textAlign: 'center', py: 2 }}>
                        ${parca.fasonMaliyeti ? parseFloat(parca.fasonMaliyeti).toFixed(2) : '0.00'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                        ₺{parca.fasonMaliyeti ? (parseFloat(parca.fasonMaliyeti) * 32).toFixed(2) : '0.00'}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              ) : (
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, border: '1px solid #e0e0e0', textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
                      <Typography variant="subtitle2" color="default.main">
                        📦 Tedarik Bedeli
                      </Typography>
                      <Chip
                        label="Tedarik Edilen"
                        color="default"
                        size="small"
                      />
                    </Box>
                    <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 'bold', py: 2 }}>
                      ${parca.tedarikBedeli ? parseFloat(parca.tedarikBedeli).toFixed(2) : '0.00'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ₺{parca.tedarikBedeli ? (parseFloat(parca.tedarikBedeli) * 32).toFixed(2) : '0.00'}
                    </Typography>
                  </Paper>
                </Grid>
              )}

              {/* Maliyet Açıklaması */}
              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>Maliyet Hesaplama Mantığı:</strong><br />
                  {parca.imalMi ? (
                    <>
                      • İmal edilen parçalar için <strong>öncelikle şirket içi maliyeti</strong> kullanılır<br />
                      • Eğer şirket içi maliyeti belirtilmemişse, <strong>fason maliyeti</strong> dikkate alınır<br />
                      • Üretim maliyeti doğrudan bu değerlerden hesaplanır
                    </>
                  ) : (
                    <>
                      • Tedarik edilen parçalar için <strong>tedarik bedeli</strong> kullanılır<br />
                      • Dışarıdan satın alma maliyetini temsil eder
                    </>
                  )}
                </Typography>
              </Alert>
            </TabPanel>

            {/* QR Kod Sekmesi */}
            <TabPanel value={activeTab} index={3}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                {activeTab === 3 && parca && (
                  <QRCodeDisplay
                    parcaKodu={parca.parcaKodu}
                    parcaAdi={parca.parcaAdi}
                    size={200}
                    variant="default"
                  />
                )}
              </Box>
            </TabPanel>

            {/* CAD Dosyaları Sekmesi */}
            <TabPanel value={activeTab} index={4}>
              <Box sx={{ mb: 3 }}>
                <Alert severity="info">
                  CAD dosya yolları, SolidWorks dosyalarının sunucudaki konumlarını belirtir.
                  Dizin tarama modülü ile bu alanlar otomatik olarak doldurulabilir.
                </Alert>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="SLDPRT Dosya Yolu"
                    name="sldprt_yolu"
                    value={parca.sldprt_yolu || ''}
                    fullWidth
                    variant="filled"
                    disabled
                    helperText="3D model dosyasının (.sldprt) sunucudaki yolu"
                    placeholder="/mnt/cad_files/parcalar/PARCA_001.sldprt"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="SLDDRW Dosya Yolu"
                    name="slddrw_yolu"
                    value={parca.slddrw_yolu || ''}
                    fullWidth
                    variant="filled"
                    disabled
                    helperText="Teknik çizim dosyasının (.slddrw) sunucudaki yolu"
                    placeholder="/mnt/cad_files/parcalar/PARCA_001.slddrw"
                  />
                </Grid>

                {/* CAD Dosya Linkleri */}
                {(parca.sldprt_yolu || parca.slddrw_yolu) && (
                  <Grid item xs={12}>
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        CAD Dosya Linkleri:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {parca.sldprt_yolu && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleCadFileClick(parca.sldprt_yolu, 'sldprt')}
                          >
                            SLDPRT Aç
                          </Button>
                        )}
                        {parca.slddrw_yolu && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleCadFileClick(parca.slddrw_yolu, 'slddrw')}
                          >
                            SLDDRW Aç
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      {/* Teknik Resim Dialog */}
      <Dialog
        open={teknikResimDialogOpen}
        onClose={() => setTeknikResimDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { height: '90vh' } }}
      >
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setTeknikResimDialogOpen(false)}
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6">
              Teknik Resim
            </Typography>
          </Toolbar>
        </AppBar>
        <DialogContent sx={{ p: 0, height: '100%' }}>
          <TeknikResimViewer path={getTeknikResimPath(parca.teknik_resim_path)} />
        </DialogContent>
      </Dialog>

      {/* Fotoğraf Dialog */}
      <Dialog
        open={photoDialogOpen}
        onClose={() => setPhotoDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Parça Görseli
          <IconButton
            onClick={() => setPhotoDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Box
              component="img"
              src={selectedImage}
              alt="Parça Görseli"
              sx={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto'
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* İş Emri Oluşturma Modalı */}
      <Dialog
        open={false}
        onClose={handleCloseIsEmriModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Yeni İş Emri Ekle
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isEmriForm.malzemesi_siparis_edilecekmi}
                    onChange={handleFormChange}
                    name="malzemesi_siparis_edilecekmi"
                    color="primary"
                  />
                }
                label="Malzeme siparişi verilecek mi?"
              />
            </Grid>
            
            {/* Parça Bilgileri - Readonly */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Parça Kodu"
                value={parca?.parcaKodu || ''}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
                variant="filled"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Miktar"
                name="miktar"
                type="number"
                value={isEmriForm.miktar}
                onChange={handleFormChange}
                fullWidth
                required
                inputProps={{ min: 1 }}
              />
            </Grid>

            {isEmriForm.malzemesi_siparis_edilecekmi && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="malzeme_siparis_tarihi"
                    label="Malzeme Sipariş Tarihi"
                    type="date"
                    value={isEmriForm.malzeme_siparis_tarihi}
                    onChange={handleFormChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => setDokumanModalOpen(true)}
                  >
                    Sipariş ve Tedarik Dökümanları
                  </Button>
                </Grid>
              </>
            )}
            
            {/* Ham Malzeme Stok Kartı Bilgi Alanı */}
            <Grid item xs={12}>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Ham Malzeme Stok Kartı
                </Typography>
                
                {stokKartiLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                      Stok kartı bilgisi yükleniyor...
                    </Typography>
                  </Box>
                ) : selectedStokKarti ? (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Chip 
                        icon={<InventoryIcon />}
                        label={parcaStokKarti?.id === selectedStokKarti?.id ? "Parçanın Varsayılan Stok Kartı" : "Stok Kartı Seçili"}
                        color={parcaStokKarti?.id === selectedStokKarti?.id ? "primary" : "success"}
                        size="small"
                      />
                      <Button
                        startIcon={<InventoryIcon />}
                        variant="outlined"
                        size="small"
                        onClick={handleStokKartiModalAc}
                      >
                        Değiştir
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => {
                          setSelectedStokKarti(null);
                          setIsEmriForm(prev => ({ ...prev, stok_karti_id: null }));
                        }}
                      >
                        Kaldır
                      </Button>
                    </Box>
                    
                    <Paper sx={{ p: 2, border: '1px solid #e0e0e0' }} elevation={0}>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                        {selectedStokKarti.kesit}
                        {selectedStokKarti.boy && ` x ${selectedStokKarti.boy}mm`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                        <strong>Malzeme:</strong> {selectedStokKarti.malzeme_cinsi}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                        <strong>Stok:</strong> {selectedStokKarti.adet} adet
                        {selectedStokKarti.kritik_stok_miktari > 0 && ` (Kritik: ${selectedStokKarti.kritik_stok_miktari})`}
                      </Typography>
                      {selectedStokKarti.lokasyon && (
                        <Typography variant="body2" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                          <strong>Lokasyon:</strong> {selectedStokKarti.lokasyon}
                        </Typography>
                      )}
                      {selectedStokKarti.firma && (
                        <Typography variant="body2" color="text.secondary" display="block">
                          <strong>Firma:</strong> {selectedStokKarti.firma}
                        </Typography>
                      )}
                      
                      {/* Stok Uyarıları */}
                      {selectedStokKarti.adet === 0 && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            Bu malzeme stokta yok!
                          </Typography>
                        </Alert>
                      )}
                      {selectedStokKarti.adet > 0 && selectedStokKarti.adet <= selectedStokKarti.kritik_stok_miktari && (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            Bu malzeme kritik stok seviyesinde!
                          </Typography>
                        </Alert>
                      )}
                    </Paper>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Ham malzeme stok kartı seçilmedi
                    </Typography>
                    <Button
                      startIcon={<InventoryIcon />}
                      variant="contained"
                      onClick={handleStokKartiModalAc}
                    >
                      Malzeme Stok Kartı Ekle / Değiştir
                    </Button>
                  </Box>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 1, border: '1px solid #e0e0e0', borderRadius: 1, height: '100%' }}>
                <Typography variant="subtitle2" color="text.secondary">Setup Sayısı</Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {parca?.setupSayisi || 'Belirtilmemiş'}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 1, border: '1px solid #e0e0e0', borderRadius: 1, height: '100%' }}>
                <Typography variant="subtitle2" color="text.secondary">CNC Süresi (dk)</Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {parca?.cncIslemeSuresi || 'Belirtilmemiş'}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="teslimTarihi"
                label="Teslim Tarihi"
                type="date"
                value={isEmriForm.teslimTarihi}
                onChange={handleFormChange}
                fullWidth
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Öncelik</InputLabel>
                <Select
                  name="oncelik"
                  value={isEmriForm.oncelik || 'Normal'}
                  onChange={handleFormChange}
                  label="Öncelik"
                >
                  <MenuItem value="Düşük">Düşük</MenuItem>
                  <MenuItem value="Normal">Normal</MenuItem>
                  <MenuItem value="Yüksek">Yüksek</MenuItem>
                  <MenuItem value="Acil">Acil</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Üretim Planı</InputLabel>
                <Select
                  name="uretim_plani_id"
                  value={isEmriForm.uretim_plani_id || ''}
                  onChange={handleFormChange}
                  label="Üretim Planı"
                  displayEmpty
                  endAdornment={loadingUretimPlanlari ? <CircularProgress size={20} /> : null}
                >
                  <MenuItem value="">
                    <em>Üretim planı seçilmedi</em>
                  </MenuItem>
                  {(() => {
                    console.log('Üretim planları render:', uretimPlanlari);
                    console.log('Loading state:', loadingUretimPlanlari);
                    return uretimPlanlari.map((plan) => (
                      <MenuItem key={plan.id} value={plan.id}>
                        {plan.ozel_liste_adi ? 
                          `${plan.ozel_liste_adi} - Miktar: ${plan.miktar || 0}` : 
                          plan.makina?.name ? 
                            `${plan.makina.name} - Miktar: ${plan.miktar || 0}` : 
                            `Plan #${plan.id} - Miktar: ${plan.miktar || 0}`}
                      </MenuItem>
                    ));
                  })()}
                </Select>
              </FormControl>
              {/* Debug ve yenile butonu */}
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                <Button 
                  size="small" 
                  onClick={fetchUretimPlanlari}
                  disabled={loadingUretimPlanlari}
                >
                  {loadingUretimPlanlari ? 'Yükleniyor...' : 'Planları Yenile'}
                </Button>
                <Typography variant="caption" color="text.secondary">
                  Toplam: {uretimPlanlari.length} plan
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="aciklama"
                label="Açıklama"
                value={isEmriForm.aciklama}
                onChange={handleFormChange}
                fullWidth
                multiline
                rows={4}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseIsEmriModal} disabled={formLoading}>
            İptal
          </Button>
          <Button 
            onClick={handleIsEmriSubmit} 
            variant="contained" 
            color="primary"
            disabled={formLoading || !isEmriForm.miktar || !isEmriForm.teslimTarihi}
          >
            {formLoading ? <CircularProgress size={20} /> : 'İş Emri Ekle'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sipariş Dokümanları Modal */}
      <SiparisDokumanlariModal
        open={dokumanModalOpen}
        onClose={() => setDokumanModalOpen(false)}
        isEmriId={null}
        isEmriNo={`parca_detay_${parca?.parcaKodu || 'temp'}`}
      />

      {/* Stok Kartı Seçim Modal */}
      <StokKartiSecimModal
        open={stokKartiModalOpen}
        onClose={() => setStokKartiModalOpen(false)}
        onSelect={handleStokKartiSec}
        selectedStokKarti={selectedStokKarti}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Parça Üretim Geçmişi Modal */}
      {parca && (
        <ParcaUretimGecmisiModal
          open={uretimGecmisiModalOpen}
          onClose={() => setUretimGecmisiModalOpen(false)}
          parcaKodu={parca.parcaKodu}
          parcaAdi={parca.parcaAdi}
        />
      )}

      {/* Parça Düzenle Modal */}
      <ParcaDuzenleFormu
        open={parcaDuzenleModalOpen}
        onClose={() => setParcaDuzenleModalOpen(false)}
        parca={parca}
        onUpdateSuccess={handleParcaGuncellemeBasarili}
      />

      {/* Tek form ile iş emri ekleme */}
      <IsEmriEkleForm
        open={isEmriModalOpen}
        onClose={handleCloseIsEmriModal}
        onSubmit={async (payload) => {
          try {
            setFormLoading(true);
            const enriched = {
              ...payload,
              is_adi: payload.is_adi || parca?.parcaKodu,
              parca_kodu: payload.parca_kodu || parca?.parcaKodu,
              malzeme: payload.malzeme || parca?.hamMalzemeCinsi || ''
            };
            await isEmirleriAPI.create(enriched);
            setSnackbar({ open: true, message: 'İş emri başarıyla oluşturuldu', severity: 'success' });
            handleCloseIsEmriModal();
          } catch (e) {
            console.error('İş emri oluşturma hatası:', e);
            setSnackbar({ open: true, message: 'İş emri oluşturulamadı', severity: 'error' });
          } finally {
            setFormLoading(false);
          }
        }}
        preSelectedParcaKodu={parca ? { parcaKodu: parca.parcaKodu, stok_karti_id: parca.stok_karti_id, stokKarti: parcaStokKarti } : null}
      />

      {/* Tedarik Talebi Oluşturma Modal */}
      <TedarikTalepForm
        open={tedarikModalOpen}
        onClose={handleCloseTedarikModal}
        onSave={handleTedarikTalebiOlustur}
        prefillData={{
          kaynak_tipi: 'parca',
          parca_kodu: parca?.parcaKodu,
          aciklama: `${parca?.parcaAdi} parçası için tedarik talebi`,
          stok_karti: parcaStokKarti,
          parca: parca
        }}
      />

      {/* Parça Teklifler Modal */}
      <ParcaTekliflerModal
        open={tekliflerModalOpen}
        onClose={handleCloseTekliflerModal}
        parcaKodu={parca?.parcaKodu}
        parcaAdi={parca?.parcaAdi}
      />
    </Box>
  );
}
