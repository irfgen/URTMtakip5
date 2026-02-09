import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box, Button, Card, CardContent, Typography, TextField, Grid, IconButton,
    List, ListItem, ListItemText, ListItemSecondaryAction,
    Select, MenuItem, FormControl, InputLabel, CircularProgress, Alert,
    Tabs, Tab, FormGroup, FormControlLabel, Checkbox, Pagination, Skeleton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useMakinalar } from '../../hooks/useMakinalar';
import ParcaSecimKarti from '../../../components/ParcaSecimKarti';

// TabPanel bileşeni
function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`makina-tabpanel-${index}`}
            aria-labelledby={`makina-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

// Parça kartları için skeleton loading
function ParcaSkeletonCard() {
    return (
        <Card sx={{ height: 350, display: 'flex', flexDirection: 'column' }}>
            <Skeleton variant="rectangular" height={200} />
            <CardContent sx={{ flexGrow: 1 }}>
                <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                <Skeleton variant="text" sx={{ fontSize: '0.8rem' }} width="60%" />
                <Skeleton variant="text" sx={{ fontSize: '0.8rem' }} width="80%" />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Skeleton variant="rectangular" width={24} height={24} />
                    <Skeleton variant="text" width="40%" />
                </Box>
            </CardContent>
        </Card>
    );
}

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
    
    // Custom hook kullanarak makina verilerini yönet
    const { 
        getMakinaById, 
        createMakina, 
        updateMakina, 
        searchParts, 
        searchBoms,
        loading,
        error,
        clearError 
    } = useMakinalar();

    const [makinaData, setMakinaData] = useState({
        name: '',
        description: '',
        model: '',
        seri_no: '',
        uretim_yili: '',
        durum: 'aktif'
    });
    const [items, setItems] = useState([]); // Bileşen içeriği: { id: string, name: string, type: 'PART' | 'BOM', quantity: number }
    const [saving, setSaving] = useState(false);
    const [shouldNavigate, setShouldNavigate] = useState(false); // Navigation control
    
    // Sekme state'i
    const [tabValue, setTabValue] = useState(0);
    
    // Grup sekmesi state'leri
    const [allGroups, setAllGroups] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState(new Set());
    const [groupsLoading, setGroupsLoading] = useState(false);
    
    // Parça sekmesi state'leri
    const [allParts, setAllParts] = useState([]);
    const [selectedParts, setSelectedParts] = useState(new Set());
    const [partsLoading, setPartsLoading] = useState(false);
    
    // Sayfalama ve filtreleme state'leri
    const [partsPage, setPartsPage] = useState(1);
    const [partsPerPage, setPartsPerPage] = useState(24);
    const [showAllParts, setShowAllParts] = useState(false); // "Tümü" modu için ayrı state
    const [partsFilter, setPartsFilter] = useState('');
    
    // Grup filtreleme
    const [groupsFilter, setGroupsFilter] = useState('');

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

    // Düzenleme modunda makina detaylarını yükle
    useEffect(() => {
        if (isEditMode) {
            const loadMakina = async () => {
                try {
                    const makina = await getMakinaById(id);
                    setMakinaData({
                        name: makina.name,
                        description: makina.description || '',
                        model: makina.model || '',
                        seri_no: makina.seri_no || '',
                        uretim_yili: makina.uretim_yili || '',
                        durum: makina.durum || 'aktif'
                    });
                    // Modeldeki get() metodu JSON'ı parse ettiği için doğrudan kullanabiliriz
                    setItems(makina.items || []);
                    clearError();
                } catch (err) {
                    console.error('Makina detayı yüklenirken hata:', err);
                }
            };
            
            loadMakina();
        }
    }, [id, isEditMode, getMakinaById, clearError]);

    // BOM gruplarını yükle
    useEffect(() => {
        const loadGroups = async () => {
            setGroupsLoading(true);
            try {
                const response = await fetch('/api/boms');
                const data = await response.json();
                setAllGroups(data.data || data);
            } catch (err) {
                console.error('BOM grupları yüklenirken hata:', err);
            } finally {
                setGroupsLoading(false);
            }
        };
        
        loadGroups();
    }, []);

    // Parçaları yükle
    useEffect(() => {
        let cancelled = false;
        
        const loadParts = async () => {
            setPartsLoading(true);
            try {
                // Timeout ekleyerek parça yükleme işlemini sınırla
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 saniye timeout
                
                const response = await fetch('/api/parcalar?limit=10000', {
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!cancelled) {
                    const data = await response.json();
                    const parcalarData = data.parcalar || [];
                    setAllParts(parcalarData);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('Parçalar yüklenirken hata:', err);
                    if (err.name === 'AbortError') {
                        console.error('Parça yükleme işlemi zaman aşımına uğradı.');
                    } else {
                        console.error('Parçalar yüklenirken bir hata oluştu.');
                    }
                    setAllParts([]);
                }
            } finally {
                if (!cancelled) {
                    setPartsLoading(false);
                }
            }
        };
        
        loadParts();
        
        return () => {
            cancelled = true;
        };
    }, []);

    // Düzenle modunda önceden seçili grupları ve parçaları ayarla
    useEffect(() => {
        if (isEditMode && items.length > 0 && allGroups.length > 0 && allParts.length > 0) {
            const groups = new Set();
            const parts = new Set();
            
            items.forEach(item => {
                if (item.type === 'BOM') {
                    groups.add(item.id);
                } else if (item.type === 'PART') {
                    parts.add(item.id);
                }
            });
            
            // Seçimleri ayarla
            setSelectedGroups(groups);
            setSelectedParts(parts);
        }
    }, [isEditMode, items, allGroups, allParts]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setMakinaData(prev => ({ ...prev, [name]: value }));
    };

    const handleGroupSelection = (groupId, groupName, isSelected) => {
        const newSelectedGroups = new Set(selectedGroups);
        
        if (isSelected) {
            newSelectedGroups.add(groupId);
        } else {
            newSelectedGroups.delete(groupId);
        }
        
        setSelectedGroups(newSelectedGroups);
    };

    const handlePartSelection = (partId, isSelected) => {
        const newSelectedParts = new Set(selectedParts);
        
        if (isSelected) {
            newSelectedParts.add(partId);
        } else {
            newSelectedParts.delete(partId);
        }
        
        setSelectedParts(newSelectedParts);
    };

    // Filtrelenmiş parça listesi
    const filteredParts = useMemo(() => {
        if (!Array.isArray(allParts)) {
            return [];
        }
        
        return allParts.filter(part => {
            if (!part) return false;
            const kodMatch = part.parcaKodu?.toLowerCase().includes(partsFilter.toLowerCase());
            const adMatch = part.parcaAdi?.toLowerCase().includes(partsFilter.toLowerCase());
            return kodMatch || adMatch;
        });
    }, [allParts, partsFilter]);
    
    // Sayfalandırılmış parça listesi
    const paginatedParts = showAllParts ? filteredParts : filteredParts.slice(
        (partsPage - 1) * partsPerPage,
        partsPage * partsPerPage
    );
    
    const totalPages = showAllParts ? 1 : Math.ceil(filteredParts.length / partsPerPage);

    // Sayfa değiştirme handler'ı
    const handlePartsPageChange = (event, value) => {
        setPartsPage(value);
    };
    
    // Filtre değiştirme handler'ı
    const handlePartsFilterChange = (event) => {
        setPartsFilter(event.target.value);
        setPartsPage(1); // Filtre değişince ilk sayfaya dön
    };
    
    // Sayfa başına parça sayısı değiştirme handler'ı
    const handlePartsPerPageChange = (event) => {
        const value = Number(event.target.value);
        if (value === -1) {
            // "Tümü" seçeneği
            setShowAllParts(true);
            setPartsPage(1);
        } else {
            setShowAllParts(false);
            setPartsPerPage(value);
            setPartsPage(1);
        }
    };
    
    // Grup filtre handler'ı
    const handleGroupsFilterChange = (event) => {
        setGroupsFilter(event.target.value);
    };
    
    // Filtrelenmiş grup listesi
    const filteredGroups = useMemo(() => {
        if (!Array.isArray(allGroups)) {
            return [];
        }
        
        return allGroups.filter(group => {
            if (!group) return false;
            const nameMatch = group.name?.toLowerCase().includes(groupsFilter.toLowerCase());
            const descMatch = group.description?.toLowerCase().includes(groupsFilter.toLowerCase());
            return nameMatch || descMatch;
        });
    }, [allGroups, groupsFilter]);

    // Items array'ini selectedGroups ve selectedParts'dan otomatik oluştur
    useEffect(() => {
        // Navigation state'inde effect'leri çalıştırma
        if (saving || shouldNavigate) {
            return;
        }
        
        const newItems = [];
        
        // Seçili grupları ekle
        if (selectedGroups && allGroups) {
            selectedGroups.forEach(groupId => {
                const group = allGroups.find(g => g.bom_id === groupId);
                if (group) {
                    // Mevcut item'da quantity varsa koru, yoksa 1 yap
                    const existingItem = items.find(item => item.id === groupId && item.type === 'BOM');
                    newItems.push({
                        id: groupId,
                        name: group.name,
                        type: 'BOM',
                        quantity: existingItem ? existingItem.quantity : 1
                    });
                }
            });
        }
        
        // Seçili parçaları ekle
        if (selectedParts && allParts) {
            selectedParts.forEach(partId => {
                const part = allParts.find(p => p.parcaKodu === partId);
                if (part) {
                    // Mevcut item'da quantity varsa koru, yoksa 1 yap
                    const existingItem = items.find(item => item.id === partId && item.type === 'PART');
                    newItems.push({
                        id: partId,
                        name: partId,
                        type: 'PART',
                        quantity: existingItem ? existingItem.quantity : 1
                    });
                }
            });
        }
        
        // Sadece items değişmişse güncelle
        if (JSON.stringify(newItems) !== JSON.stringify(items)) {
            setItems(newItems);
        }
    }, [selectedGroups, selectedParts, allGroups, allParts, saving, shouldNavigate]);

    const handleRemoveItem = (index) => {
        const itemToRemove = items[index];
        
        // Item'ı items array'inden kaldır
        setItems(prevItems => prevItems.filter((_, i) => i !== index));
        
        // İlgili seçimden de kaldır
        if (itemToRemove.type === 'BOM') {
            setSelectedGroups(prev => {
                const newSet = new Set(prev);
                newSet.delete(itemToRemove.id);
                return newSet;
            });
        } else if (itemToRemove.type === 'PART') {
            setSelectedParts(prev => {
                const newSet = new Set(prev);
                newSet.delete(itemToRemove.id);
                return newSet;
            });
        }
    };

    const handleQuantityChange = (index, value) => {
        const quantity = Math.max(1, parseInt(value) || 1);
        setItems(prev => prev.map((item, i) => i === index ? { ...item, quantity } : item));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!makinaData.name?.trim()) {
            return;
        }
        
        if (saving || shouldNavigate) {
            return; // Prevent double submission or submission during navigation
        }
        
        setSaving(true);
        setShouldNavigate(false);

        const payload = {
            ...makinaData,
            name: makinaData.name.trim(), // Trim whitespace
            items: items // Modeldeki set() JSON'a çevirecek
        };

        try {
            if (isEditMode) {
                await updateMakina(id, payload);
            } else {
                await createMakina(payload);
            }
            
            // Başarılı kaydetme sonrası controlled navigation
            setShouldNavigate(true);
        } catch (err) {
            console.error('Makina kaydedilirken hata:', err);
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

                        {/* Sağ Taraf: İçerik Yönetimi */}
                        <Grid item xs={12} md={7}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>Makina Bileşenleri</Typography>

                                    {/* Sekme Yapısı */}
                                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                                        <Tabs
                                            value={tabValue}
                                            onChange={(event, newValue) => setTabValue(newValue)}
                                            variant="fullWidth"
                                            aria-label="makina bileşenleri sekmeleri"
                                        >
                                            <Tab label="Gruplar" id="makina-tab-0" aria-controls="makina-tabpanel-0" />
                                            <Tab label="Parçalar" id="makina-tab-1" aria-controls="makina-tabpanel-1" />
                                        </Tabs>
                                    </Box>

                                    {/* Gruplar Sekmesi */}
                                    <TabPanel value={tabValue} index={0}>
                                        {/* Arama Çubuğu */}
                                        <Box sx={{ mb: 3 }}>
                                            <TextField
                                                label="Grup Ara..."
                                                value={groupsFilter}
                                                onChange={handleGroupsFilterChange}
                                                fullWidth
                                                size="small"
                                                placeholder="Grup adı ile ara"
                                            />
                                        </Box>
                                        
                                        {groupsLoading ? (
                                            <>
                                                <Skeleton variant="text" height={40} sx={{ mb: 3 }} />
                                                {Array.from(new Array(6)).map((_, index) => (
                                                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                        <Skeleton variant="rectangular" width={24} height={24} sx={{ mr: 2 }} />
                                                        <Box sx={{ flexGrow: 1 }}>
                                                            <Skeleton variant="text" sx={{ fontSize: '1rem' }} width="60%" />
                                                            <Skeleton variant="text" sx={{ fontSize: '0.8rem' }} width="40%" />
                                                        </Box>
                                                    </Box>
                                                ))}
                                            </>
                                        ) : filteredGroups.length === 0 ? (
                                            <Typography variant="body2" color="text.secondary">
                                                {groupsFilter ? 'Arama kriterinize uygun grup bulunamadı.' : 'Henüz BOM grubu bulunmuyor.'}
                                            </Typography>
                                        ) : (
                                            <>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    {filteredGroups.length} grup bulundu
                                                </Typography>
                                                <FormGroup>
                                                    {filteredGroups.map((group) => (
                                                    <FormControlLabel
                                                        key={group.bom_id}
                                                        control={
                                                            <Checkbox
                                                                checked={selectedGroups.has(group.bom_id)}
                                                                onChange={(e) => handleGroupSelection(
                                                                    group.bom_id, 
                                                                    group.name, 
                                                                    e.target.checked
                                                                )}
                                                                disabled={saving}
                                                            />
                                                        }
                                                        label={
                                                            <Box>
                                                                <Typography variant="body1" fontWeight="medium">
                                                                    {group.name}
                                                                </Typography>
                                                                {group.description && (
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {group.description}
                                                                </Typography>
                                                                )}
                                                            </Box>
                                                        }
                                                        sx={{ 
                                                            mb: 1, 
                                                            alignItems: 'flex-start',
                                                            '& .MuiFormControlLabel-label': { 
                                                                mt: 0.5 
                                                            }
                                                        }}
                                                    />
                                                ))}
                                                </FormGroup>
                                            </>
                                        )}
                                    </TabPanel>

                                    {/* Parçalar Sekmesi */}
                                    <TabPanel value={tabValue} index={1}>
                                        {/* Arama Çubuğu ve Ayarlar */}
                                        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                                            <TextField
                                                label="Parça Ara..."
                                                value={partsFilter}
                                                onChange={handlePartsFilterChange}
                                                fullWidth
                                                size="small"
                                                placeholder="Parça kodu veya adı ile ara"
                                            />
                                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                                <InputLabel>Sayfa başına</InputLabel>
                                                <Select
                                                    value={showAllParts ? -1 : partsPerPage}
                                                    onChange={handlePartsPerPageChange}
                                                    label="Sayfa başına"
                                                >
                                                    <MenuItem value={12}>12</MenuItem>
                                                    <MenuItem value={24}>24</MenuItem>
                                                    <MenuItem value={48}>48</MenuItem>
                                                    <MenuItem value={100}>100</MenuItem>
                                                    <MenuItem value={-1}>Tümü ({filteredParts.length})</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Box>
                                        
                                        {partsLoading ? (
                                            <>
                                                <Skeleton variant="text" height={40} sx={{ mb: 3 }} />
                                                <Grid container spacing={2}>
                                                    {Array.from(new Array(12)).map((_, index) => (
                                                        <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                                                            <ParcaSkeletonCard />
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                            </>
                                        ) : filteredParts.length === 0 ? (
                                            <Typography variant="body2" color="text.secondary">
                                                {partsFilter ? 'Arama kriterinize uygun parça bulunamadı.' : 'Henüz parça bulunmuyor.'}
                                            </Typography>
                                        ) : (
                                            <>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    {filteredParts.length} parça bulundu ({(partsPage - 1) * partsPerPage + 1}-{Math.min(partsPage * partsPerPage, filteredParts.length)} arası gösteriliyor)
                                                </Typography>
                                                <Grid container spacing={2}>
                                                    {paginatedParts.map((parca) => (
                                                        <Grid item xs={12} sm={6} md={4} lg={3} key={parca.parcaKodu}>
                                                            <ParcaSecimKarti
                                                                parca={parca}
                                                                selected={selectedParts.has(parca.parcaKodu)}
                                                                onSelectionChange={handlePartSelection}
                                                                disabled={saving}
                                                            />
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                                
                                                {/* Sayfalama - sadece "Tümü" modunda değilse ve birden fazla sayfa varsa göster */}
                                                {!showAllParts && Math.ceil(filteredParts.length / partsPerPage) > 1 && (
                                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                                        <Pagination
                                                            count={Math.ceil(filteredParts.length / partsPerPage)}
                                                            page={partsPage}
                                                            onChange={handlePartsPageChange}
                                                            color="primary"
                                                            size="large"
                                                        />
                                                    </Box>
                                                )}
                                            </>
                                        )}
                                    </TabPanel>

                                    {/* Seçili Bileşenler Listesi */}
                                    <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                        <Typography variant="subtitle1" sx={{ mb: 2 }}>Seçili Bileşenler:</Typography>
                                        {items.length === 0 ? (
                                            <Typography variant="body2" color="text.secondary">Henüz bileşen seçilmedi.</Typography>
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
            </Box>
        </ErrorBoundary>
    );
};

export default MakinaForm;