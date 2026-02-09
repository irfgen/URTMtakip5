// Mobil Sevkiyat Listesi Sayfası
import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    IconButton,
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
    Grid,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Paper,
    Divider
} from '@mui/material';
import {
    Add as AddIcon,
    FilterList as FilterIcon,
    GetApp as ExcelIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Image as ImageIcon,
    ExpandMore as ExpandMoreIcon,
    Refresh as RefreshIcon,
    Business as BusinessIcon,
    LocationOn as LocationIcon
} from '@mui/icons-material';
import axios from 'axios';
import SevkiyatFormMobile from '../../components/mobile/SevkiyatFormMobile';
import SevkiyatResimModalMobile from '../../components/mobile/SevkiyatResimModalMobile';
import LokasyonYonetimMobilModal from '../../components/mobile/LokasyonYonetimMobilModal';
import getApiBaseUrl from '../../utils/getApiBaseUrl';
import { useNavigate } from 'react-router-dom';

const SevkiyatListesiMobile = () => {
    const navigate = useNavigate();
    const [sevkiyatlar, setSevkiyatlar] = useState([]);
    const [firmalar, setFirmalar] = useState([]);
    const [lokasyonlar, setLokasyonlar] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Modal states
    const [showForm, setShowForm] = useState(false);
    const [showResimModal, setShowResimModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
        const [showLokasyonYonetimModal, setShowLokasyonYonetimModal] = useState(false);
    const [editingSevkiyat, setEditingSevkiyat] = useState(null);
    const [selectedSevkiyat, setSelectedSevkiyat] = useState(null);
    
    // Filtreleme states
    const [filters, setFilters] = useState({
        tip: '',
        firma_id: '',
        lokasyon_id: '',
        durum: '',
        tarih_baslangic: '',
        tarih_bitis: ''
    });
    
    // Sayfalama
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
    });

    // API URL'sini merkezi helper'dan al
    const API_BASE_URL = getApiBaseUrl();
    console.log('SevkiyatListesiMobile içinde API_BASE_URL:', API_BASE_URL);

    // Veri yükleme
    useEffect(() => {
        loadData();
        loadFirmalar();
        loadLokasyonlar();
    }, [filters, pagination.page]);

    const loadData = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
            });
            
            console.log(`API URL: ${API_BASE_URL}/sevkiyat?${params}`); // URL'yi loglayalım
            const response = await axios.get(`${API_BASE_URL}/sevkiyat?${params}`);
            console.log('Sevkiyat veri cevabı:', response.data); // Cevabı loglayalım
            setSevkiyatlar(response.data.data);
            setPagination(response.data.pagination);
        } catch (err) {
            console.error('Sevkiyat listesi yüklenirken hata:', err);
            console.error('Hata detayları:', err.response?.data || err.message); // Hata detaylarını loglayalım
            setError('Sevkiyat listesi yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const loadFirmalar = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/firmalar?durum=aktif`);
            setFirmalar(response.data.data || response.data);
        } catch (err) {
            console.error('Firmalar yüklenirken hata:', err);
        }
    };

    const loadLokasyonlar = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/sevkiyat/lokasyonlar?aktif=true`);
            setLokasyonlar(response.data);
        } catch (err) {
            console.error('Lokasyonlar yüklenirken hata:', err);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const clearFilters = () => {
        setFilters({
            tip: '',
            firma_id: '',
            lokasyon_id: '',
            durum: '',
            tarih_baslangic: '',
            tarih_bitis: ''
        });
        setPagination(prev => ({ ...prev, page: 1 }));
        setShowFilters(false);
    };

    const handleEdit = (sevkiyat) => {
        setEditingSevkiyat(sevkiyat);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu sevkiyatı silmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            await axios.delete(`${API_BASE_URL}/sevkiyat/${id}`);
            setSuccess('Sevkiyat başarıyla silindi');
            loadData();
        } catch (err) {
            console.error('Sevkiyat silinirken hata:', err);
            setError('Sevkiyat silinemedi');
        }
    };

    const handleShowResimler = (sevkiyat) => {
        setSelectedSevkiyat(sevkiyat);
        setShowResimModal(true);
    };

    const exportToExcel = async () => {
        try {
            const params = new URLSearchParams({
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
            });
            
            const response = await axios.get(`${API_BASE_URL}/sevkiyat/raporlar/excel?${params}`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `sevkiyat_raporu_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            setSuccess('Excel raporu başarıyla indirildi');
        } catch (err) {
            console.error('Excel export hatası:', err);
            setError('Excel raporu oluşturulamadı');
        }
    };

    const getDurumColor = (durum) => {
        const colors = {
            'beklemede': 'warning',
            'tamamlandi': 'success',
            'iptal': 'error'
        };
        return colors[durum] || 'default';
    };

    const getTipColor = (tip) => {
        return tip === 'gelen' ? 'info' : 'primary';
    };

    const loadMore = () => {
        if (pagination.page < pagination.pages) {
            setPagination(prev => ({ ...prev, page: prev.page + 1 }));
        }
    };

    return (
        <Box sx={{ 
            minHeight: '100vh',
            bgcolor: 'background.default',
            pb: 8 // FAB için space
        }}>
            {/* Header */}
            <Paper elevation={1} sx={{ p: 2, mb: 2, position: 'sticky', top: 0, zIndex: 100 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" component="h1">
                        Sevkiyat ({pagination.total})
                    </Typography>
                    <Box>
                        <IconButton onClick={() => setShowFilters(true)} color="primary">
                            <FilterIcon />
                        </IconButton>
                        <IconButton onClick={() => navigate('/tedarik/firma-yonetimi')} color="info">
                            <BusinessIcon />
                        </IconButton>
                        <IconButton onClick={() => setShowLokasyonYonetimModal(true)} color="warning">
                            <LocationIcon />
                        </IconButton>
                        <IconButton onClick={exportToExcel} color="success">
                            <ExcelIcon />
                        </IconButton>
                        <IconButton onClick={loadData} color="primary">
                            <RefreshIcon />
                        </IconButton>
                    </Box>
                </Box>
            </Paper>

            {/* Alerts */}
            {error && (
                <Alert severity="error" sx={{ mx: 2, mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}
            
            {success && (
                <Alert severity="success" sx={{ mx: 2, mb: 2 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            {/* Loading */}
            {loading && pagination.page === 1 ? (
                <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {/* Sevkiyat Listesi */}
                    <Box px={2}>
                        {sevkiyatlar.length === 0 ? (
                            <Paper sx={{ p: 4, textAlign: 'center' }}>
                                <Typography color="text.secondary">
                                    Sevkiyat bulunamadı
                                </Typography>
                            </Paper>
                        ) : (
                            sevkiyatlar.map((sevkiyat, index) => (
                                <Card 
                                    key={sevkiyat.id} 
                                    sx={{ 
                                        mb: 2,
                                        border: '1px solid',
                                        borderColor: 'divider'
                                    }}
                                >
                                    <CardContent sx={{ pb: 1 }}>
                                        {/* Header */}
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {sevkiyat.sevkiyat_no}
                                            </Typography>
                                            <Box display="flex" gap={1}>
                                                <Chip 
                                                    label={sevkiyat.tip === 'gelen' ? 'Gelen' : 'Giden'}
                                                    color={getTipColor(sevkiyat.tip)}
                                                    size="small"
                                                />
                                                <Chip 
                                                    label={sevkiyat.durum === 'beklemede' ? 'Beklemede' : 
                                                           sevkiyat.durum === 'tamamlandi' ? 'Tamamlandı' : 'İptal'}
                                                    color={getDurumColor(sevkiyat.durum)}
                                                    size="small"
                                                />
                                            </Box>
                                        </Box>

                                        {/* Content */}
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            <strong>Firma:</strong> {sevkiyat.firma_adi}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            <strong>Lokasyon:</strong> {sevkiyat.lokasyon_adi}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            <strong>Adet:</strong> {parseFloat(sevkiyat.toplam_adet || 0).toLocaleString('tr-TR')}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            <strong>Tarih:</strong> {new Date(sevkiyat.tarih).toLocaleDateString('tr-TR', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </Typography>

                                        {sevkiyat.aciklama && (
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                <strong>Açıklama:</strong> {sevkiyat.aciklama}
                                            </Typography>
                                        )}

                                        {/* Actions */}
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                                            <Button
                                                startIcon={<ImageIcon />}
                                                onClick={() => handleShowResimler(sevkiyat)}
                                                disabled={sevkiyat.resim_sayisi === 0}
                                                size="small"
                                            >
                                                Resimler ({sevkiyat.resim_sayisi})
                                            </Button>
                                            <Box>
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleEdit(sevkiyat)}
                                                    color="primary"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleDelete(sevkiyat.id)}
                                                    color="error"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))
                        )}

                        {/* Load More Button */}
                        {pagination.page < pagination.pages && (
                            <Box textAlign="center" my={2}>
                                <Button 
                                    variant="outlined" 
                                    onClick={loadMore}
                                    disabled={loading}
                                    fullWidth
                                >
                                    {loading ? <CircularProgress size={20} /> : 'Daha Fazla Yükle'}
                                </Button>
                            </Box>
                        )}
                    </Box>
                </>
            )}

            {/* Floating Action Button */}
            <Fab
                color="primary"
                aria-label="add"
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                }}
                onClick={() => {
                    setEditingSevkiyat(null);
                    setShowForm(true);
                }}
            >
                <AddIcon />
            </Fab>

            {/* Filter Dialog */}
            <Dialog open={showFilters} onClose={() => setShowFilters(false)} fullWidth maxWidth="sm">
                <DialogTitle>Filtreleme</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} pt={1}>
                        <FormControl fullWidth>
                            <InputLabel>Tip</InputLabel>
                            <Select
                                value={filters.tip}
                                label="Tip"
                                onChange={(e) => handleFilterChange('tip', e.target.value)}
                            >
                                <MenuItem value="">Tümü</MenuItem>
                                <MenuItem value="gelen">Gelen</MenuItem>
                                <MenuItem value="giden">Giden</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Firma</InputLabel>
                            <Select
                                value={filters.firma_id}
                                label="Firma"
                                onChange={(e) => handleFilterChange('firma_id', e.target.value)}
                            >
                                <MenuItem value="">Tüm Firmalar</MenuItem>
                                {firmalar.map(firma => (
                                    <MenuItem key={firma.id} value={firma.id}>
                                        {firma.firma_adi}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Lokasyon</InputLabel>
                            <Select
                                value={filters.lokasyon_id}
                                label="Lokasyon"
                                onChange={(e) => handleFilterChange('lokasyon_id', e.target.value)}
                            >
                                <MenuItem value="">Tüm Lokasyonlar</MenuItem>
                                {lokasyonlar.map(lokasyon => (
                                    <MenuItem key={lokasyon.id} value={lokasyon.id}>
                                        {lokasyon.lokasyon_adi}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Durum</InputLabel>
                            <Select
                                value={filters.durum}
                                label="Durum"
                                onChange={(e) => handleFilterChange('durum', e.target.value)}
                            >
                                <MenuItem value="">Tüm Durumlar</MenuItem>
                                <MenuItem value="beklemede">Beklemede</MenuItem>
                                <MenuItem value="tamamlandi">Tamamlandı</MenuItem>
                                <MenuItem value="iptal">İptal</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label="Başlangıç Tarihi"
                            type="date"
                            value={filters.tarih_baslangic}
                            onChange={(e) => handleFilterChange('tarih_baslangic', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />

                        <TextField
                            label="Bitiş Tarihi"
                            type="date"
                            value={filters.tarih_bitis}
                            onChange={(e) => handleFilterChange('tarih_bitis', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={clearFilters}>Temizle</Button>
                    <Button onClick={() => setShowFilters(false)} variant="contained">Uygula</Button>
                </DialogActions>
            </Dialog>

            {/* Sevkiyat Form Modal */}
            <SevkiyatFormMobile
                open={showForm}
                onClose={() => {
                    setShowForm(false);
                    setEditingSevkiyat(null);
                }}
                sevkiyat={editingSevkiyat}
                onSuccess={() => {
                    setSuccess(editingSevkiyat ? 'Sevkiyat başarıyla güncellendi' : 'Sevkiyat başarıyla oluşturuldu');
                    loadData();
                }}
                onError={setError}
            />

            {/* Resim Modal */}
            <SevkiyatResimModalMobile
                open={showResimModal}
                onClose={() => {
                    setShowResimModal(false);
                    setSelectedSevkiyat(null);
                }}
                sevkiyat={selectedSevkiyat}
                onSuccess={() => {
                    setSuccess('Resim işlemi başarılı');
                    loadData();
                }}
                onError={setError}
            />

            
            {/* Lokasyon Yönetim Modal */}
            <LokasyonYonetimMobilModal
                open={showLokasyonYonetimModal}
                onClose={() => setShowLokasyonYonetimModal(false)}
                onSuccess={() => {
                    setSuccess('Lokasyon işlemi başarılı');
                    loadLokasyonlar();
                }}
                onError={setError}
            />
        </Box>
    );
};

export default SevkiyatListesiMobile;
