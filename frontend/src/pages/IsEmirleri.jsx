import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { useSelector, useDispatch } from 'react-redux';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import StatusUtils from '../utils/statusUtils';
import {
  Box,
  Paper,
  Typography,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import IsEmriKarti from '../components/IsEmriKarti';
import IsEmriEkleForm from '../components/IsEmriEkleForm';
import IsEmriDuzenleForm from '../components/IsEmriDuzenleForm';
import axios from 'axios';
import { isEmriDurumAPI } from '../services/api';
import {
  fetchIsEmirleri,
  createIsEmri,
  updateIsEmri,
  deleteIsEmri,
  moveIsEmri,
  setIsEmirleri
} from '../store/slices/isEmirleriSlice';
import { fetchUretimPlanlari } from '../store/slices/uretimPlaniSlice';

const IsEmirleri = () => {
  const dispatch = useDispatch();
  const isEmirleriState = useSelector(state => state.isEmirleri.isEmirleri);
  const loading = useSelector(state => state.isEmirleri.loading);
  const error = useSelector(state => state.isEmirleri.error);
  const [isEmriEkleOpen, setIsEmriEkleOpen] = useState(false);
  const [isEmriDuzenleOpen, setIsEmriDuzenleOpen] = useState(false);
  const [selectedIsEmri, setSelectedIsEmri] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [durumlar, setDurumlar] = useState([]);
  const [kolonlar, setKolonlar] = useState([]);
  const [kolonStyles, setKolonStyles] = useState({});
  const [uretimPlanlari, setUretimPlanlari] = useState([]);
  const [secilenUretimPlaniIdler, setSecilenUretimPlaniIdler] = useState([]); // çoklu seçim
  const [planiOlmayanlariGoster, setPlaniOlmayanlariGoster] = useState(false);
  const [isEmirleri, setLocalIsEmirleri] = useState({});
  const [filtrelemeDurum, setFiltrelemeDurum] = useState('');
  const [ozelListeAdi, setOzelListeAdi] = useState('');
  const [aramaMetni, setAramaMetni] = useState(''); // Arama state'i
  const [atanmislariGizle, setAtanmislariGizle] = useState(false);
  const [tamamlananlariGoster, setTamamlananlariGoster] = useState(false);

  // Durumları yükle - Yeni dinamik sistem
  const loadDurumlar = async () => {
    try {
      const aktivDurumlar = await StatusUtils.getSortedDurumlar();
      const kolonStilleri = await StatusUtils.getKolonStyles();
      
      setDurumlar(aktivDurumlar);
      setKolonlar(aktivDurumlar.map(durum => durum.durum_kodu));
      setKolonStyles(kolonStilleri);
      
      return aktivDurumlar;
    } catch (error) {
      console.error('Durumlar yüklenirken hata:', error);
      setSnackbar({
        open: true,
        message: 'Durumlar yüklenirken bir hata oluştu',
        severity: 'error'
      });
      
      // Fallback: API'yi doğrudan çağır
      try {
        const response = await isEmriDurumAPI.getAll();
        const aktivDurumlar = response.data
          .filter(durum => durum.aktif)
          .sort((a, b) => a.sira_no - b.sira_no);
        
        setDurumlar(aktivDurumlar);
        setKolonlar(aktivDurumlar.map(durum => durum.durum_kodu));
        return aktivDurumlar;
      } catch (fallbackError) {
        console.error('Fallback durum yükleme de başarısız:', fallbackError);
        return [];
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Önce durumları yükle
        await loadDurumlar();
        // Sonra iş emirlerini yükle
        await dispatch(fetchIsEmirleri({ showCompleted: tamamlananlariGoster, showAssigned: true })).unwrap();
        await loadUretimPlanlari();
      } catch (error) {
        console.error('İş emirleri yüklenirken hata:', error);
        setSnackbar({
          open: true,
          message: 'İş emirleri yüklenirken bir hata oluştu',
          severity: 'error'
        });
      }
    };
    loadData();
  }, [dispatch, tamamlananlariGoster]);

  useEffect(() => {
    // Global state'teki emirleri local state'e atayalım ve filtreleri uygulayalım
    const applyFilters = (data) => {
      let filteredData = data;

      // Üretim planı filtresi
      if (secilenUretimPlaniIdler.length || planiOlmayanlariGoster) {
        filteredData = Object.fromEntries(
          Object.entries(filteredData).map(([kolon, isEmirleriList]) => [
            kolon,
            isEmirleriList.filter(isEmri => {
              const isPlanMatch = secilenUretimPlaniIdler.length
                ? secilenUretimPlaniIdler.includes(isEmri.uretim_plani_id)
                : false;
              const isNoPlan = planiOlmayanlariGoster && (!isEmri.uretim_plani_id || isEmri.uretim_plani_id === null);
              return isPlanMatch || isNoPlan;
            })
          ])
        );
      }

      // Arama filtresi
      if (aramaMetni.trim()) {
        filteredData = Object.fromEntries(
          Object.entries(filteredData).map(([kolon, isEmirleriList]) => [
            kolon,
            isEmirleriList.filter(aramaFiltresi)
          ])
        );
      }
      
      
      return filteredData;
    };

    // Redux state'i değiştiğinde veya filtreler değiştiğinde local state'i güncelle
    setLocalIsEmirleri(applyFilters(isEmirleriState));

  }, [isEmirleriState, secilenUretimPlaniIdler, planiOlmayanlariGoster, aramaMetni, uretimPlanlari, kolonlar, durumlar]);

  const loadUretimPlanlari = async () => {
    try {
      const response = await dispatch(fetchUretimPlanlari({ ozel_liste_adi: ozelListeAdi })).unwrap();
      setUretimPlanlari(response);
    } catch (error) {
      setUretimPlanlari([]);
    }
  };

  const handleUretimPlaniChange = (e) => {
    const values = e.target.value;
    setSecilenUretimPlaniIdler(values);
    // Local filtre uygulandığından ekstra API çağrısı yok
    const label = values.length ? `Seçili planlar: ${values.join(', ')}` : '';
    setFiltrelemeDurum(label);
  };

  const resetFiltre = async () => {
    setSecilenUretimPlaniIdler([]);
    setPlaniOlmayanlariGoster(false);
    setOzelListeAdi('');
    setAramaMetni(''); // Arama textini de temizle
    setAtanmislariGizle(false);
    setTamamlananlariGoster(false); // Tamamlananları gizle
    await dispatch(fetchIsEmirleri({ showCompleted: false, showAssigned: true })).unwrap();
    setFiltrelemeDurum('');
  };

  const handleAtanmislariGizleToggle = async () => {
    try {
      const yeniDurum = !atanmislariGizle;
      setAtanmislariGizle(yeniDurum);
      
      // API'yi yeni parametre ile çağır
      const params = new URLSearchParams();
      if (!yeniDurum) {
        // Aktif işleri göstermek için showAssigned=true parametresi gönder
        params.append('showAssigned', 'true');
      }
      // yeniDurum true ise (aktif işleri gizle), hiç parametre göndermeyiz çünkü bu varsayılan davranış
      
      const response = await axios.get(`/api/is-emirleri?${params.toString()}`);
      
      // Response'u dispatch etmek yerine local state'i güncelle
      if (response.data && typeof response.data === 'object') {
        setLocalIsEmirleri(response.data);
      }
      
    } catch (error) {
      console.error('Aktif iş emirleri filtresi uygulanırken hata:', error);
      setSnackbar({
        open: true,
        message: 'Filtreleme uygulanırken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  const handleTamamlananlariToggle = async () => {
    const yeniDurum = !tamamlananlariGoster;
    setTamamlananlariGoster(yeniDurum);
    try {
      // API'yi yeni filtre ile çağır
      await dispatch(fetchIsEmirleri({ showCompleted: yeniDurum, showAssigned: true })).unwrap();
    } catch (error) {
      console.error('İş emirleri filtresi uygulanırken hata:', error);
      setSnackbar({
        open: true,
        message: 'Filtre uygulanırken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  const [siparisDialogOpen, setSiparisDialogOpen] = useState(false);
  const [siparisDialogData, setSiparisDialogData] = useState(null);
  const [siparisTarihi, setSiparisTarihi] = useState('');
  const [siparisDokumani, setSiparisDokumani] = useState(null);
  const [malzemeGeldiDialogOpen, setMalzemeGeldiDialogOpen] = useState(false);
  const [malzemeGeldiData, setMalzemeGeldiData] = useState(null);

  const handleDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceKolon = source.droppableId;
    const destKolon = destination.droppableId;
    const sourceIndex = source.index;
    const destIndex = destination.index;

    if (sourceKolon === destKolon && sourceIndex === destIndex) return;

    const tasinanIsEmri = (isEmirleri[sourceKolon] || [])[sourceIndex];

    // Aynı kolon içinde öncelik değişikliği (sıralama)
    if (sourceKolon === destKolon) {
      const yeniKolon = [...(isEmirleri[sourceKolon] || [])];
      yeniKolon.splice(sourceIndex, 1);
      yeniKolon.splice(destIndex, 0, tasinanIsEmri);
      setLocalIsEmirleri({ ...isEmirleri, [sourceKolon]: yeniKolon });
      try {
        await axios.post('/api/is-emirleri/sirala', {
          kolon: sourceKolon,
          idList: yeniKolon.map(e => e.is_emri_id)
        });
      } catch (err) {
        setSnackbar({ open: true, message: 'Sıralama güncellenemedi', severity: 'error' });
      }
      return;
    }

    // Yeni dinamik drag-drop sistemi
    let guncelIsEmri = { ...tasinanIsEmri, durum: destKolon };
    
    try {
      const transitionLogic = await StatusUtils.getDragDropTransitionLogic(sourceKolon, destKolon);
      
      switch (transitionLogic.type) {
        case 'siparis_verme':
          guncelIsEmri.malzemesi_siparis_edilecekmi = true;
          guncelIsEmri.malzeme_siparis_tarihi = new Date().toISOString();
          guncelIsEmri.hareketler = [
            ...(tasinanIsEmri.hareketler || []),
            `${new Date().toLocaleString('tr-TR')} - ${sourceKolon}'den ${destKolon}'a taşındı (${transitionLogic.message})`
          ];
          break;
          
        case 'malzeme_geldi':
          guncelIsEmri.malzemenin_geldigi_tarih = new Date().toISOString();
          guncelIsEmri.hareketler = [
            ...(tasinanIsEmri.hareketler || []),
            `${new Date().toLocaleString('tr-TR')} - ${sourceKolon}'den ${destKolon}'a taşındı (${transitionLogic.message})`
          ];
          break;
          
        default:
          guncelIsEmri.hareketler = [
            ...(tasinanIsEmri.hareketler || []),
            `${new Date().toLocaleString('tr-TR')} - ${sourceKolon}'dan ${destKolon}'a taşındı`
          ];
      }
    } catch (error) {
      console.error('Drag drop transition logic hatası:', error);
      // Fallback: basit hareket kaydı
      guncelIsEmri.hareketler = [
        ...(tasinanIsEmri.hareketler || []),
        `${new Date().toLocaleString('tr-TR')} - ${sourceKolon}'dan ${destKolon}'a taşındı`
      ];
    }

    const yeniKaynakKolonIsEmirleri = [...(isEmirleri[sourceKolon] || [])];
    yeniKaynakKolonIsEmirleri.splice(sourceIndex, 1);
    const yeniHedefKolonIsEmirleri = [...(isEmirleri[destKolon] || [])];
    yeniHedefKolonIsEmirleri.splice(destIndex, 0, guncelIsEmri);
    const yeniIsEmirleri = {
      ...isEmirleri,
      [sourceKolon]: yeniKaynakKolonIsEmirleri,
      [destKolon]: yeniHedefKolonIsEmirleri
    };
    setLocalIsEmirleri(yeniIsEmirleri);
    dispatch(moveIsEmri({
      sourceKolon,
      destKolon,
      yeniKaynakKolonIsEmirleri,
      yeniHedefKolonIsEmirleri
    }));
    await dispatch(updateIsEmri({
      id: guncelIsEmri.is_emri_id,
      isEmri: guncelIsEmri
    }));
  };

  // Sipariş formu onay
  const handleSiparisDialogOnay = async () => {
    if (!siparisTarihi) {
      setSnackbar({ open: true, message: 'Sipariş tarihi zorunlu', severity: 'error' });
      return;
    }
    const { isEmri, destIndex, sourceIndex } = siparisDialogData;
    const guncelIsEmri = {
      ...isEmri,
      durum: 'sparişte', // Yeni sistemde 'sparişte' olarak güncelleniyor
      malzemesi_siparis_edilecekmi: true,
      malzeme_siparis_tarihi: siparisTarihi,
      siparis_dokumani: siparisDokumani,
      hareketler: [
        ...(isEmri.hareketler || []),
        `${new Date().toLocaleString('tr-TR')} - beklemede'den sparişte'ye taşındı (malzeme siparişi verildi)`
      ]
    };
    // Dinamik kolon bulma sistemi
    const beklemedekiKolon = await StatusUtils.assignIsEmriToKolon(
      { durum: 'beklemede' }, 
      Object.keys(isEmirleri)
    ) || 'beklemede';
    
    const siparistedekiKolon = await StatusUtils.assignIsEmriToKolon(
      { durum: 'sparişte' }, 
      Object.keys(isEmirleri)
    ) || 'sparişte';
    
    const yeniKaynak = [...(isEmirleri[beklemedekiKolon] || [])];
    yeniKaynak.splice(sourceIndex, 1);
    const yeniHedef = [...(isEmirleri[siparistedekiKolon] || [])];
    yeniHedef.splice(destIndex, 0, guncelIsEmri);
    setLocalIsEmirleri({ 
      ...isEmirleri, 
      [beklemedekiKolon]: yeniKaynak, 
      [siparistedekiKolon]: yeniHedef 
    });
    await dispatch(updateIsEmri({ id: guncelIsEmri.is_emri_id, isEmri: guncelIsEmri }));
    setSiparisDialogOpen(false);
    setSiparisDialogData(null);
    setSiparisTarihi('');
    setSiparisDokumani(null);
  };

  // Malzeme geldi formu onay
  const handleMalzemeGeldiOnay = async () => {
    const { isEmri, destIndex, sourceIndex } = malzemeGeldiData;
    const guncelIsEmri = {
      ...isEmri,
      durum: 'beklemede',
      malzemenin_geldigi_tarih: new Date().toISOString(),
      hareketler: [
        ...(isEmri.hareketler || []),
        `${new Date().toLocaleString('tr-TR')} - sparişte'den beklemede'ye taşındı (malzeme geldi)`
      ]
    };
    // Dinamik kolon bulma sistemi
    const siparistedekiKolon = await StatusUtils.assignIsEmriToKolon(
      { durum: 'sparişte' }, 
      Object.keys(isEmirleri)
    ) || 'sparişte';
    
    const beklemedekiKolon = await StatusUtils.assignIsEmriToKolon(
      { durum: 'beklemede' }, 
      Object.keys(isEmirleri)
    ) || 'beklemede';
    
    const yeniKaynak = [...(isEmirleri[siparistedekiKolon] || [])];
    yeniKaynak.splice(sourceIndex, 1);
    const yeniHedef = [...(isEmirleri[beklemedekiKolon] || [])];
    yeniHedef.splice(destIndex, 0, guncelIsEmri);
    setLocalIsEmirleri({ 
      ...isEmirleri, 
      [siparistedekiKolon]: yeniKaynak, 
      [beklemedekiKolon]: yeniHedef 
    });
    await dispatch(updateIsEmri({ id: guncelIsEmri.is_emri_id, isEmri: guncelIsEmri }));
    setMalzemeGeldiDialogOpen(false);
    setMalzemeGeldiData(null);
  };
      {/* Siparişe geçiş formu */}
      <Dialog open={siparisDialogOpen} onClose={() => setSiparisDialogOpen(false)}>
        <DialogTitle>Malzeme Siparişi Bilgileri</DialogTitle>
        <DialogContent>
          <TextField
            label="Malzeme Sipariş Tarihi"
            type="date"
            value={siparisTarihi}
            onChange={e => setSiparisTarihi(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            required
            sx={{ my: 2 }}
          />
          <Button
            variant="outlined"
            component="label"
            fullWidth
          >
            Sipariş Dokümanı Yükle
            <input
              type="file"
              hidden
              onChange={e => setSiparisDokumani(e.target.files[0])}
              accept="application/pdf,image/*"
            />
          </Button>
          {siparisDokumani && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Yüklendi: {siparisDokumani.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSiparisDialogOpen(false)}>İptal</Button>
          <Button onClick={handleSiparisDialogOnay} variant="contained">Onayla</Button>
        </DialogActions>
      </Dialog>

      {/* Malzeme geldi formu */}
      <Dialog open={malzemeGeldiDialogOpen} onClose={() => setMalzemeGeldiDialogOpen(false)}>
        <DialogTitle>Malzeme Geldi Onayı</DialogTitle>
        <DialogContent>
          <Typography>Malzemenin geldiği tarih otomatik olarak kaydedilecektir. Onaylıyor musunuz?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMalzemeGeldiDialogOpen(false)}>İptal</Button>
          <Button onClick={handleMalzemeGeldiOnay} variant="contained">Onayla</Button>
        </DialogActions>
      </Dialog>

  const handleIsEmriEkle = async (yeniIsEmri) => {
    try {
      const isEmriData = {
        is_adi: yeniIsEmri.isAdi,
        plan_liste_no: yeniIsEmri.planListeNo,
        adet: parseInt(yeniIsEmri.adet),
        malzeme: yeniIsEmri.malzeme,
        teslim_tarihi: yeniIsEmri.teslimTarihi,
        oncelik: yeniIsEmri.oncelik,
        durum: 'beklemede',
        aciklama: yeniIsEmri.aciklama || '',
        uretim_plani_id: yeniIsEmri.uretim_plani_id || null,
        parca_kodu: yeniIsEmri.parca_kodu || null,
        setup_sayisi: yeniIsEmri.setup_sayisi || 0,
        cnc_suresi: yeniIsEmri.cnc_suresi || 0
      };

      await dispatch(createIsEmri(isEmriData)).unwrap();
      setIsEmriEkleOpen(false);
      setSnackbar({
        open: true,
        message: 'İş emri başarıyla oluşturuldu',
        severity: 'success'
      });
      
      // Eğer filtre aktifse ve yeni iş emri filtre koşullarını karşılıyorsa
      if (secilenUretimPlaniIdler.length && secilenUretimPlaniIdler.includes(isEmriData.uretim_plani_id)) {
        await handleUretimPlaniChange({ target: { value: secilenUretimPlaniIdler } });
      } else if (!secilenUretimPlaniIdler.length && !atanmislariGizle) {
        await dispatch(fetchIsEmirleri({ showAssigned: true })).unwrap();
      } else if (atanmislariGizle) {
        // Atanmışları gizle filtresi aktifse, yeniden uygula
        await handleAtanmislariGizleToggle();
      }
    } catch (error) {
      console.error('İş emri oluşturma hatası:', error);
      setSnackbar({
        open: true,
        message: 'İş emri oluşturulurken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  const handleIsEmriDuzenle = (isEmri) => {
    // Seçilen iş emrini state'e kaydet ve düzenleme formunu aç
    setSelectedIsEmri(isEmri);
    setIsEmriDuzenleOpen(true);
  };
  
  // Form gönderildiğinde çalışacak fonksiyon
  const handleIsEmriDuzenleSubmit = async (updatedIsEmri) => {
    try {
      await dispatch(updateIsEmri({
        id: updatedIsEmri.is_emri_id,
        isEmri: updatedIsEmri
      })).unwrap();
      
      setSnackbar({
        open: true,
        message: 'İş emri başarıyla güncellendi',
        severity: 'success'
      });

      // Formu kapat
      setIsEmriDuzenleOpen(false);

      // Eğer filtre aktifse ve güncellenmiş iş emri filtre koşullarını karşılıyorsa
      if (secilenUretimPlaniIdler.length) {
        await handleUretimPlaniChange({ target: { value: secilenUretimPlaniIdler } });
      } else if (atanmislariGizle) {
        // Atanmışları gizle filtresi aktifse, yeniden uygula
        await handleAtanmislariGizleToggle();
      } else {
        await dispatch(fetchIsEmirleri({ showAssigned: true })).unwrap();
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'İş emri güncellenirken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  const handleIsEmriSil = async (id) => {
    try {
      await dispatch(deleteIsEmri(id)).unwrap();
      setSnackbar({
        open: true,
        message: 'İş emri başarıyla silindi',
        severity: 'success'
      });

      // Eğer filtre aktifse, filtreli listeyi güncelle
      if (secilenUretimPlaniIdler.length) {
        await handleUretimPlaniChange({ target: { value: secilenUretimPlaniIdler } });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'İş emri silinirken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  const kolona_gore_renk = (kolon) => {
    // Dinamik stil sistemi
    if (kolonStyles[kolon]) {
      return kolonStyles[kolon];
    }
    
    // Fallback: Durum listesinden ara
    const durum = durumlar.find(d => d.durum_kodu === kolon);
    if (durum) {
      const baseColor = durum.renk_kodu;
      return { 
        bgcolor: `${baseColor}20`, // %20 opacity ile hafif arka plan
        color: baseColor,
        borderLeft: `4px solid ${baseColor}`
      };
    }
    
    return { bgcolor: 'background.paper', color: 'text.primary' };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Arama fonksiyonu - iş emri no, iş adı, parça kodu ve plan listesi no'ya göre arama
  const aramaFiltresi = (isEmri) => {
    if (!aramaMetni.trim()) return true;
    
    const arananMetin = aramaMetni.toLowerCase().trim();
    const aramaAlanlari = [
      isEmri.is_emri_no,
      isEmri.is_adi,
      isEmri.parca_kodu,
      isEmri.plan_liste_no,
      isEmri.parca?.parca_kodu,
      isEmri.parca?.parca_adi
    ];
    
    const sonuc = aramaAlanlari.some(alan => 
      alan && alan.toString().toLowerCase().includes(arananMetin)
    );
    
    // Debug için - sadece geliştirme sırasında
    if (aramaMetni && sonuc) {
      console.log('Arama eşleşmesi:', {
        aramaMetni,
        isEmri: isEmri.is_emri_no,
        isAdi: isEmri.is_adi,
        parcaKodu: isEmri.parca_kodu
      });
    }
    
    return sonuc;
  };

  // renderIsEmirleri artık doğrudan isEmirleri local state'i olacak
  // Bu kısım kaldırıldı

  return (
    <Box sx={{ 
      height: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box 
        sx={{ 
          p: 2,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 2,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Typography variant="h4">İş Emirleri</Typography>
        
        <Grid container spacing={2} alignItems="center" sx={{ flexGrow: 1, maxWidth: { xs: '100%', md: '80%' } }}>
          <Grid item xs={12} md={3}>
            <TextField
              label="Arama (İş No, İş Adı, Parça Kodu)"
              variant="outlined"
              fullWidth
              size="small"
              value={aramaMetni}
              onChange={(e) => setAramaMetni(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
                endAdornment: aramaMetni && (
                  <IconButton
                    size="small"
                    onClick={() => setAramaMetni('')}
                    edge="end"
                  >
                    <ClearIcon />
                  </IconButton>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Üretim Planına Göre Filtrele</InputLabel>
              <Select
                multiple
                value={secilenUretimPlaniIdler}
                onChange={handleUretimPlaniChange}
                label="Üretim Planına Göre Filtrele"
              >
                <MenuItem value={"__NOPLAN__"} disabled>
                  <em>Plan seçiniz (çoklu)</em>
                </MenuItem>
                {uretimPlanlari.map((plan) => (
                  <MenuItem key={plan.id} value={plan.id}>
                    {plan.ozel_liste_adi ? 
                      `${plan.ozel_liste_adi} (Plan #${plan.id})` : 
                      plan.makina?.name ? 
                        `${plan.makina.name} - Miktar: ${plan.miktar} (Plan #${plan.id})` : 
                        `Plan #${plan.id} - Miktar: ${plan.miktar}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={planiOlmayanlariGoster}
                  onChange={(_, checked) => setPlaniOlmayanlariGoster(checked)}
                  name="planiOlmayanlariGoster"
                  color="primary"
                />
              }
              label="Planı olmayanları göster"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Özel Liste Adı ile Filtrele"
              variant="outlined"
              fullWidth
              size="small"
              value={ozelListeAdi}
              onChange={e => setOzelListeAdi(e.target.value)}
            />
          </Grid>
          <Grid item>
            {(secilenUretimPlaniIdler.length || ozelListeAdi || aramaMetni) && (
              <Tooltip title="Tüm Filtreleri Temizle">
                <IconButton onClick={resetFiltre} color="primary" size="small">
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            )}
          </Grid>
          <Grid item>
            <FormControlLabel
              control={
                <Checkbox
                  checked={atanmislariGizle}
                  onChange={handleAtanmislariGizleToggle}
                  name="atanmislariGizle"
                  color="primary"
                />
              }
              label="Aktif İşleri Gizle"
            />
             <FormControlLabel
              control={
                <Checkbox
                  checked={tamamlananlariGoster}
                  onChange={handleTamamlananlariToggle}
                  name="tamamlananlariGoster"
                  color="secondary"
                />
              }
              label="Tamamlananları Göster"
            />
          </Grid>
        </Grid>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsEmriEkleOpen(true)}
        >
          Yeni İş Emri
        </Button>
      </Box>

      {filtrelemeDurum && (
        <Alert severity="info" sx={{ m: 2 }}>
          {filtrelemeDurum}
        </Alert>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Box
          sx={{
            display: 'flex',
            flex: 1,
            gap: 2,
            p: 2,
            overflow: 'auto',
            minWidth: 'fit-content'
          }}
        >
          {kolonlar.map((kolon) => (
            <Box
              key={kolon}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                minWidth: { xs: 280, sm: 300, md: 320 },
                maxWidth: { xs: 280, sm: 300, md: 320 },
                flex: '0 0 auto'
              }}
            >
              <Paper
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  p: 1,
                  ...kolona_gore_renk(kolon)
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ p: 1, textAlign: 'center', borderBottom: 1, borderColor: 'divider' }}>
                  {durumlar.find(d => d.durum_kodu === kolon)?.durum_adi || kolon}
                   {isEmirleri[kolon]?.length ? ` (${isEmirleri[kolon].length})` : ''}
                 </Typography>
                 <Droppable droppableId={kolon}>
                   {(provided) => (
                     <div
                       ref={provided.innerRef}
                       {...provided.droppableProps}
                       style={{
                         flex: 1,
                         minHeight: '100px',
                         overflow: 'auto'
                       }}
                     >
                       {isEmirleri[kolon]?.length ?
                         isEmirleri[kolon].map((isEmri, index) => (
                           <IsEmriKarti
                             key={isEmri.is_emri_id}
                             isEmri={isEmri}
                             index={index}
                             onEdit={handleIsEmriDuzenle}
                             onDelete={handleIsEmriSil}
                           />
                         )) :
                         <Typography variant="body2" sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                           İş emri bulunmamaktadır
                         </Typography>
                       }
                       {provided.placeholder}
                     </div>
                   )}
                 </Droppable>
               </Paper>
             </Box>
           ))}
         </Box>
      </DragDropContext>

          <IsEmriEkleForm
            open={isEmriEkleOpen}
            onClose={() => setIsEmriEkleOpen(false)}
            onSubmit={handleIsEmriEkle}
            preSelectedUretimPlaniId={secilenUretimPlaniIdler[0] || null}
          />
          
          {/* İş Emri Düzenleme Formu */}
          <IsEmriDuzenleForm
            open={isEmriDuzenleOpen}
            onClose={() => setIsEmriDuzenleOpen(false)}
            onSubmit={handleIsEmriDuzenleSubmit}
            initialData={selectedIsEmri}
          />
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default IsEmirleri;