import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchIsEmirleri } from '../../store/slices/isEmirleriSlice';
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  AppBar,
  Toolbar,
  Divider,
  InputAdornment,
  Snackbar,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningIcon from '@mui/icons-material/Warning';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import AddTaskIcon from '@mui/icons-material/AddTask';
import FolderIcon from '@mui/icons-material/Folder';
import SearchIcon from '@mui/icons-material/Search';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import QRCodeDisplay from '../../components/common/QRCodeDisplay';
import axios from 'axios';
import { parcalarAPI, isEmirleriAPI, isEmriDurumAPI } from '../../services/api';
import ImageWithFallback from '../../components/ImageWithFallback';
import TeknikResimViewer from '../../components/TeknikResimViewer';
import ParcaKayitlariModal from '../../components/ParcaKayitlariModal';
import ParcaUretimGecmisiModal from '../../components/ParcaUretimGecmisiModal';
import SiparisDokumanlariModal from '../../components/SiparisDokumanlariModal';
import StokKartiSecimModal from '../../components/StokKartiSecimModal';
import MobilStokKartiSecici from '../../components/mobile/MobilStokKartiSecici';
import StokKartiForm from '../../components/StokKartlari/StokKartiForm';
import { getFotoPath, getTeknikResimPath, getFileType } from '../../utils/imageUtils';

// We're now using the shared TeknikResimViewer component

