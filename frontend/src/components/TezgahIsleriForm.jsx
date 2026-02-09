import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Divider,
  List,
  CircularProgress,
  Stack,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Chip,
  Modal,
  Autocomplete,
  TextField
} from '@mui/material';
import {
  DragDropContext,
  Droppable
} from '@hello-pangea/dnd';
import TezgahIsEmriKarti from './TezgahIsEmriKarti';
import ImageWithFallback from './ImageWithFallback';
import {
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  Edit as EditIcon,
  Clear as ClearIcon,
  DragIndicator as DragIndicatorIcon,
  AccessTime as AccessTimeIcon,
  Timer as TimerIcon,
  Build as BuildIcon,
  Settings as SettingsIcon,
  Assignment as AssignmentIcon,
  Inventory as InventoryIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { Alert } from '@mui/material';
import { useDispatch } from 'react-redux';
import { tezgahAPI, tezgahPlanAPI, isEmirleriAPI, parcalarAPI } from '../services/api';
import { fetchIsEmirleri } from '../store/slices/isEmirleriSlice';
import '../styles/dragStyles.css';
import IsEmriOzetFormu from './IsEmriOzetFormu';
import IsEmriDuzenleForm from './IsEmriDuzenleForm';
import ParcaDuzenleFormu from './ParcaDuzenleFormu';
import { getFotoPath } from '../utils/imageUtils';
import TezgahRaporuModal from './TezgahRaporuModal';

const oncelikRenkleri = {
  dusuk: 'info',
  normal: 'success',
  yuksek: 'warning',
  acil: 'error'
};

const TezgahIsleriForm = ({ open, onClose, tezgah, onTezgahGuncellendi }) => {
  const dispatch = useDispatch();
  
  // State for active job
  const [aktifIs, setAktifIs] = useState(null);
  
  // State for planned jobs (left section)
  const [planlananIsler, setPlanlananIsler] = useState([]);
  const [loadingPlanlananIsler, setLoadingPlanlananIsler] = useState(false);
  
  // State for completed jobs (right section)
  const [tamamlananIsler, setTamamlananIsler] = useState([]);
  const [loadingTamamlananIsler, setLoadingTamamlananIsler] = useState(false);
  
  // Tamamlanan işler için parça bilgileri
  const [tamamlananIslerParca, setTamamlananIslerParca] = useState({});
  
  // State for drag and drop
  const [isDragging, setIsDragging] = useState(false);
  const [isDragSaving, setIsDragSaving] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  
  // Setup calculation
  const [setupSayisi, setSetupSayisi] = useState(0);
  const [calismaZamani, setCalismaZamani] = useState('0 dakika');
  const [calismaZamaniLoading, setCalismaZamaniLoading] = useState(false);
  const [atamaZamani, setAtamaZamani] = useState('-');

  // State for özet form
  const [ozetFormOpen, setOzetFormOpen] = useState(false);

  // State for edit dialogs
  const [isEmriDuzenleDialog, setIsEmriDuzenleDialog] = useState(false);
  const [parcaDuzenleDialog, setParcaDuzenleDialog] = useState(false);

  // State for workstation assignment dialog
  const [assignDialog, setAssignDialog] = useState({
    open: false,
    isEmriId: null
  });
  const [allTezgahlar, setAllTezgahlar] = useState([]);
  const [selectedTezgah, setSelectedTezgah] = useState(null);

  // CNC Panel Durum Takibi
  const [cncPanelDurum, setCncPanelDurum] = useState({
    durum: null, // true: çalışıyor, false: durdu, null: bilinmiyor
    sonGuncelleme: null,
    baglantiDurumu: 'disconnected' // 'connected', 'disconnected', 'connecting'
  });
  const [cncError, setCncError] = useState(null);

  // Aktif iş için parça bilgileri
  const [aktifIsParca, setAktifIsParca] = useState(null);
  const [aktifIsParcaLoading, setAktifIsParcaLoading] = useState(false);

  // Resim modal state'leri
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Tezgah Raporu modal state
  const [raporOpen, setRaporOpen] = useState(false);

  // Fetch data when component opens
  useEffect(() => {
    if (tezgah?.tezgah_id && open) {
      fetchAktifIs();
      fetchPlanlananIsler();
      fetchTamamlananIsler();
    }
  }, [tezgah?.tezgah_id, open]);

  // Çalışma süresini 5 dakikada bir güncelle (sadece aktif iş varsa)
  useEffect(() => {
    if (!aktifIs || !tezgah?.tezgah_id || !open) return;

    // İlk yükleme
    fetchCalismaZamani(tezgah.tezgah_id, aktifIs.is_emri_id);

    // 5 dakikada bir güncelle
    const interval = setInterval(() => {
      fetchCalismaZamani(tezgah.tezgah_id, aktifIs.is_emri_id);
    }, 5 * 60 * 1000); // 5 dakika = 300000 ms

    return () => clearInterval(interval);
  }, [aktifIs, tezgah?.tezgah_id, open]);

  // Tezgah is_emirleri değişikliklerini dinle
  useEffect(() => {
    if (open && tezgah) {
      fetchAktifIs();
    }
  }, [tezgah?.is_emirleri, open]);

  // CNC Panel durum verilerini almak için fonksiyonlar
  const fetchCncDurum = async (tezgahId) => {
    if (!tezgahId) return;
    try {
      setCncError(null);
      const response = await axios.get(`/api/tezgah-durum/tezgah-durum/${tezgahId}?limit=1`);
      const sonDurum = response.data[0];
      
      if (sonDurum) {
        setCncPanelDurum({
          durum: sonDurum.durum,
          sonGuncelleme: sonDurum.timestamp,
          baglantiDurumu: 'connected'
        });
      }
    } catch (error) {
      console.error('CNC durum alınırken hata:', error);
      setCncPanelDurum(prev => ({
        ...prev,
        baglantiDurumu: 'disconnected'
      }));
      setCncError('Veri alınamadı. Backend servisinin çalıştığından emin olun.');
    }
  };

  // Çalışma süresini hesapla
  const fetchCalismaZamani = async (tezgahId, isEmriId) => {
    if (!tezgahId || !isEmriId) {
      setCalismaZamani('0 dakika');
      return;
    }

    try {
      setCalismaZamaniLoading(true);
      const response = await axios.get(`/api/tezgah-durum/calisma-suresi/${tezgahId}/${isEmriId}`);
      setCalismaZamani(response.data.toplam_calisma_saat || '0 dakika');
    } catch (error) {
      console.error('Çalışma süresi hesaplanırken hata:', error);
      setCalismaZamani('0 dakika');
    } finally {
      setCalismaZamaniLoading(false);
    }
  };

  // CNC Panel durum verilerini periyodik olarak güncelle
  useEffect(() => {
    if (!tezgah?.tezgah_id || !open) return;
    
    // İlk yükleme
    fetchCncDurum(tezgah.tezgah_id);
    
    // 5 saniyede bir güncelle
    const interval = setInterval(() => {
      fetchCncDurum(tezgah.tezgah_id);
    }, 5000); // 5 saniye
    
    return () => clearInterval(interval);
  }, [tezgah?.tezgah_id, open]);

  // Fetch active job
  const fetchAktifIs = async () => {
    // Aktif işi tezgah bilgisinden al
    const aktif = tezgah?.is_emirleri?.[0] || null;
    
    if (aktif) {
      setAktifIs(aktif);
      
      // Atama zamanını formatla
      if (aktif.atama_tarihi) {
        setAtamaZamani(new Date(aktif.atama_tarihi).toLocaleString('tr-TR'));
      }
      
      // Setup sayısı bilgisini al
      setSetupSayisi(aktif.setup_sayisi !== undefined ? aktif.setup_sayisi : 0);
      
      // Çalışma zamanını hesapla
      await fetchCalismaZamani(tezgah?.tezgah_id, aktif.is_emri_id);
      
      // Aktif iş için parça bilgilerini al
      await fetchAktifIsParca(aktif.parca_kodu);
    } else {
      setAktifIs(null);
      setAktifIsParca(null);
      setAtamaZamani('-');
      setSetupSayisi(0);
      setCalismaZamani('0 dakika');
    }
  };

  // Aktif iş için parça bilgilerini getir
  const fetchAktifIsParca = async (parcaKodu) => {
    if (!parcaKodu) {
      setAktifIsParca(null);
      return;
    }

    try {
      setAktifIsParcaLoading(true);
      const response = await parcalarAPI.getAll({ aramaMetni: parcaKodu });
      
      let parcaData = [];
      if (response.data && response.data.parcalar && Array.isArray(response.data.parcalar)) {
        parcaData = response.data.parcalar;
      } else if (Array.isArray(response.data)) {
        parcaData = response.data;
      }
      
      if (parcaData.length > 0) {
        const matched = parcaData.find(p => p.parca_kodu === parcaKodu || p.parcaKodu === parcaKodu) || parcaData[0];
        setAktifIsParca(matched);
      } else {
        setAktifIsParca(null);
      }
    } catch (error) {
      console.error('Aktif iş parça bilgileri yüklenirken hata:', error);
      setAktifIsParca(null);
    } finally {
      setAktifIsParcaLoading(false);
    }
  };

  // Fetch planned jobs
  const fetchPlanlananIsler = async () => {
    if (!tezgah?.tezgah_id) return;
    
    try {
      setLoadingPlanlananIsler(true);
      console.log(`Tezgah ${tezgah.tezgah_id} için planlanan işler getiriliyor...`);
      const response = await axios.get(`/api/tezgah-plan/${tezgah.tezgah_id}/planlanan-isler`);
      console.log('Alınan planlanan işler:', response.data);
      setPlanlananIsler(response.data);
    } catch (error) {
      console.error('Planlanan işler yüklenirken hata:', error);
      setPlanlananIsler([]);
    } finally {
      setLoadingPlanlananIsler(false);
    }
  };

  // Fetch completed jobs
  const fetchTamamlananIsler = async () => {
    if (!tezgah?.tezgah_id) return;
    
    try {
      setLoadingTamamlananIsler(true);
      const response = await axios.get(`/api/tamamlanan-isler/tezgah/${tezgah.tezgah_id}`);
      // Son tamamlanan işi en üste getir
      const sortedJobs = [...response.data].sort((a, b) => 
        new Date(b.bitis_tarihi) - new Date(a.bitis_tarihi)
      );
      setTamamlananIsler(sortedJobs);
      
      // Her tamamlanan iş için parça bilgilerini getir
      const parcaMap = {};
      await Promise.all(sortedJobs.map(async (is) => {
        const kod = is.parca_kodu;
        if (kod) {
          try {
            const parcaRes = await parcalarAPI.getAll({ aramaMetni: kod });
            let parcaData = [];
            if (parcaRes.data && parcaRes.data.parcalar && Array.isArray(parcaRes.data.parcalar)) {
              parcaData = parcaRes.data.parcalar;
            } else if (Array.isArray(parcaRes.data)) {
              parcaData = parcaRes.data;
            }
            if (parcaData.length > 0) {
              const matched = parcaData.find(p => p.parca_kodu === kod || p.parcaKodu === kod) || parcaData[0];
              parcaMap[is.is_emri_id || is.id] = matched;
              console.log(`Parça bilgisi yüklendi: ${kod}, foto_path: ${matched.foto_path}`);
            }
          } catch (error) {
            console.error(`Parça bilgileri alınamadı: ${kod}`, error);
          }
        }
      }));
      setTamamlananIslerParca(parcaMap);
    } catch (error) {
      console.error('Tamamlanan işler yüklenirken hata:', error);
      setTamamlananIsler([]);
      setTamamlananIslerParca({});
    } finally {
      setLoadingTamamlananIsler(false);
    }
  };

  // Start a planned job
  const handleIsBaslat = async (planIs) => {
    if (!planIs?.is_emri_id || loading || aktifIs) return;
    
    try {
      setLoading(true);
      await tezgahAPI.assignIsEmri(tezgah.tezgah_id, planIs.is_emri_id);
      
      // Remove from planned jobs
      await axios.delete(`/api/tezgah-plan/planlanan-isler/${planIs.is_emri_id}`);
      
      // Update active job and lists
      if (onTezgahGuncellendi) await onTezgahGuncellendi();
      await dispatch(fetchIsEmirleri()).unwrap();
      
      // Refresh data
      fetchAktifIs();
      fetchPlanlananIsler();
    } catch (error) {
      console.error('İş başlatma hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open the summary form
  const handleIsBitir = () => {
    if (!aktifIs?.is_emri_id || loading) return;
    
    // Open the summary form
    setOzetFormOpen(true);
  };

  // Handle summary form close
  const handleOzetFormClose = async (isCompleted) => {
    setOzetFormOpen(false);
    
    // If job was completed through the form, refresh data
    if (isCompleted) {
      try {
        setLoading(true);
        console.log('İş tamamlandı sinyali alındı, veriler yenileniyor...');
        
        // Update active job and lists
        if (onTezgahGuncellendi) await onTezgahGuncellendi();
        await dispatch(fetchIsEmirleri()).unwrap();
        
        // Refresh data
        fetchAktifIs();
        fetchTamamlananIsler();
      } catch (error) {
        console.error('Liste güncelleme hatası:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Pause active job
  const handleIsAraVer = async () => {
    if (!aktifIs?.is_emri_id || loading) return;
    
    try {
      setLoading(true);
      await tezgahAPI.pauseIsEmri(tezgah.tezgah_id);
      
      // Update active job and lists
      if (onTezgahGuncellendi) await onTezgahGuncellendi();
      await dispatch(fetchIsEmirleri()).unwrap();
      
      // Refresh data
      fetchAktifIs();
      fetchPlanlananIsler();
    } catch (error) {
      console.error('İşe ara verme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  // Edit active job (fetch full data from API before opening form)
  const [duzenlenecekIsEmri, setDuzenlenecekIsEmri] = useState(null);
  const [isEmriDialogLoading, setIsEmriDialogLoading] = useState(false);
  const handleIsDuzenle = async () => {
    if (!aktifIs?.is_emri_id) return;
    setIsEmriDialogLoading(true);
    try {
      // API'den iş emri detayını çek
      const response = await axios.get(`/api/is-emirleri/${aktifIs.is_emri_id}`);
      setDuzenlenecekIsEmri(response.data);
      setIsEmriDuzenleDialog(true);
    } catch (err) {
      console.error('İş emri detayları alınamadı:', err);
      // Yine de mevcut aktifIs ile aç
      setDuzenlenecekIsEmri(aktifIs);
      setIsEmriDuzenleDialog(true);
    } finally {
      setIsEmriDialogLoading(false);
    }
  };

  // Edit part
  const [duzenlenecekParca, setDuzenlenecekParca] = useState(null);
  const [parcaDialogLoading, setParcaDialogLoading] = useState(false);
  const handleParcaDuzenle = async () => {
    if (!aktifIs?.parca_kodu) return;
    setParcaDialogLoading(true);
    try {
      // API'den parça detayını çek
      const response = await axios.get(`/api/parcalar/${aktifIs.parca_kodu}`);
      setDuzenlenecekParca(response.data);
      setParcaDuzenleDialog(true);
    } catch (err) {
      console.error('Parça detayları alınamadı:', err);
      // Yine de mevcut aktifIs ile aç
      setDuzenlenecekParca(aktifIs);
      setParcaDuzenleDialog(true);
    } finally {
      setParcaDialogLoading(false);
    }
  };

  // Handle drag & drop order changes
  const handleDragEnd = async (result) => {
    setIsDragging(false);
    
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;
    
    const newOrderedList = Array.from(planlananIsler);
    const [movedItem] = newOrderedList.splice(result.source.index, 1);
    newOrderedList.splice(result.destination.index, 0, movedItem);
    
    // Update UI immediately
    setPlanlananIsler(newOrderedList);
    
    try {
      setIsDragSaving(true);
      
      // Create new order numbers (10, 20, 30...)
      const isEmriSiralari = newOrderedList.map((isEmri, index) => {
        const is_emri_id = isEmri.is_emri_id || isEmri.id;
        if (!is_emri_id) return null;
        
        return {
          is_emri_id,
          yeni_sira: (index + 1) * 10
        };
      }).filter(item => item !== null);
      
      // Send API request to update order
      console.log('Gönderilen sıralama verileri:', isEmriSiralari);
      
      // Önlem olarak hatalı veriyi filtreleyelim
      const filteredSiralari = isEmriSiralari.filter(item => 
        item && item.is_emri_id && typeof item.yeni_sira === 'number'
      );
      
      if (filteredSiralari.length === 0) {
        console.warn('Gönderilecek geçerli veri bulunamadı');
        return;
      }
      
      try {
        // İstek gönderilmeden önce timeout ayarlayalım (10 saniye)
        const response = await axios.put(`/api/tezgah-plan/${tezgah.tezgah_id}/siralari-guncelle`, {
          isEmriSiralari: filteredSiralari
        }, { 
          timeout: 10000,
          // Yeniden deneme ayarları 
          retry: 2,
          retryDelay: 1000
        });
        
        // Başarılı olduğunda
        console.log('Server yanıtı:', response.data);
        
        // Önemli: UI'ı iyileştirmek için kullanıcıya güncellendiğini belirtelim
        if (response.data.updatedCount > 0) {
          // Başarılı güncelleme
          console.log(`${response.data.updatedCount} iş emri sırası güncellendi`);
        } else {
          // Güncelleme yapılamadı
          console.warn('Hiçbir güncelleme yapılmadı');
        }
        
        // Bir süre sonra güncel durumu tekrar yükleyelim
        setTimeout(() => {
          fetchPlanlananIsler();
        }, 800);
      } catch (error) {
        console.error('Sıralama güncellenirken hata detayı:', error.response?.data || error.message);
        
        // Ağ hatası mı yoksa sunucu hatası mı belirleyelim
        if (error.code === 'ECONNABORTED' || !error.response) {
          console.error('API isteği zaman aşımına uğradı veya ağ hatası oluştu');
        } else {
          console.error('Sunucu hatası:', error.response.status, error.response.statusText);
        }
        
        // Detaylı hata bilgisi göster (development'ta)
        if (process.env.NODE_ENV !== 'production') {
          console.group('Sıralama Hatası Detayları');
          console.error('Hata objesi:', error);
          if (error.response) {
            console.error('Hata yanıtı:', error.response.data);
            console.error('Durum kodu:', error.response.status);
          }
          console.groupEnd();
        }
        
        // Orijinal sıraya geri dön
        fetchPlanlananIsler();
      }
    } catch (error) {
      console.error('Sıralama güncellenirken hata:', error);
      // Revert to original order in case of error
      fetchPlanlananIsler();
    } finally {
      setIsDragSaving(false);
    }
  };

  // Context menu handlers
  const handleMoveUp = async (isEmriId, currentIndex) => {
    if (currentIndex === 0) return;
    
    const newPlanlananIsler = [...planlananIsler];
    const [movedItem] = newPlanlananIsler.splice(currentIndex, 1);
    newPlanlananIsler.splice(currentIndex - 1, 0, movedItem);
    
    // Update the order numbers
    const updatedItems = newPlanlananIsler.map((item, index) => ({
      ...item,
      sira: index + 1
    }));
    
    setPlanlananIsler(updatedItems);
    
    try {
      await tezgahPlanAPI.siralariGuncelle(tezgah.tezgah_id, {
        isEmriSiralari: updatedItems.map(item => ({
          is_emri_id: item.is_emri_id || item.id,
          yeni_sira: item.sira
        }))
      });
    } catch (error) {
      console.error('Sıra güncellenirken hata:', error);
      // Revert on error
      fetchPlanlananIsler();
    }
  };

  const handleMoveDown = async (isEmriId, currentIndex) => {
    if (currentIndex === planlananIsler.length - 1) return;
    
    const newPlanlananIsler = [...planlananIsler];
    const [movedItem] = newPlanlananIsler.splice(currentIndex, 1);
    newPlanlananIsler.splice(currentIndex + 1, 0, movedItem);
    
    // Update the order numbers
    const updatedItems = newPlanlananIsler.map((item, index) => ({
      ...item,
      sira: index + 1
    }));
    
    setPlanlananIsler(updatedItems);
    
    try {
      await tezgahPlanAPI.siralariGuncelle(tezgah.tezgah_id, {
        isEmriSiralari: updatedItems.map(item => ({
          is_emri_id: item.is_emri_id || item.id,
          yeni_sira: item.sira
        }))
      });
    } catch (error) {
      console.error('Sıra güncellenirken hata:', error);
      // Revert on error
      fetchPlanlananIsler();
    }
  };

  const handleRemoveFromPlan = async (isEmriId) => {
    console.log('handleRemoveFromPlan çağrıldı, isEmriId:', isEmriId);
    try {
      console.log('planlananIsleriSil API çağrısı yapılıyor...');
      const response = await tezgahPlanAPI.planlananIsleriSil(isEmriId);
      console.log('planlananIsleriSil API yanıtı:', response.data);
      
      console.log('Planlanan işler listesi yeniden yükleniyor...');
      await fetchPlanlananIsler();
      console.log('Planlanan işler listesi yenilendi');
    } catch (error) {
      console.error('İş emri silinirken hata:', error);
      console.error('Hata detayları:', error.response?.data);
    }
  };

  const handleAssignToOtherWorkstation = (isEmriId) => {
    setAssignDialog({
      open: true,
      isEmriId: isEmriId
    });
    // Load all workstations
    fetchAllTezgahlar();
  };

  const fetchAllTezgahlar = async () => {
    try {
      const response = await tezgahAPI.getAll();
      setAllTezgahlar(response.data.filter(t => t.tezgah_id !== tezgah.tezgah_id)); // Exclude current workstation
    } catch (error) {
      console.error('Tezgahlar yüklenirken hata:', error);
    }
  };

  const handleAssignConfirm = async () => {
    if (!selectedTezgah || !assignDialog.isEmriId) return;
    
    try {
      await tezgahAPI.assignIsEmri(selectedTezgah.tezgah_id, assignDialog.isEmriId);
      setAssignDialog({ open: false, isEmriId: null });
      setSelectedTezgah(null);
      fetchPlanlananIsler();
    } catch (error) {
      console.error('İş emri atanırken hata:', error);
    }
  };

  const handleAssignCancel = () => {
    setAssignDialog({ open: false, isEmriId: null });
    setSelectedTezgah(null);
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  return (
    <>
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="lg"
    >
      <DialogTitle>
        TEZGAH İŞLERİ - {tezgah?.tezgah_tanimi}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          {/* Sol Bölüm - Planlanmış İş Emirleri */}
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 2, 
                height: '75vh', 
                display: 'flex', 
                flexDirection: 'column',
                bgcolor: isDragging ? 'rgba(25, 118, 210, 0.05)' : 'inherit',
                overflow: 'hidden', // Kesinlikle Paper'da scroll olmamalı
              }}
            >
              <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 2 }}>
                Planlanan İşler
              </Typography>
              
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
                Sıraya göre planlanmış işler. Sürükleyip bırakarak sırayı değiştirebilirsiniz.
              </Typography>
              
              <DragDropContext 
                onDragEnd={handleDragEnd}
                onDragStart={handleDragStart}
              >
                {loadingPlanlananIsler ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box 
                    sx={{ 
                      flex: 1, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      overflow: 'hidden', // Hiç scroll olmamalı 
                      position: 'relative'
                    }}
                  >
                    <Droppable droppableId="planlanan-isler">
                      {(provided) => (
                        <Box 
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          sx={{ 
                            flexGrow: 1, 
                            overflow: 'auto', // Sadece bu Box'ta scroll olmalı
                            height: '58vh',
                            p: 1,
                            '&::-webkit-scrollbar': {
                              width: '8px'
                            },
                            '&::-webkit-scrollbar-thumb': {
                              backgroundColor: 'rgba(0,0,0,0.2)',
                              borderRadius: '4px'
                            }
                          }}
                        >
                          {planlananIsler.length === 0 ? (
                            <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                              Planlanmış iş yok
                            </Typography>
                          ) : (
                            planlananIsler.map((planIs, index) => (
                              <TezgahIsEmriKarti
                                key={`draggable-${String(planIs.is_emri_id || planIs.id || index)}`}
                                planIs={planIs}
                                index={index}
                                isDragDisabled={loading || !!aktifIs}
                                onClick={() => handleIsBaslat(planIs)}
                                onMoveUp={handleMoveUp}
                                onMoveDown={handleMoveDown}
                                onRemove={handleRemoveFromPlan}
                                onAssignToOtherWorkstation={handleAssignToOtherWorkstation}
                                isFirst={index === 0}
                                isLast={index === planlananIsler.length - 1}
                              />
                            ))
                          )}
                          {provided.placeholder}
                        </Box>
                      )}
                    </Droppable>
                  </Box>
                )}
              </DragDropContext>
            </Paper>
          </Grid>
          
          {/* Orta Bölüm - Aktif İş ve Komutlar */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2, height: '75vh', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom color="primary">
                Aktif İş
              </Typography>
              
              {/* Aktif İş Bilgileri */}
              <Box sx={{ mb: 3 }}>
                {aktifIs ? (
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      mb: 3, 
                      borderColor: 'primary.main',
                      boxShadow: 2,
                      '&:hover': { boxShadow: 3 }
                    }}
                  >
                    <CardContent>
                      <Grid container spacing={2}>
                        {/* Sol taraf - Parça Resmi */}
                        <Grid item xs={12} sm={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            {aktifIsParcaLoading ? (
                              <Box sx={{ 
                                width: '100%', 
                                height: 120, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                bgcolor: 'grey.100',
                                borderRadius: 1
                              }}>
                                <CircularProgress size={24} />
                              </Box>
                            ) : (
                              <ImageWithFallback
                                src={getFotoPath(aktifIsParca?.foto_path) || '/no-image.png'}
                                alt={aktifIs.parca_kodu || 'Parça'}
                                sx={{ 
                                  width: '100%', 
                                  height: 120, 
                                  objectFit: 'cover', 
                                  borderRadius: 1,
                                  cursor: aktifIsParca?.foto_path ? 'pointer' : 'default'
                                }}
                                onClick={() => {
                                  if (aktifIsParca?.foto_path) {
                                    setSelectedImage(getFotoPath(aktifIsParca.foto_path));
                                    setModalOpen(true);
                                  }
                                }}
                              />
                            )}
                            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                              Parça Resmi
                            </Typography>
                          </Box>
                        </Grid>
                        
                        {/* Sağ taraf - İş Bilgileri */}
                        <Grid item xs={12} sm={8}>
                          <Stack spacing={1}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="h6" component="div" fontWeight="bold">
                                #{aktifIs.is_emri_no}
                              </Typography>
                              {aktifIs.oncelik && (
                                <Chip
                                  label={aktifIs.oncelik.toUpperCase()}
                                  color={oncelikRenkleri[aktifIs.oncelik] || 'default'}
                                  size="small"
                                />
                              )}
                            </Box>
                            <Typography variant="body1">{aktifIs.is_adi || ''}</Typography>
                            
                            <Box display="flex" flexWrap="wrap" gap={1}>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Üretim Planı:</strong> {aktifIs.uretim_plani_id ? `Plan #${aktifIs.uretim_plani_id}` : (aktifIs.plan_liste_no || '-')}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Parça:</strong> {aktifIs.parca_kodu || '-'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Adet:</strong> {aktifIs.islenen_adet || 0} / {aktifIs.toplam_adet || 0}
                              </Typography>
                              {aktifIs.setup_sayisi !== undefined && (
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Setup:</strong> {aktifIs.setup_sayisi}
                                </Typography>
                              )}
                              {aktifIs.cnc_suresi && (
                                <Typography variant="body2" color="text.secondary">
                                  <strong>CNC Süresi:</strong> {aktifIs.cnc_suresi} dk
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.100', borderRadius: 1, mb: 3 }}>
                    <Typography color="text.secondary">
                      Aktif iş yok
                    </Typography>
                  </Box>
                )}
              </Box>
              
              {/* Komut Butonları */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" gutterBottom color="text.secondary">
                  İşlemler
                </Typography>
                <Stack spacing={2}>
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<PauseIcon />}
                    fullWidth
                    disabled={!aktifIs || loading}
                    onClick={handleIsAraVer}
                  >
                    İşe Ara Ver
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<StopIcon />}
                    fullWidth
                    disabled={!aktifIs || loading}
                    onClick={handleIsBitir}
                  >
                    İşi Bitir
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    fullWidth
                    disabled={!aktifIs || loading}
                    onClick={handleIsDuzenle}
                  >
                    İş Emrini Düzenle
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<SettingsIcon />}
                    fullWidth
                    disabled={!aktifIs || !aktifIs.parca_kodu || loading}
                    onClick={handleParcaDuzenle}
                  >
                    Parça Kartını Düzenle
                  </Button>

                  <Button
                    variant="contained"
                    color="info"
                    startIcon={<AccessTimeIcon />}
                    fullWidth
                    disabled={!tezgah?.tezgah_id}
                    onClick={() => setRaporOpen(true)}
                  >
                    Tezgah raporu
                  </Button>
                </Stack>
              </Box>
              
              {/* İş Detayları */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" gutterBottom color="text.secondary">
                  İş Detayları
                </Typography>
                
                {/* CNC Panel Durum Kartı */}
                <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: '#f8f9fa' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    🔧 CNC Panel Durumu
                    <Box 
                      sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        backgroundColor: 
                          cncPanelDurum.baglantiDurumu === 'connected' ? 
                            (cncPanelDurum.durum === true ? '#4caf50' : 
                             cncPanelDurum.durum === false ? '#f44336' : '#ff9800') :
                          '#9e9e9e'
                      }} 
                    />
                  </Typography>
                  
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Durum: {' '}
                        <Typography component="span" sx={{ 
                          fontWeight: 'bold',
                          color: cncPanelDurum.durum === true ? '#4caf50' : 
                                 cncPanelDurum.durum === false ? '#f44336' : '#ff9800'
                        }}>
                          {cncPanelDurum.durum === true ? 'Çalışıyor' : 
                           cncPanelDurum.durum === false ? 'Durdu' : 
                           'Bilinmiyor'}
                        </Typography>
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          size="small" 
                          variant="outlined"
                          onClick={() => fetchCncDurum(tezgah?.tezgah_id)}
                          disabled={cncPanelDurum.baglantiDurumu === 'connecting'}
                        >
                          🔄
                        </Button>
                      </Box>
                    </Box>                    {cncPanelDurum.sonGuncelleme && (
                      <Typography variant="caption" color="text.secondary">
                        Son Güncelleme: {(() => {
                          const timestamp = cncPanelDurum.sonGuncelleme;
                          
                          // CNC panelden gelen timestamp'i direkt string olarak parse et
                          // Eğer timestamp ISO formatında ise (2025-06-25T16:19:00.000Z)
                          if (timestamp.includes('T')) {
                            const parts = timestamp.split('T');
                            const datePart = parts[0]; // 2025-06-25
                            let timePart = parts[1];
                            
                            // Z kısmını ve milisaniyeleri temizle
                            if (timePart.includes('.')) {
                              timePart = timePart.split('.')[0]; // 16:19:00
                            }
                            if (timePart.includes('Z')) {
                              timePart = timePart.replace('Z', ''); // 16:19:00
                            }
                            
                            // Tarihi DD.MM.YYYY formatına çevir
                            const [year, month, day] = datePart.split('-');
                            return `${day}.${month}.${year} ${timePart}`;
                          }
                          
                          // Eğer farklı bir formatta ise normal parse et
                          return timestamp;
                        })()}
                      </Typography>
                    )}
                  </Stack>
                </Paper>
                
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        <strong>Atanma Zamanı:</strong> {atamaZamani}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TimerIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        <strong>Toplam Çalışma Süresi:</strong> {calismaZamaniLoading ? 'Hesaplanıyor...' : calismaZamani}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BuildIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        <strong>Setup Sayısı:</strong> {setupSayisi}
                      </Typography>
                    </Box>
                    {aktifIs?.cnc_suresi && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TimerIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          <strong>CNC Süresi (dk):</strong> {aktifIs.cnc_suresi}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                  {/* CNC Panel Hata Mesajı */}
                  {cncError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      <strong>Bağlantı Hatası:</strong> {cncError}
                    </Alert>
                  )}
                </Paper>
              </Box>
            </Paper>
          </Grid>
          
          {/* Sağ Bölüm - Tamamlanan İşler */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2, height: '75vh', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom color="primary">
                Tamamlanan İşler
              </Typography>
              
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
                En son tamamlanan iş en üstte gösterilir
              </Typography>
              
              {loadingTamamlananIsler ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box 
                  sx={{ 
                    flex: 1, 
                    overflow: 'auto',
                    maxHeight: '58vh',
                    '&::-webkit-scrollbar': {
                      width: '8px'
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      borderRadius: '4px'
                    }
                  }}
                >
                  {tamamlananIsler.length === 0 ? (
                    <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                      Tamamlanmış iş kaydı yok
                    </Typography>
                  ) : (
                    <Stack spacing={2} sx={{ p: 1 }}>
                      {tamamlananIsler.map((is) => (
                        <Card 
                          key={is.id} 
                          variant="outlined" 
                          sx={{ 
                            '&:hover': {
                              boxShadow: 2,
                              bgcolor: 'rgba(0, 0, 0, 0.01)'
                            },
                            border: '1px solid #e0e0e0',
                            borderRadius: 1,
                            mb: 1
                          }}
                        >
                          <CardContent sx={{ pb: '8px !important' }}>
                            <Stack spacing={1}>
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="subtitle1" fontWeight="medium">
                                  #{is.is_emri_no}
                                </Typography>
                                <Chip
                                  icon={<CheckCircleIcon fontSize="small" />}
                                  label="Tamamlandı"
                                  color="success"
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>
                              <Typography variant="body1">{is.is_adi}</Typography>
                              
                              {/* Parça kodu ve resmi */}
                              <Box display="flex" alignItems="flex-start" gap={1}>
                                <Box flex={1}>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    <strong>Parça:</strong> {is.parca_kodu || '-'}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>İşlenen Adet:</strong> {is.islenen_adet || 0} / {is.toplam_adet || 0}
                                  </Typography>
                                </Box>
                                
                                {/* Parça resmi */}
                                {is.parca_kodu && (
                                  <Box 
                                    sx={{ 
                                      width: 100, 
                                      height: 100, 
                                      borderRadius: 1, 
                                      overflow: 'hidden',
                                      border: '1px solid #e0e0e0',
                                      cursor: 'pointer',
                                      '&:hover': {
                                        opacity: 0.8
                                      }
                                    }}
                                    onClick={() => {
                                      const parca = tamamlananIslerParca[is.is_emri_id || is.id];
                                      const imgSrc = getFotoPath(parca?.foto_path);
                                      if (imgSrc) {
                                        setSelectedImage(imgSrc);
                                        setModalOpen(true);
                                      }
                                    }}
                                  >
                                    <ImageWithFallback
                                      src={getFotoPath(tamamlananIslerParca[is.is_emri_id || is.id]?.foto_path) || '/no-image.png'}
                                      alt={is.parca_kodu}
                                      sx={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                      }}
                                    />
                                  </Box>
                                )}
                              </Box>
                              
                              <Box display="flex" flexWrap="wrap" gap={1}>
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Bitiş:</strong> {new Date(is.bitis_tarihi).toLocaleString('tr-TR')}
                                </Typography>
                                {is.toplam_sure && (
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Süre:</strong> {is.toplam_sure}
                                  </Typography>
                                )}
                              </Box>
                              {is.notlar && (
                                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                                  Not: {is.notlar}
                                </Typography>
                              )}
                            </Stack>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      {/* İş Özeti Formu (İşi Bitir) */}
      {aktifIs && (
        <IsEmriOzetFormu
          open={ozetFormOpen}
          onClose={handleOzetFormClose}
          isEmriId={aktifIs.is_emri_id || aktifIs.id}
          isEmriNo={aktifIs.is_emri_no}
          isAdi={aktifIs.is_adi}
          tezgahAdi={tezgah?.tezgah_tanimi}
          tezgahId={tezgah?.tezgah_id}
        />
      )}

      {/* İş Emri Düzenle Formu */}
      {isEmriDuzenleDialog && (
        <IsEmriDuzenleForm
          open={isEmriDuzenleDialog}
          onClose={() => {
            setIsEmriDuzenleDialog(false);
            setDuzenlenecekIsEmri(null);
          }}
          initialData={duzenlenecekIsEmri}
          loading={isEmriDialogLoading}
          onSubmit={() => {
            setIsEmriDuzenleDialog(false);
            setDuzenlenecekIsEmri(null);
            fetchAktifIs(); // Refresh data after edit
          }}
        />
      )}

      {/* Parça Düzenle Formu */}
      {parcaDuzenleDialog && (
        <ParcaDuzenleFormu
          open={parcaDuzenleDialog}
          onClose={() => {
            setParcaDuzenleDialog(false);
            setDuzenlenecekParca(null);
          }}
          parca={duzenlenecekParca}
          onUpdateSuccess={() => {
            setParcaDuzenleDialog(false);
            setDuzenlenecekParca(null);
            fetchAktifIs(); // Refresh data after edit
          }}
        />
      )}

      {/* Resim Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            outline: 'none',
            maxWidth: '90vw',
            maxHeight: '90vh',
            bgcolor: 'white',
            borderRadius: 1,
            boxShadow: 24,
            p: 2,
          }}
        >
          <Box sx={{ textAlign: 'right', mb: 1 }}>
            <IconButton onClick={() => setModalOpen(false)}>
              <ClearIcon />
            </IconButton>
          </Box>
          <img
            src={selectedImage}
            alt="Parça Resmi"
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain',
            }}
          />
        </Box>
      </Modal>

      {/* Tezgah Raporu Modal */}
      {tezgah?.tezgah_id && (
        <TezgahRaporuModal
          open={raporOpen}
          onClose={() => setRaporOpen(false)}
          tezgah={tezgah}
          defaultDate={new Date().toISOString().split('T')[0]}
        />
      )}
    </Dialog>
    
    {/* Assign to Other Workstation Dialog */}
    <Dialog
      open={assignDialog.open}
      onClose={handleAssignCancel}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Başka Tezgaha Ata</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Autocomplete
            options={allTezgahlar}
            getOptionLabel={(option) => option.tezgah_tanimi || ''}
            value={selectedTezgah}
            onChange={(event, newValue) => setSelectedTezgah(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Hedef Tezgah"
                placeholder="Tezgah seçin..."
              />
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleAssignCancel}>İptal</Button>
        <Button 
          onClick={handleAssignConfirm} 
          variant="contained"
          disabled={!selectedTezgah}
        >
          Ata
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default TezgahIsleriForm;
