import React, { useState, useEffect } from 'react';
import SiparisDokumanlariModal from './SiparisDokumanlariModal';
import StokKartiSecimModal from './StokKartiSecimModal';
import stokKartlariService from '../services/stokKartlariService';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Modal,
  Paper,
  Alert,
  Chip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
import InventoryIcon from '@mui/icons-material/Inventory';
import SearchIcon from '@mui/icons-material/Search';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { tr } from 'date-fns/locale';
import axios from 'axios';

const IsEmriDuzenleForm = ({ open, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    is_adi: '',
    adet: '',
    teslim_tarihi: null,
    oncelik: 'normal',
    aciklama: '',
    uretim_plani_id: '',
    planlanan_tezgah: '',
    setup_sayisi: '',
    cnc_suresi: '',
    tahmini_isleme_suresi: 1,
    malzemesi_siparis_edilecekmi: false,
    malzeme_siparis_tarihi: '',
    siparis_dokumani: null,
    stok_karti_id: null
  });
  
  const [uretimPlanlari, setUretimPlanlari] = useState([]);
  const [tezgahlar, setTezgahlar] = useState([]);
  const [loadingUretimPlanlari, setLoadingUretimPlanlari] = useState(false);
  const [loadingTezgahlar, setLoadingTezgahlar] = useState(false);
  const [dokumanModalOpen, setDokumanModalOpen] = useState(false);
  
  // Stok kartı state'leri
  const [stokKartiModalOpen, setStokKartiModalOpen] = useState(false);
  const [selectedStokKarti, setSelectedStokKarti] = useState(null);
  const [stokKartiLoading, setStokKartiLoading] = useState(false);

  // Component açıldığında başlangıç verilerini yükle
  useEffect(() => {
    if (initialData && open) {
      setFormData({
        is_adi: initialData.is_adi || '',
        adet: initialData.adet || '',
        teslim_tarihi: initialData.teslim_tarihi ? new Date(initialData.teslim_tarihi) : null,
        oncelik: initialData.oncelik || 'normal',
        aciklama: initialData.aciklama || '',
        uretim_plani_id: '', // Başlangıçta boş, üretim planları yüklendikten sonra kontrol edilecek
        planlanan_tezgah: initialData.planlanan_tezgah || '',
        setup_sayisi: initialData.setup_sayisi || '',
        cnc_suresi: initialData.cnc_suresi || '',
        tahmini_isleme_suresi: initialData.tahmini_isleme_suresi || 1,
        malzemesi_siparis_edilecekmi: initialData.malzemesi_siparis_edilecekmi || false,
        malzeme_siparis_tarihi: initialData.malzeme_siparis_tarihi || '',
        siparis_dokumani: null,
        durum: initialData.durum || 'Beklemede',
        stok_karti_id: initialData.stok_karti_id || null
      });

      // Eğer iş emrinin stok kartı bilgisi varsa, önce direkt olarak kontrol et
      if (initialData.stok_karti) {
        // Eğer stok kartı nesnesi olarak geldiyse doğrudan kullan
        console.log('İş Emri Düzenle: Stok kartı nesnesi bulundu:', initialData.stok_karti);
        setSelectedStokKarti(initialData.stok_karti);
        setFormData(prev => ({
          ...prev,
          stok_karti_id: initialData.stok_karti.id
        }));
      }
      // Eğer sadece stok kartı ID'si varsa, stok kartı bilgisini getir
      else if (initialData.stok_karti_id) {
        console.log('İş Emri Düzenle: Stok kartı ID bulundu:', initialData.stok_karti_id);
        fetchStokKarti(initialData.stok_karti_id);
      } else {
        console.log('İş Emri Düzenle: Stok kartı bilgisi bulunamadı');
      }

      fetchUretimPlanlari();
      fetchTezgahlar();
    }
  }, [initialData, open]);

  // Üretim planları yüklendikten sonra ID kontrolü
  useEffect(() => {
    if (initialData && initialData.uretim_plani_id && uretimPlanlari.length > 0) {
      const planExists = uretimPlanlari.some(plan => plan.id == initialData.uretim_plani_id);
      if (planExists) {
        console.log('İş Emri Düzenle: Üretim planı ID mevcut:', initialData.uretim_plani_id);
        setFormData(prev => ({
          ...prev,
          uretim_plani_id: initialData.uretim_plani_id
        }));
      } else {
        console.log('İş Emri Düzenle: Üretim planı ID mevcut değil, temizleniyor:', initialData.uretim_plani_id);
        setFormData(prev => ({
          ...prev,
          uretim_plani_id: ''
        }));
      }
    }
  }, [uretimPlanlari, initialData]);

  // Üretim planlarını getir
  const fetchUretimPlanlari = async () => {
    try {
      setLoadingUretimPlanlari(true);
      console.log('İş Emri Düzenle: Üretim planları yükleniyor...');
      const response = await axios.get('/api/uretim-plani');
      console.log('İş Emri Düzenle: Üretim planları yüklendi, sayı:', response.data?.length || 0);
      setUretimPlanlari(response.data || []);
    } catch (error) {
      console.error('İş Emri Düzenle: Üretim planları yüklenirken hata:', error);
      setUretimPlanlari([]);
    } finally {
      setLoadingUretimPlanlari(false);
    }
  };

  // Tezgahları getir
  const fetchTezgahlar = async () => {
    try {
      setLoadingTezgahlar(true);
      const response = await axios.get('/api/tezgahlar');

      // API yanıtını güvenli şekilde işle
      let tezgahlarData = [];
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        tezgahlarData = response.data.data;
      } else if (Array.isArray(response.data)) {
        // Geriye dönük uyumluluk için doğrudan array kontrolü
        tezgahlarData = response.data;
      }

      setTezgahlar(tezgahlarData);
    } catch (error) {
      console.error('Tezgahlar yüklenirken hata:', error);
      setTezgahlar([]); // Hata durumunda boş array
    } finally {
      setLoadingTezgahlar(false);
    }
  };

  // Stok kartı bilgisini getir
  const fetchStokKarti = async (stokKartiId) => {
    try {
      setStokKartiLoading(true);
      console.log('İş Emri Düzenle: Stok kartı getiriliyor, ID:', stokKartiId);
      const stokKartiResponse = await stokKartlariService.getStokKarti(stokKartiId);
      console.log('İş Emri Düzenle: Stok kartı yanıtı:', stokKartiResponse);
      if (stokKartiResponse && stokKartiResponse.success && stokKartiResponse.data) {
        setSelectedStokKarti(stokKartiResponse.data);
        console.log('İş Emri Düzenle: Stok kartı başarıyla yüklendi:', stokKartiResponse.data);
      } else {
        console.warn('İş Emri Düzenle: Stok kartı yanıtı geçersiz:', stokKartiResponse);
        setSelectedStokKarti(null);
      }
    } catch (error) {
      console.error('İş Emri Düzenle: Stok kartı bilgisi alınamadı:', error);
      setSelectedStokKarti(null);
    } finally {
      setStokKartiLoading(false);
    }
  };

  // Stok kartı seçim fonksiyonları
  const handleStokKartiModalAc = () => {
    setStokKartiModalOpen(true);
  };

  const handleStokKartiSec = (stokKarti) => {
    setSelectedStokKarti(stokKarti);
    setFormData(prev => ({ 
      ...prev, 
      stok_karti_id: stokKarti.id
    }));
    setStokKartiModalOpen(false);
  };

  // Form input değişikliklerini handle et
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

  // Tarih değişikliğini handle et
  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, teslim_tarihi: date }));
  };

  // Form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    // Sipariş alanlarını ve stok kartı ID'sini de ekle
    onSubmit({
      ...initialData,
      ...formData,
      malzemesi_siparis_edilecekmi: formData.malzemesi_siparis_edilecekmi,
      malzeme_siparis_tarihi: formData.malzemesi_siparis_edilecekmi ? formData.malzeme_siparis_tarihi : null,
      siparis_dokumani: formData.malzemesi_siparis_edilecekmi ? formData.siparis_dokumani : null,
      stok_karti_id: selectedStokKarti?.id || null
    });
  };


  // Eski documentModalOpen ve currentDocument kodları kaldırıldı (yeni modal ile çakışma olmaması için)

  // Mevcut sipariş dokümanının var olup olmadığını kontrol etme işlevi
  const hasExistingSiparisDocument = () => {
    const result = initialData && initialData.siparis_dokumani_dosya_yolu && 
           initialData.siparis_dokumani_dosya_yolu.trim() !== '';
    console.log('IsEmriDuzenleForm hasExistingSiparisDocument check:', {
      initialData: initialData,
      siparis_dokumani_dosya_yolu: initialData?.siparis_dokumani_dosya_yolu,
      result: result
    });
    return result;
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

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>İş Emri Düzenle</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
            {/* Sipariş dokümanlarını thumbnail olarak görüntüleme */}
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => setDokumanModalOpen(true)}
              >
                Sipariş ve Tedarik Dökümanları
              </Button>
              {/* Modalı sadece dokumanModalOpen ile açıyoruz, eski documentModalOpen kullanılmıyor */}
              <SiparisDokumanlariModal
                open={dokumanModalOpen}
                onClose={() => setDokumanModalOpen(false)}
                isEmriId={initialData?.is_emri_id}
                isEmriNo={initialData?.is_emri_no}
              />
            </Grid>
            
            {/* Malzeme siparişi verilecek mi? kutusu ve bağlı alanlar */}
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
            {formData.malzemesi_siparis_edilecekmi && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="malzeme_siparis_tarihi"
                    label="Malzeme Sipariş Tarihi"
                    type="date"
                    value={
                      formData.malzeme_siparis_tarihi
                        ? (typeof formData.malzeme_siparis_tarihi === 'string'
                            ? formData.malzeme_siparis_tarihi.slice(0, 10)
                            : new Date(formData.malzeme_siparis_tarihi).toISOString().slice(0, 10))
                        : ''
                    }
                    onChange={handleChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    required
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
            <Grid item xs={12} md={6}>
              <TextField
                name="is_adi"
                label="İş Adı"
                value={formData.is_adi}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
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
                margin="normal"
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
                margin="normal"
                inputProps={{ min: 1, max: 20 }}
                helperText="İş emrinin kaç vardiyada tamamlanacağı tahmini (1-20 vardiya)"
              />
            </Grid>
            
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
                        label="Stok Kartı Seçili"
                        color="success"
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
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
                <DatePicker
                  label="Teslim Tarihi"
                  value={formData.teslim_tarihi}
                  onChange={handleDateChange}
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: "normal"
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
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
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Üretim Planı</InputLabel>
                <Select
                  name="uretim_plani_id"
                  value={formData.uretim_plani_id}
                  onChange={handleChange}
                  label="Üretim Planı"
                  displayEmpty
                  endAdornment={loadingUretimPlanlari ? <CircularProgress size={20} /> : null}
                >
                  <MenuItem value="">
                    <em>Üretim planı seçilmedi</em>
                  </MenuItem>
                  {uretimPlanlari.map((plan) => (
                    <MenuItem key={plan.id} value={plan.id}>
                      {plan.makina?.name ? 
                        `${plan.makina.name} - Miktar: ${plan.miktar}` : 
                        `Plan #${plan.id} - Miktar: ${plan.miktar}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Planlanan Tezgah</InputLabel>
                <Select
                  name="planlanan_tezgah"
                  value={formData.planlanan_tezgah}
                  onChange={handleChange}
                  label="Planlanan Tezgah"
                  displayEmpty
                  endAdornment={loadingTezgahlar ? <CircularProgress size={20} /> : null}
                >
                  <MenuItem value="">
                    <em>Tezgah seçilmedi</em>
                  </MenuItem>
                  {tezgahlar.map((tezgah) => (
                    <MenuItem key={tezgah.tezgah_id} value={tezgah.tezgah_id}>
                      {tezgah.tezgah_tanimi}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="setup_sayisi"
                label="Setup Sayısı"
                type="number"
                value={formData.setup_sayisi}
                onChange={handleChange}
                fullWidth
                margin="normal"
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="cnc_suresi"
                label="CNC Süresi (dk)"
                type="number"
                value={formData.cnc_suresi}
                onChange={handleChange}
                fullWidth
                margin="normal"
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="aciklama"
                label="Açıklama"
                value={formData.aciklama}
                onChange={handleChange}
                fullWidth
                multiline
                rows={4}
                margin="normal"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>İptal</Button>
          <Button type="submit" variant="contained" color="primary">
            Güncelle
          </Button>
        </DialogActions>
      </form>
    </Dialog>

    {/* Stok Kartı Seçim Modal */}
    <StokKartiSecimModal
      open={stokKartiModalOpen}
      onClose={() => setStokKartiModalOpen(false)}
      onSelect={handleStokKartiSec}
      selectedStokKarti={selectedStokKarti}
    />

    {/* Eski documentModalOpen ve currentDocument ile ilgili modal tamamen kaldırıldı. */}
    </>
  );
};

export default IsEmriDuzenleForm;
