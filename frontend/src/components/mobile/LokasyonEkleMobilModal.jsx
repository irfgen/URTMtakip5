// Mobil Lokasyon Ekleme Modal Bileşeni
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


import apiClient from '../../utils/apiClient';const LokasyonEkleMobilModal = ({ open, onClose, onSuccess, onError, lokasyon }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        lokasyon_adi: '',
        tip: 'ic',
        adres: '',
        aktif: true
    });
    const [errors, setErrors] = useState({});

    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

    // Form verilerini lokasyon prop'una göre ayarla
    useEffect(() => {
        if (open) {
            if (lokasyon) {
                // Düzenleme modu
                setFormData({
                    lokasyon_adi: lokasyon.lokasyon_adi,
                    tip: lokasyon.tip,
                    adres: lokasyon.adres || '',
                    aktif: lokasyon.aktif
                });
            } else {
                // Yeni ekleme modu
                setFormData({
                    lokasyon_adi: '',
                    tip: 'ic',
                    adres: '',
                    aktif: true
                });
            }
            setErrors({});
        }
    }, [open, lokasyon]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Hata varsa temizle
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.lokasyon_adi.trim()) {
            newErrors.lokasyon_adi = 'Lokasyon adı zorunludur';
        }

        if (!formData.tip) {
            newErrors.tip = 'Lokasyon tipi seçiniz';
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
            if (lokasyon) {
                // Güncelleme
                await axios.put(`${API_BASE_URL}/sevkiyat/lokasyonlar/${lokasyon.id}`, formData);
            } else {
                // Yeni ekleme
                await axios.post(`${API_BASE_URL}/sevkiyat/lokasyonlar`, formData);
            }
            onSuccess();
            handleClose();
        } catch (err) {
            console.error('Lokasyon oluşturulurken hata:', err);
            onError(err.response?.data?.error || 'Lokasyon oluşturulamadı');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setFormData({
                lokasyon_adi: '',
                tip: 'ic',
                adres: '',
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
                {lokasyon ? 'Lokasyon Düzenle' : 'Yeni Lokasyon Ekle'}
                <IconButton onClick={handleClose} disabled={loading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Divider />

            {/* Content */}
            <DialogContent sx={{ p: 2 }}>
                <Box display="flex" flexDirection="column" gap={3}>
                    {/* Lokasyon Adı */}
                    <TextField
                        label="Lokasyon Adı *"
                        value={formData.lokasyon_adi}
                        onChange={(e) => handleInputChange('lokasyon_adi', e.target.value)}
                        disabled={loading}
                        fullWidth
                        error={!!errors.lokasyon_adi}
                        helperText={errors.lokasyon_adi}
                        placeholder="Lokasyon adını giriniz"
                    />

                    {/* Lokasyon Tipi */}
                    <FormControl fullWidth error={!!errors.tip}>
                        <InputLabel>Lokasyon Tipi *</InputLabel>
                        <Select
                            value={formData.tip}
                            label="Lokasyon Tipi *"
                            onChange={(e) => handleInputChange('tip', e.target.value)}
                            disabled={loading}
                        >
                            <MenuItem value="ic">İç Lokasyon</MenuItem>
                            <MenuItem value="dis">Dış Lokasyon</MenuItem>
                        </Select>
                        {errors.tip && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                                {errors.tip}
                            </Typography>
                        )}
                    </FormControl>

                    {/* Adres */}
                    <TextField
                        label="Adres"
                        multiline
                        rows={3}
                        value={formData.adres}
                        onChange={(e) => handleInputChange('adres', e.target.value)}
                        disabled={loading}
                        fullWidth
                        placeholder="Lokasyon adresi..."
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
                        label="Lokasyon aktif durumda"
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
                    {loading ? 'Kaydediliyor...' : (lokasyon ? 'Lokasyon Güncelle' : 'Lokasyon Ekle')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default LokasyonEkleMobilModal;
