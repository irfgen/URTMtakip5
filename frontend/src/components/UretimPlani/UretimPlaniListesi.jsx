import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
    Box, Typography, TextField, Button, Card, CardContent,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Tooltip, CircularProgress, Paper, InputAdornment,
    Chip, Alert, Grid, Dialog, DialogTitle, DialogContent, 
    DialogContentText, DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import WarningIcon from '@mui/icons-material/Warning';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import BusinessIcon from '@mui/icons-material/Business';
import { fetchUretimPlanlari, deleteUretimPlani, clearError, clearSuccess } from '../../store/slices/uretimPlaniSlice';

const UretimPlaniListesi = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { uretimPlanlari, loading, error, success } = useSelector(state => state.uretimPlani);
    const [searchTerm, setSearchTerm] = useState('');
    const [ozelListeAdi, setOzelListeAdi] = useState('');
    const [filteredPlans, setFilteredPlans] = useState([]);
    
    // Silme dialog state'leri
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [planToDelete, setPlanToDelete] = useState(null);

    // Üretim planlarını yükle
    useEffect(() => {
        dispatch(fetchUretimPlanlari({ ozel_liste_adi: ozelListeAdi }));
        // Component unmount olduğunda error ve success state'lerini temizle
        return () => {
            dispatch(clearError());
            dispatch(clearSuccess());
        };
    }, [dispatch, ozelListeAdi]);

    // Arama terimine göre filtreleme
    useEffect(() => {
        if (uretimPlanlari && uretimPlanlari.length > 0) {
            const filtered = uretimPlanlari.filter(plan => {
                if (!searchTerm || searchTerm.trim() === '') {
                    return true; // Boş arama teriminde tüm planları göster
                }
                
                const searchLower = searchTerm.toLowerCase();
                
                // Güvenli şekilde değerleri kontrol et
                const makinaIdMatch = plan.makina_id && typeof plan.makina_id === 'string' 
                    ? plan.makina_id.toLowerCase().includes(searchLower) 
                    : false;
                
                const makinaAdiMatch = plan.makina && plan.makina.name && typeof plan.makina.name === 'string'
                    ? plan.makina.name.toLowerCase().includes(searchLower)
                    : false;
                
                // Tarih kontrolü
                let teslimTarihiMatch = false;
                if (plan.teslim_tarihi) {
                    try {
                        teslimTarihiMatch = new Date(plan.teslim_tarihi).toLocaleDateString('tr-TR')
                            .includes(searchTerm);
                    } catch (e) {
                        // Tarih dönüştürme hatası olursa geç
                        teslimTarihiMatch = false;
                    }
                }
                
                // Durum kontrolü
                const durumMatch = plan.durum && typeof plan.durum === 'string'
                    ? plan.durum.toLowerCase().includes(searchLower)
                    : false;
                
                return makinaIdMatch || makinaAdiMatch || teslimTarihiMatch || durumMatch;
            });
            
            setFilteredPlans(filtered);
        } else {
            setFilteredPlans([]);
        }
    }, [searchTerm, uretimPlanlari]);

    const handleAddUretimPlani = () => {
        navigate('/uretim-plani/ekle');
    };

    const handleKarmaUretimPlani = () => {
        navigate('/uretim-plani/karma');
    };

    const handleMakinaAnalizi = () => {
        navigate('/uretim-plani/makina-analiz');
    };

    const handleEditUretimPlani = (id) => {
        navigate(`/uretim-plani/duzenle/${id}`);
    };

    const handleViewUretimPlani = (id) => {
        navigate(`/uretim-plani/detay/${id}`);
    };

    const handleDeleteUretimPlani = (id) => {
        const plan = uretimPlanlari.find(p => p.id === id);
        setPlanToDelete(plan);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (planToDelete) {
            try {
                const result = await dispatch(deleteUretimPlani(planToDelete.id));
                if (result.meta.requestStatus === 'fulfilled') {
                    // Listeyi yeniden yükle
                    dispatch(fetchUretimPlanlari());
                }
            } catch (error) {
                console.error('Delete dispatch hatası:', error);
            }
        }
        setDeleteDialogOpen(false);
        setPlanToDelete(null);
    };

    const cancelDelete = () => {
        setDeleteDialogOpen(false);
        setPlanToDelete(null);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Belirtilmedi';
        
        try {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            const date = new Date(dateString);
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return 'Geçersiz Tarih';
            }
            
            return date.toLocaleDateString('tr-TR', options);
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'Geçersiz Tarih';
        }
    };

    // Durum renklerini belirle
    const getDurumColor = (durum) => {
        switch (durum) {
            case 'Planlandı': return 'info';
            case 'Üretimde': return 'warning';
            case 'Tamamlandı': return 'success';
            case 'İptal': return 'error';
            default: return 'default';
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h1">
                    Üretim Planları
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        color="info"
                        startIcon={<AnalyticsIcon />}
                        onClick={handleMakinaAnalizi}
                    >
                        Makina Analizi
                    </Button>
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<BusinessIcon />}
                        onClick={handleKarmaUretimPlani}
                    >
                        Karma Plan Oluştur
                    </Button>
                </Box>
            </Box>

            {/* Hata ve başarı mesajları */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
                    {typeof error === 'object' ? error.message || JSON.stringify(error) : error}
                </Alert>
            )}
            
            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => dispatch(clearSuccess())}>
                    {typeof success === 'object' ? success.message || JSON.stringify(success) : success}
                </Alert>
            )}

            {/* Arama ve filtreleme alanı */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={8}>
                            <TextField
                                label="Üretim Planı Ara (Makina, Tarih veya Durum)"
                                variant="outlined"
                                fullWidth
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                label="Özel Liste Adı ile Filtrele"
                                variant="outlined"
                                fullWidth
                                value={ozelListeAdi}
                                onChange={e => setOzelListeAdi(e.target.value)}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Üretim planları listesi */}
            <TableContainer component={Paper}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>İşlemler</TableCell>
                                <TableCell>Makina</TableCell>
                                <TableCell>Miktar</TableCell>
                                <TableCell>Teslim Tarihi</TableCell>
                                <TableCell>Durum</TableCell>
                                <TableCell>Kritik Stok</TableCell>
                                <TableCell>Oluşturulma Tarihi</TableCell>
                                <TableCell>Özel Liste Adı</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredPlans.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">Üretim planı bulunamadı.</TableCell>
                                </TableRow>
                            ) : (
                                filteredPlans.map((plan) => (
                                    <TableRow key={plan.id}>
                                        <TableCell>
                                            <Tooltip title="Detaylar">
                                                <IconButton 
                                                    size="small" 
                                                    color="info" 
                                                    onClick={() => handleViewUretimPlani(plan.id)}
                                                >
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Düzenle">
                                                <IconButton 
                                                    size="small" 
                                                    color="primary"
                                                    onClick={() => handleEditUretimPlani(plan.id)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Sil">
                                                <IconButton 
                                                    size="small" 
                                                    color="error"
                                                    onClick={() => handleDeleteUretimPlani(plan.id)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>{plan.makina?.name || 'Bilinmiyor'}</TableCell>
                                        <TableCell>{plan.miktar}</TableCell>
                                        <TableCell>{formatDate(plan.teslim_tarihi)}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={plan.durum} 
                                                color={getDurumColor(plan.durum)} 
                                                size="small" 
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {plan.kritik_stok_uyarisi && plan.kritik_stok_uyarisi.length > 0 ? (
                                                <Tooltip title={`${plan.kritik_stok_uyarisi.length} parça kritik stok seviyesinde`}>
                                                    <Chip
                                                        icon={<WarningIcon />}
                                                        label={plan.kritik_stok_uyarisi.length}
                                                        color="error"
                                                        size="small"
                                                    />
                                                </Tooltip>
                                            ) : (
                                                'Yok'
                                            )}
                                        </TableCell>
                                        <TableCell>{formatDate(plan.olusturma_tarihi)}</TableCell>
                                        <TableCell>{plan.ozel_liste_adi || '-'}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </TableContainer>
            
            {/* Silme Onay Dialog'u */}
            <Dialog
                open={deleteDialogOpen}
                onClose={cancelDelete}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle id="delete-dialog-title" sx={{ color: 'error.main' }}>
                    Üretim Planını Sil
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-dialog-description">
                        <strong>"{planToDelete?.ozel_liste_adi || `Plan #${planToDelete?.id}`}"</strong> üretim planını kalıcı olarak silmek istediğinize emin misiniz?
                        <br /><br />
                        <strong>⚠️ Bu işlem geri alınamaz ve:</strong>
                        <br />
                        • Planla ilişkili tüm iş emirleri ve fason işler bağlantısı kaldırılacak
                        <br />
                        • Plan bilgileri tamamen silinecek
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelDelete} color="primary" variant="outlined">
                        İptal
                    </Button>
                    <Button 
                        onClick={confirmDelete} 
                        color="error" 
                        variant="contained"
                        startIcon={<DeleteIcon />}
                    >
                        Sil
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UretimPlaniListesi;