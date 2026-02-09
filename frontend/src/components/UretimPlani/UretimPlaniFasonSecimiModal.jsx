import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    TextField,
    InputAdornment,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Checkbox,
    FormControlLabel,
    Chip,
    Alert,
    CircularProgress,
    Tabs,
    Tab,
    Avatar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ImageIcon from '@mui/icons-material/Image';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { getFotoPath } from '../../utils/imageUtils';
import axios from 'axios';

const UretimPlaniFasonSecimiModal = ({ open, onClose, onSelect, selectedFasonIds = [] }) => {
    const [fasonlar, setFasonlar] = useState([]);
    const [filteredFasonlar, setFilteredFasonlar] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTab, setSelectedTab] = useState(0);
    const [secilenFasonlar, setSecilenFasonlar] = useState([]);
    const [tamamlananlariGoster, setTamamlananlariGoster] = useState(false);

    // Durum sekmeleri
    const durumSekmeler = [
        { label: 'Tümü', value: 'all', color: '#1976d2' },
        { label: 'Beklemede', value: 'beklemede', color: '#ff9800' },
        { label: 'Üretimde', value: 'uretimde', color: '#2196f3' },
        { label: 'Tamamlandı', value: 'tamamlandi', color: '#4caf50' }
    ];

    // Base64 placeholder image
    const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdvcnNlbCBZb2s8L3RleHQ+PC9zdmc+';

    // Modal açılınca fasonları getir
    useEffect(() => {
        if (open) {
            fetchFasonlar();
            setSecilenFasonlar([]); // Modal her açılışta seçimi temizle
        }
    }, [open, tamamlananlariGoster]);

    // Fasonları getir
    const fetchFasonlar = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.get('/api/fason/is-emirleri/selectable', {
                params: {
                    durum: 'beklemede,uretimde',
                    tamamlananlari_goster: tamamlananlariGoster,
                    limit: 100
                }
            });

            if (response.data.success) {
                setFasonlar(response.data.data);
                setFilteredFasonlar(response.data.data);
            } else {
                setError('Fason listesi alınamadı');
            }
        } catch (err) {
            console.error('Fason listesi getirilirken hata:', err);
            setError('Fason listesi getirilirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    // Arama ve filtreleme
    useEffect(() => {
        let filtered = [...fasonlar];

        // Durum filtresi
        if (selectedTab > 0) {
            const selectedDurum = durumSekmeler[selectedTab].value;
            filtered = filtered.filter(fason => fason.durum === selectedDurum);
        }

        // Arama filtresi
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(fason => 
                fason.parca?.parcaKodu?.toLowerCase().includes(searchLower) ||
                fason.parca?.parcaAdi?.toLowerCase().includes(searchLower) ||
                fason.tedarikci?.toLowerCase().includes(searchLower)
            );
        }

        setFilteredFasonlar(filtered);
    }, [fasonlar, selectedTab, searchTerm]);

    // Fason seçimi/seçim kaldırma
    const handleFasonToggle = (fason) => {
        const fasonId = fason.fason_is_emri_id;
        const isSelected = secilenFasonlar.some(f => f.fason_is_emri_id === fasonId);

        if (isSelected) {
            setSecilenFasonlar(secilenFasonlar.filter(f => f.fason_is_emri_id !== fasonId));
        } else {
            setSecilenFasonlar([...secilenFasonlar, fason]);
        }
    };

    // Seçimi onayla
    const handleConfirm = () => {
        onSelect(secilenFasonlar);
        handleClose();
    };

    // Tamamlanan fasonları gösterme/gizleme toggle
    const handleTamamlananlariGosterToggle = () => {
        setTamamlananlariGoster(prev => !prev);
    };

    // Modal'ı kapat
    const handleClose = () => {
        setSecilenFasonlar([]);
        setSearchTerm('');
        setSelectedTab(0);
        setTamamlananlariGoster(false); // Tamamlanan fasonları gösterme durumunu sıfırla
        onClose();
    };

    // Durum chip'i renk belirleme
    const getDurumColor = (durum) => {
        switch (durum) {
            case 'beklemede': return '#ff9800';
            case 'uretimde': return '#2196f3';
            case 'tamamlandi': return '#4caf50';
            case 'iptal': return '#f44336';
            default: return '#9e9e9e';
        }
    };

    // Tarih formatı
    const formatTarih = (tarih) => {
        if (!tarih) return 'Belirtilmemiş';
        return new Date(tarih).toLocaleDateString('tr-TR');
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { height: '80vh', maxHeight: '800px' }
            }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" component="div">
                            Fason İş Emri Seçimi
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Üretim planına eklemek istediğiniz fason iş emirlerini seçin
                        </Typography>
                    </Box>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={tamamlananlariGoster}
                                onChange={handleTamamlananlariGosterToggle}
                                size="small"
                            />
                        }
                        label="Tamamlanan fasonları göster"
                        sx={{ 
                            fontSize: '0.875rem',
                            '& .MuiFormControlLabel-label': {
                                fontSize: '0.875rem'
                            }
                        }}
                    />
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {/* Arama ve Tab'lar */}
                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Parça kodu, parça adı veya tedarikçi ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ mb: 2 }}
                    />

                    <Tabs 
                        value={selectedTab} 
                        onChange={(e, newValue) => setSelectedTab(newValue)}
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        {durumSekmeler.map((durum, index) => (
                            <Tab
                                key={durum.value}
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box
                                            sx={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: '50%',
                                                backgroundColor: durum.color
                                            }}
                                        />
                                        {durum.label}
                                        {index === 0 && (
                                            <Chip size="small" label={fasonlar.length} />
                                        )}
                                    </Box>
                                }
                            />
                        ))}
                    </Tabs>
                </Box>

                {/* Loading/Error States */}
                {loading && (
                    <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress />
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                        <Button size="small" onClick={fetchFasonlar} sx={{ ml: 1 }}>
                            Tekrar Dene
                        </Button>
                    </Alert>
                )}

                {/* Fason Listesi */}
                {!loading && !error && (
                    <Grid container spacing={2}>
                        {filteredFasonlar.map((fason) => {
                            const isSelected = secilenFasonlar.some(f => 
                                f.fason_is_emri_id === fason.fason_is_emri_id
                            );

                            return (
                                <Grid item xs={12} sm={6} md={4} key={fason.fason_is_emri_id}>
                                    <Card 
                                        sx={{ 
                                            cursor: 'pointer',
                                            border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
                                            '&:hover': { boxShadow: 3 }
                                        }}
                                        onClick={() => handleFasonToggle(fason)}
                                    >
                                        <Box sx={{ position: 'relative' }}>
                                            <CardMedia
                                                component="img"
                                                height="120"
                                                image={
                                                    fason.parca?.foto_path 
                                                        ? getFotoPath(fason.parca.foto_path)
                                                        : fason.parca?.teknik_resim_path
                                                        ? getFotoPath(fason.parca.teknik_resim_path)
                                                        : placeholderImage
                                                }
                                                alt={fason.parca?.parcaAdi || 'Fason İş'}
                                                onError={(e) => {
                                                    e.target.src = placeholderImage;
                                                }}
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onChange={() => handleFasonToggle(fason)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                }
                                                label=""
                                                sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 8,
                                                    m: 0,
                                                    '& .MuiCheckbox-root': {
                                                        backgroundColor: 'rgba(255,255,255,0.8)',
                                                        borderRadius: 1
                                                    }
                                                }}
                                            />
                                        </Box>

                                        <CardContent sx={{ p: 2 }}>
                                            {/* Parça Bilgisi */}
                                            <Typography variant="subtitle2" noWrap>
                                                <strong>{fason.parca?.parcaKodu || 'N/A'}</strong>
                                            </Typography>
                                            <Typography 
                                                variant="body2" 
                                                color="text.secondary" 
                                                noWrap
                                                sx={{ mb: 1 }}
                                            >
                                                {fason.parca?.parcaAdi || 'Parça adı belirtilmemiş'}
                                            </Typography>

                                            {/* Fason Bilgileri */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <BusinessIcon fontSize="small" color="action" />
                                                <Typography variant="body2" noWrap>
                                                    {fason.tedarikci || 'Tedarikçi belirtilmemiş'}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <CalendarTodayIcon fontSize="small" color="action" />
                                                <Typography variant="body2">
                                                    {formatTarih(fason.teslim_tarihi)}
                                                </Typography>
                                            </Box>

                                            {/* Durum ve Adet */}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Chip
                                                    label={fason.durum}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: getDurumColor(fason.durum),
                                                        color: 'white',
                                                        fontWeight: 'bold'
                                                    }}
                                                />
                                                <Typography variant="body2" fontWeight="bold">
                                                    {fason.fason_adet} adet
                                                </Typography>
                                            </Box>

                                            {/* Grup Bilgisi */}
                                            {fason.fason_grup && (
                                                <Box sx={{ mt: 1 }}>
                                                    <Chip
                                                        label={fason.fason_grup.grup_adi}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{
                                                            borderColor: fason.fason_grup.renk,
                                                            color: fason.fason_grup.renk
                                                        }}
                                                    />
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}

                {/* Sonuç mesajı */}
                {!loading && !error && filteredFasonlar.length === 0 && (
                    <Box textAlign="center" py={4}>
                        <ImageIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            {searchTerm ? 'Arama kriterlerine uygun fason bulunamadı' : 'Seçilebilir fason iş emri bulunamadı'}
                        </Typography>
                        {searchTerm && (
                            <Button 
                                variant="outlined" 
                                onClick={() => setSearchTerm('')}
                                sx={{ mt: 2 }}
                            >
                                Filtreyi Temizle
                            </Button>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        {secilenFasonlar.length} fason seçildi
                    </Typography>
                </Box>
                <Button onClick={handleClose} color="inherit">
                    İptal
                </Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    disabled={secilenFasonlar.length === 0}
                >
                    Seçilenleri Ekle ({secilenFasonlar.length})
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UretimPlaniFasonSecimiModal;
