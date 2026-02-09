import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import React, { useState, useEffect } from 'react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Box, Typography, Card, Button, MenuItem, Select, FormControl, InputLabel, IconButton, Divider, CircularProgress, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
// PDF worker ayarı (react-pdf için gereklidir)
// Vite ve react-pdf için worker ayarı (pdfjs-dist)
// Vite ve react-pdf için worker ayarı (pdfjs-dist) - local node_modules üzerinden
import { pdfjs as _pdfjs } from 'react-pdf';
// Vite ile local worker kullanımı için worker dosyasını public klasörüne kopyalayın:
// cp ./node_modules/pdfjs-dist/build/pdf.worker.min.js ./public/pdf.worker.min.js
_pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'; // public klasöründe mjs'den kopyalandı
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { tezgahAPI, tezgahPlanAPI, parcalarAPI, isEmirleriAPI } from '../../services/api';
import { getFotoPath, getTeknikResimPath, isPdfFile } from '../../utils/imageUtils';
import FullScreenImageModal from '../../components/FullScreenImageModal';
import IsEmriDuzenleForm from '../../components/IsEmriDuzenleForm';
import YeniIsSecimiModali from '../../components/YeniIsSecimiModali';
import IsEmriOzetFormu from '../../components/IsEmriOzetFormu';
import ParcaKartiDuzenleForm from '../../components/ParcaKartiDuzenleForm';
import TezgahRaporuModal from '../../components/TezgahRaporuModal';

import axios from 'axios';

// Özel API servisi için axios instance oluştur
const api = axios.create({
  baseURL: '/api'
});

