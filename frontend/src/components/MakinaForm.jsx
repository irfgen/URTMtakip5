import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box, Button, Card, CardContent, Typography, TextField, Grid, IconButton,
    List, ListItem, ListItemText, ListItemSecondaryAction,
    Select, MenuItem, FormControl, InputLabel, CircularProgress, Alert,
    Modal, Backdrop, Fade, FormGroup, FormControlLabel, Checkbox
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';

// Error Boundary Bileşeni
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Makina form error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Alert severity="error" sx={{ m: 2 }}>
                    <Typography variant="h6" gutterBottom>Bir hata oluştu</Typography>
                    <Typography variant="body2">
                        Formda beklenmeyen bir hata oluştu. Sayfayı yenileyin veya sistem yöneticisine başvurun.
                    </Typography>
                    <Button
                        variant="outlined"
                        sx={{ mt: 2 }}
                        onClick={() => window.location.reload()}
                    >
                        Sayfayı Yenile
                    </Button>
                </Alert>
            );
        }

        return this.props.children;
    }
}

const MakinaForm = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Düzenleme modu için makina ID'si
    const isEditMode = !!id;

    const [makinaData, setMakinaData] = useState({
        name: '',
        description: '',
        model: '',
        seri_no: '',
        uretim_yili: '',
        durum: 'aktif',
        makina_sinifi_id: ''
    });
    const [makinaSiniflari, setMakinaSiniflari] = useState([]);
    const [siniflarLoading, setSiniflarLoading] = useState(false);
    const [items, setItems] = useState([]); // Bileşen içeriği: { id: string, name: string, type: 'PART' | 'BOM', quantity: number }
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [shouldNavigate, setShouldNavigate] = useState(false); // Navigation control

    // Modal state'leri
    const [bomModalOpen, setBomModalOpen] = useState(false);
    const [allBoms, setAllBoms] = useState([]);
    const [selectedBoms, setSelectedBoms] = useState(new Set());
    const [bomsLoading, setBomsLoading] = useState(false);
    const [bomSearchTerm, setBomSearchTerm] = useState('');

    // Ref'ler to prevent infinite loops
    const isInitialLoadRef = useRef(true);

    // Cleanup effect - component unmount'ta tüm pending işlemleri iptal et
    useEffect(() => {
        return () => {
            // Component unmount olduğunda tüm state'leri sıfırla
            if (saving) {
                setSaving(false);
            }
            if (shouldNavigate) {
                setShouldNavigate(false);
            }
        };
    }, []);

    // Safe navigation effect
    useEffect(() => {
        if (shouldNavigate && !saving) {
            // Tüm useEffect'leri temizlemek için kısa bir delay
            const timer = setTimeout(() => {
                navigate('/makinalar');
            }, 100);
            
            return () => clearTimeout(timer);
        }
    }, [shouldNavigate, saving, navigate]);

    // Makina sınıflarını yükle
    useEffect(() => {
        const loadMakinaSiniflari = async () => {
            setSiniflarLoading(true);
            try {
                const response = await axios.get('/api/makina-siniflari');
                setMakinaSiniflari(response.data.data || []);
            } catch (err) {
                console.error('Makina sınıfları yüklenirken hata:', err);
                setError('Makina sınıfları yüklenirken bir hata oluştu.');
            } finally {
                setSiniflarLoading(false);
            }
        };

        loadMakinaSiniflari();
    }, []);

    // Düzenleme modunda makina detaylarını yükle
    useEffect(() => {
        if (isEditMode) {
            setLoading(true);
            axios.get(`/api/makinalar/${id}`)
                .then(response => {
                    console.log('API Response:', response.data);

                    // Yeni API response formatını dikkate al: { success: true, data: makina, message: '...' }
                    const responseData = response.data.data || response.data;

                    setMakinaData({
                        name: responseData.name,
                        description: responseData.description || '',
                        model: responseData.model || '',
                        seri_no: responseData.seri_no || '',
                        uretim_yili: responseData.uretim_yili || '',
                        durum: responseData.durum || 'aktif',
                        makina_sinifi_id: responseData.makina_sinifi_id || ''
                    });

                    // Modeldeki get() metodu JSON'ı parse ettiği için doğrudan kullanabiliriz
                    const makinaItems = responseData.items || [];
                    setItems(makinaItems);
                    console.log('Makina items loaded:', makinaItems);
                    setError(null);
                })
                .catch(err => {
                    console.error('Makina detayı yüklenirken hata:', err);
                    setError('Makina detayı yüklenirken bir hata oluştu.');
                })
                .finally(() => setLoading(false));
        }
    }, [id, isEditMode]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setMakinaData(prev => ({ ...prev, [name]: value }));
    };

    const handleRemoveItem = (index) => {
        setItems(prevItems => prevItems.filter((_, i) => i !== index));
    };

    const handleQuantityChange = (index, value) => {
        const quantity = Math.max(1, parseInt(value) || 1);
        setItems(prev => prev.map((item, i) => i === index ? { ...item, quantity } : item));
    };

    // BOM Modal Fonksiyonları
    const loadBoms = async () => {
        setBomsLoading(true);
        try {
            const response = await axios.get('/api/boms');
            const responseData = response.data.data || response.data;
            const boms = Array.isArray(responseData) ? responseData : [];
            setAllBoms(boms);

            // BOM ID'lerini kontrol et ve log at
            const bomIds = boms.map(b => ({ bom_id: b.bom_id, id: b.id, name: b.name }));
            console.log('✅ Loaded BOMs:', bomIds);
            console.log('✅ BOM IDs:', boms.map(b => b.bom_id || b.id));
        } catch (err) {
            console.error('BOM listesi yüklenirken hata:', err);
            setError('BOM listesi yüklenirken bir hata oluştu.');
            setAllBoms([]);
        } finally {
            setBomsLoading(false);
        }
    };

    const openBomModal = () => {
        setBomModalOpen(true);
        setSelectedBoms(new Set());
        setBomSearchTerm('');
        loadBoms();
    };

    const closeBomModal = () => {
        setBomModalOpen(false);
        setSelectedBoms(new Set());
        setBomSearchTerm('');
    };

    const handleBomSelection = (bomId, event) => {
        const isChecked = event.target.checked;
        const id = String(bomId); // Tutarlı string dönüşümü
        console.log('BOM selection changed:', id, isChecked);

        setSelectedBoms(prev => {
            const newSet = new Set(prev);
            if (isChecked) {
                newSet.add(id);
            } else {
                newSet.delete(id);
            }
            return newSet;
        });
    };

    const addSelectedBoms = () => {
        const newItems = [];
        selectedBoms.forEach(bomIdStr => {
            const bom = allBoms.find(b =>
                String(b.bom_id || b.id) === bomIdStr
            );

            if (bom) {
                const existingItem = items.find(item =>
                    String(item.id) === bomIdStr && item.type === 'BOM'
                );

                if (!existingItem) {
                    newItems.push({
                        id: bomIdStr,
                        name: bom.name,
                        type: 'BOM',
                        quantity: 1
                    });
                }
            }
        });

        if (newItems.length > 0) {
            setItems(prevItems => [...prevItems, ...newItems]);
        }

        closeBomModal();
    };

    const filteredBoms = allBoms.filter(bom => {
        if (!bomSearchTerm) return true;
        return bom.name?.toLowerCase().includes(bomSearchTerm.toLowerCase()) ||
               bom.description?.toLowerCase().includes(bomSearchTerm.toLowerCase());
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!makinaData.name?.trim()) {
            setError('Makina adı zorunludur.');
            return;
        }
        
        if (saving || shouldNavigate) {
            return; // Prevent double submission or submission during navigation
        }
        
        setSaving(true);
        setError(null);
        setShouldNavigate(false);

        const payload = {
            ...makinaData,
            name: makinaData.name.trim(), // Trim whitespace
            items: items // Modeldeki set() JSON'a çevirecek
        };

        console.log('📤 Makina save payload:', {
            url: isEditMode ? `/api/makinalar/${id}` : '/api/makinalar',
            payload: JSON.stringify(payload, null, 2)
        });

        try {
            let response;
            if (isEditMode) {
                response = await axios.put(`/api/makinalar/${id}`, payload);
            } else {
                response = await axios.post('/api/makinalar', payload);
            }
            
            console.log('Save response:', response.data);
            
            // Response kontrolü
            if (response && response.status >= 200 && response.status < 300) {
                // Başarılı kaydetme sonrası controlled navigation
                setShouldNavigate(true);
            } else {
                throw new Error('Beklenmeyen server response');
            }
        } catch (err) {
            console.error('Makina kaydedilirken hata:', err);
            console.error('Response data:', err.response?.data);
            console.error('Response status:', err.response?.status);

            let errorMessage = 'Makina kaydedilirken bir hata oluştu.';
            if (err.response?.data?.error?.details) {
                errorMessage += `\n${err.response.data.error.details}`;
            } else if (err.response?.data?.error?.message) {
                errorMessage += ` (${err.response.data.error.message})`;
            } else if (err.response?.data?.message) {
                errorMessage += ` (${err.response.data.message})`;
            } else if (err.message) {
                errorMessage += ` (${err.message})`;
            }
            
            setError(errorMessage);
            setShouldNavigate(false);
        } finally {
            // Her durumda saving state'ini false yap
            setSaving(false);
        }
    };

    return (
        <ErrorBoundary>
            <Box sx={{ maxWidth: '100%', py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <IconButton 
                        sx={{ mr: 2 }}
                        onClick={() => {
                            if (!saving) {
                                navigate('/makinalar');
                            }
                        }}
                        disabled={saving}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Box>
                        <Typography variant="h5">
                            {isEditMode ? 'Makina Düzenle' : 'Yeni Makina Ekle'}
                        </Typography>
                        {isEditMode && makinaData.name && (
                            <Typography variant="body2" color="text.secondary">
                                {makinaData.name} - {makinaData.model || 'Model belirtilmemiş'}
                            </Typography>
                        )}
                    </Box>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <CircularProgress />
                    </Box>
                )}

                {!loading && (
                <form onSubmit={handleSubmit}>
                    <fieldset disabled={saving || shouldNavigate} style={{ border: 'none', padding: 0, margin: 0 }}>
                    <Grid container spacing={3}>
                        {/* Sol Taraf: Ana Bilgiler */}
                        <Grid item xs={12} md={5}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>Makina Bilgileri</Typography>
                                    <TextField
                                        name="name"
                                        label="Makina Adı"
                                        value={makinaData.name}
                                        onChange={handleInputChange}
                                        fullWidth
                                        required
                                        margin="normal"
                                    />
                                    <TextField
                                        name="description"
                                        label="Açıklama"
                                        value={makinaData.description}
                                        onChange={handleInputChange}
                                        fullWidth
                                        multiline
                                        rows={4}
                                        margin="normal"
                                    />
                                    <TextField
                                        name="model"
                                        label="Model"
                                        value={makinaData.model}
                                        onChange={handleInputChange}
                                        fullWidth
                                        margin="normal"
                                    />
                                    <TextField
                                        name="seri_no"
                                        label="Seri No"
                                        value={makinaData.seri_no}
                                        onChange={handleInputChange}
                                        fullWidth
                                        margin="normal"
                                    />
                                    <TextField
                                        name="uretim_yili"
                                        label="Üretim Yılı"
                                        value={makinaData.uretim_yili}
                                        onChange={handleInputChange}
                                        fullWidth
                                        margin="normal"
                                        type="number"
                                    />
                                    <FormControl fullWidth margin="normal">
                                        <InputLabel id="makina-sinifi-label">Makina Sınıfı</InputLabel>
                                        <Select
                                            labelId="makina-sinifi-label"
                                            name="makina_sinifi_id"
                                            value={makinaData.makina_sinifi_id}
                                            onChange={handleInputChange}
                                            label="Makina Sınıfı"
                                            disabled={siniflarLoading}
                                        >
                                            {siniflarLoading ? (
                                                <MenuItem disabled>
                                                    <CircularProgress size={20} sx={{ mr: 1 }} />
                                                    Yükleniyor...
                                                </MenuItem>
                                            ) : (
                                                <>
                                                    <MenuItem value="">
                                                        <em>Makina Sınıfı Seçin</em>
                                                    </MenuItem>
                                                    {makinaSiniflari.map((sinif) => (
                                                        <MenuItem key={sinif.id} value={sinif.id}>
                                                            {sinif.ad}
                                                        </MenuItem>
                                                    ))}
                                                </>
                                            )}
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth margin="normal">
                                        <InputLabel id="durum-label">Durum</InputLabel>
                                        <Select
                                            labelId="durum-label"
                                            name="durum"
                                            value={makinaData.durum}
                                            onChange={handleInputChange}
                                            label="Durum"
                                        >
                                            <MenuItem value="aktif">Aktif</MenuItem>
                                            <MenuItem value="pasif">Pasif</MenuItem>
                                            <MenuItem value="bakim">Bakımda</MenuItem>
                                        </Select>
                                    </FormControl>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Sağ Taraf: Seçili Bileşenler */}
                        <Grid item xs={12} md={7}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                                            Makina Bileşenleri
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            startIcon={<AddIcon />}
                                            onClick={openBomModal}
                                            disabled={saving}
                                            size="small"
                                        >
                                            BOM Ekle
                                        </Button>
                                    </Box>

                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                            Seçili Bileşenler: ({items.length})
                                        </Typography>
                                        {items.length === 0 ? (
                                            <Typography variant="body2" color="text.secondary">
                                                Henüz bileşen seçilmedi.
                                            </Typography>
                                        ) : (
                                            <List dense>
                                                {items.map((item, index) => (
                                                    <ListItem
                                                        key={`${item.type}-${item.id}-${index}`} // Benzersiz key
                                                        divider
                                                        sx={{ display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <ListItemText
                                                            primary={item.name}
                                                            secondary={item.type === 'PART' ? 'Parça' : 'BOM (Grup)'}
                                                            sx={{ flexGrow: 1, mr: 2 }}
                                                        />
                                                        <TextField
                                                            label="Adet"
                                                            type="number"
                                                            size="small"
                                                            value={item.quantity}
                                                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                            InputProps={{ inputProps: { min: 1 } }}
                                                            sx={{ width: '80px', mr: 1 }}
                                                            disabled={saving}
                                                        />
                                                        <ListItemSecondaryAction>
                                                            <IconButton
                                                                edge="end"
                                                                aria-label="delete"
                                                                onClick={() => handleRemoveItem(index)}
                                                                disabled={saving}
                                                                color="error"
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </ListItemSecondaryAction>
                                                    </ListItem>
                                                ))}
                                            </List>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Kaydet Butonu */}
                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                disabled={saving || shouldNavigate || !makinaData.name?.trim()}
                            >
                                {saving ? 'Kaydediliyor...' : (shouldNavigate ? 'Yönlendiriliyor...' : (isEditMode ? 'Güncelle' : 'Kaydet'))}
                            </Button>
                        </Grid>
                    </Grid>
                    </fieldset>
                </form>
                )}

                {/* BOM Seçim Modal'ı */}
                <Modal
                    open={bomModalOpen}
                    onClose={closeBomModal}
                    closeAfterTransition
                    BackdropComponent={Backdrop}
                    BackdropProps={{
                        timeout: 500,
                    }}
                >
                    <Fade in={bomModalOpen}>
                        <Box sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: { xs: '90%', sm: '80%', md: '70%', lg: '60%' },
                            maxHeight: '80vh',
                            bgcolor: 'background.paper',
                            borderRadius: 2,
                            boxShadow: 24,
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                                <Typography variant="h6" component="h2">
                                    BOM Seç
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Makinaya eklemek istediğiniz BOM'ları seçin
                                </Typography>
                            </Box>

                            <Box sx={{ p: 3, flexGrow: 1, overflow: 'auto' }}>
                                {/* Arama Çubuğu */}
                                <TextField
                                    label="BOM Ara..."
                                    value={bomSearchTerm}
                                    onChange={(e) => setBomSearchTerm(e.target.value)}
                                    fullWidth
                                    size="small"
                                    placeholder="BOM adı veya açıklaması ile ara"
                                    sx={{ mb: 3 }}
                                />

                                {/* BOM Listesi */}
                                {bomsLoading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : filteredBoms.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                        {bomSearchTerm ? 'Arama kriterinize uygun BOM bulunamadı.' : 'Henüz BOM bulunmuyor.'}
                                    </Typography>
                                ) : (
                                    <Box>
                                        {filteredBoms.map((bom, index) => {
                                            // Backend'den 'id' alanı gelir, 'bom_id' YOK!
                                            const bomId = bom.id || `bom-${index}`;
                                            const bomIdStr = String(bomId);

                                            const isSelected = selectedBoms.has(bomIdStr);
                                            const isAlreadyAdded = items.some(item =>
                                                String(item.id) === bomIdStr && item.type === 'BOM'
                                            );

                                            return (
                                                <Box
                                                    key={`bom-${bomIdStr}`}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        mb: 2,
                                                        p: 1,
                                                        borderRadius: 1,
                                                        '&:hover': {
                                                            bgcolor: 'action.hover',
                                                        },
                                                        opacity: isAlreadyAdded ? 0.6 : 1
                                                    }}
                                                >
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onChange={(e) => handleBomSelection(bomIdStr, e)}
                                                        disabled={isAlreadyAdded}
                                                        sx={{ mt: 0.5 }}
                                                    />
                                                    <Box sx={{ ml: 2, flexGrow: 1 }}>
                                                        <Typography variant="body1" fontWeight={isAlreadyAdded ? 'normal' : 'medium'}>
                                                            {bom.name}
                                                            {isAlreadyAdded && (
                                                                <Typography component="span" variant="caption" color="success.main" sx={{ ml: 1 }}>
                                                                    (Eklendi)
                                                                </Typography>
                                                            )}
                                                        </Typography>
                                                        {bom.bom_aciklamasi && (
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                                {bom.bom_aciklamasi}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                )}
                            </Box>

                            <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                <Button
                                    onClick={closeBomModal}
                                    variant="outlined"
                                    color="secondary"
                                >
                                    İptal
                                </Button>
                                <Button
                                    onClick={addSelectedBoms}
                                    variant="contained"
                                    color="primary"
                                    disabled={selectedBoms.size === 0}
                                >
                                    Tamam ({selectedBoms.size} BOM)
                                </Button>
                            </Box>
                        </Box>
                    </Fade>
                </Modal>
            </Box>
        </ErrorBoundary>
    );
};

export default MakinaForm;