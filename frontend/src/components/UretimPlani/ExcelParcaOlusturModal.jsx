import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Autocomplete,
    Box,
    Typography,
    Alert,
    Chip,
    CircularProgress,
    Grid,
    Card,
    CardContent
} from '@mui/material';
import {
    Save as SaveIcon,
    AutoFixHigh as AutoIcon,
    Engineering as EngineeringIcon
} from '@mui/icons-material';
import axios from 'axios';

const ExcelParcaOlusturModal = ({ 
    open, 
    onClose, 
    parcaDetay, 
    onSuccess 
}) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [stokKartlari, setStokKartlari] = useState([]);
    const [materialSuggestions, setMaterialSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        parcaKodu: '',
        parcaAdi: '',
        hamMalzemeCinsi: '',
        hamMalzemeOlculeri: '',
        uzunluk: '',
        imalMi: true,
        stok_karti_id: null,
        aciklama: ''
    });

    // Modal açıldığında form'u initialize et
    useEffect(() => {
        if (open && parcaDetay) {
            setFormData({
                parcaKodu: parcaDetay.parcaAdi || '',
                parcaAdi: parcaDetay.parcaAdi || '',
                hamMalzemeCinsi: parcaDetay.malzeme || '',
                hamMalzemeOlculeri: parcaDetay.kesit || '',
                uzunluk: parcaDetay.boy ? parseFloat(parcaDetay.boy) : '',
                imalMi: true,
                stok_karti_id: null,
                aciklama: `Excel'den otomatik oluşturuldu - Adet: ${parcaDetay.adet}`
            });
            
            // Stok kartlarını ve önerileri yükle
            loadStokKartlari();
            loadMaterialSuggestions();
        }
    }, [open, parcaDetay]);

    // Stok kartlarını yükle
    const loadStokKartlari = async () => {
        try {
            const response = await axios.get('/api/stok-kartlari');
            if (response.data.success) {
                setStokKartlari(response.data.data || []);
            }
        } catch (error) {
            console.error('Stok kartları yüklenemedi:', error);
        }
    };

    // Ham malzeme önerilerini yükle
    const loadMaterialSuggestions = async () => {
        if (!parcaDetay) return;

        setLoadingSuggestions(true);
        try {
            const params = new URLSearchParams();
            if (parcaDetay.kesit) params.append('kesit', parcaDetay.kesit);
            if (parcaDetay.boy) params.append('boy', parcaDetay.boy);
            if (parcaDetay.malzeme) params.append('malzeme', parcaDetay.malzeme);

            const response = await axios.get(
                `/api/parcalar/${encodeURIComponent(parcaDetay.parcaAdi)}/suggest-ham-malzeme?${params}`
            );

            if (response.data.success) {
                setMaterialSuggestions(response.data.suggestions || []);
            }
        } catch (error) {
            console.error('Ham malzeme önerileri yüklenemedi:', error);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    // Form alanı değişikliği
    const handleInputChange = (field) => (event) => {
        const value = event.target.value;
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // İmal mi radio button değişikliği
    const handleImalMiChange = (event) => {
        setFormData(prev => ({
            ...prev,
            imalMi: event.target.value === 'true'
        }));
    };

    // Stok kartı seçimi
    const handleStokKartiChange = (event, newValue) => {
        setFormData(prev => ({
            ...prev,
            stok_karti_id: newValue?.stok_karti_id || null
        }));
    };

    // Öneriyi uygula
    const applySuggestion = (suggestion) => {
        setFormData(prev => ({
            ...prev,
            stok_karti_id: suggestion.stok_karti_id,
            hamMalzemeCinsi: suggestion.malzeme_cinsi,
            hamMalzemeOlculeri: suggestion.kesit
        }));
    };

    // Form validasyonu
    const validateForm = () => {
        if (!formData.parcaKodu.trim()) {
            setError('Parça kodu gereklidir');
            return false;
        }
        // Diğer tüm alanlar isteğe bağlı
        return true;
    };

    // Parçayı kaydet
    const handleSave = async () => {
        if (!validateForm()) return;

        setSaving(true);
        setError(null);

        try {
            const parcaData = {
                parcaKodu: formData.parcaKodu,
                parcaAdi: formData.parcaAdi?.trim() || null,
                hamMalzemeCinsi: formData.hamMalzemeCinsi?.trim() || null,
                hamMalzemeOlculeri: formData.hamMalzemeOlculeri?.trim() || null,
                uzunluk: formData.uzunluk ? parseFloat(formData.uzunluk) : null,
                imalMi: formData.imalMi,
                stok_karti_id: formData.stok_karti_id || null,
                aciklama: formData.aciklama?.trim() || null
            };

            const response = await axios.post('/api/parcalar', parcaData);

            if (response.data) {
                // Başarı callback'ini çağır
                if (onSuccess) {
                    onSuccess({
                        ...response.data,
                        parcaKodu: formData.parcaKodu,
                        parcaAdi: formData.parcaAdi
                    });
                }
                
                // Modal'ı kapat
                handleClose();
            }
        } catch (error) {
            console.error('Parça kaydedilemedi:', error);
            setError(
                error.response?.data?.error || 
                error.response?.data?.message || 
                'Parça kaydedilirken bir hata oluştu'
            );
        } finally {
            setSaving(false);
        }
    };

    // Modal'ı kapat
    const handleClose = () => {
        setFormData({
            parcaKodu: '',
            parcaAdi: '',
            hamMalzemeCinsi: '',
            hamMalzemeOlculeri: '',
            uzunluk: '',
            imalMi: true,
            stok_karti_id: null,
            aciklama: ''
        });
        setError(null);
        setMaterialSuggestions([]);
        onClose();
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleClose} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
                sx: { minHeight: '70vh' }
            }}
        >
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <EngineeringIcon color="primary" />
                    <Typography variant="h6">
                        Yeni Parça Oluştur
                    </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Excel'den okunan parça için yeni kayıt oluşturuluyor
                </Typography>
            </DialogTitle>

            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    {/* Sol taraf - Form alanları */}
                    <Grid item xs={12} md={8}>
                        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Parça Kodu */}
                            <TextField
                                label="Parça Kodu"
                                value={formData.parcaKodu}
                                onChange={handleInputChange('parcaKodu')}
                                required
                                disabled={saving}
                                helperText="Excel'den alınan parça adı (değiştirilebilir)"
                            />

                            {/* Parça Adı */}
                            <TextField
                                label="Parça Adı (İsteğe bağlı)"
                                value={formData.parcaAdi}
                                onChange={handleInputChange('parcaAdi')}
                                disabled={saving}
                                placeholder="Boş bırakılabilir"
                            />

                            {/* Ham Malzeme Ölçüleri */}
                            <TextField
                                label="Ham Malzeme Ölçüleri"
                                value={formData.hamMalzemeOlculeri}
                                onChange={handleInputChange('hamMalzemeOlculeri')}
                                disabled={saving}
                                placeholder="örn: 40X25, 30X20"
                                helperText="Excel'den alınan kesit bilgisi"
                            />

                            {/* Uzunluk */}
                            <TextField
                                label="Uzunluk (mm)"
                                type="number"
                                value={formData.uzunluk}
                                onChange={handleInputChange('uzunluk')}
                                disabled={saving}
                                helperText="Excel'den alınan boy bilgisi"
                            />

                            {/* Ham Malzeme Cinsi */}
                            <TextField
                                label="Ham Malzeme Cinsi"
                                value={formData.hamMalzemeCinsi}
                                onChange={handleInputChange('hamMalzemeCinsi')}
                                disabled={saving}
                                placeholder="örn: Soğuk Çekilmiş ST37"
                                helperText="Excel'den alınan malzeme bilgisi"
                            />

                            {/* İmal Mi */}
                            <FormControl component="fieldset">
                                <FormLabel component="legend">Üretim Tipi</FormLabel>
                                <RadioGroup
                                    value={formData.imalMi.toString()}
                                    onChange={handleImalMiChange}
                                    row
                                >
                                    <FormControlLabel 
                                        value="true" 
                                        control={<Radio />} 
                                        label="İmal Edilecek" 
                                        disabled={saving}
                                    />
                                    <FormControlLabel 
                                        value="false" 
                                        control={<Radio />} 
                                        label="Satın Alınacak" 
                                        disabled={saving}
                                    />
                                </RadioGroup>
                            </FormControl>

                            {/* Stok Kartı Seçimi */}
                            <Autocomplete
                                options={stokKartlari}
                                getOptionLabel={(option) => 
                                    `${option.stok_kodu || ''} - ${option.stok_adi || ''} (${option.olcu || ''})`
                                }
                                value={stokKartlari.find(sk => sk.stok_karti_id === formData.stok_karti_id) || null}
                                onChange={handleStokKartiChange}
                                disabled={saving}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Ham Malzeme Stok Kartı"
                                        helperText="Opsiyonel - Ham malzeme için stok kartı seçin"
                                    />
                                )}
                            />

                            {/* Açıklama */}
                            <TextField
                                label="Açıklama"
                                value={formData.aciklama}
                                onChange={handleInputChange('aciklama')}
                                disabled={saving}
                                multiline
                                rows={2}
                            />
                        </Box>
                    </Grid>

                    {/* Sağ taraf - Ham malzeme önerileri */}
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center" gap={1} mb={2}>
                                    <AutoIcon color="primary" />
                                    <Typography variant="h6">
                                        Akıllı Öneriler
                                    </Typography>
                                </Box>

                                {loadingSuggestions ? (
                                    <Box display="flex" justifyContent="center" p={2}>
                                        <CircularProgress size={24} />
                                    </Box>
                                ) : materialSuggestions.length > 0 ? (
                                    <Box>
                                        <Typography variant="body2" color="textSecondary" mb={1}>
                                            Parça bilgilerine göre önerilen ham malzemeler:
                                        </Typography>
                                        <Box display="flex" flexDirection="column" gap={1}>
                                            {materialSuggestions.slice(0, 3).map((suggestion, index) => (
                                                <Card 
                                                    key={index} 
                                                    variant="outlined" 
                                                    sx={{ 
                                                        cursor: 'pointer',
                                                        '&:hover': { bgcolor: 'action.hover' }
                                                    }}
                                                    onClick={() => applySuggestion(suggestion)}
                                                >
                                                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                                        <Typography variant="body2" fontWeight="bold">
                                                            {suggestion.kesit}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            {suggestion.malzeme_cinsi}
                                                        </Typography>
                                                        <Box mt={0.5}>
                                                            <Chip 
                                                                label={`${suggestion.score} puan`}
                                                                size="small"
                                                                color={suggestion.score >= 80 ? 'success' : 'warning'}
                                                            />
                                                        </Box>
                                                        <Typography variant="caption" display="block" mt={0.5}>
                                                            {suggestion.match_reason}
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </Box>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="textSecondary">
                                        Bu parça için öneri bulunamadı.
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>

                        {/* Excel Bilgileri */}
                        {parcaDetay && (
                            <Card sx={{ mt: 2 }}>
                                <CardContent>
                                    <Typography variant="h6" mb={1}>
                                        Excel Bilgileri
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Adet:</strong> {parcaDetay.adet}
                                    </Typography>
                                    {parcaDetay.kesit && (
                                        <Typography variant="body2">
                                            <strong>Kesit:</strong> {parcaDetay.kesit}
                                        </Typography>
                                    )}
                                    {parcaDetay.boy && (
                                        <Typography variant="body2">
                                            <strong>Boy:</strong> {parcaDetay.boy}
                                        </Typography>
                                    )}
                                    {parcaDetay.malzeme && (
                                        <Typography variant="body2">
                                            <strong>Malzeme:</strong> {parcaDetay.malzeme}
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions>
                <Button 
                    onClick={handleClose}
                    disabled={saving}
                >
                    İptal
                </Button>
                <Button 
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                >
                    {saving ? 'Kaydediliyor...' : 'Parçayı Kaydet'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ExcelParcaOlusturModal;
