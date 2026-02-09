import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchIsEmirleri } from '../../store/slices/isEmirleriSlice';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Button, Typography, Grid, Card, CardContent,
    CardMedia, Chip, Divider, Stack, Avatar, Alert,
    List, ListItem, ListItemText, ListItemIcon,
    CircularProgress, TextField, FormControl, InputLabel,
    Select, MenuItem, Fab
} from '@mui/material';
import {
    Build as BuildIcon,
    Inventory as InventoryIcon,
    Warning as WarningIcon,
    History as HistoryIcon,
    Add as AddIcon,
    Save as SaveIcon,
    Close as CloseIcon,
    Assignment as AssignmentIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import axios from 'axios';
import { isEmriDurumAPI } from '../../services/api';

const ParcaDetayModal = ({ open, onClose, parcaData, miktar = 1 }) => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [parcaDetay, setParcaDetay] = useState(null);
    const [isEmirFormAcik, setIsEmirFormAcik] = useState(false);
    const [isEmirLoading, setIsEmirLoading] = useState(false);
    const [isEmirData, setIsEmirData] = useState({
        is_adi: '',
        parca_id: '',
        miktar: 1,
        aciklama: '',
        teslim_tarihi: new Date().toISOString().split('T')[0]
    });

    // Parça detaylarını yükle
    useEffect(() => {
        if (open && parcaData?.parcaKodu) {
            fetchParcaDetay();
        }
    }, [open, parcaData]);

    const fetchParcaDetay = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/parcalar/${parcaData.parcaKodu}`);
            setParcaDetay(response.data);
            
            // İş emri formu için varsayılan değerleri ayarla
            setIsEmirData(prev => ({
                ...prev,
                parca_id: parcaData.parcaKodu,
                is_adi: `${parcaData.parcaAdi} - Üretim`,
                miktar: Math.max(0, parcaData.miktar - parcaData.stokMiktari) || parcaData.miktar
            }));
        } catch (error) {
            console.error('Parça detayı yüklenirken hata:', error);
            setParcaDetay(null);
        } finally {
            setLoading(false);
        }
    };

    const handleIsEmriOlustur = async () => {
        setIsEmirLoading(true);
        try {
            // Backend'den aktif durumları al ve doğru durumu belirle
            let durum = 'beklemede'; // Varsayılan
            try {
                const durumlarResponse = await isEmriDurumAPI.getAll();
                const durumlar = durumlarResponse.data || [];
                
                // Beklemede durumu ara
                const beklemedeDurum = durumlar.find(d => 
                    d.durum_kodu === 'beklemede' || 
                    d.durum_adi?.toLowerCase().includes('beklemede')
                );
                durum = beklemedeDurum ? beklemedeDurum.durum_kodu : 'beklemede';
                
                console.log('Seçilen durum (modal):', durum);
            } catch (durumError) {
                console.error('Durumlar alınırken hata (modal):', durumError);
                // Hata durumunda varsayılan değeri kullan
                durum = 'beklemede';
            }

            const response = await axios.post('/api/is-emirleri', {
                ...isEmirData,
                durum: durum,
                olusturma_tarihi: new Date().toISOString()
            });
            
            // Başarı mesajı göster
            alert('İş emri başarıyla oluşturuldu!');
            
            // İş emirleri listesini güncelle
            try {
                await dispatch(fetchIsEmirleri()).unwrap();
                console.log('İş emirleri listesi güncellendi');
            } catch (error) {
                console.error('İş emirleri listesi güncellenemedi:', error);
            }
            
            setIsEmirFormAcik(false);
            onClose();
        } catch (error) {
            console.error('İş emri oluşturulurken hata:', error);
            alert('İş emri oluşturulurken hata: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsEmirLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setIsEmirData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (!parcaData) return null;

    const eksikMiktar = Math.max(0, parcaData.miktar - parcaData.stokMiktari);
    const kritikDurum = parcaData.kritikStokUyarisi;

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { minHeight: '70vh' }
            }}
        >
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <InventoryIcon />
                    </Avatar>
                    <Box flexGrow={1}>
                        <Typography variant="h6" component="div">
                            {parcaData.parcaAdi}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Kod: {parcaData.parcaKodu}
                        </Typography>
                    </Box>
                    <Box display="flex" gap={1}>
                        {kritikDurum && (
                            <Chip 
                                icon={<WarningIcon />}
                                label="Kritik Stok" 
                                color="error" 
                                size="small"
                            />
                        )}
                        <Chip 
                            label={`Hiyerarşi: ${parcaData.path}`} 
                            variant="outlined" 
                            size="small"
                        />
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent>
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                        <CircularProgress />
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        {/* Sol Kolon - Stok Bilgileri */}
                        <Grid item xs={12} md={6}>
                            <Card variant="outlined" sx={{ mb: 2 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom color="primary">
                                        Stok Durumu
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Box textAlign="center" p={2}>
                                                <Typography variant="h4" color="primary">
                                                    {parcaData.stokMiktari || 0}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Mevcut Stok
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Box textAlign="center" p={2}>
                                                <Typography variant="h4" color="error">
                                                    {parcaData.miktar}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    İhtiyaç
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Box textAlign="center" p={2}>
                                                <Typography 
                                                    variant="h4" 
                                                    color={kritikDurum ? 'error' : 'success'}
                                                >
                                                    {parcaData.uretimSonrasiStok}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Üretim Sonrası
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Box textAlign="center" p={2}>
                                                <Typography variant="h4" color="warning.main">
                                                    {parcaData.kritikStokMiktari || 0}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Kritik Seviye
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            {kritikDurum && (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    <Typography variant="body2">
                                        Bu parça kritik stok seviyesinde! 
                                        {eksikMiktar > 0 && ` Eksik miktar: ${eksikMiktar}`}
                                    </Typography>
                                </Alert>
                            )}
                        </Grid>

                        {/* Sağ Kolon - Parça Detayları */}
                        <Grid item xs={12} md={6}>
                            {parcaDetay && (
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom color="primary">
                                            Parça Bilgileri
                                        </Typography>
                                        <List dense>
                                            <ListItem>
                                                <ListItemIcon>
                                                    <InfoIcon color="primary" />
                                                </ListItemIcon>
                                                <ListItemText 
                                                    primary="Parça Adı" 
                                                    secondary={parcaDetay.name || parcaDetay.parcaAdi}
                                                />
                                            </ListItem>
                                            <ListItem>
                                                <ListItemIcon>
                                                    <AssignmentIcon color="primary" />
                                                </ListItemIcon>
                                                <ListItemText 
                                                    primary="Parça Kodu" 
                                                    secondary={parcaDetay.id || parcaDetay.parcaKodu}
                                                />
                                            </ListItem>
                                            {parcaDetay.malzeme && (
                                                <ListItem>
                                                    <ListItemIcon>
                                                        <BuildIcon color="primary" />
                                                    </ListItemIcon>
                                                    <ListItemText 
                                                        primary="Malzeme" 
                                                        secondary={parcaDetay.malzeme}
                                                    />
                                                </ListItem>
                                            )}
                                            {parcaDetay.aciklama && (
                                                <ListItem>
                                                    <ListItemIcon>
                                                        <InfoIcon color="primary" />
                                                    </ListItemIcon>
                                                    <ListItemText 
                                                        primary="Açıklama" 
                                                        secondary={parcaDetay.aciklama}
                                                    />
                                                </ListItem>
                                            )}
                                        </List>
                                    </CardContent>
                                </Card>
                            )}
                        </Grid>

                        {/* İş Emri Oluşturma Formu */}
                        {isEmirFormAcik && (
                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Card variant="outlined" sx={{ bgcolor: 'background.paper' }}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom color="primary">
                                            İş Emri Oluştur
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    fullWidth
                                                    label="İş Adı"
                                                    value={isEmirData.is_adi}
                                                    onChange={(e) => handleInputChange('is_adi', e.target.value)}
                                                    required
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={3}>
                                                <TextField
                                                    fullWidth
                                                    label="Miktar"
                                                    type="number"
                                                    value={isEmirData.miktar}
                                                    onChange={(e) => handleInputChange('miktar', parseInt(e.target.value) || 0)}
                                                    required
                                                    inputProps={{ min: 1 }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={3}>
                                                <TextField
                                                    fullWidth
                                                    label="Teslim Tarihi"
                                                    type="date"
                                                    value={isEmirData.teslim_tarihi}
                                                    onChange={(e) => handleInputChange('teslim_tarihi', e.target.value)}
                                                    InputLabelProps={{ shrink: true }}
                                                />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <TextField
                                                    fullWidth
                                                    label="Açıklama"
                                                    multiline
                                                    rows={3}
                                                    value={isEmirData.aciklama}
                                                    onChange={(e) => handleInputChange('aciklama', e.target.value)}
                                                    placeholder="İş emri ile ilgili ek bilgiler..."
                                                />
                                            </Grid>
                                        </Grid>
                                        <Box display="flex" gap={2} mt={2}>
                                            <Button
                                                variant="contained"
                                                startIcon={isEmirLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                                                onClick={handleIsEmriOlustur}
                                                disabled={isEmirLoading || !isEmirData.is_adi}
                                            >
                                                {isEmirLoading ? 'Oluşturuluyor...' : 'İş Emri Oluştur'}
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                onClick={() => setIsEmirFormAcik(false)}
                                            >
                                                İptal
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        )}
                    </Grid>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} variant="outlined" startIcon={<CloseIcon />}>
                    Kapat
                </Button>
                {!isEmirFormAcik && (kritikDurum || eksikMiktar > 0) && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => setIsEmirFormAcik(true)}
                    >
                        İş Emri Oluştur
                    </Button>
                )}
            </DialogActions>

            {/* Floating Action Button - Hızlı İş Emri */}
            {!isEmirFormAcik && (kritikDurum || eksikMiktar > 0) && (
                <Fab
                    color="primary"
                    aria-label="iş emri oluştur"
                    sx={{
                        position: 'absolute',
                        bottom: 16,
                        right: 16,
                    }}
                    onClick={() => setIsEmirFormAcik(true)}
                >
                    <AddIcon />
                </Fab>
            )}
        </Dialog>
    );
};

export default ParcaDetayModal;
