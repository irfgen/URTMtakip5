// Mobil Lokasyon Yönetim Modal Bileşeni
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
    LocationOn as LocationIcon
} from '@mui/icons-material';
import axios from 'axios';
import LokasyonEkleMobilModal from './LokasyonEkleMobilModal';


import apiClient from '../../utils/apiClient';const LokasyonYonetimMobilModal = ({ open, onClose, onSuccess, onError }) => {
    const [lokasyonlar, setLokasyonlar] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showLokasyonEkleModal, setShowLokasyonEkleModal] = useState(false);
    const [editingLokasyon, setEditingLokasyon] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        tip: '',
        aktif: ''
    });

    // API URL'sini localStorage'dan al veya varsayılan olarak yerel IP adresini kullan
    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
    console.log('LokasyonYonetimMobilModal içinde API_BASE_URL:', API_BASE_URL);

    useEffect(() => {
        if (open) {
            loadLokasyonlar();
        }
    }, [open, filters]);

    const loadLokasyonlar = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.tip) params.append('tip', filters.tip);
            if (filters.aktif) params.append('aktif', filters.aktif);
            
            const response = await axios.get(`${API_BASE_URL}/sevkiyat/lokasyonlar?${params}`);
            setLokasyonlar(response.data);
        } catch (err) {
            console.error('Lokasyonlar yüklenirken hata:', err);
            onError('Lokasyonlar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (lokasyon) => {
        setEditingLokasyon(lokasyon);
        setShowLokasyonEkleModal(true);
    };

    const handleDelete = async (id, lokasyonAdi) => {
        if (!window.confirm(`"${lokasyonAdi}" lokasyonunu silmek istediğinizden emin misiniz?`)) {
            return;
        }

        try {
            await axios.delete(`${API_BASE_URL}/sevkiyat/lokasyonlar/${id}`);
            onSuccess();
            loadLokasyonlar();
        } catch (err) {
            console.error('Lokasyon silinirken hata:', err);
            onError(err.response?.data?.error || 'Lokasyon silinemedi');
        }
    };

    const handleToggleAktif = async (id) => {
        try {
            await axios.put(`${API_BASE_URL}/sevkiyat/lokasyonlar/${id}/toggle-aktif`);
            onSuccess();
            loadLokasyonlar();
        } catch (err) {
            console.error('Lokasyon durumu değiştirilirken hata:', err);
            onError('Lokasyon durumu değiştirilemedi');
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
                        <LocationIcon />
                        <Typography variant="h6">Lokasyon Yönetimi</Typography>
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
                                <InputLabel>Lokasyon Tipi</InputLabel>
                                <Select
                                    value={filters.tip}
                                    label="Lokasyon Tipi"
                                    onChange={(e) => handleFilterChange('tip', e.target.value)}
                                >
                                    <MenuItem value="">Tümü</MenuItem>
                                    <MenuItem value="ic">İç Lokasyon</MenuItem>
                                    <MenuItem value="dis">Dış Lokasyon</MenuItem>
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
                            {lokasyonlar.length === 0 ? (
                                <ListItem>
                                    <ListItemText
                                        primary="Lokasyon bulunamadı"
                                        secondary="Henüz lokasyon eklenmemiş veya filtre kriterleri ile eşleşen lokasyon yok"
                                    />
                                </ListItem>
                            ) : (
                                lokasyonlar.map((lokasyon, index) => (
                                    <React.Fragment key={lokasyon.id}>
                                        <ListItem sx={{ py: 2 }}>
                                            <ListItemText
                                                primary={
                                                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                                        <Typography variant="subtitle1" fontWeight="bold">
                                                            {lokasyon.lokasyon_adi}
                                                        </Typography>
                                                        {getTipChip(lokasyon.tip)}
                                                        {getAktifChip(lokasyon.aktif)}
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box>
                                                        {lokasyon.adres && (
                                                            <Typography variant="caption" display="block" color="text.secondary">
                                                                {lokasyon.adres.length > 50 ? 
                                                                    `${lokasyon.adres.substring(0, 50)}...` : 
                                                                    lokasyon.adres
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
                                                        onClick={() => handleEdit(lokasyon)}
                                                        color="primary"
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleToggleAktif(lokasyon.id)}
                                                        color={lokasyon.aktif ? "warning" : "success"}
                                                    >
                                                        {lokasyon.aktif ? <ToggleOffIcon /> : <ToggleOnIcon />}
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDelete(lokasyon.id, lokasyon.lokasyon_adi)}
                                                        color="error"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Box>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                        {index < lokasyonlar.length - 1 && <Divider />}
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
                        setEditingLokasyon(null);
                        setShowLokasyonEkleModal(true);
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

            {/* Lokasyon Ekleme/Düzenleme Modal */}
            <LokasyonEkleMobilModal
                open={showLokasyonEkleModal}
                onClose={() => {
                    setShowLokasyonEkleModal(false);
                    setEditingLokasyon(null);
                }}
                lokasyon={editingLokasyon}
                onSuccess={() => {
                    onSuccess();
                    loadLokasyonlar();
                }}
                onError={onError}
            />
        </>
    );
};

export default LokasyonYonetimMobilModal;