const TezgahlarMobile = () => {


  // Parça Kartı Düzenle modal state
  const [parcaDuzenleDialog, setParcaDuzenleDialog] = useState({ open: false, parca: null });
  
  // Snackbar için basit bir state (isteğe bağlı, kullanıcıya bilgi vermek için)
  // İş Emri Düzenle modal state
  const [editDialog, setEditDialog] = useState({ open: false, isEmri: null });
  const [editLoading, setEditLoading] = useState(false);
  
  // İş Emri Özet Formu state
  const [ozetFormOpen, setOzetFormOpen] = useState(false);
  const [isiBitirLoading, setIsiBitirLoading] = useState(false);
  // Aktif iş emrini düzenle modalını aç
  const handleEditIsEmri = () => {
    if (!aktifIs) return;
    setEditDialog({ open: true, isEmri: aktifIs });
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
      // API'ye iş emri güncellemesi gönder
      await isEmirleriAPI.update(editDialog.isEmri.is_emri_id || editDialog.isEmri.id, formData);
      setSnackbar({ open: true, message: 'İş emri başarıyla güncellendi', severity: 'success' });
      setEditDialog({ open: false, isEmri: null });
      // Aktif işi tekrar çek
      if (selectedTezgah) {
        setLoading(true);
        axios.get(`/api/tezgahlar/${selectedTezgah}`)
          .then(async res => {
            const isler = res.data?.data?.is_emirleri || [];
            const aktif = isler.length > 0 ? isler[0] : null;
            setAktifIs(aktif);
            if (aktif && (aktif.parca_kodu || aktif.parcaKodu)) {
              try {
                const kod = aktif.parca_kodu || aktif.parcaKodu;
                const parcaRes = await parcalarAPI.getAll({ aramaMetni: kod });
                let parcaData = [];
                if (parcaRes.data && parcaRes.data.parcalar && Array.isArray(parcaRes.data.parcalar)) {
                  parcaData = parcaRes.data.parcalar;
                } else if (Array.isArray(parcaRes.data)) {
                  parcaData = parcaRes.data;
                }
                if (parcaData.length > 0) {
                  const matched = parcaData.find(p => p.parcaKodu === kod) || parcaData[0];
                  setAktifIsParca(matched);
                } else {
                  setAktifIsParca(null);
                }
              } catch { setAktifIsParca(null); }
            } else {
              setAktifIsParca(null);
            }
          })
          .catch(() => { setAktifIs(null); setAktifIsParca(null); })
          .finally(() => setLoading(false));
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Güncelleme başarısız: ' + (error.response?.data?.error || error.message), severity: 'error' });
    } finally {
      setEditLoading(false);
    }
  };
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [araVerLoading, setAraVerLoading] = useState(false);
  
  // Yeni İş Seçimi modal state - YENİ MODAL SİSTEMİ
  const [yeniIsModalOpen, setYeniIsModalOpen] = useState(false);
  
  // İş bitirme formunu aç
  const handleIsiBitir = () => {
    if (!aktifIs || !selectedTezgah) return;
    setOzetFormOpen(true);
  };
  
  // İş özet formu kapatma
  const handleOzetFormClose = (isCompleted) => {
    setOzetFormOpen(false);
    
    // Eğer iş başarıyla tamamlandıysa sayfayı yenile
    if (isCompleted) {
      setSnackbar({ open: true, message: 'İş emri başarıyla tamamlandı', severity: 'success' });
      // Aktif işi ve parça bilgisini temizle
      setAktifIs(null);
      setAktifIsParca(null);
      // Planlanan ve tamamlanan işleri tekrar çek
      setLoading(true);
      tezgahPlanAPI.getPlanlananIsler(selectedTezgah)
        .then(async res => {
          const isler = res.data || [];
          setPlanlananIsler(isler);
          const parcaMap = {};
          await Promise.all(isler.map(async (is) => {
            const kod = is.parca_kodu || is.parcaKodu;
            if (kod) {
              try {
                const parcaRes = await parcalarAPI.getAll({ aramaMetni: kod });
                let parcaData = [];
                if (parcaRes.data && parcaRes.data.parcalar && Array.isArray(parcaRes.data.parcalar)) {
                  parcaData = parcaRes.data.parcalar;
                } else if (Array.isArray(parcaRes.data)) {
                  parcaData = parcaRes.data;
                }
                const matched = parcaData.find(p => p.parca_kodu === kod || p.parcaKodu === kod);
                if (matched) {
                  parcaMap[is.is_emri_id || is.id] = matched;
                }
              } catch {}
            }
          }));
          setPlanlananIslerParca(parcaMap);
        })
        .catch(() => { setPlanlananIsler([]); setPlanlananIslerParca({}); });
      axios.get(`/api/tamamlanan-isler/tezgah/${selectedTezgah}`)
        .then(async res => {
          const isler = res.data || [];
          setTamamlananIsler(isler);
          const parcaMap = {};
          await Promise.all(isler.map(async (is) => {
            const kod = is.parca_kodu || is.parcaKodu;
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
                  const matched = parcaData.find(p => p.parcaKodu === kod) || parcaData[0];
                  parcaMap[is.is_emri_id || is.id] = matched;
                }
              } catch {}
            }
          }));
          setTamamlananIslerParca(parcaMap);
        })
        .catch(() => { setTamamlananIsler([]); setTamamlananIslerParca({}); })
        .finally(() => setLoading(false));
    }
  };
  
  // Aktif iş için "İşe Ara Ver" fonksiyonu
  const handleIsAraVer = async () => {
    if (!aktifIs || !selectedTezgah) return;
    setAraVerLoading(true);
    try {
      await tezgahAPI.pauseIsEmri(selectedTezgah);
      setSnackbar({ open: true, message: `İş emri için ara verildi`, severity: 'info' });
      // Aktif işi ve parça bilgisini temizle
      setAktifIs(null);
      setAktifIsParca(null);
      // Planlanan ve tamamlanan işleri tekrar çek
      setLoading(true);
      tezgahPlanAPI.getPlanlananIsler(selectedTezgah)
        .then(async res => {
          const isler = res.data || [];
          setPlanlananIsler(isler);
          const parcaMap = {};
          await Promise.all(isler.map(async (is) => {
            const kod = is.parca_kodu || is.parcaKodu;
            if (kod) {
              try {
                const parcaRes = await parcalarAPI.getAll({ aramaMetni: kod });
                let parcaData = [];
                if (parcaRes.data && parcaRes.data.parcalar && Array.isArray(parcaRes.data.parcalar)) {
                  parcaData = parcaRes.data.parcalar;
                } else if (Array.isArray(parcaRes.data)) {
                  parcaData = parcaRes.data;
                }
                const matched = parcaData.find(p => p.parca_kodu === kod || p.parcaKodu === kod);
                if (matched) {
                  parcaMap[is.is_emri_id || is.id] = matched;
                }
              } catch {}
            }
          }));
          setPlanlananIslerParca(parcaMap);
        })
        .catch(() => { setPlanlananIsler([]); setPlanlananIslerParca({}); });
      axios.get(`/api/tamamlanan-isler/tezgah/${selectedTezgah}`)
        .then(async res => {
          const isler = res.data || [];
          setTamamlananIsler(isler);
          const parcaMap = {};
          await Promise.all(isler.map(async (is) => {
            const kod = is.parca_kodu || is.parcaKodu;
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
                  const matched = parcaData.find(p => p.parcaKodu === kod) || parcaData[0];
                  parcaMap[is.is_emri_id || is.id] = matched;
                }
              } catch {}
            }
          }));
          setTamamlananIslerParca(parcaMap);
        })
        .catch(() => { setTamamlananIsler([]); setTamamlananIslerParca({}); })
        .finally(() => setLoading(false));
    } catch (error) {
      setSnackbar({ open: true, message: 'İşe ara verme işlemi başarısız oldu', severity: 'error' });
    } finally {
      setAraVerLoading(false);
    }
  };
  // Yeni İş Seçimi modalını aç - YENİ MODAL SİSTEMİ
  const handleYeniIsSecimi = () => {
    if (!selectedTezgah) return;
    setYeniIsModalOpen(true);
  };
  
  // Yeni iş seçildi - YENİ MODAL SİSTEMİ
  const handleYeniIsSecildi = async (selectedIsEmri) => {
    if (!selectedTezgah || !selectedIsEmri) return;
    
    try {
      console.log('Yeni iş atanıyor:', selectedIsEmri.is_emri_no);
      
      const isEmriId = selectedIsEmri.is_emri_id || selectedIsEmri.id;
      
      // Seçilen işi planlananlara ekle, eğer zaten ekliyse (409) hatayı yut
      let planlamaHatasi = false;
      try {
        await tezgahPlanAPI.addPlanlananIs(selectedTezgah, isEmriId);
      } catch (err) {
        console.error('Planlama hatası:', err);
        if (err.response && err.response.status === 409) {
          // Zaten planlanmış, devam et
          planlamaHatasi = true;
        } else {
          throw err;
        }
      }

      // Her durumda başlatmayı dene
      await tezgahAPI.startIsEmri(selectedTezgah, isEmriId);

      setSnackbar({
        open: true,
        message: planlamaHatasi
          ? 'İş zaten planlanmıştı, doğrudan başlatıldı'
          : 'Yeni iş başarıyla atandı ve başlatıldı',
        severity: 'success'
      });

      // Modal'ı kapat
      setYeniIsModalOpen(false);

      // Tezgah durumunu güncelle
      fetchCncDurum(selectedTezgah);
      
      // Aktif iş durumunu güncelle
      try {
        const tezgahRes = await axios.get(`/api/tezgahlar/${selectedTezgah}`);
        const isler = tezgahRes.data?.data?.is_emirleri || [];
        const aktif = isler.length > 0 ? isler[0] : null;
        setAktifIs(aktif);
        if (aktif && (aktif.parca_kodu || aktif.parcaKodu)) {
          const kod = aktif.parca_kodu || aktif.parcaKodu;
          const parcaRes = await parcalarAPI.getAll({ aramaMetni: kod });
          let parcaData = [];
          if (parcaRes.data && parcaRes.data.parcalar && Array.isArray(parcaRes.data.parcalar)) {
            parcaData = parcaRes.data.parcalar;
          } else if (Array.isArray(parcaRes.data)) {
            parcaData = parcaRes.data;
          }
          if (parcaData.length > 0) {
            const matched = parcaData.find(p => p.parcaKodu === kod) || parcaData[0];
            setAktifIsParca(matched);
          }
        }
      } catch (error) {
        console.error('Aktif iş güncelleme hatası:', error);
      }
    } catch (error) {
      console.error('Yeni iş atama hatası:', error);
      setSnackbar({
        open: true,
        message: 'İş atama başarısız: ' + (error.response?.data?.error || error.message),
        severity: 'error'
      });
    }
  };
  
  const [tezgahlar, setTezgahlar] = useState([]);
  // İş Ata dialog state
  const [isAtaDialogOpen, setIsAtaDialogOpen] = useState(false);
  const [isAtaLoading, setIsAtaLoading] = useState(false);
  const [isAtaSelectedTezgah, setIsAtaSelectedTezgah] = useState('');
  const [isAtaSelectedIsEmri, setIsAtaSelectedIsEmri] = useState(null);
  // Debug için buton tıklama state'i
  const [isAtaButtonClicked, setIsAtaButtonClicked] = useState(false);
  // İş Ata dialogunu aç
  const handleIsAtaDialogOpen = (isEmri) => {
    setIsAtaButtonClicked(true);
    setSnackbar({ open: true, message: 'Dialog açılıyor', severity: 'info' });
    setIsAtaSelectedIsEmri(isEmri);
    setIsAtaSelectedTezgah('');
    setIsAtaDialogOpen(true);
  };

  // İş Ata dialogunu kapat
  const handleIsAtaDialogClose = () => {
    setIsAtaDialogOpen(false);
    setIsAtaSelectedTezgah('');
    setIsAtaSelectedIsEmri(null);
  };

  // İş emrini seçilen tezgaha ata
  const handleIsAtaOnayla = async () => {
    if (!isAtaSelectedTezgah || !isAtaSelectedIsEmri) return;
    setIsAtaLoading(true);
    try {
      const isEmriId = isAtaSelectedIsEmri.is_emri_id || isAtaSelectedIsEmri.id;
      await tezgahPlanAPI.addPlanlananIs(isAtaSelectedTezgah, isEmriId);
      setSnackbar({ open: true, message: 'İş emri başarıyla tezgaha atandı', severity: 'success' });
      // Planlanan işleri güncelle
      if (selectedTezgah === isAtaSelectedTezgah) {
        // Eğer mevcut ekranda atama yapılan tezgah seçiliyse, listeyi güncelle
        setLoading(true);
        tezgahPlanAPI.getPlanlananIsler(selectedTezgah)
          .then(async res => {
            const isler = res.data || [];
            setPlanlananIsler(isler);
            const parcaMap = {};
            await Promise.all(isler.map(async (is) => {
              const kod = is.parca_kodu || is.parcaKodu;
              if (kod) {
                try {
                  const parcaRes = await parcalarAPI.getAll({ aramaMetni: kod });
                  let parcaData = [];
                  if (parcaRes.data && parcaRes.data.parcalar && Array.isArray(parcaRes.data.parcalar)) {
                    parcaData = parcaRes.data.parcalar;
                  } else if (Array.isArray(parcaRes.data)) {
                    parcaData = parcaRes.data;
                  }
                  const matched = parcaData.find(p => p.parca_kodu === kod || p.parcaKodu === kod);
                  if (matched) {
                    parcaMap[is.is_emri_id || is.id] = matched;
                  }
                } catch {}
              }
            }));
            setPlanlananIslerParca(parcaMap);
          })
          .catch(() => { setPlanlananIsler([]); setPlanlananIslerParca({}); });

      }
      handleIsAtaDialogClose();
    } catch (error) {
      setSnackbar({ open: true, message: 'İş emri atanamadı: ' + (error.response?.data?.error || error.message), severity: 'error' });
    } finally {
      setIsAtaLoading(false);
    }
  };
  const [selectedTezgah, setSelectedTezgah] = useState('');
  const [planlananIsler, setPlanlananIsler] = useState([]);
  const [planlananIslerParca, setPlanlananIslerParca] = useState({});
  const [aktifIs, setAktifIs] = useState(null);
  const [aktifIsParca, setAktifIsParca] = useState(null);
  const [tamamlananIsler, setTamamlananIsler] = useState([]);
  const [tamamlananIslerParca, setTamamlananIslerParca] = useState({});
  const [loading, setLoading] = useState(false);

  // Fullscreen image modal state
  const [fullscreenImg, setFullscreenImg] = useState({ open: false, src: '', alt: '' });
  const [fullscreenTeknikResim, setFullscreenTeknikResim] = useState({ open: false, src: '', alt: '' });
  const [raporOpen, setRaporOpen] = useState(false);

  // Sekme durumu: 0 = Planlanan İşler, 1 = Aktif İş, 2 = Tamamlanan İşler
  const [tabIndex, setTabIndex] = useState(1); // Aktif İş sekmesi öntanımlı

  // CNC Panel Durum Takibi
  const [cncPanelDurum, setCncPanelDurum] = useState({
    durum: null, // true: çalışıyor, false: durdu, null: bilinmiyor
    sonGuncelleme: null,
    baglantiDurumu: 'disconnected' // 'connected', 'disconnected', 'connecting'
  });

  // Çalışma süresi takibi
  const [aktifIsCalismaZamani, setAktifIsCalismaZamani] = useState('0 dakika');

  // CNC Panel durum verilerini almak için fonksiyonlar
  const [cncError, setCncError] = useState(null);

  const fetchCncDurum = async (tezgahId) => {
    if (!tezgahId) return;
    
    console.log('[CNC DURUM] Tezgah ID:', tezgahId);
    
    try {
      setCncError(null);
      // api instance'ını kullan (proxy üzerinden)
      const apiUrl = `/tezgah-durum/tezgah-durum/${tezgahId}?limit=1`;
      console.log('[CNC DURUM] API URL:', apiUrl);
      
      const response = await api.get(apiUrl);
      console.log('[CNC DURUM] API Response:', response.data);
      
      const sonDurum = response.data[0];
      if (sonDurum) {
        console.log('[CNC DURUM] Son durum:', sonDurum);
        setCncPanelDurum({
          durum: sonDurum.durum,
          sonGuncelleme: sonDurum.timestamp,
          baglantiDurumu: 'connected'
        });
      } else {
        console.log('[CNC DURUM] Son durum bulunamadı');
        setCncPanelDurum(prev => ({
          ...prev,
          baglantiDurumu: 'connected'
        }));
      }
    } catch (error) {
      console.error('[CNC DURUM] Hata detayları:', error);
      console.error('[CNC DURUM] Error response:', error.response);
      setCncPanelDurum(prev => ({
        ...prev,
        baglantiDurumu: 'disconnected'
      }));
      setCncError('Veri alınamadı. Backend servisinin çalıştığından emin olun.');
    }
  };

  // Çalışma süresini hesapla (mobil versiyon)
  const fetchAktifIsCalismaZamani = async (tezgahId, isEmriId) => {
    if (!tezgahId || !isEmriId) {
      setAktifIsCalismaZamani('0 dakika');
      return;
    }

    try {
      const response = await api.get(`/tezgah-durum/calisma-suresi/${tezgahId}/${isEmriId}`);
      setAktifIsCalismaZamani(response.data.toplam_calisma_saat || '0 dakika');
    } catch (error) {
      console.error('Çalışma süresi hesaplanırken hata:', error);
      setAktifIsCalismaZamani('0 dakika');
    }
  };

  // Tezgahları çek
  useEffect(() => {
    const fetchTezgahlar = async () => {
      setLoading(true);
      try {
        const res = await tezgahAPI.getAll();
        console.log('[TEZGAHLAR] API Response:', res.data);
        const tezgahlarData = res.data?.data || res.data || [];
        setTezgahlar(tezgahlarData);
        if (tezgahlarData && tezgahlarData.length > 0) {
          console.log('[TEZGAHLAR] İlk tezgah seçiliyor:', tezgahlarData[0].tezgah_id);
          setSelectedTezgah(tezgahlarData[0].tezgah_id);
        }
      } catch (err) {
        console.error('[TEZGAHLAR] Hata:', err);
        setTezgahlar([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTezgahlar();
  }, []);

  // Seçili tezgah değişince ilgili işleri çek
  useEffect(() => {
    if (!selectedTezgah) return;
    
    console.log('[SEÇILI TEZGAH] Seçili tezgah değişti:', selectedTezgah);
    
    setTabIndex(1); // Tezgah değiştiğinde Aktif İş sekmesi öntanımlı açılsın
    setLoading(true);
    
    // CNC Panel durum verilerini çek
    fetchCncDurum(selectedTezgah);
    // Planlanan işler
    tezgahPlanAPI.getPlanlananIsler(selectedTezgah)
      .then(async res => {
        const isler = res.data || [];
        setPlanlananIsler(isler);
        // Parça detaylarını çek
        const parcaMap = {};
        await Promise.all(isler.map(async (is) => {
          const kod = is.parca_kodu || is.parcaKodu;
          console.log('[PLANLANAN İŞLER] APIYE GÖNDERİLEN PARÇA KODU:', kod, 'İŞ:', is);
          if (kod) {
            try {
              const parcaRes = await parcalarAPI.getAll({ aramaMetni: kod });
              let parcaData = [];
              if (parcaRes.data && parcaRes.data.parcalar && Array.isArray(parcaRes.data.parcalar)) {
                parcaData = parcaRes.data.parcalar;
              } else if (Array.isArray(parcaRes.data)) {
                parcaData = parcaRes.data;
              }
              const matched = parcaData.find(p => p.parca_kodu === kod || p.parcaKodu === kod);
              if (matched) {
                parcaMap[is.is_emri_id || is.id] = matched;
              }
            } catch (e) {
              console.error('[PLANLANAN İŞLER] Parça API çağrısı hatası:', e);
            }
          }
        }));
        setPlanlananIslerParca(parcaMap);
      })
      .catch(() => { setPlanlananIsler([]); setPlanlananIslerParca({}); });
    // Aktif iş (ilk iş emri aktif kabul edilir)
    axios.get(`/api/tezgahlar/${selectedTezgah}`)
      .then(async res => {
        const isler = res.data?.data?.is_emirleri || [];
        const aktif = isler.length > 0 ? isler[0] : null;
        setAktifIs(aktif);
        if (aktif && (aktif.parca_kodu || aktif.parcaKodu)) {
          try {
            const kod = aktif.parca_kodu || aktif.parcaKodu;
            const parcaRes = await parcalarAPI.getAll({ aramaMetni: kod });
            let parcaData = [];
            if (parcaRes.data && parcaRes.data.parcalar && Array.isArray(parcaRes.data.parcalar)) {
              parcaData = parcaRes.data.parcalar;
            } else if (Array.isArray(parcaRes.data)) {
              parcaData = parcaRes.data;
            }
            if (parcaData.length > 0) {
              const matched = parcaData.find(p => p.parcaKodu === kod) || parcaData[0];
              setAktifIsParca(matched);
            } else {
              setAktifIsParca(null);
            }
          } catch { setAktifIsParca(null); }
        } else {
          setAktifIsParca(null);
        }
      })
      .catch(() => { setAktifIs(null); setAktifIsParca(null); });
    // Tamamlanan işler
    axios.get(`/api/tamamlanan-isler/tezgah/${selectedTezgah}`)
      .then(async res => {
        const isler = res.data || [];
        setTamamlananIsler(isler);
        const parcaMap = {};
        await Promise.all(isler.map(async (is) => {
          const kod = is.parca_kodu || is.parcaKodu;
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
                const matched = parcaData.find(p => p.parcaKodu === kod) || parcaData[0];
                parcaMap[is.is_emri_id || is.id] = matched;
              }
            } catch {}
          }
        }));
        setTamamlananIslerParca(parcaMap);
      })
      .catch(() => { setTamamlananIsler([]); setTamamlananIslerParca({}); })
      .finally(() => setLoading(false));
  }, [selectedTezgah]);

  // Aktif iş değiştiğinde çalışma süresini hesapla
  useEffect(() => {
    if (aktifIs && selectedTezgah && aktifIs.is_emri_id) {
      fetchAktifIsCalismaZamani(selectedTezgah, aktifIs.is_emri_id);
    } else {
      setAktifIsCalismaZamani('0 dakika');
    }
  }, [aktifIs, selectedTezgah]);

  // Çalışma süresini 5 dakikada bir güncelle (sadece aktif iş varsa)
  useEffect(() => {
    if (!aktifIs || !selectedTezgah || !aktifIs.is_emri_id) return;

    // 5 dakikada bir güncelle
    const interval = setInterval(() => {
      fetchAktifIsCalismaZamani(selectedTezgah, aktifIs.is_emri_id);
    }, 5 * 60 * 1000); // 5 dakika

    return () => clearInterval(interval);
  }, [aktifIs, selectedTezgah]);

  // CNC Panel durum verilerini periyodik olarak güncelle
  useEffect(() => {
    if (!selectedTezgah) return;
    
    // İlk yükleme
    fetchCncDurum(selectedTezgah);
    
    // Sayfa görünürlüğünü kontrol et
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Sayfa tekrar aktif olduğunda hemen güncelle
        fetchCncDurum(selectedTezgah);
      }
    };
    
    // Visibility change event listener ekle
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 30 saniyede bir güncelle (daha az sıklık)
    const interval = setInterval(() => {
      // Sadece sayfa aktifken güncelle
      if (!document.hidden) {
        fetchCncDurum(selectedTezgah);
      }
    }, 30000); // 30 saniye
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedTezgah]);

  // Planlanan iş sırasını değiştir (API ile entegre edilecekse burada yapılmalı)
  const moveUp = (idx) => {
    if (idx === 0) return;
    const newList = [...planlananIsler];
    [newList[idx - 1], newList[idx]] = [newList[idx], newList[idx - 1]];
    setPlanlananIsler(newList);
    // TODO: API'ye yeni sıralamayı gönder
  };
  const moveDown = (idx) => {
    if (idx === planlananIsler.length - 1) return;
    const newList = [...planlananIsler];
    [newList[idx], newList[idx + 1]] = [newList[idx + 1], newList[idx]];
    setPlanlananIsler(newList);
    // TODO: API'ye yeni sıralamayı gönder
  };


  return (
    <Box sx={{ p: 1, pb: 10 }}>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="tezgah-select-label">Tezgah Seç</InputLabel>
        <Select
          labelId="tezgah-select-label"
          value={selectedTezgah}
          label="Tezgah Seç"
          onChange={e => setSelectedTezgah(e.target.value)}
        >
          {tezgahlar.map(tezgah => (
            <MenuItem key={tezgah.tezgah_id} value={tezgah.tezgah_id}>{tezgah.tezgah_tanimi || tezgah.ad || tezgah.tezgah_id}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Tabs
            value={tabIndex}
            onChange={(_, v) => setTabIndex(v)}
            variant="fullWidth"
            sx={{ mb: 2 }}
            centered
          >
            <Tab label="Planlanan İşler" />
            <Tab label="Aktif İş" />
            <Tab label="Tamamlanan İşler" />
          </Tabs>


          {/* Planlanan İşler Sekmesi */}
          {tabIndex === 0 && (
            <Box>
              <Typography variant="subtitle1" align="center" sx={{ fontWeight: 'bold', mb: 1 }}>Planlanan İşler</Typography>
              {planlananIsler.length === 0 && <Typography align="center" color="text.secondary">Planlanan iş yok</Typography>}
              {planlananIsler.map((is, idx) => {
                const parca = planlananIslerParca[is.is_emri_id || is.id];
                const imgSrc = getFotoPath(parca?.foto_path) || '/no-image.png';
                const teknikResimPath = parca?.teknik_resim_path || parca?.teknikResimPath || '';
                const stokAdet = parca?.stokAdeti ?? parca?.stok_adeti ?? '-';
                const kritikStok = parca?.kritikStok ?? parca?.kritik_stok ?? '-';
                return (
                  <Card key={is.is_emri_id || is.id || idx} sx={{ mb: 1, display: 'flex', alignItems: 'center', p: 1, position: 'relative' }}>
                    <Box
                      component="img"
                      src={imgSrc}
                      alt="parca"
                      sx={{ width: 144, height: 144, mr: 1, borderRadius: 2, objectFit: 'contain', cursor: 'pointer', background: '#f5f5f5' }}
                      onClick={() => setFullscreenImg({ open: true, src: imgSrc, alt: is.parca_kodu || is.parcaKodu })}
                      onError={e => { e.target.onerror = null; e.target.src = '/no-image.png'; }}
                    />
                    <Box sx={{ flex: 1, position: 'relative' }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{is.parca_kodu || is.parcaKodu}</Typography>
                      <Typography variant="caption">Stok: {stokAdet} / Kritik: {kritikStok}</Typography><br />
                      <Typography variant="caption">Setup: {is.setup_sayisi ?? is.setupSayisi ?? '-'} | CNC: {is.cnc_suresi ?? is.cncSuresi ?? '-'}</Typography>
                      {/* Teknik resim ikonu ve PDF desteği */}
                      {teknikResimPath && (
                        teknikResimPath.toLowerCase().endsWith('.pdf') ? (
                          <IconButton
                            size="small"
                            sx={{ position: 'absolute', top: 0, right: 0, zIndex: 2 }}
                            onClick={() => setFullscreenTeknikResim({ open: true, src: teknikResimPath, alt: (is.parca_kodu || is.parcaKodu) + ' Teknik Resim', isPdf: true })}
                            aria-label="Teknik Resim (PDF)"
                          >
                            {/* PDF icon */}
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M8 3v4a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
                          </IconButton>
                        ) : (
                          <IconButton
                            size="small"
                            sx={{ position: 'absolute', top: 0, right: 0, zIndex: 2 }}
                            onClick={() => setFullscreenTeknikResim({ open: true, src: teknikResimPath, alt: (is.parca_kodu || is.parcaKodu) + ' Teknik Resim', isPdf: false })}
                            aria-label="Teknik Resim"
                          >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M9 9h6v6H9z"/></svg>
                          </IconButton>
                        )
                      )}
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={() => moveUp(idx)} disabled={idx === 0}><ArrowUpwardIcon /></IconButton>
                      <IconButton size="small" onClick={() => moveDown(idx)} disabled={idx === planlananIsler.length - 1}><ArrowDownwardIcon /></IconButton>
                    </Box>
                  </Card>
                );
              })}
            </Box>
          )}

          {/* İş Ata Dialog: sekmeden bağımsız, Tabs'ın hemen altında */}
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
                  {tezgahlar.map(tezgah => (
                    <MenuItem key={tezgah.tezgah_id} value={tezgah.tezgah_id}>{tezgah.tezgah_tanimi || tezgah.ad || tezgah.tezgah_id}</MenuItem>
                  ))}
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


          {/* Aktif İş Sekmesi */}
          {tabIndex === 1 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle1" align="center" sx={{ fontWeight: 'bold' }}>Aktif İş</Typography>
                {selectedTezgah && (
                  <Button size="small" variant="outlined" onClick={() => setRaporOpen(true)}>Tezgah raporu</Button>
                )}
              </Box>
              {aktifIs ? (
                <Card sx={{ mb: 1, p: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      component="img"
                      src={getFotoPath(aktifIsParca?.foto_path) || '/no-image.png'}
                      alt="parca"
                      sx={{ width: 144, height: 144, mr: 1, borderRadius: 2, objectFit: 'contain', cursor: 'pointer', background: '#f5f5f5' }}
                      onClick={() => setFullscreenImg({ open: true, src: getFotoPath(aktifIsParca?.foto_path) || '/no-image.png', alt: aktifIs.parca_kodu || aktifIs.parcaKodu })}
                      onError={e => { e.target.onerror = null; e.target.src = '/no-image.png'; }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{aktifIs.parca_kodu || aktifIs.parcaKodu}</Typography>
                      {/* Stok ve kritik stok bilgisi aktifIsParca üzerinden gösterilecek */}
                      <Typography variant="caption">
                        Stok: {aktifIsParca?.stokAdeti ?? aktifIsParca?.stok_adeti ?? '-'} / Kritik: {aktifIsParca?.kritikStok ?? aktifIsParca?.kritik_stok ?? '-'}
                      </Typography><br />
                      <Typography variant="caption">Setup: {aktifIs.setup_sayisi ?? aktifIs.setupSayisi ?? '-'} | CNC: {aktifIs.cnc_suresi ?? aktifIs.cncSuresi ?? '-'}</Typography>
                      
                      {/* Teknik Resim Butonu */}
                      <Box sx={{ mt: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          disabled={!aktifIsParca?.teknik_resim_path}
                          onClick={() => {
                            if (aktifIsParca?.teknik_resim_path) {
                              const teknikResimPath = getTeknikResimPath(aktifIsParca.teknik_resim_path);
                              const isPdf = isPdfFile(aktifIsParca.teknik_resim_path);
                              setFullscreenTeknikResim({ 
                                open: true, 
                                src: teknikResimPath, 
                                alt: `${aktifIs.parca_kodu || aktifIs.parcaKodu} - Teknik Resim`,
                                isPdf
                              });
                            }
                          }}
                          sx={{ 
                            fontSize: '0.7rem', 
                            py: 0.5, 
                            px: 1,
                            opacity: aktifIsParca?.teknik_resim_path ? 1 : 0.5
                          }}
                        >
                          Teknik Resim
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="warning"
                      sx={{ mb: 1 }}
                      onClick={handleIsAraVer}
                      disabled={araVerLoading || !aktifIs}
                    >
                      {araVerLoading ? 'Ara Veriliyor...' : 'İşe Ara Ver'}
                    </Button>
                    <Button 
                      variant="contained" 
                      color="success" 
                      sx={{ mb: 1 }} 
                      onClick={handleIsiBitir}
                      disabled={isiBitirLoading || !aktifIs}
                    >
                      {isiBitirLoading ? 'Tamamlanıyor...' : 'İşi Bitir'}
                    </Button>

                    <Button variant="outlined" color="primary" sx={{ mb: 1 }} onClick={handleEditIsEmri}>İş Emrini Düzenle</Button>
                    <Button 
                      variant="outlined" 
                      color="secondary"
                      onClick={() => setParcaDuzenleDialog({ open: true, parca: aktifIsParca })}
                    >
                      Parça Kartını Düzenle
                    </Button>

      {/* Parça Kartı Düzenle Modal */}
      <ParcaKartiDuzenleForm
        open={parcaDuzenleDialog?.open}
        initialData={parcaDuzenleDialog?.parca}
        onClose={() => setParcaDuzenleDialog({ open: false, parca: null })}
        onSubmit={async (formData) => {
          // API güncellemesi
          if (!formData?.parcaKodu) return;
          await parcalarAPI.update(formData.parcaKodu, formData);
          setSnackbar({ open: true, message: 'Parça başarıyla güncellendi', severity: 'success' });
          setParcaDuzenleDialog({ open: false, parca: null });
          // Aktif parça bilgisini güncelle
          setAktifIsParca(formData);
        }}
      />
      {/* İş Emri Düzenle Modal */}
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

      {/* İş Özeti Formu (İşi Bitir) */}
      {aktifIs && (
        <IsEmriOzetFormu
          open={ozetFormOpen}
          onClose={handleOzetFormClose}
          isEmriId={aktifIs.id || aktifIs.is_emri_id}
          isEmriNo={aktifIs.is_emri_no}
          isAdi={aktifIs.is_adi}
          tezgahAdi={tezgahlar.find(t => t.tezgah_id === selectedTezgah)?.tezgah_tanimi}
          tezgahId={selectedTezgah}
        />
      )}
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box>
                    <Typography variant="caption">Atanma Zamanı: {aktifIs.atama_tarihi || aktifIs.atanmaZamani || '-'}</Typography><br />
                    <Typography variant="caption">Toplam Çalışma Süresi: {aktifIsCalismaZamani}</Typography><br />
                    <Typography variant="caption">Setup Sayısı: {aktifIs.setup_sayisi ?? aktifIs.setupSayisi ?? '-'}</Typography>
                  </Box>
                </Card>
              ) : (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography align="center" color="text.secondary" sx={{ mb: 2 }}>Aktif iş yok</Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleYeniIsSecimi}
                    disabled={loading}
                  >
                    Yeni İş Seçimi
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* Tamamlanan İşler Sekmesi */}
          {tabIndex === 2 && (
            <Box>
              <Typography variant="subtitle1" align="center" sx={{ fontWeight: 'bold', mb: 1 }}>Tamamlanan İşler</Typography>
              {tamamlananIsler.length === 0 && <Typography align="center" color="text.secondary">Tamamlanan iş yok</Typography>}
              {tamamlananIsler.map((is, idx) => {
                // Öncelik: tamamlanan_isler tablosundaki değerleri kullan
                // Parça detayları sadece foto_path için kullanılacak
                const parca = tamamlananIslerParca[is.is_emri_id || is.id];
                const imgSrc = getFotoPath(parca?.foto_path) || '/no-image.png';
                // Stok ve kritik_stok tamamlanan_isler tablosunda yok, bu yüzden '-' gösterilecek
                // Setup ve CNC tamamlanan_isler tablosunda yoksa, '-' gösterilecek
                return (
                  <Card key={is.id || is.is_emri_id || idx} sx={{ mb: 1, display: 'flex', alignItems: 'center', p: 1 }}>
                    <Box
                      component="img"
                      src={imgSrc}
                      alt="parca"
                      sx={{ width: 144, height: 144, mr: 1, borderRadius: 2, objectFit: 'contain', cursor: 'pointer', background: '#f5f5f5' }}
                      onClick={() => setFullscreenImg({ open: true, src: imgSrc, alt: is.parca_kodu || is.parcaKodu })}
                      onError={e => { e.target.onerror = null; e.target.src = '/no-image.png'; }}
                    />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{is.parca_kodu || is.parcaKodu}</Typography>
                      <Typography variant="caption">
                        Stok: - / Kritik: -
                      </Typography><br />
                      <Typography variant="caption">
                        Setup: {is.setup_sayisi ?? is.setupSayisi ?? '-'} | CNC: {is.cnc_suresi ?? is.cncSuresi ?? '-'}
                      </Typography><br />
                      {/* Tamamlanan işlere özel ek bilgiler */}
                      <Typography variant="caption">
                        Toplam Adet: {is.toplam_adet ?? '-'} / İşlenen Adet: {is.islenen_adet ?? '-'}
                      </Typography><br />
                      <Typography variant="caption">
                        Başlama: {is.baslama_tarihi ? new Date(is.baslama_tarihi).toLocaleString() : '-'}<br />
                        Bitiş: {is.bitis_tarihi ? new Date(is.bitis_tarihi).toLocaleString() : '-'}
                      </Typography>
                    </Box>
                  </Card>
                );
              })}
            </Box>
          )}
        </>
      )}

      <FullScreenImageModal open={fullscreenImg.open} onClose={() => setFullscreenImg({ open: false, src: '', alt: '' })} src={fullscreenImg.src} alt={fullscreenImg.alt} />

      {/* Teknik Resim Tam Ekran Modal: PDF desteği ile */}
      {fullscreenTeknikResim.open && (
        <Dialog open={fullscreenTeknikResim.open} onClose={() => setFullscreenTeknikResim({ open: false, src: '', alt: '', isPdf: false })} maxWidth="md" fullWidth>
          <DialogTitle>{fullscreenTeknikResim.alt}</DialogTitle>
          <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            {fullscreenTeknikResim.isPdf ? (
              <Box sx={{ width: '100%', height: '70vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Document file={fullscreenTeknikResim.src} loading={<Typography>PDF yükleniyor...</Typography>} error={<Typography>PDF görüntülenemedi.</Typography>}>
                  <Page pageNumber={1} width={window.innerWidth > 600 ? 600 : window.innerWidth - 32} />
                </Document>
              </Box>
            ) : (
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img src={fullscreenTeknikResim.src} alt={fullscreenTeknikResim.alt} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8 }} />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFullscreenTeknikResim({ open: false, src: '', alt: '', isPdf: false })}>Kapat</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Tezgah Raporu Modal (Mobil) */}
      {selectedTezgah && (
        <TezgahRaporuModal
          open={raporOpen}
          onClose={() => setRaporOpen(false)}
          tezgah={tezgahlar.find(t => t.tezgah_id === selectedTezgah) || { tezgah_id: selectedTezgah }}
          defaultDate={new Date().toISOString().split('T')[0]}
        />
      )}

      {/* CNC Panel Durum Kartı */}
      {selectedTezgah && (
        <Card sx={{ mb: 2, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box>
              {cncPanelDurum.sonGuncelleme && (
                <Typography variant="body2" color="text.secondary">
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
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                size="small" 
                variant="outlined"
                onClick={() => fetchCncDurum(selectedTezgah)}
                disabled={cncPanelDurum.baglantiDurumu === 'connecting'}
              >
                🔄 Yenile
              </Button>
            </Box>
          </Box>
          {/* CNC Panel Hata Mesajı */}
          {cncError && (
            <Box sx={{ mt: 2 }}>
              <div style={{ color: 'red', fontWeight: 'bold' }}>Bağlantı Hatası: {cncError}</div>
            </Box>
          )}

        </Card>
      )}

      {/* Global Snackbar göstergesi */}
      {snackbar.open && (
        <Box sx={{ position: 'fixed', bottom: 24, left: 0, right: 0, zIndex: 9999, display: 'flex', justifyContent: 'center' }}>
          <Card sx={{ px: 2, py: 1, bgcolor: snackbar.severity === 'error' ? '#ffebee' : '#e3f2fd', color: snackbar.severity === 'error' ? '#b71c1c' : '#1565c0', minWidth: 200, textAlign: 'center' }}>
            <Typography variant="body2">{snackbar.message}</Typography>
            <Button size="small" onClick={() => setSnackbar({ ...snackbar, open: false })}>Kapat</Button>
          </Card>
        </Box>
      )}

      {/* Yeni İş Seçimi Modalı - YENİ MODAL SİSTEMİ */}
      <YeniIsSecimiModali
        open={yeniIsModalOpen}
        onClose={() => setYeniIsModalOpen(false)}
        onSelectIsEmri={handleYeniIsSecildi}
        tezgahId={selectedTezgah}
      />


    </Box>
  );
};

export default TezgahlarMobile;
