import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    TextField, 
    Button, 
    Card, 
    CardContent, 
    CardMedia,
    Grid,
    IconButton,
    Chip,
    Divider,
    Alert,
    CircularProgress,
    Tabs,
    Tab,
    Badge,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Snackbar,
    Tooltip,
    ButtonGroup
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import BuildIcon from '@mui/icons-material/Build';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AssignmentIcon from '@mui/icons-material/Assignment';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import UretimPlaniIsEmriSecimiModal from './UretimPlaniIsEmriSecimiModal';
import UretimPlaniFasonSecimiModal from './UretimPlaniFasonSecimiModal';
import { getFotoPath } from '../../utils/imageUtils';
import axios from 'axios';
import { isEmriDurumAPI, tezgahAPI, tezgahPlanAPI } from '../../services/api';
import ExcelUretimPlaniModal from './ExcelUretimPlaniModal';

const KarmaUretimPlaniForm = () => {
    // State tanımlamaları
    const [planAdi, setPlanAdi] = useState('');
    const [aciklama, setAciklama] = useState('');
    const [activeTab, setActiveTab] = useState(0);
    
    // Modal States
    const [isEmriModalOpen, setIsEmriModalOpen] = useState(false);
    const [fasonModalOpen, setFasonModalOpen] = useState(false);
    const [excelModalOpen, setExcelModalOpen] = useState(false);
    
    // Seçilmiş Öğeler
    const [selectedIsEmirleri, setSelectedIsEmirleri] = useState([]);
    const [selectedFasonlar, setSelectedFasonlar] = useState([]);
    
    // Parça Görselleri
    const [parcaGorselleri, setParcaGorselleri] = useState({});
    
    // Form States
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    
    // Excel Import States
    const [importing, setImporting] = useState(false);
    const [importSuccess, setImportSuccess] = useState(false);
    const [importError, setImportError] = useState(null);
    
    // Yeni özellikler için state'ler
    const [durumlar, setDurumlar] = useState([]);
    const [tezgahlar, setTezgahlar] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    
    // Dialog state'leri
    const [fasonDialogOpen, setFasonDialogOpen] = useState(false);
    const [durumDialogOpen, setDurumDialogOpen] = useState(false);
    const [tezgahDialogOpen, setTezgahDialogOpen] = useState(false);
    const [selectedIsEmriForAction, setSelectedIsEmriForAction] = useState(null);
    const [selectedDurum, setSelectedDurum] = useState('');
    const [selectedTezgah, setSelectedTezgah] = useState('');

    // Base64 encoded placeholder image
    const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdvcnNlbCBZb2s8L3RleHQ+PC9zdmc+';

    // Durumları ve tezgahları yükle
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Durumları yükle
                const durumResponse = await isEmriDurumAPI.getAll();
                setDurumlar(durumResponse.data.filter(d => d.aktif));
                
                // Tezgahları yükle
                const tezgahResponse = await tezgahAPI.getAll();
                setTezgahlar(tezgahResponse.data || []);
            } catch (error) {
                console.error('İlk veri yüklenirken hata:', error);
                setSnackbar({
                    open: true,
                    message: 'Veriler yüklenirken bir hata oluştu',
                    severity: 'error'
                });
            }
        };
        
        loadInitialData();
    }, []);

    // Tab değişimi
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // İş emri seçme modalını aç
    const handleIsEmriEkleClick = () => {
        setIsEmriModalOpen(true);
    };

    // Fason seçme modalını aç
    const handleFasonEkleClick = () => {
        setFasonModalOpen(true);
    };

    // Modal kapama fonksiyonları
    const handleIsEmriModalClose = () => {
        setIsEmriModalOpen(false);
    };

    const handleFasonModalClose = () => {
        setFasonModalOpen(false);
    };
    // Excel modal handlers
    const handleExcelModalOpen = () => setExcelModalOpen(true);
    const handleExcelModalClose = () => setExcelModalOpen(false);
    const handleExcelSuccess = (result) => {
        console.log('Excel import başarılı (karma):', result);
        if (result?.isEmriTaslakOlusturuldu && result?.oturum_id) {
            window.location.href = `/is-emri-taslaklari/${result.oturum_id}`;
            return;
        }
        if (Array.isArray(result?.isEmirleri) && result.isEmirleri.length > 0) {
            const yeniIsEmirleri = result.isEmirleri.map(isEmri => ({
                id: isEmri.is_emri_id,
                is_emri_id: isEmri.is_emri_id,
                is_emri_no: isEmri.is_emri_no,
                is_adi: isEmri.is_adi,
                parca_kodu: isEmri.parca_kodu,
                adet: isEmri.adet,
                durum: isEmri.durum || 'beklemede',
                parca: isEmri.parca
            }));
            setSelectedIsEmirleri(prev => [...prev, ...yeniIsEmirleri]);
        }
        setExcelModalOpen(false);
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 5000);
    };

    // Parça görsellerini yükleme
    const loadParcaGorselleri = async (isEmirleri) => {
        const newGorseller = {};
        
        try {
            for (const isEmri of isEmirleri) {
                const emriId = isEmri.id || isEmri.is_emri_id;
                
                // Parça kodu varsa görseli yükle
                if (isEmri.parca_kodu) {
                    try {
                        const response = await axios.get(`/api/parcalar/${isEmri.parca_kodu}`);
                        const parcaData = response.data;
                        
                        if (parcaData && parcaData.foto_path) {
                            const gorselUrl = getFotoPath(parcaData.foto_path);
                            newGorseller[emriId] = gorselUrl;
                        }
                    } catch (error) {
                        console.log(`Parça görseli bulunamadı: ${isEmri.parca_kodu}`);
                    }
                }
            }
            
            setParcaGorselleri(prev => ({ ...prev, ...newGorseller }));
        } catch (error) {
            console.error('Parça görselleri yüklenirken hata:', error);
        }
    };

    // İş emri seçimi
    const handleIsEmirleriSec = async (yeniIsEmirleri) => {
        console.log('Seçilen iş emirleri:', yeniIsEmirleri);
        
        const mevcutIds = selectedIsEmirleri.map(ie => ie.id || ie.is_emri_id);
        const yeniEklenecekler = yeniIsEmirleri.filter(ie => 
            !mevcutIds.includes(ie.id || ie.is_emri_id)
        );
        
        if (yeniEklenecekler.length > 0) {
            setSelectedIsEmirleri([...selectedIsEmirleri, ...yeniEklenecekler]);
            // Yeni eklenen iş emirleri için parça görsellerini yükle
            await loadParcaGorselleri(yeniEklenecekler);
        }
        
        setIsEmriModalOpen(false);
    };

    // Fason seçimi
    const handleFasonlariSec = (yeniFasonlar) => {
        console.log('Seçilen fasonlar:', yeniFasonlar);
        
        const mevcutIds = selectedFasonlar.map(f => f.fason_is_emri_id);
        const yeniEklenecekler = yeniFasonlar.filter(f => 
            !mevcutIds.includes(f.fason_is_emri_id)
        );
        
        if (yeniEklenecekler.length > 0) {
            setSelectedFasonlar([...selectedFasonlar, ...yeniEklenecekler]);
        }
        
        setFasonModalOpen(false);
    };

    // İş emrini listeden çıkart
    const handleIsEmriCikart = (isEmriId) => {
        setSelectedIsEmirleri(selectedIsEmirleri.filter(ie => (ie.id || ie.is_emri_id) !== isEmriId));
        // Görsel de temizle
        setParcaGorselleri(prev => {
            const newGorseller = { ...prev };
            delete newGorseller[isEmriId];
            return newGorseller;
        });
    };

    // Fason'u listeden çıkart
    const handleFasonCikart = (fasonId) => {
        setSelectedFasonlar(selectedFasonlar.filter(f => f.fason_is_emri_id !== fasonId));
    };

    // Yeni özellik buton handlers
    const handleFasonOlustur = (isEmri) => {
        setSelectedIsEmriForAction(isEmri);
        setFasonDialogOpen(true);
    };

    const handleDurumDegistir = (isEmri) => {
        setSelectedIsEmriForAction(isEmri);
        setSelectedDurum(isEmri.durum || '');
        setDurumDialogOpen(true);
    };

    const handleTezgahAta = (isEmri) => {
        setSelectedIsEmriForAction(isEmri);
        setSelectedTezgah('');
        setTezgahDialogOpen(true);
    };

    // Fason iş oluşturma işlemi
    const handleFasonOlusturOnayla = async () => {
        try {
            if (!selectedIsEmriForAction) return;
            
            const fasonData = {
                parca_kodu: selectedIsEmriForAction.parca_kodu,
                fason_adet: selectedIsEmriForAction.adet,
                kaynak_is_emri_id: selectedIsEmriForAction.id || selectedIsEmriForAction.is_emri_id,
                durum: 'beklemede',
                aciklama: `${selectedIsEmriForAction.is_emri_no} iş emrinden oluşturuldu`
            };

            await axios.post('/api/fason', fasonData);
            
            setSnackbar({
                open: true,
                message: 'Fason iş başarıyla oluşturuldu',
                severity: 'success'
            });
            
            setFasonDialogOpen(false);
            setSelectedIsEmriForAction(null);
        } catch (error) {
            console.error('Fason iş oluşturulurken hata:', error);
            setSnackbar({
                open: true,
                message: 'Fason iş oluşturulurken bir hata oluştu',
                severity: 'error'
            });
        }
    };

    // İş emri durum değiştirme işlemi
    const handleDurumDegistirOnayla = async () => {
        try {
            if (!selectedIsEmriForAction || !selectedDurum) return;
            
            const isEmriId = selectedIsEmriForAction.id || selectedIsEmriForAction.is_emri_id;
            await axios.put(`/api/is-emirleri/${isEmriId}`, { durum: selectedDurum });
            
            // Yerel state'i güncelle
            setSelectedIsEmirleri(prev => 
                prev.map(ie => 
                    (ie.id || ie.is_emri_id) === isEmriId 
                        ? { ...ie, durum: selectedDurum }
                        : ie
                )
            );
            
            setSnackbar({
                open: true,
                message: 'İş emri durumu başarıyla güncellendi',
                severity: 'success'
            });
            
            setDurumDialogOpen(false);
            setSelectedIsEmriForAction(null);
            setSelectedDurum('');
        } catch (error) {
            console.error('İş emri durumu güncellenirken hata:', error);
            setSnackbar({
                open: true,
                message: 'İş emri durumu güncellenirken bir hata oluştu',
                severity: 'error'
            });
        }
    };

    // Tezgah atama işlemi
    const handleTezgahAtaOnayla = async () => {
        try {
            if (!selectedIsEmriForAction || !selectedTezgah) return;
            
            const isEmriId = selectedIsEmriForAction.id || selectedIsEmriForAction.is_emri_id;
            await tezgahPlanAPI.addPlanlananIs(selectedTezgah, isEmriId);
            
            setSnackbar({
                open: true,
                message: 'İş emri başarıyla tezgaha atandı',
                severity: 'success'
            });
            
            setTezgahDialogOpen(false);
            setSelectedIsEmriForAction(null);
            setSelectedTezgah('');
        } catch (error) {
            console.error('İş emri tezgaha atanırken hata:', error);
            setSnackbar({
                open: true,
                message: 'İş emri tezgaha atanırken bir hata oluştu',
                severity: 'error'
            });
        }
    };

    // Dialog kapatma fonksiyonları
    const handleDialogClose = () => {
        setFasonDialogOpen(false);
        setDurumDialogOpen(false);
        setTezgahDialogOpen(false);
        setSelectedIsEmriForAction(null);
        setSelectedDurum('');
        setSelectedTezgah('');
    };

    // Durum chip renkleri - dinamik
    const getDurumColor = (durum) => {
        const durumObj = durumlar.find(d => d.durum_kodu === durum);
        return durumObj ? durumObj.renk_kodu : '#9e9e9e';
    };

    // Form temizleme
    const resetForm = () => {
        setPlanAdi('');
        setAciklama('');
        setSelectedIsEmirleri([]);
        setSelectedFasonlar([]);
        setActiveTab(0);
        setSaveError(null);
        setSaveSuccess(false);
    };

    // Karma üretim planını kaydet
    const handleSave = async () => {
        if (!planAdi.trim()) {
            setSaveError('Üretim planı adı gereklidir');
            return;
        }

        if (selectedIsEmirleri.length === 0 && selectedFasonlar.length === 0) {
            setSaveError('En az bir iş emri veya fason iş emri seçmelisiniz');
            return;
        }

        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        try {
            const karmaUretimPlaniData = {
                plan_adi: planAdi.trim(),
                aciklama: aciklama.trim() || null,
                is_emirleri: selectedIsEmirleri.map(ie => ({
                    is_emri_id: ie.id || ie.is_emri_id,
                    is_emri_no: ie.is_emri_no,
                    is_adi: ie.is_adi,
                    parca_kodu: ie.parca_kodu,
                    adet: ie.adet,
                    durum: ie.durum
                })),
                fason_is_emirleri: selectedFasonlar.map(f => ({
                    fason_is_emri_id: f.fason_is_emri_id,
                    parca_kodu: f.parca_kodu,
                    fason_adet: f.fason_adet,
                    tedarikci: f.tedarikci,
                    durum: f.durum,
                    teslim_tarihi: f.teslim_tarihi
                })),
                durum: 'aktif'
            };

            console.log('Gönderilecek karma plan verisi:', karmaUretimPlaniData);

            const response = await axios.post('/api/uretim-plani/karma', karmaUretimPlaniData);
            
            console.log('Karma üretim planı başarıyla kaydedildi:', response.data);
            
            setSaveSuccess(true);
            
            // 2 saniye sonra formu temizle
            setTimeout(() => {
                resetForm();
            }, 2000);

        } catch (err) {
            console.error('Karma üretim planı kaydedilirken hata:', err);
            setSaveError(
                err.response?.data?.message || 
                'Karma üretim planı kaydedilirken bir hata oluştu'
            );
        } finally {
            setSaving(false);
        }
    };

    // Toplam istatistikler
    const toplamIsEmri = selectedIsEmirleri.length;
    const toplamFason = selectedFasonlar.length;
    const toplamOge = toplamIsEmri + toplamFason;

    // Debug log
    console.log('Debug - Karma Plan Form:', {
        planAdi: planAdi.trim(),
        toplamIsEmri,
        toplamFason,
        toplamOge,
        saving,
        buttonDisabled: saving || (!planAdi.trim()) || (toplamOge === 0)
    });

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            {/* Başlık */}
            <Typography variant="h4" component="h1" gutterBottom>
                Karma Üretim Planı Oluştur
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                İş emirleri ve fason işleri birlikte içeren üretim planı oluşturun
            </Typography>

            {/* Plan Bilgileri */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Plan Bilgileri
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Plan Adı *"
                            value={planAdi}
                            onChange={(e) => setPlanAdi(e.target.value)}
                            placeholder="Örn: Ağustos 2025 Karma Üretim Planı"
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Açıklama"
                            value={aciklama}
                            onChange={(e) => setAciklama(e.target.value)}
                            placeholder="İsteğe bağlı açıklama..."
                        />
                    </Grid>
                </Grid>

                {/* İstatistikler */}
                <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip 
                        icon={<WorkIcon />}
                        label={`${toplamIsEmri} İş Emri`}
                        color="primary"
                        variant={toplamIsEmri > 0 ? "filled" : "outlined"}
                    />
                    <Chip 
                        icon={<BusinessIcon />}
                        label={`${toplamFason} Fason İş`}
                        color="secondary"
                        variant={toplamFason > 0 ? "filled" : "outlined"}
                    />
                    <Chip 
                        label={`Toplam: ${toplamOge} Öğe`}
                        color="default"
                        variant={toplamOge > 0 ? "filled" : "outlined"}
                    />
                </Box>
            </Paper>

            {/* Tab Sistemi */}
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="scrollable"
                    scrollButtons
                    allowScrollButtonsMobile
                >
                    <Tab 
                        label={
                            <Badge badgeContent={toplamIsEmri} color="primary">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <WorkIcon />
                                    İş Emirleri
                                </Box>
                            </Badge>
                        }
                    />
                    <Tab 
                        label={
                            <Badge badgeContent={toplamFason} color="secondary">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <BusinessIcon />
                                    Fason İşleri
                                </Box>
                            </Badge>
                        }
                    />
                </Tabs>

                {/* İş Emirleri Tab'ı */}
                {activeTab === 0 && (
                    <Box sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                Seçilen İş Emirleri ({toplamIsEmri})
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleIsEmriEkleClick}
                                color="primary"
                            >
                                İş Emri Seç
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<UploadFileIcon />}
                                onClick={handleExcelModalOpen}
                                color="secondary"
                            >
                                Excel'den Ekle
                            </Button>
                        </Box>

                        {selectedIsEmirleri.length === 0 ? (
                            <Alert severity="info">
                                Henüz iş emri seçilmedi. "İş Emri Seç" butonuna tıklayarak iş emirleri ekleyebilirsiniz.
                            </Alert>
                        ) : (
                            <Grid container spacing={2}>
                                {selectedIsEmirleri.map((isEmri) => (
                                    <Grid item xs={12} sm={6} md={4} key={isEmri.id || isEmri.is_emri_id}>
                                        <Card>
                                            <CardMedia
                                                component="img"
                                                height="140"
                                                image={
                                                    parcaGorselleri[isEmri.id || isEmri.is_emri_id] || placeholderImage
                                                }
                                                alt={isEmri.is_adi}
                                                onError={(e) => {
                                                    e.target.src = placeholderImage;
                                                }}
                                            />
                                            <CardContent>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                    <Typography variant="subtitle1" component="div" noWrap>
                                                        <strong>{isEmri.is_emri_no}</strong>
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                        <Tooltip title="Fason İş Oluştur">
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={() => handleFasonOlustur(isEmri)}
                                                            >
                                                                <BuildIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Durum Değiştir">
                                                            <IconButton
                                                                size="small"
                                                                color="info"
                                                                onClick={() => handleDurumDegistir(isEmri)}
                                                            >
                                                                <SwapHorizIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Tezgaha Ata">
                                                            <IconButton
                                                                size="small"
                                                                color="secondary"
                                                                onClick={() => handleTezgahAta(isEmri)}
                                                            >
                                                                <AssignmentIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Listeden Çıkar">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleIsEmriCikart(isEmri.id || isEmri.is_emri_id)}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </Box>
                                                
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                    {isEmri.is_adi}
                                                </Typography>
                                                
                                                <Typography variant="body2" sx={{ mb: 1 }}>
                                                    <strong>Parça:</strong> {isEmri.parca_kodu}
                                                </Typography>
                                                
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Chip
                                                        label={isEmri.durum}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: getDurumColor(isEmri.durum),
                                                            color: 'white',
                                                            fontWeight: 'bold'
                                                        }}
                                                    />
                                                    <Typography variant="body2">
                                                        <strong>{isEmri.adet} adet</strong>
                                                    </Typography>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Box>
                )}

                {/* Fason İşleri Tab'ı */}
                {activeTab === 1 && (
                    <Box sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                Seçilen Fason İşleri ({toplamFason})
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleFasonEkleClick}
                                color="secondary"
                            >
                                Fason Seç
                            </Button>
                        </Box>

                        {selectedFasonlar.length === 0 ? (
                            <Alert severity="info">
                                Henüz fason iş emri seçilmedi. "Fason Seç" butonuna tıklayarak fason işleri ekleyebilirsiniz.
                            </Alert>
                        ) : (
                            <Grid container spacing={2}>
                                {selectedFasonlar.map((fason) => (
                                    <Grid item xs={12} sm={6} md={4} key={fason.fason_is_emri_id}>
                                        <Card>
                                            <CardMedia
                                                component="img"
                                                height="140"
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
                                            <CardContent>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                    <Typography variant="subtitle1" component="div" noWrap>
                                                        <strong>{fason.parca?.parcaKodu || 'N/A'}</strong>
                                                    </Typography>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleFasonCikart(fason.fason_is_emri_id)}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Box>
                                                
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                    {fason.parca?.parcaAdi || 'Parça adı belirtilmemiş'}
                                                </Typography>
                                                
                                                <Typography variant="body2" sx={{ mb: 1 }}>
                                                    <strong>Tedarikçi:</strong> {fason.tedarikci}
                                                </Typography>
                                                
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
                                                    <Typography variant="body2">
                                                        <strong>{fason.fason_adet} adet</strong>
                                                    </Typography>
                                                </Box>

                                                {/* Grup bilgisi varsa göster */}
                                                {fason.fason_grup && (
                                                    <Box sx={{ mt: 1 }}>
                                                        <Chip
                                                            label={fason.fason_grup.grup_adi}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{
                                                                borderColor: fason.fason_grup.renk,
                                                                color: fason.fason_grup.renk,
                                                                fontSize: '0.7rem'
                                                            }}
                                                        />
                                                    </Box>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Box>
                )}
            </Paper>

            {/* Hata/Başarı Mesajları */}
            {saveError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {saveError}
                </Alert>
            )}

            {saveSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    Karma üretim planı başarıyla oluşturuldu! Form temizleniyor...
                </Alert>
            )}

            {/* Kaydet Butonu */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                    variant="outlined"
                    size="large"
                    onClick={resetForm}
                    disabled={saving}
                >
                    Temizle
                </Button>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    onClick={handleSave}
                    disabled={saving || (!planAdi.trim()) || (toplamOge === 0)}
                    sx={{ minWidth: 200 }}
                >
                    {saving ? 'Kaydediliyor...' : `Karma Planı Kaydet (${toplamOge} öğe)`}
                </Button>
            </Box>

            {/* Modal'lar */}
            <UretimPlaniIsEmriSecimiModal
                open={isEmriModalOpen}
                onClose={handleIsEmriModalClose}
                onSelectIsEmirleri={handleIsEmirleriSec}
                selectedIsEmriIds={selectedIsEmirleri.map(ie => ie.id || ie.is_emri_id)}
            />

            <UretimPlaniFasonSecimiModal
                open={fasonModalOpen}
                onClose={handleFasonModalClose}
                onSelect={handleFasonlariSec}
                selectedFasonIds={selectedFasonlar.map(f => f.fason_is_emri_id)}
            />

            {/* Fason İş Oluşturma Dialog */}
            <Dialog open={fasonDialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
                <DialogTitle>Fason İş Oluştur</DialogTitle>
                <DialogContent>
                    {selectedIsEmriForAction && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body1" gutterBottom>
                                <strong>İş Emri:</strong> {selectedIsEmriForAction.is_emri_no}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>İş Adı:</strong> {selectedIsEmriForAction.is_adi}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Parça Kodu:</strong> {selectedIsEmriForAction.parca_kodu}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Adet:</strong> {selectedIsEmriForAction.adet}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 2 }}>
                                Bu iş emrinden fason iş oluşturulacaktır.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose}>İptal</Button>
                    <Button onClick={handleFasonOlusturOnayla} variant="contained" color="primary">
                        Fason İş Oluştur
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Durum Değiştirme Dialog */}
            <Dialog open={durumDialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
                <DialogTitle>İş Emri Durumunu Değiştir</DialogTitle>
                <DialogContent>
                    {selectedIsEmriForAction && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body1" gutterBottom>
                                <strong>İş Emri:</strong> {selectedIsEmriForAction.is_emri_no}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                <strong>Mevcut Durum:</strong> {selectedIsEmriForAction.durum}
                            </Typography>
                            
                            <FormControl fullWidth>
                                <InputLabel>Yeni Durum</InputLabel>
                                <Select
                                    value={selectedDurum}
                                    onChange={(e) => setSelectedDurum(e.target.value)}
                                    label="Yeni Durum"
                                >
                                    {durumlar.map((durum) => (
                                        <MenuItem key={durum.durum_id} value={durum.durum_kodu}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box
                                                    sx={{
                                                        width: 16,
                                                        height: 16,
                                                        backgroundColor: durum.renk_kodu,
                                                        borderRadius: 1,
                                                        border: '1px solid',
                                                        borderColor: 'divider'
                                                    }}
                                                />
                                                {durum.durum_adi}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose}>İptal</Button>
                    <Button 
                        onClick={handleDurumDegistirOnayla} 
                        variant="contained" 
                        color="primary"
                        disabled={!selectedDurum}
                    >
                        Durumu Değiştir
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Tezgah Atama Dialog */}
            <Dialog open={tezgahDialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
                <DialogTitle>Tezgaha Ata</DialogTitle>
                <DialogContent>
                    {selectedIsEmriForAction && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body1" gutterBottom>
                                <strong>İş Emri:</strong> {selectedIsEmriForAction.is_emri_no}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                <strong>İş Adı:</strong> {selectedIsEmriForAction.is_adi}
                            </Typography>
                            
                            <FormControl fullWidth>
                                <InputLabel>Tezgah Seç</InputLabel>
                                <Select
                                    value={selectedTezgah}
                                    onChange={(e) => setSelectedTezgah(e.target.value)}
                                    label="Tezgah Seç"
                                >
                                    {tezgahlar.map((tezgah) => (
                                        <MenuItem key={tezgah.tezgah_id} value={tezgah.tezgah_id}>
                                            {tezgah.tezgah_tanimi || tezgah.ad || `Tezgah #${tezgah.tezgah_id}`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose}>İptal</Button>
                    <Button 
                        onClick={handleTezgahAtaOnayla} 
                        variant="contained" 
                        color="primary"
                        disabled={!selectedTezgah}
                    >
                        Tezgaha Ata
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert 
                    onClose={() => setSnackbar({ ...snackbar, open: false })} 
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
            <ExcelUretimPlaniModal 
                open={excelModalOpen} 
                onClose={handleExcelModalClose} 
                onSuccess={handleExcelSuccess}
            />
        </Box>
    );
};

export default KarmaUretimPlaniForm;
