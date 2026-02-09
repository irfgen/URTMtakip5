import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Chip,
  Menu,
  Tooltip,
  CircularProgress,
  Card,
  CardContent,
  InputAdornment,
  Modal,
  Backdrop,
  Fade,
} from '@mui/material';
import ParcaSecici from '../components/ParcaSecici';
import HamMalzemeGonderimDialog from '../components/HamMalzemeGonderimDialog';
import HamMalzemeTeslimDialog from '../components/HamMalzemeTeslimDialog';
import HamMalzemeBilgiDialog from '../components/HamMalzemeBilgiDialog';
import FasonTeslimDialog from '../components/FasonTeslimDialog';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupIcon from '@mui/icons-material/Group';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import ImageWithFallback from '../components/ImageWithFallback';
import CloseIcon from '@mui/icons-material/Close';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import InventoryIcon from '@mui/icons-material/Inventory';
import axios from 'axios';

function Fason() {
  const theme = useTheme();
  const location = useLocation();
  const [fasonIsler, setFasonIsler] = useState([]);
  const [filteredFasonIsler, setFilteredFasonIsler] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [parcalar, setParcalar] = useState([]);
  const [fasonGruplar, setFasonGruplar] = useState([]); // Fason grupları için yeni state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedParca, setSelectedParca] = useState(null);
  const [selectedGrup, setSelectedGrup] = useState(null); // Seçili grup için yeni state
  const [teklifler, setTeklifler] = useState([]);
  const [teklifDialogOpen, setTeklifDialogOpen] = useState(false);
  const [statusMenuAnchorEl, setStatusMenuAnchorEl] = useState(null);
  const [selectedFasonId, setSelectedFasonId] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    tedarikci: '',
    durum: '',
    fason_grup_id: '',
    ham_malzeme_durumu: ''
  });
  const [sorting, setSorting] = useState({
    field: 'verilis_tarihi',
    direction: 'desc'
  });
  const [teklifFormData, setTeklifFormData] = useState({
    tedarikci: '',
    teklif_fiyati: '',
    teslim_suresi: '',
    aciklama: ''
  });
  const [formData, setFormData] = useState({
    parca_kodu: '',
    fason_adet: 1,
    teslim_tarihi: '',
    ilgili_kisi: '',
    tedarikci: '',
    durum: 'beklemede',
    aciklama: '',
    fason_grup_id: '' // Fason grup ID'si için yeni alan
  });
  const [teslimDialogOpen, setTeslimDialogOpen] = useState(false);
  const [teslimData, setTeslimData] = useState({
    teslim_adet: 0,
    notlar: ''
  });
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [imagePopupOpen, setImagePopupOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [currentParca, setCurrentParca] = useState(null);
  
  // Ham malzeme dialog states
  const [hamMalzemeDialogOpen, setHamMalzemeDialogOpen] = useState(false);
  const [selectedFasonForHamMalzeme, setSelectedFasonForHamMalzeme] = useState(null);

  // Helper function to format date for input fields
  const formatDateForInput = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Ham malzeme state'leri
  const [hamMalzemeTeslimDialogOpen, setHamMalzemeTeslimDialogOpen] = useState(false);
  const [hamMalzemeBilgiDialogOpen, setHamMalzemeBilgiDialogOpen] = useState(false);

  // Fason teslim state'leri
  const [fasonTeslimDialogOpen, setFasonTeslimDialogOpen] = useState(false);
  const [selectedFasonForTeslim, setSelectedFasonForTeslim] = useState(null);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };
  
  // Yardımcı fonksiyonlar - Dosya yolları
  const getFotoPath = (foto_path) => {
    if (!foto_path) return '';
    if (foto_path.startsWith('/uploads/')) return foto_path;
    if (foto_path.startsWith('/fotograflar/')) return '/uploads' + foto_path;
    if (foto_path.includes('/')) return '/uploads/fotograflar/' + foto_path.split('/').pop();
    return '/uploads/fotograflar/' + foto_path;
  };
  
  const getTeknikResimPath = (teknik_resim_path) => {
    if (!teknik_resim_path) return '';
    if (teknik_resim_path.startsWith('/uploads/')) return teknik_resim_path;
    if (teknik_resim_path.startsWith('/teknik_resimler/')) return '/uploads' + teknik_resim_path;
    if (teknik_resim_path.includes('/')) return '/uploads/teknik_resimler/' + teknik_resim_path.split('/').pop();
    return '/uploads/teknik_resimler/' + teknik_resim_path;
  };

  // Durum menüsünü açma ve kapama fonksiyonları
  const handleStatusClick = (event, id) => {
    setStatusMenuAnchorEl(event.currentTarget);
    setSelectedFasonId(id);
  };

  const handleStatusMenuClose = () => {
    setStatusMenuAnchorEl(null);
    setSelectedFasonId(null);
  };

  // Durum güncelleme fonksiyonu
  const handleStatusChange = async (newStatus) => {
    if (!selectedFasonId) return;
    
    // Tamamlandı durumuna geçilirse teslim alma dialogunu aç
    if (newStatus === 'tamamlandi') {
      // Önce seçilen fason iş emrini bul
      const selectedFasonIsEmri = fasonIsler.find(item => item.fason_is_emri_id === selectedFasonId);
      if (selectedFasonIsEmri) {
        setTeslimData({
          teslim_adet: selectedFasonIsEmri.fason_adet, // Fason adet değerini varsayılan olarak ayarla
          notlar: ''
        });
        setPendingStatusChange(newStatus);
        setTeslimDialogOpen(true);
        return;
      }
    }
    
    // Diğer durumlar için normal akış devam eder
    await updateFasonStatus(newStatus);
  };
  
  // Teslim alma işlemini gerçekleştir
  const handleTeslimAl = async () => {
    if (!selectedFasonId || !pendingStatusChange) return;
    
    // Teslim adet kontrolü
    if (teslimData.teslim_adet <= 0) {
      setError('Geçerli bir teslim adedi girilmelidir');
      return;
    }
    
    setStatusLoading(true);
    try {
      // Önce teslim alma işlemini yap
      const teslimResponse = await axios.post(
        `/api/fason/is-emirleri/${selectedFasonId}/teslim-al`, 
        teslimData
      );
      console.log('Teslim alma yanıtı:', teslimResponse.data);
      
      // Hem fasonIsler hem de filteredFasonIsler listelerini güncelle
      const updatedItem = teslimResponse.data.fasonIsEmri;
      
      setFasonIsler(prevList => {
        return prevList.map(item => 
          item.fason_is_emri_id === selectedFasonId ? { 
            ...item, 
            durum: updatedItem.durum, 
            teslim_adet: updatedItem.teslim_adet,
            gercek_teslim_tarihi: updatedItem.gercek_teslim_tarihi
          } : item
        );
      });
      
      setFilteredFasonIsler(prevList => {
        return prevList.map(item => 
          item.fason_is_emri_id === selectedFasonId ? { 
            ...item, 
            durum: updatedItem.durum,
            teslim_adet: updatedItem.teslim_adet,
            gercek_teslim_tarihi: updatedItem.gercek_teslim_tarihi
          } : item
        );
      });
      
      // Dialog'u kapat ve bekleyen durumu temizle
      setTeslimDialogOpen(false);
      setPendingStatusChange(null);
      setError(null);
      
      // Kullanıcıya başarı mesajı göster
      alert(`Fason iş teslim alındı: ${teslimData.teslim_adet} adet parça stoka eklendi`);
      
      handleStatusMenuClose();
    } catch (err) {
      console.error('Teslim alma işlemi sırasında hata:', err);
      setError('Teslim alma işlemi sırasında bir hata oluştu: ' + (err.response?.data?.message || err.message));
      alert('Teslim alma işlemi başarısız! ' + (err.response?.data?.message || 'Lütfen tekrar deneyin.'));
    } finally {
      setStatusLoading(false);
    }
  };
  
  // Statü değişimini gerçekleştir
  const updateFasonStatus = async (newStatus) => {
    setStatusLoading(true);
    try {
      const response = await axios.patch(`/api/fason/is-emirleri/${selectedFasonId}/durum`, { durum: newStatus });
      console.log('Durum değişikliği yanıtı:', response.data);
      
      // Hem fasonIsler hem de filteredFasonIsler listelerini güncelle
      const updatedItem = response.data.fasonIsEmri;
      
      setFasonIsler(prevList => {
        return prevList.map(item => 
          item.fason_is_emri_id === selectedFasonId ? { 
            ...item, 
            durum: newStatus, 
            guncelleme_tarihi: updatedItem.guncelleme_tarihi,
            teslim_adet: updatedItem.teslim_adet, // Teslim adet bilgisini de güncelle
            gercek_teslim_tarihi: updatedItem.gercek_teslim_tarihi
          } : item
        );
      });
      
      setFilteredFasonIsler(prevList => {
        return prevList.map(item => 
          item.fason_is_emri_id === selectedFasonId ? { 
            ...item, 
            durum: newStatus, 
            guncelleme_tarihi: updatedItem.guncelleme_tarihi,
            teslim_adet: updatedItem.teslim_adet, // Teslim adet bilgisini de güncelle
            gercek_teslim_tarihi: updatedItem.gercek_teslim_tarihi
          } : item
        );
      });
      
      // Kullanıcıya bilgi ver
      setError(null); // Önceki hataları temizle
      
      // Başarılı olduğunu göster
      const statusText = 
        newStatus === 'beklemede' ? 'Beklemede' :
        newStatus === 'uretimde' ? 'Üretimde' :
        newStatus === 'tamamlandi' ? 'Tamamlandı' :
        newStatus === 'iptal' ? 'İptal' : newStatus;
        
      alert(`Fason iş durumu "${statusText}" olarak güncellendi`);
      
      handleStatusMenuClose();
    } catch (err) {
      console.error('Durum güncellenirken hata:', err);
      setError('Durum güncellenirken bir hata oluştu: ' + (err.response?.data?.message || err.message));
      alert('Durum güncellenemedi! Lütfen tekrar deneyin.');
    } finally {
      setStatusLoading(false);
    }
  };

  // Form step navigation
  const handleNext = () => {
    if (activeStep === 0 && selectedParca) {
      // Parça seçildi, teklifleri getir
      fetchTeklifler(selectedParca.parcaKodu);
    }
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Fetch fason işleri ve parça listesini getir
  useEffect(() => {
    fetchFasonIsler();
    fetchParcalar();
    fetchFasonGruplar();
    
    // Parça detayından gelip gelmediğini kontrol et
    if (location.state?.fromParcaDetay && location.state?.selectedParca) {
      const parcaFromState = location.state.selectedParca;
      setSelectedParca(parcaFromState);
      setFormData({
        parca_kodu: parcaFromState.parcaKodu,
        fason_adet: 1,
        teslim_tarihi: formatDateForInput(new Date()),
        ilgili_kisi: '',
        tedarikci: '',
        durum: 'beklemede',
        aciklama: '',
        fason_grup_id: ''
      });
      
      // Teklifleri getir
      fetchTeklifler(parcaFromState.parcaKodu);
      
      // Dialog'u aç ve adımı 1'e ayarla (teklif adımı)
      setActiveStep(1);
      setDialogOpen(true);
    }
  }, []);

  // Filtreleme otomatik uygulama
  useEffect(() => {
    applyFilters();
  }, [filters, fasonIsler, sorting]);

  // Fason işleri getir
  const fetchFasonIsler = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/fason/is-emirleri');
      setFasonIsler(response.data);
      setFilteredFasonIsler(response.data);
      setError(null);
    } catch (err) {
      console.error('Fason işleri getirilirken hata oluştu:', err);
      setError('Fason işleri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  };

  // Parça listesini getir
  const fetchParcalar = async () => {
    try {
      const response = await axios.get('/api/parcalar');
      setParcalar(response.data);
    } catch (err) {
      console.error('Parçalar getirilirken hata oluştu:', err);
      setError('Parça listesi yüklenirken bir hata oluştu.');
    }
  };

  // Fason gruplarını getir
  const fetchFasonGruplar = async () => {
    try {
      const response = await axios.get('/api/fason-grup');
      setFasonGruplar(response.data);
    } catch (err) {
      console.error('Fason grupları getirilirken hata oluştu:', err);
      setError('Fason grup listesi yüklenirken bir hata oluştu.');
    }
  };

  // Seçilen parça için teklifleri getir
  const fetchTeklifler = async (parcaKodu) => {
    setLoading(true);
    try {
      if (!parcaKodu) {
        console.error('[HATA] Parça kodu boş olamaz!');
        setError('Geçerli bir parça kodu belirtilmemiş');
        setTeklifler([]);
        return;
      }
      
      console.log(`[DEBUG] Teklifler getiriliyor, parça kodu: ${parcaKodu}`);
      const encodedParcaKodu = encodeURIComponent(parcaKodu);
      const response = await axios.get(`/api/fason/teklifler/parca/${encodedParcaKodu}`);
      console.log(`[DEBUG] Gelen teklif verileri:`, response.data);
      console.log(`[DEBUG] Bulunan teklif sayısı: ${response.data.length}`);
      
      if (response.data.length === 0) {
        console.log(`[DEBUG] '${parcaKodu}' parça kodu için teklif bulunamadı`);
      } else {
        console.log(`[DEBUG] İlk teklif örneği:`, {
          teklif_id: response.data[0].teklif_id,
          parca_kodu: response.data[0].parca_kodu,
          tedarikci: response.data[0].tedarikci
        });
      }
      
      setTeklifler(response.data);
      setError(null);
    } catch (err) {
      console.error('Teklifler getirilirken hata oluştu:', err);
      console.error('Hata detayları:', err.response?.data || err.message);
      setError('Teklifler yüklenirken bir hata oluştu.');
      setTeklifler([]); // Hata durumunda teklifleri temizle
    } finally {
      setLoading(false);
    }
  };

  // Yeni teklif ekleme
  const handleTeklifSubmit = async (e) => {
    e.preventDefault();
    
    // Parça seçili değilse işlemi engelle ve hata mesajı göster
    if (!selectedParca || !selectedParca.parcaKodu) {
      setError('Lütfen önce bir parça seçin. Teklif ekleyebilmek için geçerli bir parça kodu gereklidir.');
      return;
    }
    
    if (!teklifFormData.tedarikci || !teklifFormData.teklif_fiyati || !teklifFormData.teslim_suresi) {
      setError('Lütfen tedarikçi, teklif fiyatı ve teslim süresi alanlarını doldurun.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Debug için parça kodunu konsola yazdırma
      console.log('Gönderilecek parça kodu:', selectedParca.parcaKodu);
      console.log('Seçilen parça bilgileri:', selectedParca);
      
      const teklifData = {
        parca_kodu: selectedParca.parcaKodu,
        tedarikci: teklifFormData.tedarikci,
        teklif_fiyati: Number(teklifFormData.teklif_fiyati),
        teslim_suresi: Number(teklifFormData.teslim_suresi),
        aciklama: teklifFormData.aciklama || ''
      };

      console.log('Gönderilecek teklif verisi:', teklifData);
      
      const response = await axios.post('/api/fason/teklifler', teklifData);
      console.log('Teklif ekleme yanıtı:', response.data);
      
      // Teklif eklendikten sonra teklifleri yeniden getir
      fetchTeklifler(selectedParca.parcaKodu);
      
      // Form verilerini temizle ve diyaloğu kapat
      setTeklifFormData({
        tedarikci: '',
        teklif_fiyati: '',
        teslim_suresi: '',
        aciklama: ''
      });
      setTeklifDialogOpen(false);
      
      // Başarı mesajı göster
      alert('Teklif başarıyla eklendi!');
    } catch (err) {
      console.error('Teklif eklenirken hata oluştu:', err);
      console.error('Hata detayları:', err.response?.data || err.message);
      setError('Teklif eklenirken bir hata oluştu: ' + (err.response?.data?.message || err.message));
      alert('Teklif eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Teklif seçme
  const handleSelectTeklif = (teklif) => {
    setFormData({
      ...formData,
      tedarikci: teklif.tedarikci,
      toplam_maliyet: teklif.teklif_fiyati * formData.fason_adet
    });
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setFormData({
      parca_kodu: '',
      fason_adet: 1,
      teslim_tarihi: formatDateForInput(new Date()),
      ilgili_kisi: '',
      tedarikci: '',
      durum: 'beklemede',
      aciklama: '',
      fason_grup_id: ''
    });
    setSelectedParca(null);
    setSelectedGrup(null);
    setActiveStep(0);
    setDialogOpen(true);
    
    // Location state'ini temizle
    if (location.state) {
      window.history.replaceState({}, document.title);
    }
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    
    // Eğer teslim tarihi varsa, input için uygun formata dönüştür
    const teslimTarihi = item.teslim_tarihi ? formatDateForInput(item.teslim_tarihi) : '';
    
    setFormData({
      ...item,
      teslim_tarihi: teslimTarihi
    });

    // Seçili grubu ayarla
    if (item.fason_grup_id) {
      const grup = fasonGruplar.find(g => g.fason_grup_id === item.fason_grup_id);
      setSelectedGrup(grup);
    }
    
    setActiveStep(1); // Düzenleme modunda direkt ikinci adıma geçiyoruz
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu fason iş emrini silmek istediğinizden emin misiniz?')) {
      try {
        setLoading(true);
        await axios.delete(`/api/fason/is-emirleri/${id}`);
        fetchFasonIsler(); // Tabloyu yenile
        setError(null);
      } catch (err) {
        console.error('Fason işi silinirken hata:', err);
        setError('Fason işi silinirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Form değerlerini kontrol et
      console.log('Form verileri:', formData);
      
      // Formdan alınan verileri API'ye göre formatla
      const apiData = {
        parca_kodu: formData.parca_kodu,
        fason_adet: Number(formData.fason_adet),
        teslim_adet: Number(formData.teslim_adet || 0),
        teslim_tarihi: formData.teslim_tarihi,
        ilgili_kisi: formData.ilgili_kisi,
        tedarikci: formData.tedarikci,
        durum: formData.durum || 'beklemede', // Durum belirtilmemişse varsayılan değer ekle
        aciklama: formData.aciklama || '', // Açıklama null ise boş string ekle
        fason_grup_id: formData.fason_grup_id || null // Fason grup ID'si
      };
      
      // Gönderilecek verileri kontrol et
      console.log('Gönderilecek API verileri:', apiData);

      if (selectedItem) {
        // Güncelleme işlemi
        await axios.put(`/api/fason/is-emirleri/${selectedItem.fason_is_emri_id}`, apiData);
      } else {
        // Yeni kayıt ekleme
        await axios.post('/api/fason/is-emirleri', apiData);
      }
      
      fetchFasonIsler(); // Tabloyu yenile
      setDialogOpen(false);
      setError(null);
      
      // Location state'ini temizle
      if (location.state) {
        window.history.replaceState({}, document.title);
      }
      
    } catch (err) {
      console.error('Fason işi kaydedilirken hata:', err);
      setError('Fason işi kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Filtreleri uygulama fonksiyonu
  const applyFilters = () => {
    if (!fasonIsler.length) return;
    
    const filtered = fasonIsler.filter(item => {
      // Arama metni filtreleme (parça kodu, parça adı veya tedarikçi)
      const searchMatch = !filters.search || [
        item.parca_kodu,
        item.parca?.parcaAdi,
        item.parca_adi,
        item.tedarikci,
        item.ilgili_kisi
      ].some(field => field && field.toLowerCase().includes(filters.search.toLowerCase()));
      
      // Tedarikçi filtreleme
      const tedarikciMatch = !filters.tedarikci || 
        (item.tedarikci && item.tedarikci.toLowerCase().includes(filters.tedarikci.toLowerCase()));
      
      // Durum filtreleme
      const durumMatch = !filters.durum || item.durum === filters.durum;

      // Grup filtreleme
      const grupMatch = !filters.fason_grup_id || 
        (filters.fason_grup_id === 'grupsuz' ? !item.fason_grup_id : item.fason_grup_id === filters.fason_grup_id);
      
      // Ham malzeme durum filtreleme
      const hamMalzemeMatch = !filters.ham_malzeme_durumu || 
        (item.ham_malzeme_durumu === filters.ham_malzeme_durumu);
      
      return searchMatch && tedarikciMatch && durumMatch && grupMatch && hamMalzemeMatch;
    });
    
    // Sıralama uygula
    const sorted = applySorting(filtered);
    setFilteredFasonIsler(sorted);
  };

  // Sıralama fonksiyonu
  const applySorting = (items) => {
    return [...items].sort((a, b) => {
      let valueA, valueB;
      
      switch (sorting.field) {
        case 'verilis_tarihi':
          valueA = new Date(a.verilis_tarihi);
          valueB = new Date(b.verilis_tarihi);
          break;
        case 'teslim_tarihi':
          valueA = a.teslim_tarihi ? new Date(a.teslim_tarihi) : new Date('1900-01-01');
          valueB = b.teslim_tarihi ? new Date(b.teslim_tarihi) : new Date('1900-01-01');
          break;
        case 'parca_kodu':
          valueA = a.parca_kodu || '';
          valueB = b.parca_kodu || '';
          break;
        case 'tedarikci':
          valueA = a.tedarikci || '';
          valueB = b.tedarikci || '';
          break;
        default:
          return 0;
      }
      
      if (sorting.direction === 'asc') {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });
  };

  // Filtreleri temizle
  const clearFilters = () => {
    setFilters({
      search: '',
      tedarikci: '',
      durum: '',
      fason_grup_id: '',
      ham_malzeme_durumu: ''
    });
    setSorting({
      field: 'verilis_tarihi',
      direction: 'desc'
    });
    setFilteredFasonIsler(fasonIsler);
  };

  // Image popup states
  const [hoverImageVisible, setHoverImageVisible] = useState(false);
  const [hoveredImage, setHoveredImage] = useState(null);
  
  // Handle mouseover image event
  const handleMouseEnter = (imageUrl) => {
    setHoveredImage(imageUrl);
    setHoverImageVisible(true);
  };
  
  // Handle mouseleave image event
  const handleMouseLeave = () => {
    setHoverImageVisible(false);
    setHoveredImage(null);
  };
  
  // Click to show full-size image dialog
  const handleImageClick = (imageUrl, parca) => {
    setCurrentImage(imageUrl);
    setCurrentParca(parca);
    setImagePopupOpen(true);
  };

  // Close the full-size image dialog
  const handleImagePopupClose = () => {
    setCurrentImage(null);
    setImagePopupOpen(false);
  };

  // Ham malzeme gönderim fonksiyonları
  const handleHamMalzemeGonder = (fasonIsEmri) => {
    setSelectedFasonForHamMalzeme(fasonIsEmri);
    setHamMalzemeDialogOpen(true);
  };

  const handleHamMalzemeSubmit = async (formData) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `/api/fason/is-emirleri/${selectedFasonForHamMalzeme.fason_is_emri_id}/ham-malzeme-gonder`,
        formData
      );
      
      // Listeyi yenile
      fetchFasonIsler();
      
      alert('Ham malzeme gönderimi başarıyla kaydedildi!');
      setHamMalzemeDialogOpen(false);
      setSelectedFasonForHamMalzeme(null);
    } catch (err) {
      console.error('Ham malzeme gönderim hatası:', err);
      setError('Ham malzeme gönderimi kaydedilemedi: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleHamMalzemeDurumGuncelle = async (fasonIsEmriId, yeniDurum) => {
    try {
      setLoading(true);
      await axios.patch(
        `/api/fason/is-emirleri/${fasonIsEmriId}/ham-malzeme-durum`,
        { ham_malzeme_durumu: yeniDurum }
      );
      
      // Listeyi yenile
      fetchFasonIsler();
      
      alert('Ham malzeme durumu güncellendi!');
    } catch (err) {
      console.error('Ham malzeme durum güncelleme hatası:', err);
      setError('Ham malzeme durumu güncellenemedi: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Ham malzeme teslim et
  const handleHamMalzemeTeslimEt = (fasonIsEmri) => {
    setSelectedFasonForHamMalzeme(fasonIsEmri);
    setHamMalzemeTeslimDialogOpen(true);
  };

  const handleHamMalzemeTeslimSubmit = async (formData) => {
    try {
      setLoading(true);
      await axios.post(
        `/api/fason/is-emirleri/${selectedFasonForHamMalzeme.fason_is_emri_id}/ham-malzeme-teslim`,
        formData
      );
      
      // Listeyi yenile
      fetchFasonIsler();
      
      alert('Ham malzeme başarıyla teslim edildi!');
      setHamMalzemeTeslimDialogOpen(false);
      setSelectedFasonForHamMalzeme(null);
    } catch (err) {
      console.error('Ham malzeme teslim hatası:', err);
      setError('Ham malzeme teslim edilemedi: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Ham malzeme bilgi göster
  const handleHamMalzemeBilgiGoster = (fasonIsEmri) => {
    setSelectedFasonForHamMalzeme(fasonIsEmri);
    setHamMalzemeBilgiDialogOpen(true);
  };

  // Fason teslim fonksiyonları
  const handleFasonTeslim = (fasonIsEmri) => {
    setSelectedFasonForTeslim(fasonIsEmri);
    setFasonTeslimDialogOpen(true);
  };

  const handleFasonTeslimSubmit = async (formData) => {
    try {
      setLoading(true);
      await axios.post(
        `/api/fason/is-emirleri/${selectedFasonForTeslim.fason_is_emri_id}/teslim-al`,
        formData
      );
      
      // Listeyi yenile
      fetchFasonIsler();
      
      alert('Fason teslim başarıyla kaydedildi!');
      setFasonTeslimDialogOpen(false);
      setSelectedFasonForTeslim(null);
    } catch (err) {
      console.error('Fason teslim hatası:', err);
      setError('Fason teslim kaydedilemedi: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Fason İşler</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            component={Link}
            to="/fason-gruplar"
            startIcon={<GroupIcon />}
          >
            Fason Grupları
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Yeni Fason İş
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Filtreler ve Sıralama
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Tedarikçi"
                variant="outlined"
                size="small"
                value={filters.tedarikci}
                onChange={(e) => setFilters({ ...filters, tedarikci: e.target.value })}
                placeholder="Tedarikçi adı..."
              />
            </Grid>
            
            <Grid item xs={12} sm={4} md={2}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>Fason Durumu</InputLabel>
                <Select
                  value={filters.durum}
                  onChange={(e) => setFilters({ ...filters, durum: e.target.value })}
                  label="Fason Durumu"
                >
                  <MenuItem value=""><em>Tümü</em></MenuItem>
                  <MenuItem value="beklemede">Beklemede</MenuItem>
                  <MenuItem value="uretimde">Üretimde</MenuItem>
                  <MenuItem value="tamamlandi">Tamamlandı</MenuItem>
                  <MenuItem value="iptal">İptal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4} md={2}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>Fason Grubu</InputLabel>
                <Select
                  value={filters.fason_grup_id}
                  onChange={(e) => setFilters({ ...filters, fason_grup_id: e.target.value })}
                  label="Fason Grubu"
                >
                  <MenuItem value=""><em>Tümü</em></MenuItem>
                  <MenuItem value="grupsuz">Grupsuz İşler</MenuItem>
                  {fasonGruplar.map((grup) => (
                    <MenuItem key={grup.fason_grup_id} value={grup.fason_grup_id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            backgroundColor: grup.renk,
                            borderRadius: '50%'
                          }}
                        />
                        {grup.grup_adi}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>Ham Malzeme</InputLabel>
                <Select
                  value={filters.ham_malzeme_durumu}
                  onChange={(e) => setFilters({ ...filters, ham_malzeme_durumu: e.target.value })}
                  label="Ham Malzeme"
                >
                  <MenuItem value=""><em>Tümü</em></MenuItem>
                  <MenuItem value="bekliyor">Bekliyor</MenuItem>
                  <MenuItem value="gonderildi">Gönderildi</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
            {/* Sıralama Elemanları */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl variant="outlined" sx={{ minWidth: 180 }}>
                <InputLabel>Sıralama Kriteri</InputLabel>
                <Select
                  value={sorting.field}
                  onChange={(e) => setSorting({ ...sorting, field: e.target.value })}
                  label="Sıralama Kriteri"
                  size="small"
                >
                  <MenuItem value="verilis_tarihi">Veriliş Tarihi</MenuItem>
                  <MenuItem value="teslim_tarihi">Teslim Tarihi</MenuItem>
                  <MenuItem value="parca_kodu">Parça Kodu</MenuItem>
                  <MenuItem value="tedarikci">Tedarikçi</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl variant="outlined" sx={{ minWidth: 150 }}>
                <InputLabel>Sıralama Yönü</InputLabel>
                <Select
                  value={sorting.direction}
                  onChange={(e) => setSorting({ ...sorting, direction: e.target.value })}
                  label="Sıralama Yönü"
                  size="small"
                >
                  <MenuItem value="desc">Azalan</MenuItem>
                  <MenuItem value="asc">Artan</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Hızlı Arama"
                variant="outlined"
                size="small"
                value={filters.search}
                onChange={(e) => {
                  const newFilters = { ...filters, search: e.target.value };
                  setFilters(newFilters);
                  // Anında filtreleme yapmak için
                  const filtered = fasonIsler.filter(item => {
                    const searchTerm = e.target.value.toLowerCase();
                    return [
                      item.parca_kodu,
                      item.parca?.parcaAdi,
                      item.parca_adi,
                      item.tedarikci,
                      item.ilgili_kisi
                    ].some(field => field && field.toLowerCase().includes(searchTerm));
                  });
                  setFilteredFasonIsler(filtered);
                }}
                placeholder="Parça, Tedarikçi..."
                sx={{ minWidth: 350 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              {/* Sıfırlama Butonu */}
              <Button 
                variant="outlined" 
                onClick={clearFilters}
                startIcon={<FilterListIcon />}
                size="small"
                sx={{ ml: 1 }}
              >
                Filtreleri ve Sıralamayı Sıfırla
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 1000 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
              <TableCell sx={{ fontWeight: 'bold', width: '80px', minWidth: '80px' }}>Görsel</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '90px', minWidth: '90px' }}>Parça Kodu</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '70px', minWidth: '70px' }}>Grup</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '60px', minWidth: '60px' }}>Verilen</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '90px', minWidth: '90px' }}>Teslim</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '90px', minWidth: '90px' }}>Tedarikçi</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '80px', minWidth: '80px' }}>V.Tarihi</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '80px', minWidth: '80px' }}>T.Tarihi</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '80px', minWidth: '80px' }}>İlgili Kişi</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '100px', minWidth: '100px' }}>Durum</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '100px', minWidth: '100px' }}>Ham Malzeme</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'right', width: '70px', minWidth: '70px' }}>Maliyet</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '80px', minWidth: '80px' }}>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={13} align="center">Yükleniyor...</TableCell>
              </TableRow>
            ) : filteredFasonIsler.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} align="center">Fason iş kaydı bulunamadı</TableCell>
              </TableRow>
            ) : (
              filteredFasonIsler.map((is, index) => (
                <TableRow 
                  key={is.fason_is_emri_id}
                  sx={{ 
                    backgroundColor: index % 2 ? 'rgba(0, 0, 0, 0.02)' : 'inherit',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <TableCell sx={{ width: '80px', padding: '2px' }}>
                    {is.parca?.foto_path ? (
                      <Box sx={{ position: 'relative', display: 'inline-block' }}>
                        <ImageWithFallback
                          src={getFotoPath(is.parca.foto_path) || '/no-image.png'}
                          alt={is.parca_kodu || is.parca?.parcaAdi}
                          imgStyle={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'contain',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            border: '1px solid #eee',
                            transition: 'all 0.2s ease-in-out',
                          }}
                          onMouseEnter={() => handleMouseEnter(getFotoPath(is.parca.foto_path))}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => handleImageClick(getFotoPath(is.parca.foto_path), is.parca)}
                          fallbackText="Görsel yok"
                        />
                        {hoverImageVisible && hoveredImage === getFotoPath(is.parca.foto_path) && (                            <Box 
                              sx={{ 
                                position: 'absolute', 
                                zIndex: 1000, 
                                left: '150px', 
                                top: '-10px', 
                                boxShadow: '0 5px 15px rgba(0,0,0,0.2)', 
                                backgroundColor: 'white', 
                                p: 1.5,
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                minWidth: '320px'
                              }}
                            >
                              <Typography variant="subtitle2" gutterBottom sx={{ borderBottom: '1px solid #eee', pb: 0.5 }}>
                                {is.parca?.parcaAdi || is.parca_kodu}
                              </Typography>
                              <ImageWithFallback
                                src={getFotoPath(is.parca.foto_path) || '/no-image.png'}
                                alt={is.parca_kodu || is.parca?.parcaAdi}
                                imgStyle={{ width: '320px', height: '320px', objectFit: 'contain', marginBottom: '8px' }}
                                fallbackText="Görsel yok"
                              />
                              <Typography variant="caption" display="block" color="text.secondary">
                                Tıklayarak büyütebilirsiniz
                              </Typography>
                            </Box>
                        )}
                      </Box>
                    ) : (
                      <Box 
                        sx={{ 
                          width: '60px', 
                          height: '60px', 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          backgroundColor: '#f5f5f5', 
                          color: '#757575',
                          borderRadius: '4px',
                          border: '1px dashed #ccc'
                        }}
                      >
                        <ImageIcon fontSize="small" />
                        <Typography variant="caption" sx={{ fontSize: '0.5rem' }}>
                          Yok
                        </Typography>
                      </Box>
                    )}
                    {is.parca?.teknik_resim_path && (
                      <Tooltip title="Teknik Resim Görüntüle">
                        <IconButton 
                          size="small" 
                          component={Link}
                          href={getTeknikResimPath(is.parca.teknik_resim_path)} 
                          target="_blank"
                          color="primary"
                          sx={{ 
                            mt: 0.5, 
                            display: 'block',
                            border: '1px solid',
                            borderColor: 'primary.light',
                            '&:hover': {
                              backgroundColor: 'primary.light',
                              color: 'white'
                            }
                          }}
                        >
                          <DescriptionIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell sx={{ padding: '4px 8px', fontSize: '0.875rem' }}>{is.parca_kodu}</TableCell>
                  <TableCell sx={{ padding: '4px 8px' }}>
                    {is.fason_grup ? (
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            backgroundColor: is.fason_grup.renk || '#1976d2',
                            borderRadius: '50%'
                          }}
                        />
                        <Tooltip title={is.fason_grup.aciklama || ''}>
                          <Chip
                            size="small"
                            label={is.fason_grup.grup_adi}
                            variant="outlined"
                            sx={{ maxWidth: 70, fontSize: '0.7rem', height: '20px' }}
                          />
                        </Tooltip>
                      </Box>
                    ) : (
                      <Chip
                        size="small"
                        label="Grupsuz"
                        variant="outlined"
                        color="default"
                        sx={{ fontSize: '0.7rem', height: '20px' }}
                      />
                    )}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', padding: '4px 8px', fontSize: '0.875rem' }}>{is.fason_adet}</TableCell>
                  <TableCell sx={{ textAlign: 'center', padding: '2px 4px' }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={0.3}>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', lineHeight: 1 }}>
                        {is.teslim_adet || 0}/{is.fason_adet}
                      </Typography>
                      <Button
                        size="small"
                        variant={is.durum === 'tamamlandi' ? 'outlined' : 'contained'}
                        disabled={is.durum === 'tamamlandi'}
                        onClick={() => handleFasonTeslim(is)}
                        color="primary"
                        sx={{ 
                          fontSize: '0.55rem', 
                          py: 0.1, 
                          px: 0.3,
                          minWidth: '50px',
                          height: '20px'
                        }}
                      >
                        {is.durum === 'tamamlandi' ? 'OK' : 'Teslim'}
                      </Button>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ padding: '4px 8px', fontSize: '0.875rem', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Tooltip title={is.tedarikci}>
                      <span>{is.tedarikci}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ padding: '4px 8px', fontSize: '0.75rem' }}>{new Date(is.verilis_tarihi).toLocaleDateString('tr-TR')}</TableCell>
                  <TableCell sx={{ padding: '4px 8px', fontSize: '0.75rem' }}>{is.teslim_tarihi ? new Date(is.teslim_tarihi).toLocaleDateString('tr-TR') : '-'}</TableCell>
                  <TableCell sx={{ padding: '4px 8px', fontSize: '0.875rem', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Tooltip title={is.ilgili_kisi}>
                      <span>{is.ilgili_kisi}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ padding: '2px 4px' }}>
                    <Box display="flex" flexDirection="column" gap={0.3}>
                      <Chip
                        size="small"
                        label={
                          is.durum === 'beklemede' ? 'Bekliyor' :
                          is.durum === 'uretimde' ? 'Üretim' :
                          is.durum === 'tamamlandi' ? 'Tamam' :
                          is.durum === 'iptal' ? 'İptal' : is.durum
                        }
                        color={
                          is.durum === 'beklemede' ? 'warning' :
                          is.durum === 'uretimde' ? 'primary' :
                          is.durum === 'tamamlandi' ? 'success' :
                          is.durum === 'iptal' ? 'error' : 'default'
                        }
                        onClick={(event) => handleStatusClick(event, is.fason_is_emri_id)}
                        sx={{ cursor: 'pointer', fontSize: '0.6rem', height: '18px' }}
                        variant="outlined"
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.55rem' }}>
                        {new Date(is.guncelleme_tarihi).toLocaleDateString('tr-TR')}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ padding: '2px 4px' }}>
                    <Box display="flex" flexDirection="column" gap={0.3}>
                      {/* Ham Malzeme Durumu */}
                      <Box display="flex" alignItems="center" gap={0.3}>
                        <LocalShippingIcon 
                          fontSize="small" 
                          color={
                            is.ham_malzeme_durumu === 'teslim_edildi' ? 'success' :
                            is.ham_malzeme_durumu === 'gonderildi' ? 'primary' : 'disabled'
                          } 
                        />
                        <Chip
                          size="small"
                          label={
                            is.ham_malzeme_durumu === 'teslim_edildi' ? 'Teslim' :
                            is.ham_malzeme_durumu === 'gonderildi' ? 'Gönder.' : 'Yok'
                          }
                          color={
                            is.ham_malzeme_durumu === 'teslim_edildi' ? 'success' :
                            is.ham_malzeme_durumu === 'gonderildi' ? 'primary' : 'default'
                          }
                          onClick={() => {
                            if (is.ham_malzeme_durumu === 'teslim_edildi') {
                              handleHamMalzemeBilgiGoster(is);
                            } else if (is.ham_malzeme_durumu === 'gonderildi') {
                              handleHamMalzemeTeslimEt(is);
                            } else {
                              handleHamMalzemeGonder(is);
                            }
                          }}
                          sx={{ cursor: 'pointer', fontSize: '0.6rem', height: '18px' }}
                        />
                      </Box>
                      
                      {/* Ham malzeme detayları */}
                      {is.ham_malzeme_gonderim_tarihi && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
                          {new Date(is.ham_malzeme_gonderim_tarihi).toLocaleDateString('tr-TR')}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', padding: '4px 8px', fontSize: '0.875rem' }}>{is.toplam_maliyet ? `${is.toplam_maliyet} ₺` : '-'}</TableCell>
                  <TableCell sx={{ textAlign: 'center', padding: '2px 4px' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'row', 
                      gap: 0.2,
                      justifyContent: 'center',
                      '@media (max-width: 960px)': {
                        flexDirection: 'column',
                      } 
                    }}>
                      <Tooltip title="Düzenle">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEdit(is)} 
                          color="primary"
                          sx={{ 
                            border: '1px solid', 
                            borderColor: 'primary.light',
                            width: '24px',
                            height: '24px',
                            '&:hover': {
                              backgroundColor: 'primary.light',
                              color: 'white'
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDelete(is.fason_is_emri_id)} 
                          color="error"
                          sx={{ 
                            border: '1px solid', 
                            borderColor: 'error.light',
                            width: '24px',
                            height: '24px',
                            '&:hover': {
                              backgroundColor: 'error.light',
                              color: 'white'
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Durumu Değiştir">
                        <IconButton 
                          size="small" 
                          onClick={(event) => handleStatusClick(event, is.fason_is_emri_id)}
                          color="info"
                          sx={{ 
                            border: '1px solid', 
                            borderColor: 'info.light',
                            '&:hover': {
                              backgroundColor: 'info.light',
                              color: 'white'
                            }
                          }}
                        >
                          <KeyboardArrowDownIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Durum değiştirme menüsü */}
      <Menu
        anchorEl={statusMenuAnchorEl}
        open={Boolean(statusMenuAnchorEl)}
        onClose={handleStatusMenuClose}
        disableScrollLock
      >
        <MenuItem 
          onClick={() => handleStatusChange('beklemede')}
          disabled={statusLoading}
        >
          <Chip size="small" color="warning" label="Beklemede" sx={{ minWidth: 85 }} />
        </MenuItem>
        <MenuItem 
          onClick={() => handleStatusChange('uretimde')}
          disabled={statusLoading}
        >
          <Chip size="small" color="primary" label="Üretimde" sx={{ minWidth: 85 }} />
        </MenuItem>
        <MenuItem 
          onClick={() => handleStatusChange('tamamlandi')}
          disabled={statusLoading}
        >
          <Chip size="small" color="success" label="Tamamlandı" sx={{ minWidth: 85 }} />
        </MenuItem>
        <MenuItem 
          onClick={() => handleStatusChange('iptal')}
          disabled={statusLoading}
        >
          <Chip size="small" color="error" label="İptal" sx={{ minWidth: 85 }} />
        </MenuItem>
        {statusLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Menu>

      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {selectedItem ? 'Fason İş Düzenle' : (
              location.state?.fromParcaDetay ? 
                `Yeni Fason İş - ${location.state.selectedParca?.parcaKodu}` : 
                'Yeni Fason İş'
            )}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ width: '100%', mt: 2 }}>
              {/* Parçadan geldiğinde bilgi mesajı */}
              {location.state?.fromParcaDetay && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <strong>{location.state.selectedParca?.parcaKodu}</strong> parçası için fason iş oluşturuyorsunuz.
                </Alert>
              )}
              
              {/* Adım göstergesi */}
              {!selectedItem && (
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                  <Step>
                    <StepLabel>
                      {location.state?.fromParcaDetay ? 'Seçili Parça' : 'Parça Seç'}
                    </StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Teklifler</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Fason Detayları</StepLabel>
                  </Step>
                </Stepper>
              )}

              {/* Adım 1: Parça Seçimi */}
              {!selectedItem && activeStep === 0 && (
                <Box>
                  {location.state?.fromParcaDetay ? (
                    // Parçadan gelince seçili parçayı göster
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Seçili Parça
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                        <Grid container spacing={2} alignItems="center">
                          {location.state.selectedParca?.foto_path && (
                            <Grid item xs={12} sm={3}>
                              <Box sx={{ textAlign: 'center' }}>
                                <img
                                  src={getFotoPath(location.state.selectedParca.foto_path)}
                                  alt={location.state.selectedParca.parcaKodu}
                                  style={{ 
                                    width: '100px', 
                                    height: '100px', 
                                    objectFit: 'contain',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '4px'
                                  }}
                                />
                              </Box>
                            </Grid>
                          )}
                          <Grid item xs={12} sm={location.state.selectedParca?.foto_path ? 9 : 12}>
                            <Typography variant="h6" gutterBottom>
                              {location.state.selectedParca?.parcaKodu}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {location.state.selectedParca?.parcaAdi || 'Parça Adı Belirtilmemiş'}
                            </Typography>
                            {location.state.selectedParca?.hamMalzemeCinsi && (
                              <Typography variant="body2">
                                Ham Malzeme: {location.state.selectedParca.hamMalzemeCinsi}
                              </Typography>
                            )}
                            {location.state.selectedParca?.hamMalzemeOlculeri && (
                              <Typography variant="body2">
                                Ölçüler: {location.state.selectedParca.hamMalzemeOlculeri}
                              </Typography>
                            )}
                            {location.state.selectedParca?.sirketIciMaliyeti && (
                              <Typography variant="body2" color="primary">
                                Şirket İçi Maliyet: {location.state.selectedParca.sirketIciMaliyeti} ₺
                              </Typography>
                            )}
                          </Grid>
                        </Grid>
                      </Paper>
                    </Box>
                  ) : (
                    // Normal parça seçim formu
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Fason İşi İçin Parça Seçin
                      </Typography>
                      <ParcaSecici
                        selectedParca={selectedParca}
                        onSec={(parca) => {
                          setSelectedParca(parca);
                          if (parca) {
                            setFormData({
                              ...formData,
                              parca_kodu: parca.parcaKodu,
                            });
                          } else {
                            setFormData({
                              ...formData,
                              parca_kodu: '',
                            });
                          }
                        }}
                      />
                    </Box>
                  )}
                  {selectedParca && (
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Parça Kodu"
                          value={selectedParca.parcaKodu}
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Stok Adeti"
                          value={selectedParca.stokAdeti || 0}
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Ham Madde Cinsi"
                          value={selectedParca.hamMalzemeCinsi || '-'}
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Ham Madde Boyutları"
                          value={selectedParca.hamMalzemeOlculeri || '-'}
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Fasona Verilecek Adet"
                          type="number"
                          value={formData.fason_adet}
                          onChange={(e) => setFormData({ ...formData, fason_adet: e.target.value })}
                          required
                          inputProps={{ min: 1 }}
                        />
                      </Grid>
                    </Grid>
                  )}
                </Box>
              )}

              {/* Adım 2: Teklifler */}
              {!selectedItem && activeStep === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Teklifler
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => setTeklifDialogOpen(true)}
                    >
                      Yeni Teklif Ekle
                    </Button>
                    
                    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1" sx={{ mr: 1 }}>
                        <strong>Şirket İçi Maliyet:</strong>
                      </Typography>
                      <Typography variant="subtitle1" color="primary">
                        {selectedParca?.sirketIciMaliyeti ? `${selectedParca.sirketIciMaliyeti} ₺` : 'Belirtilmemiş'}
                      </Typography>
                    </Paper>
                  </Box>
                  
                  {teklifler.length === 0 ? (
                    <Box>
                      <Typography sx={{ mb: 2 }}>Teklif bulunamadı.</Typography>
                      <Alert severity="info" sx={{ mb: 3 }}>
                        Bu parça için henüz teklif bulunmuyor. İsterseniz yeni teklif ekleyebilir veya doğrudan fason detayları sayfasına geçebilirsiniz.
                      </Alert>
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={() => setActiveStep(2)}
                        sx={{ mt: 1 }}
                      >
                        Fason Detaylarına Geç
                      </Button>
                    </Box>
                  ) : (
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Tedarikçi</TableCell>
                            <TableCell>Teklif Fiyatı</TableCell>
                            <TableCell>Teslim Süresi</TableCell>
                            <TableCell>Tarih</TableCell>
                            <TableCell>Açıklama</TableCell>
                            <TableCell>Seç</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {teklifler.map((teklif) => (
                            <TableRow key={teklif.teklif_id}>
                              <TableCell>{teklif.tedarikci}</TableCell>
                              <TableCell>{teklif.teklif_fiyati} ₺</TableCell>
                              <TableCell>{teklif.teslim_suresi} gün</TableCell>
                              <TableCell>{formatDate(teklif.teklif_tarihi)}</TableCell>
                              <TableCell>{teklif.aciklama || '-'}</TableCell>
                              <TableCell>
                                <Button
                                  variant="contained"
                                  onClick={() => handleSelectTeklif(teklif)}
                                >
                                  Seç
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {/* Adım 3: Fason Detayları */}
              {(!selectedItem && activeStep === 2) || selectedItem ? (
                <Box>
                  {!selectedItem && (
                    <Typography variant="h6" gutterBottom>
                      Fason Detaylarını Girin
                    </Typography>
                  )}
                  <Grid container spacing={3}>
                    {selectedItem && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Parça Kodu"
                          value={formData.parca_kodu}
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                    )}
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label={selectedItem ? "Fasona Verilen Adet" : "Fasona Verilecek Adet"}
                        type="number"
                        value={formData.fason_adet}
                        onChange={(e) => setFormData({ ...formData, fason_adet: e.target.value })}
                        required
                        inputProps={{ min: 1 }}
                        disabled={selectedItem && formData.durum === 'tamamlandi'}
                      />
                    </Grid>
                    
                    {selectedItem && (
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Teslim Alınan Adet"
                          type="number"
                          value={formData.teslim_adet}
                          onChange={(e) => setFormData({ ...formData, teslim_adet: e.target.value })}
                          inputProps={{ min: 0 }}
                        />
                      </Grid>
                    )}
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Tedarikçi"
                        value={formData.tedarikci}
                        onChange={(e) => setFormData({ ...formData, tedarikci: e.target.value })}
                        required
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="İlgili Kişi/Birim"
                        value={formData.ilgili_kisi}
                        onChange={(e) => setFormData({ ...formData, ilgili_kisi: e.target.value })}
                        required
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Teslim Tarihi"
                        type="date"
                        value={formData.teslim_tarihi}
                        onChange={(e) => setFormData({ ...formData, teslim_tarihi: e.target.value })}
                        required
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Fason Grubu (Opsiyonel)</InputLabel>
                        <Select
                          value={formData.fason_grup_id || ''}
                          onChange={(e) => {
                            setFormData({ ...formData, fason_grup_id: e.target.value });
                            const grup = fasonGruplar.find(g => g.fason_grup_id === e.target.value);
                            setSelectedGrup(grup || null);
                          }}
                          label="Fason Grubu (Opsiyonel)"
                        >
                          <MenuItem value="">
                            <em>Grup Seçilmemiş</em>
                          </MenuItem>
                          {fasonGruplar.map((grup) => (
                            <MenuItem key={grup.fason_grup_id} value={grup.fason_grup_id}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    backgroundColor: grup.renk,
                                    borderRadius: '50%'
                                  }}
                                />
                                {grup.grup_adi}
                                <Chip
                                  size="small"
                                  label={`${grup.aktif_parca_sayisi || 0} parça`}
                                  variant="outlined"
                                  sx={{ ml: 1 }}
                                />
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Açıklama"
                        multiline
                        rows={3}
                        value={formData.aciklama || ''}
                        onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                      />
                    </Grid>
                  </Grid>
                </Box>
              ) : null}
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button onClick={() => {
              setDialogOpen(false);
              // Location state'ini temizle
              if (location.state) {
                window.history.replaceState({}, document.title);
              }
            }}>İptal</Button>
            
            {!selectedItem && activeStep > 0 && !location.state?.fromParcaDetay && (
              <Button onClick={handleBack}>
                Geri
              </Button>
            )}
            
            {!selectedItem && (activeStep === 0 || activeStep === 1) && (
              <Button 
                variant="contained" 
                onClick={handleNext}
                disabled={activeStep === 0 ? !selectedParca : false}
              >
                {location.state?.fromParcaDetay && activeStep === 0 ? 'Tekliflere Geç' : 'İlerle'}
              </Button>
            )}
            
            {(selectedItem || activeStep === 2) && (
              <Button 
                type="submit" 
                variant="contained"
                disabled={!formData.parca_kodu || !formData.fason_adet || !formData.teslim_tarihi || !formData.tedarikci || !formData.ilgili_kisi}
              >
                {selectedItem ? 'Güncelle' : 'Kaydet'}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>

      <Dialog 
        open={teklifDialogOpen} 
        onClose={() => setTeklifDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleTeklifSubmit}>
          <DialogTitle>Yeni Teklif Ekle</DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              {/* Seçilen parça bilgisi */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: 'background.paper' }}>
                  <Typography variant="subtitle2" gutterBottom>Seçilen Parça:</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedParca ? `${selectedParca.parcaKodu} - ${selectedParca.parcaAdi || ''}` : 'Parça seçilmedi'}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tedarikçi"
                  value={teklifFormData.tedarikci}
                  onChange={(e) => setTeklifFormData({ ...teklifFormData, tedarikci: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Teklif Fiyatı"
                  type="number"
                  value={teklifFormData.teklif_fiyati}
                  onChange={(e) => setTeklifFormData({ ...teklifFormData, teklif_fiyati: e.target.value })}
                  required
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Teslim Süresi (gün)"
                  type="number"
                  value={teklifFormData.teslim_suresi}
                  onChange={(e) => setTeklifFormData({ ...teklifFormData, teslim_suresi: e.target.value })}
                  required
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Açıklama"
                  multiline
                  rows={3}
                  value={teklifFormData.aciklama}
                  onChange={(e) => setTeklifFormData({ ...teklifFormData, aciklama: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTeklifDialogOpen(false)}>İptal</Button>
            <Button type="submit" variant="contained">Kaydet</Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Teslim Alma Dialog */}
      <Dialog 
        open={teslimDialogOpen} 
        onClose={() => {
          if (!statusLoading) {
            setTeslimDialogOpen(false);
            setPendingStatusChange(null);
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Fason İş Teslim Alma</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Teslim alınan adeti belirtin. Varsayılan olarak fason adet değeri gösterilmektedir.
          </Typography>
          
          <TextField
            fullWidth
            margin="dense"
            label="Teslim Adedi"
            type="number"
            value={teslimData.teslim_adet}
            onChange={(e) => setTeslimData({ ...teslimData, teslim_adet: parseInt(e.target.value) || 0 })}
            disabled={statusLoading}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            margin="dense"
            label="Notlar"
            multiline
            rows={3}
            value={teslimData.notlar}
            onChange={(e) => setTeslimData({ ...teslimData, notlar: e.target.value })}
            disabled={statusLoading}
            placeholder="Teslim notları (opsiyonel)"
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setTeslimDialogOpen(false);
              setPendingStatusChange(null);
            }} 
            disabled={statusLoading}
          >
            İptal
          </Button>
          <Button 
            onClick={handleTeslimAl} 
            variant="contained" 
            color="primary" 
            disabled={statusLoading || teslimData.teslim_adet <= 0}
          >
            {statusLoading ? <CircularProgress size={24} /> : "Teslim Al"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resim Önizleme Popup'ı */}
      <Dialog
        open={imagePopupOpen}
        onClose={handleImagePopupClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Parça Görseli</Typography>
            <IconButton onClick={handleImagePopupClose} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
          {currentImage && (
            <ImageWithFallback
              src={currentImage || '/no-image.png'}
              alt="Parça Görseli"
              imgStyle={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                border: '1px solid #eee',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              fallbackText="Görsel yok"
            />
          )}
        </DialogContent>
        <DialogActions>
          {currentParca?.teknik_resim_path && (
            <Button 
              startIcon={<DescriptionIcon />}
              component={Link}
              href={getTeknikResimPath(currentParca.teknik_resim_path)}
              target="_blank"
              color="primary"
            >
              Teknik Resmi Görüntüle
            </Button>
          )}
          <Button onClick={handleImagePopupClose} variant="contained">Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* Ham Malzeme Gönderim Dialog */}
      <HamMalzemeGonderimDialog
        open={hamMalzemeDialogOpen}
        onClose={() => {
          setHamMalzemeDialogOpen(false);
          setSelectedFasonForHamMalzeme(null);
        }}
        fasonIsEmri={selectedFasonForHamMalzeme}
        onSubmit={handleHamMalzemeSubmit}
        loading={loading}
      />

      {/* Ham Malzeme Teslim Dialog */}
      <HamMalzemeTeslimDialog
        open={hamMalzemeTeslimDialogOpen}
        onClose={() => {
          setHamMalzemeTeslimDialogOpen(false);
          setSelectedFasonForHamMalzeme(null);
        }}
        fasonIsEmri={selectedFasonForHamMalzeme}
        onSubmit={handleHamMalzemeTeslimSubmit}
        loading={loading}
      />

      {/* Ham Malzeme Bilgi Dialog */}
      <HamMalzemeBilgiDialog
        open={hamMalzemeBilgiDialogOpen}
        onClose={() => {
          setHamMalzemeBilgiDialogOpen(false);
          setSelectedFasonForHamMalzeme(null);
        }}
        fasonIsEmri={selectedFasonForHamMalzeme}
      />

      {/* Fason Teslim Dialog */}
      <FasonTeslimDialog
        open={fasonTeslimDialogOpen}
        onClose={() => {
          setFasonTeslimDialogOpen(false);
          setSelectedFasonForTeslim(null);
        }}
        fasonIsEmri={selectedFasonForTeslim}
        onSubmit={handleFasonTeslimSubmit}
        loading={loading}
      />
    </Box>
  );
}

export default Fason;