// Mobil Sevkiyat Form Bileşeni
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Box,
    CircularProgress,
    Alert,
    IconButton,
    Typography,
    Divider,
    Fab,
    Card,
    CardContent,
    Chip
} from '@mui/material';
import {
    Close as CloseIcon,
    Save as SaveIcon,
    Add as AddIcon,
    Image as ImageIcon,
    Search as SearchIcon,
    Inventory as InventoryIcon,
    Build as BuildIcon,
    Clear as ClearIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';
import axios from 'axios';
import FirmaEkleMobilModal from './FirmaEkleMobilModal';
import LokasyonEkleMobilModal from './LokasyonEkleMobilModal';
import SevkiyatResimModalMobile from './SevkiyatResimModalMobile';
import MobilStokKartiSecici from './MobilStokKartiSecici';
import MobilParcaSecici from './MobilParcaSecici';

const SevkiyatFormMobile = ({ open, onClose, sevkiyat, onSuccess, onError }) => {
    const [loading, setLoading] = useState(false);
    const [firmalar, setFirmalar] = useState([]);
    const [lokasyonlar, setLokasyonlar] = useState([]);
    const [formData, setFormData] = useState({
        tip: 'gelen',
        firma_id: '',
        lokasyon_id: '',
        tarih: new Date(),
        durum: 'beklemede',
        aciklama: ''
    });
    
    // Kalem bilgileri için state'ler
    const [kalemData, setKalemData] = useState({
        kalem_tipi: '', // 'stok_karti' veya 'parca'
        secilen_stok_karti: null,
        secilen_parca: null,
        adet: 1
    });
    
    const [errors, setErrors] = useState({});
    const [showFirmaModal, setShowFirmaModal] = useState(false);
    const [showLokasyonModal, setShowLokasyonModal] = useState(false);
    const [showResimModal, setShowResimModal] = useState(false);
    const [kaydedilenSevkiyat, setKaydedilenSevkiyat] = useState(null);
    
    // Modal state'leri
    const [stokKartiModalOpen, setStokKartiModalOpen] = useState(false);
    const [parcaSecimModalOpen, setParcaSecimModalOpen] = useState(false);

    // API URL'sini localStorage'dan al veya varsayılan olarak yerel IP adresini kullan
    const API_BASE_URL = 'http://172.22.180.221:3000/api'; // Use actual machine IP
    console.log('SevkiyatFormMobile içinde API_BASE_URL:', API_BASE_URL);

    useEffect(() => {
        if (open) {
            loadFirmalar();
            loadLokasyonlar();
            
            if (sevkiyat) {
                // Düzenleme modu
                setFormData({
                    tip: sevkiyat.tip,
                    firma_id: sevkiyat.firma_id,
                    lokasyon_id: sevkiyat.lokasyon_id,
                    tarih: new Date(sevkiyat.tarih),
                    durum: sevkiyat.durum,
                    aciklama: sevkiyat.aciklama || ''
                });
                
                // Mevcut kalemleri yükle
                loadSevkiyatKalemleri(sevkiyat.id);
            } else {
                // Yeni kayıt modu
                setFormData({
                    tip: 'gelen',
                    firma_id: '',
                    lokasyon_id: '',
                    tarih: new Date(),
                    durum: 'beklemede',
                    aciklama: ''
                });
                
                // Kalem verilerini temizle
                setKalemData({
                    kalem_tipi: '',
                    secilen_stok_karti: null,
                    secilen_parca: null,
                    adet: 1
                });
            }
            setErrors({});
        }
    }, [open, sevkiyat]);

    const loadFirmalar = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/firmalar?durum=aktif`);
            setFirmalar(response.data.data || response.data);
        } catch (err) {
            console.error('Firmalar yüklenirken hata:', err);
            onError('Firmalar yüklenemedi');
        }
    };

    const loadLokasyonlar = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/sevkiyat/lokasyonlar?aktif=true`);
            setLokasyonlar(response.data);
        } catch (err) {
            console.error('Lokasyonlar yüklenirken hata:', err);
            onError('Lokasyonlar yüklenemedi');
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Hata varsa temizle
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    // Stok kartı seçme fonksiyonu
    const handleStokKartiSec = (stokKarti) => {
        setKalemData({
            kalem_tipi: 'stok_karti',
            secilen_stok_karti: stokKarti,
            secilen_parca: null,
            adet: kalemData.adet
        });
        setStokKartiModalOpen(false);
    };

    // Parça seçme fonksiyonu
    const handleParcaSec = (parca) => {
        setKalemData({
            kalem_tipi: 'parca',
            secilen_stok_karti: null,
            secilen_parca: parca,
            adet: kalemData.adet
        });
        setParcaSecimModalOpen(false);
    };

    // Kalem temizleme fonksiyonu
    const handleKalemTemizle = () => {
        setKalemData({
            kalem_tipi: '',
            secilen_stok_karti: null,
            secilen_parca: null,
            adet: 1
        });
    };

    // Mevcut sevkiyat kalemlerini yükle
    const loadSevkiyatKalemleri = async (sevkiyatId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/sevkiyat-kalemleri/${sevkiyatId}/kalemler`);
            const kalemler = response.data;
            
            if (kalemler && kalemler.length > 0) {
                const kalem = kalemler[0]; // İlk kalemi al (basit versiyonda tek kalem)
                
                if (kalem.kalem_tipi === 'stok_karti') {
                    setKalemData({
                        kalem_tipi: 'stok_karti',
                        secilen_stok_karti: {
                            id: kalem.stok_karti_id,
                            kesit: kalem.kalem_adi,
                            malzeme_cinsi: kalem.kalem_detay,
                            olculeriFormatted: kalem.kalem_adi
                        },
                        secilen_parca: null,
                        adet: kalem.adet
                    });
                } else if (kalem.kalem_tipi === 'parca') {
                    setKalemData({
                        kalem_tipi: 'parca',
                        secilen_stok_karti: null,
                        secilen_parca: {
                            parcaKodu: kalem.parca_kodu,
                            parcaAdi: kalem.kalem_adi
                        },
                        adet: kalem.adet
                    });
                }
            }
        } catch (error) {
            console.error('Sevkiyat kalemleri yüklenirken hata:', error);
            // Hata durumunda sessizce devam et
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.tip) {
            newErrors.tip = 'Sevkiyat tipi seçimi zorunludur';
        }

        if (!formData.firma_id) {
            newErrors.firma_id = 'Firma seçimi zorunludur';
        }

        if (!formData.lokasyon_id) {
            newErrors.lokasyon_id = 'Lokasyon seçimi zorunludur';
        }

        if (!formData.tarih) {
            newErrors.tarih = 'Tarih seçimi zorunludur';
        }

        if (!formData.durum) {
            newErrors.durum = 'Durum seçimi zorunludur';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        const submitData = {
            ...formData,
            tarih: formData.tarih.toISOString(),
            olusturan_kullanici: 'Mobile User' // Şimdilik sabit kullanıcı, daha sonra authentication'dan alınacak
        };

        console.log('Frontend submit data:', submitData);
        console.log('Form data:', formData);

        try {
            setLoading(true);

            let sevkiyatData;

            if (sevkiyat) {
                // Güncelleme
                await axios.put(`${API_BASE_URL}/sevkiyat/${sevkiyat.id}`, submitData);
                sevkiyatData = { ...sevkiyat, ...submitData };
            } else {
                // Yeni oluşturma
                const response = await axios.post(`${API_BASE_URL}/sevkiyat`, submitData);
                sevkiyatData = {
                    id: response.data.id,
                    sevkiyat_no: response.data.sevkiyat_no,
                    ...submitData,
                    olusturulma_tarihi: new Date().toISOString()
                };
                
                // Yeni sevkiyat için resim ekleme seçeneği sun
                setKaydedilenSevkiyat(sevkiyatData);
            }
            
            // Eğer kalem seçilmişse, kalemi kaydet
            if (kalemData.secilen_stok_karti || kalemData.secilen_parca) {
                const kalemSubmitData = {
                    sevkiyat_id: sevkiyatData.id,
                    kalem_tipi: kalemData.kalem_tipi,
                    adet: kalemData.adet
                };
                
                if (kalemData.kalem_tipi === 'stok_karti') {
                    kalemSubmitData.stok_karti_id = kalemData.secilen_stok_karti.id;
                } else if (kalemData.kalem_tipi === 'parca') {
                    kalemSubmitData.parca_kodu = kalemData.secilen_parca.parcaKodu;
                }
                
                await axios.post(`${API_BASE_URL}/sevkiyat-kalemleri`, kalemSubmitData);
            }
            
            onSuccess();
            
            if (!sevkiyat) {
                // Mobilde confirm diyalogları kısıtlanabildiği için doğrudan resim modalını aç
                setShowResimModal(true);
            } else {
                handleClose();
            }
        } catch (err) {
            console.error('Sevkiyat kaydedilirken hata:', err);
            console.error('Hata detayı:', err.response?.data);
            console.error('Gönderilen veri:', submitData);
            onError(err.response?.data?.error || 'Sevkiyat kaydedilemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setKaydedilenSevkiyat(null);
            onClose();
        }
    };

    const handleFirmaEklendi = () => {
        setShowFirmaModal(false);
        loadFirmalar(); // Firma listesini yenile
    };

    const handleLokasyonEklendi = () => {
        setShowLokasyonModal(false);
        loadLokasyonlar(); // Lokasyon listesini yenile
    };

    return (
        <>
            <Dialog 
                open={open} 
                onClose={handleClose}
                fullScreen
                sx={{
                    '& .MuiDialog-paper': {
                        margin: 0,
                        maxHeight: '100vh'
                    }
                }}
            >
                {/* Header */}
                <DialogTitle sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    pb: 1
                }}>
                    {sevkiyat ? 'Sevkiyat Düzenle' : 'Yeni Sevkiyat'}
                    <IconButton onClick={handleClose} disabled={loading}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <Divider />

                {/* Content */}
                <DialogContent sx={{ p: 2 }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
                        <Box display="flex" flexDirection="column" gap={3}>
                            {/* Tip Seçimi */}
                            <FormControl fullWidth error={!!errors.tip}>
                                <InputLabel>Sevkiyat Tipi *</InputLabel>
                                <Select
                                    value={formData.tip}
                                    label="Sevkiyat Tipi *"
                                    onChange={(e) => handleInputChange('tip', e.target.value)}
                                    disabled={loading}
                                >
                                    <MenuItem value="gelen">Gelen Sevkiyat</MenuItem>
                                    <MenuItem value="giden">Giden Sevkiyat</MenuItem>
                                </Select>
                                {errors.tip && (
                                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                                        {errors.tip}
                                    </Typography>
                                )}
                            </FormControl>

                            {/* Durum Seçimi */}
                            <FormControl fullWidth error={!!errors.durum}>
                                <InputLabel>Durum *</InputLabel>
                                <Select
                                    value={formData.durum}
                                    label="Durum *"
                                    onChange={(e) => handleInputChange('durum', e.target.value)}
                                    disabled={loading}
                                >
                                    <MenuItem value="beklemede">Beklemede</MenuItem>
                                    <MenuItem value="tamamlandi">Tamamlandı</MenuItem>
                                    <MenuItem value="iptal">İptal</MenuItem>
                                </Select>
                                {errors.durum && (
                                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                                        {errors.durum}
                                    </Typography>
                                )}
                            </FormControl>

                            {/* Firma Seçimi */}
                            <Box sx={{ position: 'relative' }}>
                                <FormControl fullWidth error={!!errors.firma_id}>
                                    <InputLabel>Firma *</InputLabel>
                                    <Select
                                        value={formData.firma_id}
                                        label="Firma *"
                                        onChange={(e) => handleInputChange('firma_id', e.target.value)}
                                        disabled={loading}
                                    >
                                        {firmalar.map(firma => (
                                            <MenuItem key={firma.id} value={firma.id}>
                                                {firma.firma_adi}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.firma_id && (
                                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                                            {errors.firma_id}
                                        </Typography>
                                    )}
                                </FormControl>
                                
                                {/* Firma Ekle Fab Butonu */}
                                <Fab
                                    size="small"
                                    color="primary"
                                    onClick={() => setShowFirmaModal(true)}
                                    disabled={loading}
                                    sx={{
                                        position: 'absolute',
                                        right: -8,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        zIndex: 1,
                                        width: 32,
                                        height: 32,
                                        minHeight: 32
                                    }}
                                >
                                    <AddIcon sx={{ fontSize: 16 }} />
                                </Fab>
                            </Box>

                            {/* Lokasyon Seçimi */}
                            <Box sx={{ position: 'relative' }}>
                                <FormControl fullWidth error={!!errors.lokasyon_id}>
                                    <InputLabel>Lokasyon *</InputLabel>
                                    <Select
                                        value={formData.lokasyon_id}
                                        label="Lokasyon *"
                                        onChange={(e) => handleInputChange('lokasyon_id', e.target.value)}
                                        disabled={loading}
                                    >
                                        {lokasyonlar.map(lokasyon => (
                                            <MenuItem key={lokasyon.id} value={lokasyon.id}>
                                                {lokasyon.lokasyon_adi}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.lokasyon_id && (
                                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                                            {errors.lokasyon_id}
                                        </Typography>
                                    )}
                                </FormControl>
                                
                                {/* Lokasyon Ekle Fab Butonu */}
                                <Fab
                                    size="small"
                                    color="primary"
                                    onClick={() => setShowLokasyonModal(true)}
                                    disabled={loading}
                                    sx={{
                                        position: 'absolute',
                                        right: -8,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        zIndex: 1,
                                        width: 32,
                                        height: 32,
                                        minHeight: 32
                                    }}
                                >
                                    <AddIcon sx={{ fontSize: 16 }} />
                                </Fab>
                            </Box>

                            {/* Tarih ve Saat */}
                            <DateTimePicker
                                label="Tarih ve Saat *"
                                value={formData.tarih}
                                onChange={(newValue) => handleInputChange('tarih', newValue)}
                                disabled={loading}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        error: !!errors.tarih,
                                        helperText: errors.tarih
                                    }
                                }}
                            />

                            {/* Açıklama */}
                            <TextField
                                label="Açıklama"
                                multiline
                                rows={3}
                                value={formData.aciklama}
                                onChange={(e) => handleInputChange('aciklama', e.target.value)}
                                disabled={loading}
                                fullWidth
                                placeholder="Sevkiyat ile ilgili açıklama..."
                            />

                            {/* Kalem Seçimi Bölümü */}
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                                    Kalem Bilgileri
                                </Typography>
                                
                                {/* Stok Kartı Seçimi */}
                                <Card sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
                                    <CardContent sx={{ p: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <InventoryIcon fontSize="small" />
                                                Malzeme Stok Kartı
                                            </Typography>
                                            {kalemData.secilen_stok_karti && (
                                                <IconButton 
                                                    size="small" 
                                                    color="error"
                                                    onClick={handleKalemTemizle}
                                                >
                                                    <ClearIcon />
                                                </IconButton>
                                            )}
                                        </Box>

                                        {kalemData.secilen_stok_karti ? (
                                            <Card sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                                                <CardContent sx={{ p: 2 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                                        {kalemData.secilen_stok_karti.olculeriFormatted || kalemData.secilen_stok_karti.kesit}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        <strong>Malzeme:</strong> {kalemData.secilen_stok_karti.malzeme_cinsi}
                                                    </Typography>
                                                    {kalemData.secilen_stok_karti.adet !== undefined && (
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            <strong>Stok:</strong> {kalemData.secilen_stok_karti.adet} adet
                                                        </Typography>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ) : (
                                            <Button
                                                variant="outlined"
                                                fullWidth
                                                startIcon={<SearchIcon />}
                                                onClick={() => setStokKartiModalOpen(true)}
                                                disabled={loading || kalemData.kalem_tipi === 'parca'}
                                            >
                                                Stok Kartı Seç
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* VEYA Ayırıcı */}
                                <Box sx={{ textAlign: 'center', my: 2 }}>
                                    <Chip label="VEYA" variant="outlined" />
                                </Box>

                                {/* Parça Seçimi */}
                                <Card sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
                                    <CardContent sx={{ p: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <BuildIcon fontSize="small" />
                                                Parça
                                            </Typography>
                                            {kalemData.secilen_parca && (
                                                <IconButton 
                                                    size="small" 
                                                    color="error"
                                                    onClick={handleKalemTemizle}
                                                >
                                                    <ClearIcon />
                                                </IconButton>
                                            )}
                                        </Box>

                                        {kalemData.secilen_parca ? (
                                            <Card sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                                                <CardContent sx={{ p: 2 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                                        {kalemData.secilen_parca.parcaKodu}
                                                    </Typography>
                                                    {kalemData.secilen_parca.parcaAdi && (
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            {kalemData.secilen_parca.parcaAdi}
                                                        </Typography>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ) : (
                                            <Button
                                                variant="outlined"
                                                fullWidth
                                                startIcon={<SearchIcon />}
                                                onClick={() => setParcaSecimModalOpen(true)}
                                                disabled={loading || kalemData.kalem_tipi === 'stok_karti'}
                                            >
                                                Parça Seç
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Adet Girişi */}
                                {(kalemData.secilen_stok_karti || kalemData.secilen_parca) && (
                                    <TextField
                                        label="Adet"
                                        type="number"
                                        value={kalemData.adet}
                                        onChange={(e) => setKalemData({
                                            ...kalemData,
                                            adet: parseInt(e.target.value) || 1
                                        })}
                                        inputProps={{ min: 1 }}
                                        fullWidth
                                        disabled={loading}
                                        size="small"
                                        sx={{ mt: 2 }}
                                    />
                                )}
                            </Box>

                            {/* Yeni sevkiyat için resim ekleme bilgisi */}
                            {!sevkiyat && (
                                <Alert severity="info">
                                    <Typography variant="body2">
                                        <strong>İpucu:</strong> Sevkiyat kaydedildikten sonra resim ekleme seçeneği sunulacak.
                                    </Typography>
                                </Alert>
                            )}

                            {/* Bilgi Kartı (Düzenleme modunda) */}
                            {sevkiyat && (
                                <>
                                    <Alert severity="info">
                                        <Typography variant="subtitle2" gutterBottom>
                                            Sevkiyat Bilgileri
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Sevkiyat No:</strong> {sevkiyat.sevkiyat_no}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Oluşturulma:</strong> {new Date(sevkiyat.olusturulma_tarihi).toLocaleString('tr-TR')}
                                        </Typography>
                                        {sevkiyat.guncelleme_tarihi && (
                                            <Typography variant="body2">
                                                <strong>Son Güncelleme:</strong> {new Date(sevkiyat.guncelleme_tarihi).toLocaleString('tr-TR')}
                                            </Typography>
                                        )}
                                    </Alert>
                                    
                                    {/* Resim Yönetimi Butonu */}
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        startIcon={<ImageIcon />}
                                        onClick={() => setShowResimModal(true)}
                                        disabled={loading}
                                        sx={{ mt: 2 }}
                                    >
                                        Resim Yönetimi
                                    </Button>
                                </>
                            )}
                        </Box>
                    </LocalizationProvider>
                </DialogContent>

                <Divider />

                {/* Actions */}
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button 
                        onClick={handleClose} 
                        disabled={loading}
                        variant="outlined"
                        fullWidth
                    >
                        İptal
                    </Button>
                    <Button 
                        onClick={handleSubmit}
                        disabled={loading}
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
                        fullWidth
                    >
                        {loading ? 'Kaydediliyor...' : (sevkiyat ? 'Güncelle' : 'Kaydet')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Firma Ekleme Modal */}
            <FirmaEkleMobilModal
                open={showFirmaModal}
                onClose={() => setShowFirmaModal(false)}
                onSuccess={handleFirmaEklendi}
                onError={onError}
            />

            {/* Lokasyon Ekleme Modal */}
            <LokasyonEkleMobilModal
                open={showLokasyonModal}
                onClose={() => setShowLokasyonModal(false)}
                onSuccess={handleLokasyonEklendi}
                onError={onError}
            />

            {/* Resim Yönetimi Modal */}
            {(sevkiyat || kaydedilenSevkiyat) && (
                <SevkiyatResimModalMobile
                    open={showResimModal}
                    onClose={() => {
                        setShowResimModal(false);
                        if (kaydedilenSevkiyat) {
                            // Yeni sevkiyat için resim modal'ı kapandığında ana modal'ı da kapat
                            handleClose();
                        }
                    }}
                    sevkiyat={sevkiyat || kaydedilenSevkiyat}
                    onSuccess={() => {
                        // Resim işlemi başarılı mesajı göster
                    }}
                    onError={onError}
                />
            )}

            {/* Stok Kartı Seçim Modal */}
            <MobilStokKartiSecici
                open={stokKartiModalOpen}
                onClose={() => setStokKartiModalOpen(false)}
                onSelect={handleStokKartiSec}
                aramaMetni=""
                currentParca={null}
            />

            {/* Parça Seçim Modal */}
            <MobilParcaSecici
                open={parcaSecimModalOpen}
                onClose={() => setParcaSecimModalOpen(false)}
                onSelect={handleParcaSec}
                aramaMetni=""
                currentParca={null}
            />
        </>
    );
};

export default SevkiyatFormMobile;