// Sekme panel bileşeni
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
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function ParcaDetayMobile() {
  const { parcaKodu } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [parca, setParca] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editedParca, setEditedParca] = useState(null);
  const [teknikResimDialogOpen, setTeknikResimDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [hasChanges, setHasChanges] = useState(false);
  const [yeniParca, setYeniParca] = useState(false);
  const fotoInputRef = useRef(null);

  // İş emri oluşturma modal state'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmriForm, setIsEmriForm] = useState({
    miktar: 1,
    teslimTarihi: '',
    aciklama: '',
    parcaKodu: '',
    malzemeCinsi: '',
    malzemeOlculeri: '',
    malzemesi_siparis_edilecekmi: false,
    malzeme_siparis_tarihi: '',
    siparis_dokumani: null,
    stok_karti_id: null,
    oncelik: 'Normal',
    uretim_plani_id: '',
    durum: 'beklemede'
  });
  const [formLoading, setFormLoading] = useState(false);
  const [dokumanModalOpen, setDokumanModalOpen] = useState(false);
  const [stokKartiModalOpen, setStokKartiModalOpen] = useState(false);
  const [selectedStokKarti, setSelectedStokKarti] = useState(null);
  const [uretimPlanlari, setUretimPlanlari] = useState([]);
  const [loadingUretimPlanlari, setLoadingUretimPlanlari] = useState(false);

  // İş emri durumları için state
  const [isEmriDurumlari, setIsEmriDurumlari] = useState([]);
  const [loadingDurumlar, setLoadingDurumlar] = useState(false);

  // Mobil Stok Kartı Seçici
  const [mobilStokKartiSeciciOpen, setMobilStokKartiSeciciOpen] = useState(false);
  const [secilenStokKarti, setSecilenStokKarti] = useState(null);
  const [stokKartiDuzenleModal, setStokKartiDuzenleModal] = useState({ open: false, stokKarti: null });

  // Parça Kayıtları modal state
  const [parcaKayitlariModalOpen, setParcaKayitlariModalOpen] = useState(false);

  // Parça Üretim Geçmişi modal state
  const [uretimGecmisiModalOpen, setUretimGecmisiModalOpen] = useState(false);

  // Parça verilerini getir
  useEffect(() => {
    const fetchParca = async () => {
      try {
        setLoading(true);
        
        // Yeni parça ekleme durumu
        if (parcaKodu === 'yeni') {
          setYeniParca(true);
          setEditMode(true);
          const yeniParcaTemplate = {
            parcaKodu: '',
            parcaAdi: '',
            stokAdeti: 0,
            kritik_stok: 0,
            tedarikBedeli: 0,
            imalMi: false,
            hamMalzemeCinsi: '',
            hamMalzemeOlculeri: '',
            fasonMaliyeti: 0,
            sirketIciMaliyeti: 0,
            teknik_resim_path: '',
            foto_path: '',
            setupSayisi: 0,
            cncIslemeSuresi: 0,
            siyah: false
          };
          setParca(yeniParcaTemplate);
          setEditedParca(yeniParcaTemplate);
        } else {
          // Mevcut parça düzenleme
          const response = await axios.get(`/api/parcalar/${encodeURIComponent(parcaKodu)}?includeStokKarti=true`);
          setParca(response.data);
          setEditedParca(response.data);
          
          // Stok kartı bilgisini yükle
          if (response.data.stokKarti) {
            console.log('Parça stok kartı yüklendi:', response.data.stokKarti);
            setSecilenStokKarti(response.data.stokKarti);
          } else {
            console.log('Parça için stok kartı bulunamadı');
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

  // We're now using the shared image path utility functions from imageUtils

  // Form field değişikliklerini yönetme
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setEditedParca(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? (value === '' ? '' : Number(value)) : 
              value
    }));
    
    // Değişiklik yapıldığını işaretle
    setHasChanges(true);
  };

  // Parça güncelleme veya ekleme işlemi
  const handleUpdate = async () => {
    try {
      let response;
      
      if (yeniParca) {
        // Yeni parça ekleme
        response = await parcalarAPI.create(editedParca);
        setSnackbar({
          open: true,
          message: 'Yeni parça başarıyla eklendi',
          severity: 'success'
        });
        // Yeni eklenen parça sayfasına yönlendir
        navigate(`/mobile/parcalar/${encodeURIComponent(editedParca.parcaKodu)}`, { replace: true });
      } else {
        // Mevcut parçayı güncelleme
        response = await parcalarAPI.update(parcaKodu, editedParca);
        setSnackbar({
          open: true,
          message: 'Parça başarıyla güncellendi',
          severity: 'success'
        });
      }
      
      setParca(response.data);
      setEditMode(false);
      setHasChanges(false);
    } catch (err) {
      console.error('Parça kaydedilirken hata:', err);
      setSnackbar({
        open: true,
        message: `Parça ${yeniParca ? 'eklenirken' : 'güncellenirken'} bir hata oluştu`,
        severity: 'error'
      });
    }
  };

  // İş emri modal fonksiyonları
  const handleOpenIsEmriModal = () => {
    // Eğer parçanın stok kartı varsa onu seç
    const parcaStokKarti = secilenStokKarti || parca?.stokKarti;
    console.log('İş emri modal açılıyor - Stok kartı durumu:', {
      secilenStokKarti,
      parcaStokKarti: parca?.stokKarti,
      finalStokKarti: parcaStokKarti
    });
    
    if (parcaStokKarti) {
      setSelectedStokKarti(parcaStokKarti);
    }
    
    setIsEmriForm({
      miktar: 1,
      teslimTarihi: '',
      aciklama: '',
      parcaKodu: parca?.parcaKodu || '',
      malzemeCinsi: parca?.hamMalzemeCinsi || '',
      malzemeOlculeri: parca?.hamMalzemeOlculeri || '',
      malzemesi_siparis_edilecekmi: false,
      malzeme_siparis_tarihi: '',
      siparis_dokumani: null,
      stok_karti_id: parcaStokKarti?.id || null,
      oncelik: 'Normal',
      uretim_plani_id: '',
      durum: 'beklemede'
    });
    
    // Üretim planlarını ve durumları getir
    fetchUretimPlanlari();
    fetchIsEmriDurumlari();
    setIsModalOpen(true);
  };

  const handleCloseIsEmriModal = () => {
    setIsModalOpen(false);
    setIsEmriForm({
      miktar: 1,
      teslimTarihi: '',
      aciklama: '',
      parcaKodu: '',
      malzemeCinsi: '',
      malzemeOlculeri: '',
      malzemesi_siparis_edilecekmi: false,
      malzeme_siparis_tarihi: '',
      siparis_dokumani: null,
      stok_karti_id: null,
      oncelik: 'Normal',
      uretim_plani_id: '',
      durum: 'beklemede'
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

  const handleStokKartiModalAc = () => {
    setStokKartiModalOpen(true);
  };

  const handleStokKartiSec = (stokKarti) => {
    setSelectedStokKarti(stokKarti);
    setIsEmriForm(prev => ({
      ...prev,
      stok_karti_id: stokKarti?.id || null
    }));
    setStokKartiModalOpen(false);
  };

  // Parça düzenleme için stok kartı seçimi
  const handleParcaStokKartiSec = (stokKarti) => {
    setSecilenStokKarti(stokKarti);
    setEditedParca(prev => ({
      ...prev,
      stok_karti_id: stokKarti.id,
      // Backward compatibility için eski alanları da güncelle
      hamMalzemeCinsi: stokKarti.malzeme_cinsi,
      hamMalzemeOlculeri: stokKarti.olculeriFormatted || stokKarti.kesit
    }));
    setMobilStokKartiSeciciOpen(false);
    setHasChanges(true);
  };

  const handleParcaStokKartiBaglantiKaldir = () => {
    setSecilenStokKarti(null);
    setEditedParca(prev => ({
      ...prev,
      stok_karti_id: null
    }));
    setHasChanges(true);
  };

  const handleMalzemeSiparisChange = (event) => {
    const value = event.target.checked;
    setIsEmriForm(prev => ({
      ...prev,
      malzemesi_siparis_edilecekmi: value,
      malzeme_siparis_tarihi: value ? prev.malzeme_siparis_tarihi : ''
    }));
  };

  // Üretim planlarını getir
  const fetchUretimPlanlari = async () => {
    try {
      setLoadingUretimPlanlari(true);
      console.log('Üretim planları getiriliyor...');
      const response = await axios.get('/api/uretim-plani');
      console.log('Üretim planları yanıtı:', response.data);
      
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
      
      console.log('İşlenmiş planlar:', plans);
      setUretimPlanlari(plans);
    } catch (error) {
      console.error('Üretim planları yüklenirken hata:', error);
      setUretimPlanlari([]);
    } finally {
      setLoadingUretimPlanlari(false);
    }
  };

  // İş emri durumlarını getir
  const fetchIsEmriDurumlari = async () => {
    try {
      setLoadingDurumlar(true);
      const response = await isEmriDurumAPI.getAll();
      const durumlar = response.data || [];
      console.log('İş emri durumları:', durumlar);
      setIsEmriDurumlari(durumlar);
    } catch (error) {
      console.error('İş emri durumları yüklenirken hata:', error);
      setIsEmriDurumlari([]);
    } finally {
      setLoadingDurumlar(false);
    }
  };

  const handleIsEmriSubmit = async () => {
    try {
      setFormLoading(true);
      
      let siparisDocumentPath = null;
      
      // Eğer sipariş dokümanı varsa önce yükle
      if (isEmriForm.malzemesi_siparis_edilecekmi && isEmriForm.siparis_dokumani) {
        console.log('Sipariş dokümanı yükleniyor:', isEmriForm.siparis_dokumani);
        const formData = new FormData();
        formData.append('siparis_dokumani', isEmriForm.siparis_dokumani);
        
        try {
          const uploadResponse = await axios.post('/api/upload/siparis-dokumani', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          console.log('Upload response:', uploadResponse.data);
          siparisDocumentPath = uploadResponse.data.siparis_dokumani_path;
          console.log('Sipariş dokümanı dosya yolu:', siparisDocumentPath);
        } catch (uploadError) {
          console.error('Sipariş dokümanı yüklenirken hata:', uploadError);
          setSnackbar({
            open: true,
            message: 'Sipariş dokümanı yüklenirken bir hata oluştu',
            severity: 'error'
          });
          return;
        }
      }
      
      // Formdan gelen durum değerini kullan
      const durum = isEmriForm.durum || 'beklemede';

      const isEmriData = {
        plan_liste_no: 'MOBIL-' + Date.now(),
        is_adi: parca?.parcaKodu || isEmriForm.parcaKodu, // İş adı olarak parça kodu
        adet: Number(isEmriForm.miktar),
        malzeme: selectedStokKarti?.malzeme_cinsi || `${isEmriForm.malzemeCinsi} - ${isEmriForm.malzemeOlculeri}`.trim(),
        teslim_tarihi: isEmriForm.teslimTarihi,
        durum: durum,
        aciklama: isEmriForm.aciklama,
        parca_kodu: parca?.parcaKodu || isEmriForm.parcaKodu,
        oncelik: isEmriForm.oncelik || 'Normal',
        setup_sayisi: parca?.setupSayisi || 0,
        cnc_suresi: parca?.cncIslemeSuresi || 0,
        malzemesi_siparis_edilecekmi: isEmriForm.malzemesi_siparis_edilecekmi,
        malzeme_siparis_tarihi: isEmriForm.malzemesi_siparis_edilecekmi ? isEmriForm.malzeme_siparis_tarihi : null,
        siparis_dokumani_dosya_yolu: siparisDocumentPath,
        stok_karti_id: selectedStokKarti?.id || null,
        uretim_plani_id: isEmriForm.uretim_plani_id || null
      };

      console.log('İş emri oluşturuluyor:', isEmriData);
      const response = await isEmirleriAPI.create(isEmriData);
      console.log('İş emri oluşturuldu:', response);
      
      // Geçici dökümanları temizle
      if (response?.data?.id) {
        localStorage.removeItem(`temporary_documents_${response.data.id}`);
      }
      
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

  // Resim yükleme işlemi
  const handleFileSelect = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const formData = new FormData();
        
        // Yeni parça ekleme durumunda geçici bir kod kullan
        const parcaKoduToUse = yeniParca ? 'temp_' + Date.now() : parcaKodu;
        formData.append('parcaKodu', parcaKoduToUse);
        formData.append('foto', file);
        
        try {
          const response = await axios.post('/api/upload/parca', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          // Önbellek sorunlarını önlemek için resim URL'ine zaman damgası ekleyin
          const timestamp = new Date().getTime();
          const updatedPath = `${response.data.foto_path}?t=${timestamp}`;
          
          setEditedParca(prev => ({
            ...prev,
            foto_path: updatedPath
          }));
          
          setParca(prev => ({
            ...prev,
            foto_path: updatedPath
          }));
          
          // Değişiklik yapıldığını işaretle
          setHasChanges(true);
          
          // Eğer düzenleme modunda değilse, düzenleme modunu aç
          if (!editMode) setEditMode(true);
          
          setSnackbar({
            open: true,
            message: 'Resim başarıyla yüklendi. Değişiklikleri kaydetmeyi unutmayın!',
            severity: 'success'
          });
          
        } catch (err) {
          console.error('Resim yüklenirken hata:', err);
          setSnackbar({
            open: true,
            message: 'Resim yüklenirken bir hata oluştu',
            severity: 'error'
          });
        }
      }
    };
    input.click();
  };

  // Teknik resim yükleme işlemi
  const handleTeknikResimSelect = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    // Hem resim dosyaları hem de teknik çizim formatlarını kabul et
    input.accept = 'image/*,.pdf,.dwg,.dxf';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const formData = new FormData();
        
        // Yeni parça ekleme durumunda geçici bir kod kullan
        const parcaKoduToUse = yeniParca ? 'temp_' + Date.now() : parcaKodu;
        formData.append('parcaKodu', parcaKoduToUse);
        formData.append('teknik', file);
        
        try {
          const response = await axios.post('/api/upload/parca', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          // Önbellek sorunlarını önlemek için resim URL'ine zaman damgası ekleyin
          const timestamp = new Date().getTime();
          const updatedPath = `${response.data.teknik_resim_path}?t=${timestamp}`;
          
          setEditedParca(prev => ({
            ...prev,
            teknik_resim_path: updatedPath
          }));
          
          setParca(prev => ({
            ...prev,
            teknik_resim_path: updatedPath
          }));
          
          // Değişiklik yapıldığını işaretle
          setHasChanges(true);
          
          // Eğer düzenleme modunda değilse, düzenleme modunu aç
          if (!editMode) setEditMode(true);
          
          setSnackbar({
            open: true,
            message: 'Teknik resim başarıyla yüklendi. Değişiklikleri kaydetmeyi unutmayın!',
            severity: 'success'
          });
          
        } catch (err) {
          console.error('Teknik resim yüklenirken hata:', err);
          setSnackbar({
            open: true,
            message: 'Teknik resim yüklenirken bir hata oluştu',
            severity: 'error'
          });
        }
      }
    };
    input.click();
  };

  // Sipariş dokümanını görüntüleme işlevi
  const handleViewSiparisDocument = (documentPath) => {
    if (!documentPath) {
      setSnackbar({
        open: true,
        message: 'Sipariş dokümanı bulunamadı',
        severity: 'warning'
      });
      return;
    }

    // Doküman yolunu tam URL'ye dönüştür
    const fullUrl = documentPath.startsWith('http') 
      ? documentPath 
      : `${window.location.origin}${documentPath}`;
    
    // Yeni sekmede dokümanı aç
    window.open(fullUrl, '_blank');
  };

  // Sipariş dokümanının var olup olmadığını kontrol etme işlevi
  const hasSiparisDocument = (documentFile, documentPath) => {
    return documentFile || (documentPath && documentPath.trim() !== '');
  };

  // Sipariş dokümanının dosya tipini belirleme işlevi
  const getSiparisDocumentType = (documentFile, documentPath) => {
    if (documentFile) {
      return documentFile.type;
    }
    if (documentPath) {
      const extension = documentPath.toLowerCase().split('.').pop();
      if (['pdf'].includes(extension)) return 'application/pdf';
      if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return 'image';
    }
    return 'unknown';
  };

  // Sipariş dokümanının ikonu
  const getSiparisDocumentIcon = (documentFile, documentPath) => {
    const type = getSiparisDocumentType(documentFile, documentPath);
    if (type === 'application/pdf') return <PictureAsPdfIcon />;
    if (type === 'image') return <ImageIcon />;
    return <VisibilityIcon />;
  };

  // Hata durumunda gösterilecek içerik
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/mobile/parcalar')}
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Parçalar Listesine Dön
        </Button>
      </Box>
    );
  }

  // Yükleme durumunda gösterilecek içerik
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 56px)' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      {/* Üst AppBar */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => {
              // Eğer değişiklik yapılmışsa kullanıcıya sorma
              if (hasChanges && !window.confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğinizden emin misiniz?')) {
                return;
              }
              navigate('/mobile/parcalar');
            }}
            aria-label="back"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {yeniParca ? 'Yeni Parça' : 'Parça Detayı'}
          </Typography>
          {!editMode ? (
            <>
              {!yeniParca && (
                <Button 
                  variant="outlined"
                  size="small"
                  onClick={() => setParcaKayitlariModalOpen(true)}
                  sx={{ 
                    mr: 1, 
                    fontSize: '0.75rem',
                    minWidth: 'auto',
                    px: 1
                  }}
                >
                  Parça Kayıtları
                </Button>
              )}
              <IconButton color="primary" onClick={() => setEditMode(true)}>
                <EditIcon />
              </IconButton>
            </>
          ) : (
            <>
              <IconButton 
                color="primary" 
                onClick={handleUpdate}
                sx={{ 
                  position: 'relative', 
                  animation: hasChanges ? 'pulse 1.5s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { boxShadow: '0 0 0 0 rgba(25, 118, 210, 0.4)' },
                    '70%': { boxShadow: '0 0 0 10px rgba(25, 118, 210, 0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(25, 118, 210, 0)' }
                  }
                }}
              >
                <SaveIcon />
              </IconButton>
              <IconButton color="default" onClick={() => {
                if (hasChanges && !window.confirm('Değişiklikler kaybedilecek. Devam etmek istiyor musunuz?')) {
                  return;
                }
                setEditedParca(parca);
                setEditMode(false);
                setHasChanges(false);
              }}>
                <CloseIcon />
              </IconButton>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Parça resim alanı */}
      <Box 
        sx={{ 
          position: 'relative', 
          bgcolor: '#f5f5f5',
          borderBottom: '1px solid #e0e0e0'
        }}
      >
        <Box 
          sx={{ 
            height: 560, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            overflow: 'hidden'
          }}
        >
          {parca.foto_path ? (
            <ImageWithFallback
              src={getFotoPath(parca.foto_path)}
              alt={parca.parcaAdi}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%',
                objectFit: 'contain' 
              }}
              onClick={() => {
                setSelectedImage(getFotoPath(parca.foto_path));
                setPhotoDialogOpen(true);
              }}
            />
          ) : (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                color: 'text.secondary' 
              }}
            >
              <DesignServicesIcon sx={{ fontSize: 60, opacity: 0.5, mb: 1 }} />
              <Typography variant="body2">Resim Bulunmuyor</Typography>
            </Box>
          )}
        </Box>

        {/* Resim ekleme/değiştirme butonu */}
        <IconButton
          sx={{
            position: 'absolute',
            right: 8,
            bottom: 8,
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': { bgcolor: 'background.paper' }
          }}
          onClick={handleFileSelect}
        >
          <AddPhotoAlternateIcon />
        </IconButton>

        {/* Parça kodu ve stok durumu */}
        <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h6" component="h1">
            {parca.parcaKodu}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {parca.parcaAdi}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
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

          {/* İş emri oluştur butonu */}
          {!editMode && !yeniParca && (
            <Box sx={{ mt: 2 }}>
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
            </Box>
          )}
        </Box>
      </Box>

      {/* Sekmeler */}
      <Paper square>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Temel Bilgiler" />
          <Tab label="Üretim" />
          <Tab label="Maliyet" />
          <Tab label="QR Kod" />
          <Tab label="CAD Dosyaları" />
        </Tabs>
      </Paper>

      {/* Temel Bilgiler Sekmesi */}
      <TabPanel value={activeTab} index={0}>
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Parça Kodu"
            name="parcaKodu"
            value={editedParca.parcaKodu || ''}
            onChange={handleChange}
            disabled={!editMode || (!yeniParca && editMode)}
            fullWidth
            required
            error={editMode && yeniParca && !editedParca.parcaKodu}
            helperText={editMode && yeniParca && !editedParca.parcaKodu ? "Parça kodu gerekli" : ""}
            variant={editMode ? "outlined" : "filled"}
            size="small"
            InputProps={{ readOnly: !yeniParca && !editMode }}
          />
          
          <TextField
            label="Parça Adı"
            name="parcaAdi"
            value={editedParca.parcaAdi || ''}
            onChange={handleChange}
            fullWidth
            disabled={!editMode}
            variant={editMode ? "outlined" : "filled"}
            size="small"
          />
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Stok Miktarı"
              name="stokAdeti"
              type="number"
              value={editedParca.stokAdeti || ''}
              onChange={handleChange}
              fullWidth
              disabled={!editMode}
              variant={editMode ? "outlined" : "filled"}
              size="small"
            />
            
            <TextField
              label="Kritik Stok"
              name="kritik_stok"
              type="number"
              value={editedParca.kritik_stok || ''}
              onChange={handleChange}
              fullWidth
              disabled={!editMode}
              variant={editMode ? "outlined" : "filled"}
              size="small"
            />
          </Box>
          
          <FormControlLabel
            control={
              <Switch
                name="imalMi"
                checked={!!editedParca.imalMi}
                onChange={handleChange}
                disabled={!editMode}
              />
            }
            label="İmal Edilen Parça"
          />
          
          {/* Teknik Resim Butonu */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Teknik Resim
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={editedParca.teknik_resim_path ? "contained" : "outlined"}
                startIcon={(() => {
                  const fileType = getFileType(editedParca.teknik_resim_path);
                  switch (fileType) {
                    case 'pdf':
                      return <PictureAsPdfIcon />;
                    case 'image':
                      return <ImageIcon color="secondary" />;
                    case 'cad':
                    case 'unknown':
                    default:
                      return <DesignServicesIcon color="info" />;
                  }
                })()}
                onClick={() => {
                  if (editedParca.teknik_resim_path) {
                    setTeknikResimDialogOpen(true);
                  } else if (editMode) {
                    handleTeknikResimSelect();
                  }
                }}
                fullWidth
              >
                {editedParca.teknik_resim_path ? "Görüntüle" : "Ekle"}
              </Button>
              
              {editMode && editedParca.teknik_resim_path && (
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleTeknikResimSelect}
                >
                  Değiştir
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </TabPanel>

      {/* Üretim Sekmesi */}
      <TabPanel value={activeTab} index={1}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {editedParca.imalMi && (
            <>
              {/* Ham Malzeme Stok Kartı */}
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Ham Malzeme Stok Kartı
                </Typography>
                
                {secilenStokKarti ? (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Chip 
                        icon={<LinkIcon />}
                        label="Stok Kartı Bağlı"
                        color="success"
                        size="small"
                      />
                      {editMode && (
                        <>
                          <Button
                            startIcon={<SearchIcon />}
                            variant="outlined"
                            size="small"
                            onClick={() => setMobilStokKartiSeciciOpen(true)}
                          >
                            Değiştir
                          </Button>
                          <Button
                            startIcon={<EditIcon />}
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={() => setStokKartiDuzenleModal({ open: true, stokKarti: secilenStokKarti })}
                          >
                            Düzenle
                          </Button>
                          <Button
                            startIcon={<LinkOffIcon />}
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={handleParcaStokKartiBaglantiKaldir}
                          >
                            Kaldır
                          </Button>
                        </>
                      )}
                    </Box>
                    
                    <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1, border: '1px solid #e0e0e0' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        {secilenStokKarti.olculeriFormatted || secilenStokKarti.kesit}
                        {secilenStokKarti.boy && ` x ${secilenStokKarti.boy}mm`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                        <strong>Malzeme:</strong> {secilenStokKarti.malzeme_cinsi}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        <strong>Stok:</strong> {secilenStokKarti.adet} adet
                        {secilenStokKarti.kritik_stok_miktari > 0 && ` (Kritik: ${secilenStokKarti.kritik_stok_miktari})`}
                      </Typography>
                      {secilenStokKarti.lokasyon && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          <strong>Lokasyon:</strong> {secilenStokKarti.lokasyon}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Ham malzeme için stok kartı seçilmedi
                    </Typography>
                    {editMode && (
                      <Button
                        startIcon={<SearchIcon />}
                        variant="contained"
                        size="small"
                        onClick={() => setMobilStokKartiSeciciOpen(true)}
                      >
                        Stok Kartı Seç
                      </Button>
                    )}
                  </Box>
                )}
              </Box>

              <TextField
                label="Setup Sayısı"
                name="setupSayisi"
                type="number"
                value={editedParca.setupSayisi || ''}
                onChange={handleChange}
                fullWidth
                disabled={!editMode}
                variant={editMode ? "outlined" : "filled"}
                size="small"
              />
              
              <TextField
                label="CNC İşleme Süresi (dk)"
                name="cncIslemeSuresi"
                type="number"
                value={editedParca.cncIslemeSuresi || ''}
                onChange={handleChange}
                fullWidth
                disabled={!editMode}
                variant={editMode ? "outlined" : "filled"}
                size="small"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    name="siyah"
                    checked={!!editedParca.siyah}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                }
                label="Siyah Parça"
              />
            </>
          )}
          
          {!editedParca.imalMi && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                Bu parça üretilmemektedir. Üretim bilgileri girebilmek için parçayı "İmal Edilen Parça" olarak işaretleyin.
              </Typography>
            </Box>
          )}
        </Box>
      </TabPanel>

      {/* Maliyet Sekmesi */}
      <TabPanel value={activeTab} index={2}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Birim Maliyet Özeti */}
          <Paper sx={{ p: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 2 }}>
              💰 Birim Maliyet
            </Typography>

            {/* Aktif Birim Maliyeti */}
            <Box sx={{ textAlign: 'center', py: 2, bgcolor: 'white', borderRadius: 2, mb: 2 }}>
              <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                ${(() => {
                  if (editedParca.imalMi) {
                    // İmal edilen parça - öncelik sırası: şirket içi > fason
                    if (editedParca.sirketIciMaliyeti && editedParca.sirketIciMaliyeti > 0) {
                      return parseFloat(editedParca.sirketIciMaliyeti).toFixed(2);
                    } else if (editedParca.fasonMaliyeti && editedParca.fasonMaliyeti > 0) {
                      return parseFloat(editedParca.fasonMaliyeti).toFixed(2);
                    }
                  } else {
                    // Tedarik edilen parça
                    return (parseFloat(editedParca.tedarikBedeli) || 0).toFixed(2);
                  }
                  return '0.00';
                })()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ≈ ₺{(() => {
                  const birimMaliyetUSD = (() => {
                    if (editedParca.imalMi) {
                      if (editedParca.sirketIciMaliyeti && editedParca.sirketIciMaliyeti > 0) {
                        return parseFloat(editedParca.sirketIciMaliyeti);
                      } else if (editedParca.fasonMaliyeti && editedParca.fasonMaliyeti > 0) {
                        return parseFloat(editedParca.fasonMaliyeti);
                      }
                    } else {
                      return parseFloat(editedParca.tedarikBedeli) || 0;
                    }
                    return 0;
                  })();
                  return (birimMaliyetUSD * 32).toFixed(2); // USD/TRY kur dönüşümü
                })()}
              </Typography>
            </Box>

            {/* Maliyet Kaynağı ve Detayları */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {editedParca.imalMi ? (
                // İmal Edilen Parça
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    🏭 İmal Edilen Parça
                  </Typography>

                  {/* Şirket İçi Maliyeti */}
                  <Box sx={{ mb: 1, p: 1, bgcolor: editedParca.sirketIciMaliyeti > 0 ? 'success.50' : 'grey.100', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Şirket İçi:
                        </Typography>
                        {editedParca.sirketIciMaliyeti > 0 && (
                          <Chip
                            label="ÖNCELİKLİ"
                            size="small"
                            color="success"
                            sx={{ ml: 1, fontSize: '0.7rem', height: 20 }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        ${(parseFloat(editedParca.sirketIciMaliyeti) || 0).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Fason Maliyeti */}
                  <Box sx={{ p: 1, bgcolor: editedParca.fasonMaliyeti > 0 && (!editedParca.sirketIciMaliyeti || editedParca.sirketIciMaliyeti === 0) ? 'warning.50' : 'grey.100', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Fason:
                        </Typography>
                        {editedParca.fasonMaliyeti > 0 && (!editedParca.sirketIciMaliyeti || editedParca.sirketIciMaliyeti === 0) && (
                          <Chip
                            label="ÖNCELİKLİ"
                            size="small"
                            color="warning"
                            sx={{ ml: 1, fontSize: '0.7rem', height: 20 }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        ${(parseFloat(editedParca.fasonMaliyeti) || 0).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    💡 Öncelik sırası: Şirket içi maliyeti &gt; Fason maliyeti
                  </Typography>
                </Box>
              ) : (
                // Tedarik Edilen Parça
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    📦 Tedarik Edilen Parça
                  </Typography>

                  <Box sx={{ p: 1, bgcolor: 'info.50', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Tedarik Bedeli:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        ${(parseFloat(editedParca.tedarikBedeli) || 0).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Maliyet Hesaplama Açıklaması */}
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              📊 Maliyet Hesaplama Mantığı
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {editedParca.imalMi ?
                "Bu parça için birim maliyet, şirket içi maliyeti veya fason maliyeti üzerinden hesaplanır. Şirket içi maliyeti varsa öncelikli olarak kullanılır." :
                "Bu parça için birim maliyet, tedarik bedeli üzerinden hesaplanır."
              }
            </Typography>
          </Paper>

          {/* Düzenleme Alanları */}
          {editMode && (
            <>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2 }}>
                ✏️ Maliyet Bilgilerini Düzenle
              </Typography>

              <TextField
                label="Tedarik Bedeli ($)"
                name="tedarikBedeli"
                type="number"
                value={editedParca.tedarikBedeli || ''}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                helperText="Tedarik edilen parçalar için kullanılır"
              />

              {editedParca.imalMi && (
                <>
                  <TextField
                    label="Fason Maliyeti ($)"
                    name="fasonMaliyeti"
                    type="number"
                    value={editedParca.fasonMaliyeti || ''}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    helperText="Şirket dışı üretim maliyeti"
                  />

                  <TextField
                    label="Şirket İçi Maliyeti ($)"
                    name="sirketIciMaliyeti"
                    type="number"
                    value={editedParca.sirketIciMaliyeti || ''}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    helperText="Şirket içi üretim maliyeti (öncelikli)"
                  />
                </>
              )}
            </>
          )}
        </Box>
      </TabPanel>

      {/* QR Kod Sekmesi */}
      <TabPanel value={activeTab} index={3}>
        <Box sx={{ textAlign: 'center', py: 2 }}>
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
        <Box sx={{ mb: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            CAD dosya yolları, SolidWorks dosyalarının sunucudaki konumlarını belirtir.
            Dizin tarama modülü ile bu alanlar otomatik olarak doldurulabilir.
          </Alert>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="SLDPRT Dosya Yolu"
            value={parca.sldprt_yolu || ''}
            fullWidth
            variant="filled"
            disabled
            helperText="3D model dosyasının (.sldprt) sunucudaki yolu"
            placeholder="/mnt/cad_files/parcalar/PARCA_001.sldprt"
            size="small"
          />

          <TextField
            label="SLDDRW Dosya Yolu"
            value={parca.slddrw_yolu || ''}
            fullWidth
            variant="filled"
            disabled
            helperText="Teknik çizim dosyasının (.slddrw) sunucudaki yolu"
            placeholder="/mnt/cad_files/parcalar/PARCA_001.slddrw"
            size="small"
          />

          {/* CAD Dosya Linkleri */}
          {(parca.sldprt_yolu || parca.slddrw_yolu) && (
            <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                CAD Dosya Linkleri:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flexDirection: 'column' }}>
                {parca.sldprt_yolu && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleCadFileClick(parca.sldprt_yolu, 'sldprt')}
                    fullWidth
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
                    fullWidth
                  >
                    SLDDRW Aç
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </TabPanel>

      {/* Teknik Resim Dialog */}
      <Dialog
        open={teknikResimDialogOpen}
        onClose={() => setTeknikResimDialogOpen(false)}
        maxWidth="lg"
        fullScreen
      >
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setTeknikResimDialogOpen(false)}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              Teknik Resim
            </Typography>
          </Toolbar>
        </AppBar>
        
        <DialogContent sx={{ p: 0, height: '100%' }}>
          <TeknikResimViewer path={getTeknikResimPath(parca.teknik_resim_path)} />
        </DialogContent>
      </Dialog>

      {/* Fotoğraf Büyük Görünüm Dialog */}
      <Dialog
        open={photoDialogOpen}
        onClose={() => setPhotoDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0, textAlign: 'center' }}>
          {selectedImage && (
            <Box
              component="img"
              src={selectedImage}
              alt="Parça Detay"
              sx={{ 
                maxWidth: '100%', 
                maxHeight: 'calc(100vh - 64px)',
                objectFit: 'contain'
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhotoDialogOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* Bildirim Snackbar */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({...snackbar, open: false})}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({...snackbar, open: false})} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* İş Emri Oluşturma Butonu (Sadece yeni parça için) */}
      {yeniParca && (
        <Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenIsEmriModal}
            startIcon={<DesignServicesIcon />}
            size="large"
            sx={{ 
              borderRadius: 28,
              boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
              '&:hover': {
                boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.3)',
              }
            }}
          >
            İş Emri Oluştur
          </Button>
        </Box>
      )}

      {/* İş Emri Oluşturma Modalı */}
      <Dialog
        open={isModalOpen}
        onClose={handleCloseIsEmriModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Yeni İş Emri Oluştur
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Miktar"
              name="miktar"
              type="number"
              value={isEmriForm.miktar}
              onChange={handleFormChange}
              fullWidth
              required
              variant="outlined"
              size="small"
            />
            
            <Alert severity="info" sx={{ mb: 1 }}>
              Ham malzeme bilgileri artık stok kartları üzerinden otomatik alınmaktadır.
            </Alert>

            {/* Stok Kartı Seçim Butonu */}
            <Button
              variant={selectedStokKarti ? "contained" : "outlined"}
              color={selectedStokKarti ? "success" : "primary"}
              fullWidth
              size="small"
              startIcon={<InventoryIcon />}
              onClick={handleStokKartiModalAc}
              sx={{ textTransform: 'none' }}
            >
              {selectedStokKarti ? 
                `Seçilen: ${selectedStokKarti.malzeme_cinsi} - ${selectedStokKarti.kesit}` : 
                'Ham Malzeme Stok Kartı Seç'
              }
            </Button>

            {selectedStokKarti && (
              <Paper sx={{ p: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Seçili Stok Kartı:
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  <strong>Malzeme:</strong> {selectedStokKarti.malzeme_cinsi}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  <strong>Kesit:</strong> {selectedStokKarti.kesit}
                  {selectedStokKarti.boy && ` x ${selectedStokKarti.boy}mm`}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  <strong>Stok:</strong> {selectedStokKarti.adet} adet
                  {selectedStokKarti.kritik_stok_miktari > 0 && ` (Kritik: ${selectedStokKarti.kritik_stok_miktari})`}
                </Typography>
                
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
            )}

            <FormControlLabel
              control={
                <Checkbox
                  name="malzemesi_siparis_edilecekmi"
                  checked={isEmriForm.malzemesi_siparis_edilecekmi}
                  onChange={handleFormChange}
                />
              }
              label="Malzemesi sipariş edilecek mi?"
            />

            {isEmriForm.malzemesi_siparis_edilecekmi && (
              <>
                <TextField
                  label="Malzeme Sipariş Tarihi"
                  name="malzeme_siparis_tarihi"
                  type="date"
                  value={isEmriForm.malzeme_siparis_tarihi}
                  onChange={handleFormChange}
                  fullWidth
                  variant="outlined"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
                
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  size="small"
                  sx={{ textTransform: 'none' }}
                >
                  {isEmriForm.siparis_dokumani ? isEmriForm.siparis_dokumani.name : 'Sipariş Dokümanı Yükle'}
                  <input
                    type="file"
                    name="siparis_dokumani"
                    hidden
                    accept="image/*,.pdf"
                    onChange={handleFormChange}
                  />
                </Button>
                
                {hasSiparisDocument(isEmriForm.siparis_dokumani, null) && (
                  <Button
                    variant="contained"
                    size="small"
                    fullWidth
                    startIcon={getSiparisDocumentIcon(isEmriForm.siparis_dokumani, null)}
                    onClick={() => {
                      if (isEmriForm.siparis_dokumani) {
                        // Yüklenen dosyayı göster
                        const fileUrl = URL.createObjectURL(isEmriForm.siparis_dokumani);
                        window.open(fileUrl, '_blank');
                      }
                    }}
                    sx={{ textTransform: 'none', mt: 1 }}
                  >
                    Sipariş Dokümanını Görüntüle
                  </Button>
                )}
              </>
            )}
            
            <TextField
              label="Teslim Tarihi"
              name="teslimTarihi"
              type="date"
              value={isEmriForm.teslimTarihi}
              onChange={handleFormChange}
              fullWidth
              required
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
            />

            {/* Öncelik Seçimi */}
            <FormControl fullWidth size="small">
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

            {/* İş Emri Durumu Seçimi */}
            <FormControl fullWidth size="small">
              <InputLabel>İş Emri Durumu</InputLabel>
              <Select
                name="durum"
                value={isEmriForm.durum || 'beklemede'}
                onChange={handleFormChange}
                label="İş Emri Durumu"
                endAdornment={loadingDurumlar ? <CircularProgress size={20} /> : null}
              >
                {isEmriDurumlari.map((durum) => (
                  <MenuItem key={durum.durum_kodu} value={durum.durum_kodu}>
                    {durum.durum_adi}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Üretim Planı Seçimi */}
            <FormControl fullWidth size="small">
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
                {uretimPlanlari.map((plan) => (
                  <MenuItem key={plan.id} value={plan.id}>
                    {plan.ozel_liste_adi ? 
                      `${plan.ozel_liste_adi} - Miktar: ${plan.miktar || 0}` : 
                      plan.makina?.name ? 
                        `${plan.makina.name} - Miktar: ${plan.miktar || 0}` : 
                        `Plan #${plan.id} - Miktar: ${plan.miktar || 0}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Setup Sayısı ve CNC Süresi Bilgileri */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Paper sx={{ p: 2, flex: 1, bgcolor: 'grey.50' }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Setup Sayısı
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {parca?.setupSayisi || 'Belirtilmemiş'}
                </Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: 1, bgcolor: 'grey.50' }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  CNC Süresi (dk)
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {parca?.cncIslemeSuresi || 'Belirtilmemiş'}
                </Typography>
              </Paper>
            </Box>
            
            <TextField
              label="Açıklama"
              name="aciklama"
              value={isEmriForm.aciklama}
              onChange={handleFormChange}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              size="small"
            />

            {/* Sipariş ve Tedarik Dökümanları */}
            <Button
              variant="outlined"
              onClick={() => setDokumanModalOpen(true)}
              fullWidth
              style={{ 
                fontSize: '12px',
                padding: '8px 12px',
                marginTop: '15px'
              }}
            >
              Sipariş ve Tedarik Dökümanları
            </Button>

            
            <TextField
              label="Parça Kodu"
              name="parcaKodu"
              value={isEmriForm.parcaKodu}
              onChange={handleFormChange}
              fullWidth
              disabled
              variant="filled"
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseIsEmriModal}>
            İptal
          </Button>
          <Button 
            onClick={handleIsEmriSubmit} 
            variant="contained"
            disabled={formLoading}
            sx={{ bgcolor: 'primary.main', color: 'white' }}
          >
            {formLoading ? <CircularProgress size={24} color="inherit" /> : "Oluştur"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Parça Kayıtları Modal */}
      {parca && !yeniParca && (
        <ParcaKayitlariModal
          open={parcaKayitlariModalOpen}
          onClose={() => setParcaKayitlariModalOpen(false)}
          parcaKodu={parca.parcaKodu}
        />
      )}

      {/* Parça Üretim Geçmişi Modal */}
      {parca && !yeniParca && (
        <ParcaUretimGecmisiModal
          open={uretimGecmisiModalOpen}
          onClose={() => setUretimGecmisiModalOpen(false)}
          parcaKodu={parca.parcaKodu}
          parcaAdi={parca.parcaAdi}
        />
      )}

      {/* Sipariş Dökümanları Modal */}
      {dokumanModalOpen && (
        <SiparisDokumanlariModal
          open={dokumanModalOpen}
          onClose={() => setDokumanModalOpen(false)}
          isEmriId={null}
          isNewOrder={true}
        />
      )}

      {/* Stok Kartı Seçim Modal */}
      {stokKartiModalOpen && (
        <StokKartiSecimModal
          open={stokKartiModalOpen}
          onClose={() => setStokKartiModalOpen(false)}
          onSelect={handleStokKartiSec}
        />
      )}

      {/* Mobil Stok Kartı Seçici */}
      <MobilStokKartiSecici
        open={mobilStokKartiSeciciOpen}
        onClose={() => setMobilStokKartiSeciciOpen(false)}
        onSelect={handleParcaStokKartiSec}
        aramaMetni={editedParca?.hamMalzemeOlculeri || ''}
        currentParca={editedParca}
      />

      {/* Stok Kartı Düzenle Modal */}
      <StokKartiForm
        open={stokKartiDuzenleModal.open}
        onClose={() => setStokKartiDuzenleModal({ open: false, stokKarti: null })}
        stokKarti={stokKartiDuzenleModal.stokKarti}
        onSuccess={async (data, action) => {
          // Stok kartı güncellendiğinde, parça formundaki stok kartı bilgilerini güncelle
          if (action === 'update' && secilenStokKarti && secilenStokKarti.id === data.id) {
            setSecilenStokKarti(data);
            setEditedParca(prev => ({
              ...prev,
              hamMalzemeCinsi: data.malzeme_cinsi,
              hamMalzemeOlculeri: data.olculeriFormatted || data.kesit
            }));
          }

          // Global stok kartı güncelleme event'ini tetikle
          window.dispatchEvent(new CustomEvent('stokKartiUpdated', {
            detail: { updatedStokKarti: data, action: 'update' }
          }));
        }}
      />
    </Box>
  );
}
