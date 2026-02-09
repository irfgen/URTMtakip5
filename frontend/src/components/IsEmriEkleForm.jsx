import { useState, useEffect } from 'react';
import SiparisDokumanlariModal from './SiparisDokumanlariModal';
import StokKartiSecimModal from './StokKartiSecimModal';
import stokKartlariService from '../services/stokKartlariService';
import { Checkbox, FormControlLabel, Chip } from '@mui/material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Typography,
  Box,
  Paper,
  Alert
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  Search as SearchIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';
import axios from 'axios';
import ParcaSecimFormu from './ParcaSecimFormu';
import ParcaSecici from './ParcaSecici';
import TedarikTalepForm from './tedarik/TedarikTalepForm';

const IsEmriEkleForm = ({ 
  open, 
  onClose, 
  onSubmit, 
  preSelectedUretimPlaniId = null, 
  preSelectedParcaKodu = null,
  hideUretimPlaniSelection = false // Üretim planı seçimini gizleme seçeneği
}) => {
  const [formData, setFormData] = useState({
    parcaKodu: preSelectedParcaKodu || null,
    adet: '',
    teslimTarihi: '',
    oncelik: 'normal',
    durum: 'beklemede',
    aciklama: '',
    uretimPlaniId: preSelectedUretimPlaniId || '',
    malzemesi_siparis_edilecekmi: false,
    malzeme_siparis_tarihi: '',
    siparis_dokumani: null,
    stok_karti_id: null,
    tahmini_isleme_suresi: 1
  });

  const [parcalar, setParcalar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [secilenParcaBilgisi, setSecilenParcaBilgisi] = useState({
    hamMalzemeCinsi: '',
    hamMalzemeOlculeri: '',
    setup_sayisi: '',
    cnc_suresi: ''
  });
  const [uretimPlanlari, setUretimPlanlari] = useState([]);
  const [loadingUretimPlanlari, setLoadingUretimPlanlari] = useState(false);
  const [durumlar, setDurumlar] = useState([]);
  const [loadingDurumlar, setLoadingDurumlar] = useState(false);
  const [parcaSecimDialogOpen, setParcaSecimDialogOpen] = useState(false);
  const [dokumanModalOpen, setDokumanModalOpen] = useState(false);
  const [stokKartiModalOpen, setStokKartiModalOpen] = useState(false);
  const [selectedStokKarti, setSelectedStokKarti] = useState(null);
  const [parcaStokKarti, setParcaStokKarti] = useState(null);
  const [stokKartiLoading, setStokKartiLoading] = useState(false);
  const [tedarikModalOpen, setTedarikModalOpen] = useState(false);

  // Parçaları ve üretim planlarını API'den yükleme
  useEffect(() => {
    if (open) {
      loadParcalar();
      loadUretimPlanlari();
      loadDurumlar();
    }
  }, [open]);

  // Önceden seçili parça kodu varsa formData'yı güncelle
  useEffect(() => {
    if (preSelectedParcaKodu) {
      // preSelectedParcaKodu obje olarak geliyorsa ve stok kartı bilgisi varsa direkt kullan
      if (typeof preSelectedParcaKodu === 'object' && preSelectedParcaKodu.stokKarti) {
        // Stok kartı objesi varsa, formu ve seçili stok kartını direkt set et
        setFormData(prev => ({
          ...prev,
          parcaKodu: preSelectedParcaKodu
        }));

        setSecilenParcaBilgisi({
          hamMalzemeCinsi: preSelectedParcaKodu.hamMalzemeCinsi || '',
          hamMalzemeOlculeri: preSelectedParcaKodu.hamMalzemeOlculeri || '',
          setup_sayisi: preSelectedParcaKodu.setupSayisi || 0,
          cnc_suresi: preSelectedParcaKodu.cncIslemeSuresi || 0
        });

        // Stok kartını doğrudan seç
        setParcaStokKarti(preSelectedParcaKodu.stokKarti);
        setSelectedStokKarti(preSelectedParcaKodu.stokKarti);
        setFormData(prev => ({ ...prev, stok_karti_id: preSelectedParcaKodu.stokKarti.id }));
      } else {
        // String veya sadece parcaKodu bilgisi varsa (eski yöntem)
        const parcaKodu = typeof preSelectedParcaKodu === 'string' ? preSelectedParcaKodu : preSelectedParcaKodu?.parcaKodu;

        if (parcaKodu) {
          // Parça listesinden ilgili parçayı bul
          const parca = parcalar.find(p => p.parcaKodu === parcaKodu);

          if (parca) {
            setFormData(prev => ({
              ...prev,
              parcaKodu: parca
            }));

            setSecilenParcaBilgisi({
              hamMalzemeCinsi: parca.hamMalzemeCinsi || '',
              hamMalzemeOlculeri: parca.hamMalzemeOlculeri || '',
              setup_sayisi: parca.setupSayisi || 0,
              cnc_suresi: parca.cncIslemeSuresi || 0
            });
          } else {
            // Eğer parça henüz yüklenmediyse, sadece parça kodunu set et
            setFormData(prev => ({
              ...prev,
              parcaKodu: { parcaKodu: parcaKodu }
            }));
          }
        }
      }
    }
  }, [preSelectedParcaKodu, parcalar]);

  const loadParcalar = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/parcalar?includeStokKarti=true');
      // API'den dönen veri { parcalar: [...] } ise onu kullan, değilse object ise Object.values, array ise direkt ata
      if (Array.isArray(response.data.parcalar)) {
        setParcalar(response.data.parcalar);
      } else if (Array.isArray(response.data)) {
        setParcalar(response.data);
      } else if (typeof response.data === 'object' && response.data !== null) {
        setParcalar(Object.values(response.data));
      } else {
        setParcalar([]);
      }
    } catch (error) {
      console.error('Parçalar yüklenirken hata oluştu:', error);
      setParcalar([]); // Hata durumunda da dizi olarak ayarla
    } finally {
      setLoading(false);
    }
  };

  const loadUretimPlanlari = async () => {
    try {
      setLoadingUretimPlanlari(true);
      const response = await axios.get('/api/uretim-plani');
      // API {rows} ya da {data} ile gelebilir; yoksa doğrudan dizi bekle
      const allPlans = Array.isArray(response.data)
        ? response.data
        : (Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data?.rows) ? response.data.rows : []));
      // Durum filtresi esnek: 'Planlandı' veya 'Üretimde' içerenleri öncelikle göster
      const norm = (s) => (s || '').toString().toLowerCase();
      const aktif = allPlans.filter(p => {
        const d = norm(p.durum);
        return d.includes('planlan') || d.includes('üretim') || d.includes('uretim');
      });
      setUretimPlanlari(aktif.length > 0 ? aktif : allPlans);
    } catch (error) {
      console.error('Üretim planları yüklenirken hata oluştu:', error);
      // Hata durumunda boş liste göster (fallback mock kaldırıldı)
      setUretimPlanlari([]);
    } finally {
      setLoadingUretimPlanlari(false);
    }
  };

  const loadDurumlar = async () => {
    try {
      setLoadingDurumlar(true);
      const response = await axios.get('/api/is-emri-durumlari');
      // Beklenen yapı: aktif durumlar listesi, sıralı
      const list = Array.isArray(response.data) ? response.data : [];
      // UI için { value: durum_kodu, label: durum_adi } formatına dönüştür
      const mapped = list
        .filter(d => d.aktif !== false)
        .map(d => ({ value: d.durum_kodu, label: d.durum_adi, color: d.renk_kodu }))
        .sort((a, b) => a.label.localeCompare(b.label, 'tr'));
      setDurumlar(mapped);
      // Eğer mevcut formData.durum liste içinde yoksa ve 'beklemede' varsa onu seç
      if (mapped.length > 0) {
        const exists = mapped.some(d => d.value === formData.durum);
        if (!exists) {
          const bek = mapped.find(d => d.value.toLowerCase() === 'beklemede');
          if (bek) setFormData(prev => ({ ...prev, durum: bek.value }));
        }
      }
    } catch (error) {
      console.error('Durumlar yüklenirken hata oluştu:', error);
      // Hata durumunda temel bir fallback listesi
      const fallback = [
        { value: 'beklemede', label: 'Beklemede' },
        { value: 'freze', label: 'Freze' },
        { value: 'torna', label: 'Torna' },
        { value: '5 metre', label: '5 Metre' },
        { value: '6 metre', label: '6 Metre' },
        { value: 'kaynak', label: 'Kaynak' }
      ];
      setDurumlar(fallback);
    } finally {
      setLoadingDurumlar(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleParcaSec = async (parca) => {
    setFormData(prev => ({
      ...prev,
      parcaKodu: parca
    }));

    if (parca) {
      // Parça değerlerini konsola yazdırarak ne geldiğini kontrol edelim
      console.log('Seçilen parça bilgileri:', parca);
      
      setSecilenParcaBilgisi({
        hamMalzemeCinsi: parca.hamMalzemeCinsi || '',
        hamMalzemeOlculeri: parca.hamMalzemeOlculeri || '',
        setup_sayisi: parca.setupSayisi || 0,  // setupSayisi değerini al
        cnc_suresi: parca.cncIslemeSuresi || 0 // cncIslemeSuresi değerini al
      });

      // Eğer parçanın stok kartı bilgisi varsa, doğrudan kullan
      if (parca.stokKarti) {
        console.log('Parçanın stok kartı bulundu:', parca.stokKarti);
        setParcaStokKarti(parca.stokKarti);
        // Parçanın kendi stok kartını varsayılan olarak seç
        setSelectedStokKarti(parca.stokKarti);
        setFormData(prev => ({ ...prev, stok_karti_id: parca.stokKarti.id }));
      } else if (parca.stok_karti_id) {
        // Eğer stok kartı objesi yok ama ID varsa, API'den getir
        try {
          setStokKartiLoading(true);
          console.log('Stok kartı API den getiriliyor, ID:', parca.stok_karti_id);
          const stokKartiResponse = await stokKartlariService.getStokKarti(parca.stok_karti_id);
          if (stokKartiResponse.success) {
            setParcaStokKarti(stokKartiResponse.data);
            // Parçanın kendi stok kartını varsayılan olarak seç
            setSelectedStokKarti(stokKartiResponse.data);
            setFormData(prev => ({ ...prev, stok_karti_id: stokKartiResponse.data.id }));
          }
        } catch (stokKartiError) {
          console.error('Stok kartı bilgisi alınamadı:', stokKartiError);
          setParcaStokKarti(null);
        } finally {
          setStokKartiLoading(false);
        }
      } else {
        console.log('Parçanın stok kartı bulunamadı');
        setParcaStokKarti(null);
        setSelectedStokKarti(null);
        setFormData(prev => ({ ...prev, stok_karti_id: null }));
      }
    } else {
      setSecilenParcaBilgisi({
        hamMalzemeCinsi: '',
        hamMalzemeOlculeri: '',
        setup_sayisi: '',
        cnc_suresi: ''
      });
      setParcaStokKarti(null);
      setSelectedStokKarti(null);
      setFormData(prev => ({ ...prev, stok_karti_id: null }));
    }
  };
  
  const handleParcaDuzenle = (parca) => {
    // Parça düzenleme formunu açmak için burada bir işlem başlatabilirsiniz
    alert(`Parça düzenleme formu açılacak: ${parca.parcaKodu}`);
  };

  // Stok kartı seçim fonksiyonları
  const handleStokKartiModalAc = () => {
    setStokKartiModalOpen(true);
  };

  const handleStokKartiSec = (stokKarti) => {
    setSelectedStokKarti(stokKarti);
    setFormData(prev => ({ ...prev, stok_karti_id: stokKarti.id }));
    setStokKartiModalOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('Form submit edildi, formData:', formData);
    console.log('Seçilen parça bilgisi:', secilenParcaBilgisi);
    
    if (!formData.parcaKodu) {
      alert('Lütfen bir parça kodu seçin');
      return;
    }

    if (!formData.adet || formData.adet <= 0) {
      alert('Lütfen geçerli bir adet giriniz');
      return;
    }

    // Parça kodu string veya obje olabilir, onu normalize et
    const parcaKodu = typeof formData.parcaKodu === 'string' 
      ? formData.parcaKodu 
      : formData.parcaKodu?.parcaKodu;
    
    if (!parcaKodu) {
      alert('Parça kodu eksik veya hatalı');
      return;
    }

    // API için veriyi hazırla
    const data = {
      is_adi: parcaKodu, // İş adı olarak parça kodu
      adet: parseInt(formData.adet),
      plan_liste_no: 'Genel',
      malzeme: selectedStokKarti?.malzeme_cinsi || secilenParcaBilgisi.hamMalzemeCinsi || '',
      teslim_tarihi: formData.teslimTarihi,
      oncelik: formData.oncelik,
      durum: formData.durum,
      aciklama: formData.aciklama,
      uretim_plani_id: formData.uretimPlaniId === '' ? null : formData.uretimPlaniId,
      parca_kodu: parcaKodu, // Backend'in beklediği alan adı
      setup_sayisi: secilenParcaBilgisi.setup_sayisi || 0,
      cnc_suresi: secilenParcaBilgisi.cnc_suresi || 0,
      tahmini_isleme_suresi: parseInt(formData.tahmini_isleme_suresi) || 1,
      malzemesi_siparis_edilecekmi: formData.malzemesi_siparis_edilecekmi,
      malzeme_siparis_tarihi: formData.malzemesi_siparis_edilecekmi ? formData.malzeme_siparis_tarihi : null,
      stok_karti_id: selectedStokKarti?.id || null,
      siparis_dokumani: formData.malzemesi_siparis_edilecekmi ? formData.siparis_dokumani : null
    };
    
    console.log('API\'ye gönderilecek veri:', data);
    onSubmit(data);
    
    // İş emri başarıyla oluşturulduysa geçici dokümanları temizle
    const tempDocKey = typeof formData.parcaKodu === 'string' 
      ? formData.parcaKodu 
      : formData.parcaKodu?.parcaKodu;
    const tempStorageKey = `temp_dokuman_${tempDocKey || 'yeni_is_emri'}`;
    localStorage.removeItem(tempStorageKey);
    console.log('Geçici dokümanlar localStorage\'dan temizlendi:', tempStorageKey);
    
    // Form resetle
    setFormData({
      parcaKodu: null,
      adet: '',
      teslimTarihi: '',
      oncelik: 'normal',
      durum: 'beklemede',
      aciklama: '',
      uretimPlaniId: '',
      malzemesi_siparis_edilecekmi: false,
      malzeme_siparis_tarihi: '',
      siparis_dokumani: null,
      stok_karti_id: null,
      tahmini_isleme_suresi: 1
    });

    setSecilenParcaBilgisi({
      hamMalzemeCinsi: '',
      hamMalzemeOlculeri: '',
      setup_sayisi: '',
      cnc_suresi: ''
    });

    setSelectedStokKarti(null);
    setParcaStokKarti(null);
  };

  return (
    <>
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Yeni İş Emri Ekle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.malzemesi_siparis_edilecekmi}
                    onChange={handleChange}
                    name="malzemesi_siparis_edilecekmi"
                    color="primary"
                  />
                }
                label="Malzeme siparişi verilecek mi?"
              />
            </Grid>
            
            {/* Parça Seçimi */}
            <Grid item xs={12} md={6}>
              <ParcaSecici
                selectedParca={formData.parcaKodu}
                onSec={handleParcaSec}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="adet"
                label="Adet"
                type="number"
                value={formData.adet}
                onChange={handleChange}
                fullWidth
                required
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                name="tahmini_isleme_suresi"
                label="Tahmini İşleme Süresi (Vardiya)"
                type="number"
                value={formData.tahmini_isleme_suresi}
                onChange={handleChange}
                fullWidth
                required
                inputProps={{ min: 1, max: 20 }}
                helperText="İş emrinin kaç vardiyada tamamlanacağı tahmini (1-20 vardiya)"
              />
            </Grid>

            {formData.malzemesi_siparis_edilecekmi && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="malzeme_siparis_tarihi"
                    label="Malzeme Sipariş Tarihi"
                    type="date"
                    value={formData.malzeme_siparis_tarihi}
                    onChange={handleChange}
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
                  <SiparisDokumanlariModal
                    open={dokumanModalOpen}
                    onClose={() => setDokumanModalOpen(false)}
                    isEmriId={null}
                    isEmriNo={formData.parcaKodu ? (typeof formData.parcaKodu === 'string' ? formData.parcaKodu : formData.parcaKodu?.parcaKodu) || 'yeni_is_emri' : 'yeni_is_emri'}
                  />
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
                        icon={<LinkIcon />}
                        label={parcaStokKarti?.id === selectedStokKarti?.id ? "Parçanın Varsayılan Stok Kartı" : "Stok Kartı Seçili"}
                        color={parcaStokKarti?.id === selectedStokKarti?.id ? "primary" : "success"}
                        size="small"
                      />
                      <Button
                        startIcon={<SearchIcon />}
                        variant="outlined"
                        size="small"
                        onClick={handleStokKartiModalAc}
                      >
                        Değiştir
                      </Button>
                      <Button
                        startIcon={<LinkOffIcon />}
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => {
                          setSelectedStokKarti(null);
                          setFormData(prev => ({ ...prev, stok_karti_id: null }));
                        }}
                      >
                        Kaldır
                      </Button>
                      <Button
                        startIcon={<ShoppingCartIcon />}
                        variant="contained"
                        color="warning"
                        size="small"
                        onClick={() => setTedarikModalOpen(true)}
                      >
                        Sipariş Ver
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
                      startIcon={<SearchIcon />}
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
                  {secilenParcaBilgisi.setup_sayisi !== '' && secilenParcaBilgisi.setup_sayisi !== undefined ? secilenParcaBilgisi.setup_sayisi : 'Parça seçilmedi'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 1, border: '1px solid #e0e0e0', borderRadius: 1, height: '100%' }}>
                <Typography variant="subtitle2" color="text.secondary">CNC Süresi (dk)</Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {secilenParcaBilgisi.cnc_suresi !== '' && secilenParcaBilgisi.cnc_suresi !== undefined ? secilenParcaBilgisi.cnc_suresi : 'Parça seçilmedi'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="teslimTarihi"
                label="Teslim Tarihi"
                type="date"
                value={formData.teslimTarihi}
                onChange={handleChange}
                fullWidth
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
                  value={formData.oncelik}
                  onChange={handleChange}
                  label="Öncelik"
                >
                  <MenuItem value="dusuk">Düşük</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="yuksek">Yüksek</MenuItem>
                  <MenuItem value="acil">Acil</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {hideUretimPlaniSelection && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Durum</InputLabel>
                  <Select
                    name="durum"
                    value={formData.durum}
                    onChange={handleChange}
                    label="Durum"
                    displayEmpty
                    endAdornment={loadingDurumlar ? <CircularProgress size={20} /> : null}
                  >
                    {durumlar.length === 0 && (
                      <MenuItem value={formData.durum || 'beklemede'}>
                        {formData.durum || 'beklemede'}
                      </MenuItem>
                    )}
                    {durumlar.map(d => (
                      <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            {!hideUretimPlaniSelection && (
              <>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Üretim Planı</InputLabel>
                    <Select
                      name="uretimPlaniId"
                      value={formData.uretimPlaniId}
                      onChange={handleChange}
                      label="Üretim Planı"
                      displayEmpty
                      endAdornment={loadingUretimPlanlari ? <CircularProgress size={20} /> : null}
                    >
                      <MenuItem value="">
                        <em>Üretim planı seçilmedi</em>
                      </MenuItem>
                      {uretimPlanlari.map((plan) => {
                        const aciklama = plan.aciklama || plan.ozel_liste_adi || plan.plan_adi || (plan.makina?.name ? `Makina: ${plan.makina.name}` : '');
                        const label = `Plan #${plan.id}${aciklama ? ` - ${aciklama}` : ''}`;
                        return (
                          <MenuItem key={plan.id} value={plan.id}>
                            {label}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Durum</InputLabel>
                    <Select
                      name="durum"
                      value={formData.durum}
                      onChange={handleChange}
                      label="Durum"
                      displayEmpty
                      endAdornment={loadingDurumlar ? <CircularProgress size={20} /> : null}
                    >
                      {durumlar.length === 0 && (
                        <MenuItem value={formData.durum || 'beklemede'}>
                          {formData.durum || 'beklemede'}
                        </MenuItem>
                      )}
                      {durumlar.map(d => (
                        <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <TextField
                name="aciklama"
                label="Açıklama"
                value={formData.aciklama}
                onChange={handleChange}
                fullWidth
                multiline
                rows={4}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>İptal</Button>
          <Button type="submit" variant="contained" color="primary">
            Ekle
          </Button>
        </DialogActions>
      </form>
    </Dialog>

    {/* Tedarik Talebi Modal */}
    {selectedStokKarti && (
      <TedarikTalepForm
        open={tedarikModalOpen}
        onClose={() => setTedarikModalOpen(false)}
        onSave={(response) => {
          console.log('Tedarik talebi oluşturuldu:', response);
          setTedarikModalOpen(false);
        }}
        prefillData={{
          kaynak_tipi: 'stok_karti',
          stok_karti: selectedStokKarti,
          stok_karti_id: selectedStokKarti.id,
          aciklama: `${selectedStokKarti.kesit}${selectedStokKarti.boy ? ` x ${selectedStokKarti.boy}mm` : ''} stok kartı için tedarik talebi`
        }}
      />
    )}

    {/* Stok Kartı Seçim Modal */}
    <StokKartiSecimModal
      open={stokKartiModalOpen}
      onClose={() => setStokKartiModalOpen(false)}
      onSelect={handleStokKartiSec}
      selectedStokKarti={selectedStokKarti}
    />
  </>
  );
};

export default IsEmriEkleForm;