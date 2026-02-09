// Mobil Firma Ekleme Modal Bileşeni
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
    IconButton,
    Typography,
    Divider,
    FormControlLabel,
    Switch
} from '@mui/material';
import {
    Close as CloseIcon,
    Save as SaveIcon
} from '@mui/icons-material';
import axios from 'axios';


import apiClient from '../../utils/apiClient';const FirmaEkleMobilModal = ({ open, onClose, onSuccess, onError, firma }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firma_adi: '',
        tip: 'dis',
        adres: '',
        telefon: '',
        yetkili_kisi: '',
        aktif: true
    });
    const [errors, setErrors] = useState({});

    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

    // Form verilerini firma prop'una göre ayarla
    useEffect(() => {
        if (open) {
            if (firma) {
                // Düzenleme modu
                setFormData({
                    firma_adi: firma.firma_adi,
                    tip: firma.tip,
                    adres: firma.adres || '',
                    telefon: firma.telefon || '',
                    yetkili_kisi: firma.yetkili_kisi || '',
                    aktif: firma.aktif
                });
            } else {
                // Yeni ekleme modu
                setFormData({
                    firma_adi: '',
                    tip: 'dis',
                    adres: '',
                    telefon: '',
                    yetkili_kisi: '',
                    aktif: true
                });
            }
            setErrors({});
        }
    }, [open, firma]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Hata varsa temizle
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.firma_adi.trim()) {
            newErrors.firma_adi = 'Firma adı zorunludur';
        }

        if (!formData.tip) {
            newErrors.tip = 'Firma tipi seçiniz';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            if (firma) {
                // Güncelleme
                await axios.put(`${API_BASE_URL}/firmalar/${firma.id}`, formData);
            } else {
                // Yeni ekleme
                await axios.post(`${API_BASE_URL}/firmalar`, formData);
            }
            onSuccess();
            handleClose();
        } catch (err) {
            console.error('Firma oluşturulurken hata:', err);
            onError(err.response?.data?.error || 'Firma oluşturulamadı');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setFormData({
                firma_adi: '',
                tip: 'dis',
                adres: '',
                telefon: '',
                yetkili_kisi: '',
                aktif: true
            });
            setErrors({});
            onClose();
        }
    };

    return (
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
                {firma ? 'Firma Düzenle' : 'Yeni Firma Ekle'}
                <IconButton onClick={handleClose} disabled={loading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Divider />

            {/* Content */}
            <DialogContent sx={{ p: 2 }}>
                <Box display="flex" flexDirection="column" gap={3}>
                    {/* Firma Adı */}
                    <TextField
                        label="Firma Adı *"
                        value={formData.firma_adi}
                        onChange={(e) => handleInputChange('firma_adi', e.target.value)}
                        disabled={loading}
                        fullWidth
                        error={!!errors.firma_adi}
                        helperText={errors.firma_adi}
                        placeholder="Firma adını giriniz"
                    />

                    {/* Firma Tipi */}
                    <FormControl fullWidth error={!!errors.tip}>
                        <InputLabel>Firma Tipi *</InputLabel>
                        <Select
                            value={formData.tip || 'dis'}
                            label="Firma Tipi *"
                            onChange={(e) => handleInputChange('tip', e.target.value)}
                            disabled={loading}
                        >
                            <MenuItem value="ic">İç Firma</MenuItem>
                            <MenuItem value="dis">Dış Firma</MenuItem>
                        </Select>
                        {errors.tip && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                                {errors.tip}
                            </Typography>
                        )}
                    </FormControl>

                    {/* Telefon */}
                    <TextField
                        label="Telefon"
                        type="tel"
                        value={formData.telefon}
                        onChange={(e) => handleInputChange('telefon', e.target.value)}
                        disabled={loading}
                        fullWidth
                        placeholder="0212 555 0000"
                    />

                    {/* Yetkili Kişi */}
                    <TextField
                        label="Yetkili Kişi"
                        value={formData.yetkili_kisi}
                        onChange={(e) => handleInputChange('yetkili_kisi', e.target.value)}
                        disabled={loading}
                        fullWidth
                        placeholder="Yetkili kişi adı"
                    />

                    {/* Adres */}
                    <TextField
                        label="Adres"
                        multiline
                        rows={3}
                        value={formData.adres}
                        onChange={(e) => handleInputChange('adres', e.target.value)}
                        disabled={loading}
                        fullWidth
                        placeholder="Firma adresi..."
                    />

                    {/* Aktif Durum */}
                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.aktif}
                                onChange={(e) => handleInputChange('aktif', e.target.checked)}
                                disabled={loading}
                            />
                        }
                        label="Firma aktif durumda"
                    />
                </Box>
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
                    {loading ? 'Kaydediliyor...' : (firma ? 'Firma Güncelle' : 'Firma Ekle')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default FirmaEkleMobilModal;
