// Mobil Firma Yönetim Modal Bileşeni
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Typography,
    Box,
    Fab,
    Chip,
    CircularProgress,
    Alert,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Divider,
    Paper
} from '@mui/material';
import {
    Close as CloseIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ToggleOn as ToggleOnIcon,
    ToggleOff as ToggleOffIcon,
    FilterList as FilterIcon,
    Business as BusinessIcon
} from '@mui/icons-material';
import axios from 'axios';
import FirmaEkleMobilModal from './FirmaEkleMobilModal';


import apiClient from '../../utils/apiClient';const FirmaYonetimMobilModal = ({ open, onClose, onSuccess, onError }) => {
    const [firmalar, setFirmalar] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showFirmaEkleModal, setShowFirmaEkleModal] = useState(false);
    const [editingFirma, setEditingFirma] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        tip: '',
        aktif: ''
    });

    // API URL'sini localStorage'dan al veya varsayılan olarak yerel IP adresini kullan
    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
    console.log('FirmaYonetimMobilModal içinde API_BASE_URL:', API_BASE_URL);

    useEffect(() => {
        if (open) {
            loadFirmalar();
        }
    }, [open, filters]);

    const loadFirmalar = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.tip) params.append('tip', filters.tip);
            if (filters.aktif) params.append('aktif', filters.aktif);
            
            const response = await axios.get(`${API_BASE_URL}/firmalar?${params}`);
            setFirmalar(response.data.data || response.data);
        } catch (err) {
            console.error('Firmalar yüklenirken hata:', err);
            onError('Firmalar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (firma) => {
        setEditingFirma(firma);
        setShowFirmaEkleModal(true);
    };

    const handleDelete = async (id, firmaAdi) => {
        if (!window.confirm(`"${firmaAdi}" firmasını silmek istediğinizden emin misiniz?`)) {
            return;
        }

        try {
            await axios.delete(`${API_BASE_URL}/firmalar/${id}`);
            onSuccess();
            loadFirmalar();
        } catch (err) {
            console.error('Firma silinirken hata:', err);
            onError(err.response?.data?.error || 'Firma silinemedi');
        }
    };

    const handleToggleAktif = async (id, currentAktif) => {
        try {
            await axios.patch(`${API_BASE_URL}/firmalar/${id}/durum`, { durum: currentAktif ? 'pasif' : 'aktif' });
            onSuccess();
            loadFirmalar();
        } catch (err) {
            console.error('Firma durumu değiştirilirken hata:', err);
            onError('Firma durumu değiştirilemedi');
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const clearFilters = () => {
        setFilters({ tip: '', aktif: '' });
    };

    const getTipChip = (tip) => {
        return (
            <Chip
                size="small"
                label={tip === 'ic' ? 'İç' : 'Dış'}
                color={tip === 'ic' ? 'success' : 'primary'}
            />
        );
    };

    const getAktifChip = (aktif) => {
        return (
            <Chip
                size="small"
                label={aktif ? 'Aktif' : 'Pasif'}
                color={aktif ? 'success' : 'default'}
            />
        );
    };

    const handleClose = () => {
        setFilters({ tip: '', aktif: '' });
        setShowFilters(false);
        onClose();
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
                    <Box display="flex" alignItems="center" gap={1}>
                        <BusinessIcon />
                        <Typography variant="h6">Firma Yönetimi</Typography>
                    </Box>
                    <Box>
                        <IconButton 
                            onClick={() => setShowFilters(!showFilters)}
                            color={showFilters ? "primary" : "default"}
                        >
                            <FilterIcon />
                        </IconButton>
                        <IconButton onClick={handleClose}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <Divider />

                {/* Filters */}
                {showFilters && (
                    <Paper sx={{ m: 2, p: 2 }} elevation={2}>
                        <Typography variant="subtitle2" gutterBottom>
                            Filtreler
                        </Typography>
                        <Box display="flex" flexDirection="column" gap={2}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Firma Tipi</InputLabel>
                                <Select
                                    value={filters.tip}
                                    label="Firma Tipi"
                                    onChange={(e) => handleFilterChange('tip', e.target.value)}
                                >
                                    <MenuItem value="">Tümü</MenuItem>
                                    <MenuItem value="ic">İç Firma</MenuItem>
                                    <MenuItem value="dis">Dış Firma</MenuItem>
                                </Select>
                            </FormControl>
                            
                            <FormControl fullWidth size="small">
                                <InputLabel>Durum</InputLabel>
                                <Select
                                    value={filters.aktif}
                                    label="Durum"
                                    onChange={(e) => handleFilterChange('aktif', e.target.value)}
                                >
                                    <MenuItem value="">Tümü</MenuItem>
                                    <MenuItem value="true">Aktif</MenuItem>
                                    <MenuItem value="false">Pasif</MenuItem>
                                </Select>
                            </FormControl>
                            
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={clearFilters}
                                fullWidth
                            >
                                Filtreleri Temizle
                            </Button>
                        </Box>
                    </Paper>
                )}

                {/* Content */}
                <DialogContent sx={{ p: 0, flex: 1 }}>
                    {loading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                            <CircularProgress />
                        </Box>
                    ) : (
                        <List sx={{ width: '100%' }}>
                            {firmalar.length === 0 ? (
                                <ListItem>
                                    <ListItemText
                                        primary="Firma bulunamadı"
                                        secondary="Henüz firma eklenmemiş veya filtre kriterleri ile eşleşen firma yok"
                                    />
                                </ListItem>
                            ) : (
                                firmalar.map((firma, index) => (
                                    <React.Fragment key={firma.id}>
                                        <ListItem sx={{ py: 2 }}>
                                            <ListItemText
                                                primary={
                                                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                                        <Typography variant="subtitle1" fontWeight="bold">
                                                            {firma.firma_adi}
                                                        </Typography>
                                                        {getTipChip(firma.tip)}
                                                        {getAktifChip(firma.aktif)}
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box>
                                                        {firma.telefon && (
                                                            <Typography variant="caption" display="block">
                                                                Tel: {firma.telefon}
                                                            </Typography>
                                                        )}
                                                        {firma.yetkili_kisi && (
                                                            <Typography variant="caption" display="block">
                                                                Yetkili: {firma.yetkili_kisi}
                                                            </Typography>
                                                        )}
                                                        {firma.adres && (
                                                            <Typography variant="caption" display="block" color="text.secondary">
                                                                {firma.adres.length > 50 ? 
                                                                    `${firma.adres.substring(0, 50)}...` : 
                                                                    firma.adres
                                                                }
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                }
                                            />
                                            <ListItemSecondaryAction>
                                                <Box display="flex" gap={0.5}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleEdit(firma)}
                                                        color="primary"
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleToggleAktif(firma.id, firma.aktif)}
                                                        color={firma.aktif ? "warning" : "success"}
                                                    >
                                                        {firma.aktif ? <ToggleOffIcon /> : <ToggleOnIcon />}
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDelete(firma.id, firma.firma_adi)}
                                                        color="error"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Box>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                        {index < firmalar.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))
                            )}
                        </List>
                    )}
                </DialogContent>

                {/* Floating Action Button */}
                <Fab
                    color="primary"
                    sx={{
                        position: 'fixed',
                        bottom: 80,
                        right: 16,
                        zIndex: 1000
                    }}
                    onClick={() => {
                        setEditingFirma(null);
                        setShowFirmaEkleModal(true);
                    }}
                >
                    <AddIcon />
                </Fab>

                {/* Actions */}
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleClose} variant="outlined" fullWidth>
                        Kapat
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Firma Ekleme/Düzenleme Modal */}
            <FirmaEkleMobilModal
                open={showFirmaEkleModal}
                onClose={() => {
                    setShowFirmaEkleModal(false);
                    setEditingFirma(null);
                }}
                firma={editingFirma}
                onSuccess={() => {
                    onSuccess();
                    loadFirmalar();
                }}
                onError={onError}
            />
        </>
    );
};

export default FirmaYonetimMobilModal;
