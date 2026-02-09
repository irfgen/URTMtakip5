import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  IconButton,
  FormControlLabel,
  Switch,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Badge,
  InputAdornment,
  Button,
  TextField,
  CircularProgress,
  Pagination,
  Stack,
  Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import WarningIcon from '@mui/icons-material/Warning';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import axios from 'axios';
import ImageWithFallback from '../components/ImageWithFallback';
import ParcaDuzenleFormu from '../components/ParcaDuzenleFormu';
import StokKartiSecici from '../components/StokKartiSecici';
import TeknikResimCameraModal from '../components/TeknikResimCameraModal';
import ParcaTakipListeleriYonetModal from '../components/ParcaTakipListeleri/ParcaTakipListeleriYonetModal';
import ParcaTakipListesiModal from '../components/ParcaTakipListeleri/ParcaTakipListesiModal';
import ParcaTakipSecimModal from '../components/ParcaTakipListeleri/ParcaTakipSecimModal';
import parcaTakipListeleriService from '../services/parcaTakipListeleriService';

function Parcalar() {
  const navigate = useNavigate();
  const [parcalar, setParcalar] = useState([]);
  const [aramaMetni, setAramaMetni] = useState('');
  const [imalMiFiltre, setImalMiFiltre] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [secilenParca, setSecilenParca] = useState(null);
  const [parcaDuzenleFormOpen, setParcaDuzenleFormOpen] = useState(false);
  
  // Sayfalama state'leri
  const [sayfa, setSayfa] = useState(1);
  const [sayfaBasi] = useState(30);
  const [toplam, setToplam] = useState(0);
  const [sayfaSayisi, setSayfaSayisi] = useState(0);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [yeniParca, setYeniParca] = useState({
    parcaKodu: '',
    parcaAdi: '',
    stokAdeti: 0,
    kritik_stok: 0,
    tedarikBedeli: 0,
    imalMi: false,
    stok_karti_id: null,
    fasonMaliyeti: 0,
    sirketIciMaliyeti: 0,
    teknik_resim_path: '',
    foto_path: '',
    setupSayisi: 0,
    cncIslemeSuresi: 0,
    siyah: false
  });
  
  // Stok kartı secimi için state'ler
  const [yeniParcaStokKartiSeciciOpen, setYeniParcaStokKartiSeciciOpen] = useState(false);
  const [yeniParcaSecilenStokKarti, setYeniParcaSecilenStokKarti] = useState(null);

  // Teknik resim kamera modal için state
  const [teknikResimModalOpen, setTeknikResimModalOpen] = useState(false);

  // Parça Takip Listeleri durumları
  const [parcaTakipListeleri, setParcaTakipListeleri] = useState([]);
  const [seciliParcaTakipListesiId, setSeciliParcaTakipListesiId] = useState('');
  const [parcaYonetModalOpen, setParcaYonetModalOpen] = useState(false);
  const [yeniParcaListeModalOpen, setYeniParcaListeModalOpen] = useState(false);
  const [takipSecimModal, setTakipSecimModal] = useState({ open: false, mode: 'add', parcaKodu: '' });

  // Makina filtresi - YENİ
  const [makinalar, setMakinalar] = useState([]);
  const [seciliMakinaId, setSeciliMakinaId] = useState('');

  // Sayfa değiştirme fonksiyonu
  const handleSayfaChange = (event, yeniSayfa) => {
    setSayfa(yeniSayfa);
  };

  const parcalariGetir = async () => {
    try {
      setYukleniyor(true);
      const params = new URLSearchParams();
      params.append('page', sayfa);
      params.append('limit', sayfaBasi);
      params.append('includeStokKarti', 'true'); // Stok kartı bilgilerini dahil et
      if (aramaMetni) params.append('aramaMetni', aramaMetni);
      if (imalMiFiltre !== false) params.append('imalMi', imalMiFiltre);
      if (seciliParcaTakipListesiId) params.append('parca_takip_listesi_id', seciliParcaTakipListesiId);
      if (seciliMakinaId) params.append('makina_id', seciliMakinaId); // YENİ
      const response = await axios.get(`/api/parcalar?${params}`);
      // API returns paginated data in the format {parcalar: Array, toplam, sayfa, sayfaBasi, sayfaSayisi}
      if (response.data && response.data.parcalar && Array.isArray(response.data.parcalar)) {
        setParcalar(response.data.parcalar);
        setToplam(response.data.toplam || 0);
        setSayfaSayisi(response.data.sayfaSayisi || 0);
      } else if (Array.isArray(response.data)) {
        // Handle case where API might return direct array
        setParcalar(response.data);
        setToplam(response.data.length);
        setSayfaSayisi(1);
      } else {
        console.error('API response does not contain parcalar array:', response.data);
        setParcalar([]);
        setToplam(0);
        setSayfaSayisi(0);
      }
    } catch (error) {
      console.error('Parçalar getirilirken hata oluştu:', error);
      setParcalar([]);
      setToplam(0);
      setSayfaSayisi(0);
    } finally {
      setYukleniyor(false);
    }
  };

  useEffect(() => {
    parcalariGetir();
  }, [sayfa, aramaMetni, imalMiFiltre, seciliParcaTakipListesiId, seciliMakinaId]);

  // Parça takip listelerini yükle
  useEffect(() => {
    (async () => {
      try {
        const lists = await parcaTakipListeleriService.list();
        setParcaTakipListeleri(lists || []);
      } catch (e) {
        console.error('Parça takip listeleri yükleme hatası:', e);
      }
    })();
  }, []);

  // Makinaları yükle - YENİ
  useEffect(() => {
    (async () => {
      try {
        const response = await axios.get('/api/makinalar');
        setMakinalar(response.data.data || response.data || []);
      } catch (e) {
        console.error('Makinalar yükleme hatası:', e);
      }
    })();
  }, []);

  // Parça güncellemelerini dinle
  useEffect(() => {
    const handleParcaUpdate = (event) => {
      console.log('Parça güncellendi, verileri yeniden yükleniyor:', event.detail);
      parcalariGetir();
    };

    const handleStokKartiUpdate = (event) => {
      console.log('Stok kartı güncellendi, parça verilerini yeniden yükleniyor:', event.detail);
      parcalariGetir();
    };

    window.addEventListener('parcaUpdated', handleParcaUpdate);
    window.addEventListener('stokKartiUpdated', handleStokKartiUpdate);

    return () => {
      window.removeEventListener('parcaUpdated', handleParcaUpdate);
      window.removeEventListener('stokKartiUpdated', handleStokKartiUpdate);
    };
  }, [sayfa, aramaMetni, imalMiFiltre]);

  // Arama metni değiştiğinde sayfayı 1'e resetle
  useEffect(() => {
    if (sayfa !== 1) {
      setSayfa(1);
    }
  }, [aramaMetni, imalMiFiltre, seciliParcaTakipListesiId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Sadece yeni parça ekleme
      await axios.post('/api/parcalar', yeniParca);
      setDialogOpen(false);
      parcalariGetir();
      setYeniParca({
        parcaKodu: '',
        parcaAdi: '',
        stokAdeti: 0,
        kritik_stok: 0,
        tedarikBedeli: 0,
        imalMi: false,
        stok_karti_id: null,
        fasonMaliyeti: 0,
        sirketIciMaliyeti: 0,
        teknik_resim_path: '',
        foto_path: '',
        setupSayisi: 0,
        cncIslemeSuresi: 0,
        siyah: false
      });
      setYeniParcaSecilenStokKarti(null);
    } catch (error) {
      console.error('Parça kaydedilirken hata oluştu:', error);
      if (error.response && error.response.data && error.response.data.error) {
        alert(error.response.data.error);
      } else {
        alert('Parça kaydedilirken hata oluştu!');
      }
    }
  };

  // Yeni parça için stok kartı seçme fonksiyonları
  const handleYeniParcaStokKartiSec = (stokKarti) => {
    setYeniParcaSecilenStokKarti(stokKarti);
    setYeniParca(prev => ({
      ...prev,
      stok_karti_id: stokKarti.id
    }));
    setYeniParcaStokKartiSeciciOpen(false);
  };

  const handleYeniParcaStokKartiBaglantiKaldir = () => {
    setYeniParcaSecilenStokKarti(null);
    setYeniParca(prev => ({
      ...prev,
      stok_karti_id: null
    }));
  };

  // Teknik resim modal callback'leri
  const handlePartFound = (partData) => {
    console.log('Parça bulundu:', partData);
    // Modal zaten navigate edecek, ek işlem gerekmiyor
  };

  const handlePartCreate = (formData, imageData) => {
    console.log('Yeni parça oluşturuluyor:', formData);
    
    // Form verilerini yeni parça state'ine aktar
    setYeniParca({
      parcaKodu: formData.parcaKodu || '',
      parcaAdi: formData.parcaAdi || '',
      hamMalzemeCinsi: formData.malzemeCinsi || '',
      hamMalzemeOlculeri: formData.hamMalzemeOlculeri || '',
      stokAdeti: 0,
      kritik_stok: 0,
      tedarikBedeli: 0,
      imalMi: true, // Teknik resimden gelen parçalar genellikle imal edilir
      stok_karti_id: null,
      fasonMaliyeti: 0,
      sirketIciMaliyeti: 0,
      teknik_resim_path: '',
      foto_path: '',
      setupSayisi: 0,
      cncIslemeSuresi: 0,
      siyah: false
    });
    
    // Yeni parça dialog'unu aç
    setDialogOpen(true);
  };

  const handleDelete = async (parcaKodu) => {
    if (window.confirm('Bu parçayı silmek istediğinizden emin misiniz?')) {
      try {
        // Parça kodunu normalize et (tüm boşluk ve tab karakterlerini tek boşluğa çevirip trimle)
        const temizParcaKodu = parcaKodu.replace(/\s+/g, ' ').trim();
        await axios.delete(`/api/parcalar/${encodeURIComponent(temizParcaKodu)}`);
        parcalariGetir();
      } catch (error) {
        console.error('Parça silinirken hata oluştu:', error);
        
        // Referans hatası durumunda
        if (error.response && error.response.data && error.response.data.referanslar) {
          const referanslar = error.response.data.referanslar;
          const toplamReferans = referanslar.toplam;
          
          const detaylar = [
            referanslar.isEmirleri > 0 ? `${referanslar.isEmirleri} iş emri` : null,
            referanslar.fasonIsEmirleri > 0 ? `${referanslar.fasonIsEmirleri} fason iş emri` : null,
            referanslar.fasonTeklifler > 0 ? `${referanslar.fasonTeklifler} fason teklif` : null,
            referanslar.grupParcalar > 0 ? `${referanslar.grupParcalar} grup ilişkisi` : null
          ].filter(Boolean).join(', ');
          
          const message = `Bu parça ${toplamReferans} yerde kullanılıyor (${detaylar}).\nYine de bu parçayı ve ilişkili tüm kayıtları silmek istiyor musunuz?`;
          
          if (window.confirm(message)) {
            try {
              // Force delete request
              await axios.delete(`/api/parcalar/${parcaKodu}?force=true`);
              alert('Parça ve ilişkili kayıtlar başarıyla silindi');
              parcalariGetir();
            } catch (forceError) {
              console.error('Force silme hatası:', forceError);
              let errorMsg = 'Parça silinirken hata oluştu!';
              if (forceError.response && forceError.response.data && forceError.response.data.error) {
                errorMsg = forceError.response.data.error;
              }
              alert(errorMsg);
            }
          }
        } else {
          // Standart hata mesajı göster
          let msg = 'Parça silinirken hata oluştu!';
          if (error.response && error.response.data && error.response.data.error) {
            msg = error.response.data.error;
          }
          alert(msg);
        }
      }
    }
  };

  const handleEdit = (parca) => {
    setSecilenParca(parca);
    setParcaDuzenleFormOpen(true);
  };

  // Parça düzenleme formu için submit handler
  const handleParcaGuncellendi = (guncellenenParca) => {
    // Güncellenmiş parçayı listemize entegre edelim
    setParcalar(prev => 
      prev.map(parca => 
        parca.parcaKodu === guncellenenParca.parcaKodu ? guncellenenParca : parca
      )
    );
    setParcaDuzenleFormOpen(false);
    setSecilenParca(null);
  };

  // Parça detayına git handler
  const handleParcaDetayinaGit = (parca) => {
    navigate(`/parcalar/${encodeURIComponent(parca.parcaKodu)}`);
  };

  // İş emri ekleme başarılı olduğunda

  // Yeni bir input ref oluştur
  const teknikResimInputRef = React.useRef(null);
  const fotoInputRef = React.useRef(null);
  
  // Dosya yükleme fonksiyonu
  const handleFileSelect = async (inputRef, fieldName) => {
    const input = document.createElement('input');
    input.type = 'file';
    if (fieldName === 'teknik_resim_path') {
      input.accept = '.pdf,.dwg,.dxf';
    } else if (fieldName === 'foto_path') {
      input.accept = 'image/*';
    }
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const formData = new FormData();
        // Parça kodunu mutlaka ekle
        formData.append('parcaKodu', yeniParca.parcaKodu);
        if (fieldName === 'teknik_resim_path') {
          formData.append('teknik', file);
        } else if (fieldName === 'foto_path') {
          formData.append('foto', file);
        }
        try {
          const response = await axios.post('/api/upload/parca', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setYeniParca(prev => ({
            ...prev,
            [fieldName]: response.data[fieldName]
          }));
        } catch (err) {
          alert('Dosya yüklenemedi!');
        }
      }
    };
    input.click();
  };

  // Yardımcı fonksiyonlar
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
  
  // Handle modal open/close
  const handleOpenModal = (imagePath) => {
    setSelectedImage(imagePath);
    setModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedImage(null);
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Parçalar & Stok</Typography>
        <Box display="flex" gap={2}>
          <Button 
            variant="outlined"
            onClick={() => setParcaYonetModalOpen(true)}
          >
            Takip listelerini yönet
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setYeniParcaListeModalOpen(true)}
          >
            Yeni Parça Takip Listesi
          </Button>
          <Button 
            variant="outlined"
            color="primary"
            startIcon={<CameraAltIcon />}
            onClick={() => setTeknikResimModalOpen(true)}
          >
            Teknik Resim Çek
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setYeniParca({
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
              });
              setDialogOpen(true);
            }}
          >
            Yeni Parça Ekle
          </Button>
        </Box>
      </Box>

      <Box mb={3} display="flex" gap={2}>
        <TextField
          label="Parça Kodu Ara"
          value={aramaMetni}
          onChange={(e) => setAramaMetni(e.target.value)}
        />
        <FormControlLabel
          control={
            <Switch
              checked={imalMiFiltre === true}
              onChange={(e) => setImalMiFiltre(e.target.checked)}
            />
          }
          label="Sadece İmal Edilenler"
        />
        {/* Parça Takip Listesi Filtresi */}
        <FormControl sx={{ minWidth: 260 }}>
          <InputLabel>Seçili Parça Takip Listesi</InputLabel>
          <Select
            value={seciliParcaTakipListesiId}
            label="Seçili Parça Takip Listesi"
            onChange={(e) => setSeciliParcaTakipListesiId(e.target.value)}
          >
            <MenuItem value="">(Yok)</MenuItem>
            {parcaTakipListeleri.map(l => (
              <MenuItem key={l.id} value={l.id}>{l.ad}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Makinaya Göre Listele - YENİ */}
        <FormControl sx={{ minWidth: 260 }}>
          <InputLabel>Makinaya Göre Listele</InputLabel>
          <Select
            value={seciliMakinaId}
            label="Makinaya Göre Listele"
            onChange={(e) => setSeciliMakinaId(e.target.value)}
          >
            <MenuItem value="">(Tümü)</MenuItem>
            {makinalar.map(m => (
              <MenuItem key={m.makina_id} value={m.makina_id}>{m.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Parça Sayısı Bilgisi */}
      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" color="textSecondary">
          {toplam > 0 ? `Toplam ${toplam} parça` : 'Parça bulunamadı'}
          {sayfaSayisi > 1 && ` (${sayfaSayisi} sayfa)`}
        </Typography>
        {yukleniyor && <CircularProgress size={20} />}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Dosyalar</TableCell>
              <TableCell>Parça Kodu</TableCell>
              <TableCell>Stok Durumu</TableCell>
              <TableCell>İmal/Tedarik</TableCell>
              <TableCell>Tedarik Bedeli</TableCell>
              <TableCell>Ham Malzeme Stok Kartı</TableCell>
              <TableCell>Fason Maliyeti</TableCell>
              <TableCell>Şirket İçi Maliyet</TableCell>
              <TableCell>Setup Sayısı</TableCell>
              <TableCell>CNC İşleme Süresi (dk)</TableCell>
              <TableCell>Siyah</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(parcalar) ? parcalar.map((parca) => (
              <TableRow 
                key={parca.parcaKodu}
                sx={parca.stokAdeti <= parca.kritik_stok ? { backgroundColor: 'rgba(255, 0, 0, 0.1)' } : {}}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {parca.foto_path && (
                      <Tooltip 
                        title={
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            bgcolor: 'white',
                            p: 1,
                            borderRadius: 1,
                            maxWidth: '800px',
                            maxHeight: '800px'
                          }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1 }}>
                              {parca.parcaKodu}
                            </Typography>
                            <Box 
                              sx={{ 
                                position: 'relative',
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                              }}
                            >
                              <CircularProgress 
                                size={24} 
                                sx={{ 
                                  position: 'absolute',
                                  color: 'primary.light'
                                }}
                              />
                              <ImageWithFallback 
                                src={getFotoPath(parca.foto_path)}
                                alt="Parça Fotoğrafı"
                                style={{ 
                                  maxWidth: '100%', 
                                  maxHeight: '760px', 
                                  objectFit: 'contain',
                                  border: '1px solid #eaeaea'
                                }}
                              />
                            </Box>
                          </Box>
                        }
                        componentsProps={{
                          tooltip: {
                            sx: {
                              bgcolor: 'transparent',
                              '& .MuiTooltip-arrow': {
                                color: 'white',
                              },
                              maxWidth: 'none !important',
                              boxShadow: 3,
                              p: 0,
                              overflow: 'visible'
                            }
                          }
                        }}
                        arrow
                        placement="right"
                        enterDelay={100}
                      >
                        <Box 
                          component="img"
                          src={getFotoPath(parca.foto_path)}
                          alt="Parça Görseli"
                          sx={{
                            width: 180,
                            height: 180,
                            borderRadius: 1,
                            objectFit: 'contain',
                            border: '1px solid #eaeaea',
                            cursor: 'pointer',
                            '&:hover': {
                              opacity: 0.8,
                              boxShadow: 1
                            }
                          }}
                          onClick={() => handleOpenModal(getFotoPath(parca.foto_path))}
                        />
                      </Tooltip>
                    )}
                    {parca.teknik_resim_path && (
                      <Tooltip title="Teknik Resim">
                        <IconButton size="small" onClick={() => window.open(getTeknikResimPath(parca.teknik_resim_path), '_blank')}>
                          <PictureAsPdfIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{parca.parcaKodu}</TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    {parca.stokAdeti <= parca.kritik_stok && parca.kritik_stok > 0 && (
                      <Tooltip title="Kritik stok seviyesinin altında!">
                        <WarningIcon color="error" sx={{ mr: 1 }} />
                      </Tooltip>
                    )}
                    <span>{parca.stokAdeti}</span>
                    {parca.kritik_stok > 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        (Kritik: {parca.kritik_stok})
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{parca.imalMi ? 'İmal' : 'Tedarik'}</TableCell>
                <TableCell>{parca.tedarikBedeli}</TableCell>
                <TableCell>
                  {parca.hamMalzemeFormatted ? (
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {parca.hamMalzemeFormatted.olculeri}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {parca.hamMalzemeFormatted.malzemeCinsi}
                      </Typography>
                      {parca.hamMalzemeFormatted.stokMiktari !== undefined && (
                        <Typography variant="caption" color="text.secondary">
                          Stok: {parca.hamMalzemeFormatted.stokMiktari} adet
                          {parca.hamMalzemeFormatted.kritikStokMiktari > 0 && (
                            ` (Kritik: ${parca.hamMalzemeFormatted.kritikStokMiktari})`
                          )}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {parca.imalMi ? 'Stok kartı yok' : 'Gerekmiyor'}
                      </Typography>
                    </Box>
                  )}
                </TableCell>
                <TableCell>{parca.fasonMaliyeti}</TableCell>
                <TableCell>{parca.sirketIciMaliyeti}</TableCell>
                <TableCell>{parca.setupSayisi}</TableCell>
                <TableCell>{parca.cncIslemeSuresi}</TableCell>
                <TableCell>{parca.siyah ? 'Evet' : 'Hayır'}</TableCell>
                <TableCell>
                  <Tooltip title="Düzenle">
                    <IconButton onClick={() => handleEdit(parca)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Sil">
                    <IconButton onClick={() => handleDelete(parca.parcaKodu)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Takip listesine ekle">
                    <IconButton onClick={() => setTakipSecimModal({ open: true, mode: 'add', parcaKodu: parca.parcaKodu })}>
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Takip listesinden çıkar">
                    <IconButton color="error" onClick={() => setTakipSecimModal({ open: true, mode: 'remove', parcaKodu: parca.parcaKodu })}>
                      <LinkOffIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Parça Detayına Git">
                    <IconButton onClick={() => handleParcaDetayinaGit(parca)}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={13} align="center">
                  Parça bulunamadı veya yükleniyor...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Sayfalama Bilgisi ve Kontrolü */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="body2" color="textSecondary">
          {toplam > 0 ? (
            `${((sayfa - 1) * sayfaBasi) + 1}-${Math.min(sayfa * sayfaBasi, toplam)} / ${toplam} parça gösteriliyor`
          ) : (
            'Parça bulunamadı'
          )}
          {yukleniyor && <CircularProgress size={16} sx={{ ml: 1 }} />}
        </Typography>
        
        {sayfaSayisi > 1 && (
          <Pagination
            count={sayfaSayisi}
            page={sayfa}
            onChange={handleSayfaChange}
            color="primary"
            size="small"
            showFirstButton
            showLastButton
          />
        )}
      </Box>

      {/* Yeni Parça Ekleme Formu - Eski inline form korunuyor */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            Yeni Parça Ekle
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={2}>
              <TextField
                label="Parça Kodu"
                value={yeniParca.parcaKodu ?? ""}
                onChange={(e) => setYeniParca({...yeniParca, parcaKodu: e.target.value})}
                required
              />
              <TextField
                label="Parça Adı"
                value={yeniParca.parcaAdi ?? ""}
                onChange={(e) => setYeniParca({...yeniParca, parcaAdi: e.target.value})}
                required
              />
              <Box display="flex" gap={2}>
                <TextField
                  label="Stok Adeti"
                  type="number"
                  value={yeniParca.stokAdeti ?? ""}
                  onChange={(e) => setYeniParca({...yeniParca, stokAdeti: parseInt(e.target.value)})}
                  required
                  fullWidth
                />
                <TextField
                  label="Kritik Stok Seviyesi"
                  type="number"
                  value={yeniParca.kritik_stok ?? ""}
                  onChange={(e) => setYeniParca({...yeniParca, kritik_stok: parseInt(e.target.value)})}
                  helperText="Bu seviyenin altına düştüğünde uyarı verilecek"
                  fullWidth
                />
              </Box>
              <TextField
                label="Tedarik Bedeli"
                type="number"
                value={yeniParca.tedarikBedeli ?? ""}
                onChange={(e) => setYeniParca({...yeniParca, tedarikBedeli: parseFloat(e.target.value)})}
                required
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={yeniParca.imalMi ?? false}
                    onChange={(e) => setYeniParca({...yeniParca, imalMi: e.target.checked})}
                  />
                }
                label="İmal Edilen Parça"
              />
              {yeniParca.imalMi && (
                <>
                  {/* Ham Malzeme Stok Kartı */}
                  <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Ham Malzeme Stok Kartı
                    </Typography>
                    
                    {yeniParcaSecilenStokKarti ? (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Chip 
                            icon={<LinkIcon />}
                            label="Stok Kartı Seçili"
                            color="success"
                            size="small"
                          />
                          <Button
                            startIcon={<SearchIcon />}
                            variant="outlined"
                            size="small"
                            onClick={() => setYeniParcaStokKartiSeciciOpen(true)}
                          >
                            Değiştir
                          </Button>
                          <Button
                            startIcon={<LinkOffIcon />}
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={handleYeniParcaStokKartiBaglantiKaldir}
                          >
                            Kaldır
                          </Button>
                        </Box>
                        
                        <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1, border: '1px solid #e0e0e0' }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                            {yeniParcaSecilenStokKarti.olculeriFormatted || yeniParcaSecilenStokKarti.kesit}
                            {yeniParcaSecilenStokKarti.boy && ` x ${yeniParcaSecilenStokKarti.boy}mm`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                            <strong>Malzeme:</strong> {yeniParcaSecilenStokKarti.malzeme_cinsi}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" display="block">
                            <strong>Stok:</strong> {yeniParcaSecilenStokKarti.adet} adet
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Ham malzeme için stok kartı seçilmedi
                        </Typography>
                        <Button
                          startIcon={<SearchIcon />}
                          variant="contained"
                          size="small"
                          onClick={() => setYeniParcaStokKartiSeciciOpen(true)}
                        >
                          Stok Kartı Seç
                        </Button>
                      </Box>
                    )}
                  </Box>

                  <TextField
                    label="Fason Maliyeti"
                    type="number"
                    value={yeniParca.fasonMaliyeti ?? ""}
                    onChange={(e) => setYeniParca({...yeniParca, fasonMaliyeti: parseFloat(e.target.value)})}
                  />
                  <TextField
                    label="Şirket İçi Maliyeti"
                    type="number"
                    value={yeniParca.sirketIciMaliyeti ?? ""}
                    onChange={(e) => setYeniParca({...yeniParca, sirketIciMaliyeti: parseFloat(e.target.value)})}
                  />
                  <TextField
                    label="Setup Sayısı"
                    type="number"
                    value={yeniParca.setupSayisi ?? ""}
                    onChange={(e) => setYeniParca({...yeniParca, setupSayisi: parseInt(e.target.value)})}
                    fullWidth
                  />
                  <TextField
                    label="CNC İşleme Süresi (dk)"
                    type="number"
                    value={yeniParca.cncIslemeSuresi ?? ""}
                    onChange={(e) => setYeniParca({...yeniParca, cncIslemeSuresi: parseInt(e.target.value)})}
                    fullWidth
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={yeniParca.siyah ?? false}
                        onChange={(e) => setYeniParca({...yeniParca, siyah: e.target.checked})}
                      />
                    }
                    label="Siyah Parça"
                  />
                </>
              )}
              <Box display="flex" gap={2}>
                <TextField
                  label="Teknik Resim Dosya Yolu"
                  value={yeniParca.teknik_resim_path ?? ""}
                  onChange={(e) => setYeniParca({...yeniParca, teknik_resim_path: e.target.value})}
                  helperText="PDF dosyasının tam yolu veya URL'si"
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={() => handleFileSelect(teknikResimInputRef, 'teknik_resim_path')}
                          edge="end"
                        >
                          <FolderOpenIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  inputRef={teknikResimInputRef}
                />
                <TextField
                  label="Fotoğraf Dosya Yolu"
                  value={yeniParca.foto_path ?? ""}
                  onChange={(e) => setYeniParca({...yeniParca, foto_path: e.target.value})}
                  helperText="Resim dosyasının tam yolu veya URL'si"
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={() => handleFileSelect(fotoInputRef, 'foto_path')}
                          edge="end"
                        >
                          <FolderOpenIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  inputRef={fotoInputRef}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button type="submit" variant="contained">
              Kaydet
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Parça Düzenleme Formu - Parça Kayıtları butonu ile */}
      {parcaDuzenleFormOpen && secilenParca && (
        <ParcaDuzenleFormu 
          open={parcaDuzenleFormOpen}
          onClose={() => {
            setParcaDuzenleFormOpen(false);
            setSecilenParca(null);
          }}
          parca={secilenParca}
          onUpdateSuccess={handleParcaGuncellendi}
        />
      )}


      
      {/* Image popup modal */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="lg"
        PaperProps={{
          sx: {
            maxWidth: '90vw',
            maxHeight: '90vh',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 0,
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
          <IconButton
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' }
            }}
            onClick={handleCloseModal}
          >
            <DeleteIcon />
          </IconButton>
          
          {selectedImage && (
            <Box
              component="img"
              src={selectedImage}
              alt="Parça Detay Görseli"
              sx={{
                maxWidth: '100%',
                maxHeight: 'calc(90vh - 16px)',
                objectFit: 'contain',
                display: 'block'
              }}
              onError={(e) => {
                console.error('Image failed to load:', e);
                e.target.src = '/static/images/broken-image.jpg';
              }}
            />
          )}
        </Box>
      </Dialog>

      {/* Yeni Parça İçin Stok Kartı Seçici */}
      <StokKartiSecici
        open={yeniParcaStokKartiSeciciOpen}
        onClose={() => setYeniParcaStokKartiSeciciOpen(false)}
        onSelect={handleYeniParcaStokKartiSec}
        aramaMetni=""
      />

      {/* Teknik Resim Kamera Modal */}
      <TeknikResimCameraModal
        open={teknikResimModalOpen}
        onClose={() => setTeknikResimModalOpen(false)}
        onPartFound={handlePartFound}
        onPartCreate={handlePartCreate}
      />

      {/* Parça Takip Listesi Oluştur/Düzenle */}
      <ParcaTakipListesiModal
        open={yeniParcaListeModalOpen}
        onClose={() => setYeniParcaListeModalOpen(false)}
        onSaved={async () => {
          try {
            const lists = await parcaTakipListeleriService.list();
            setParcaTakipListeleri(lists || []);
          } catch {}
        }}
      />

      {/* Parça Takip Listelerini Yönet */}
      <ParcaTakipListeleriYonetModal
        open={parcaYonetModalOpen}
        onClose={() => setParcaYonetModalOpen(false)}
      />

      {/* Parça Takip Seçim Modali */}
      <ParcaTakipSecimModal
        open={takipSecimModal.open}
        mode={takipSecimModal.mode}
        parcaKodu={takipSecimModal.parcaKodu}
        onClose={() => setTakipSecimModal({ open: false, mode: 'add', parcaKodu: '' })}
        onCompleted={() => {
          // Filtreli görünümde yeni eklenen parça görünür olsun diye sayfayı başa al
          setSayfa(1);
          parcalariGetir();
        }}
      />
    </Box>
  );
}

export default Parcalar;