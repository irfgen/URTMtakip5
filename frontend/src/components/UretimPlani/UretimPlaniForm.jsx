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
    CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import TableViewIcon from '@mui/icons-material/TableView';
import UretimPlaniIsEmriSecimiModal from './UretimPlaniIsEmriSecimiModal';
import ExcelUretimPlaniModal from './ExcelUretimPlaniModal';
import { getFotoPath } from '../../utils/imageUtils';
import axios from 'axios';

const UretimPlaniForm = () => {
    // State tanımlamaları
    const [planAdi, setPlanAdi] = useState('');
    const [isEmriModalOpen, setIsEmriModalOpen] = useState(false);
    const [excelModalOpen, setExcelModalOpen] = useState(false);
    const [selectedIsEmirleri, setSelectedIsEmirleri] = useState([]);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Base64 encoded placeholder image (1x1 pixel gray image)
    const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdvcnNlbCBZb2s8L3RleHQ+PC9zdmc+';

    // İş emri seçme modalını aç
    const handleIsEmriEkleClick = () => {
        setIsEmriModalOpen(true);
    };

    // İş emri seçme modalını kapat
    const handleModalClose = () => {
        setIsEmriModalOpen(false);
    };

    // Excel modal kontrolü
    const handleExcelModalOpen = () => {
        setExcelModalOpen(true);
    };

    const handleExcelModalClose = () => {
        setExcelModalOpen(false);
    };

    // Excel'den iş emri taslakları oluşturulduğunda
    const handleExcelSuccess = (result) => {
        console.log('Excel import başarılı:', result);
        
        // Eğer taslak oluşturulduysa, taslak yönetimi sayfasına yönlendir
        if (result.isEmriTaslakOlusturuldu && result.oturum_id) {
            // Taslak yönetimi sayfasına yönlendir
            window.location.href = `/is-emri-taslaklari/${result.oturum_id}`;
            return;
        }
        
        // Eski sistem (direkt iş emri oluşturma) ile uyumluluk
        if (result.isEmirleri && result.isEmirleri.length > 0) {
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
        
        // Plan adını Excel'den gelen veriye göre güncelle
        if (result.planAdi && !planAdi.trim()) {
            setPlanAdi(result.planAdi);
        }
        
        setExcelModalOpen(false);
        setSaveSuccess(true);
        
        // Başarı mesajını 5 saniye sonra gizle
        setTimeout(() => {
            setSaveSuccess(false);
        }, 5000);
    };

    // YeniIsSecimiModali'nden çoklu iş emri seçildiğinde
    const handleIsEmirleriSec = (yeniIsEmirleri) => {
        console.log('Seçilen iş emirleri:', yeniIsEmirleri);
        
        // Mevcut listeye yeni seçilenleri ekle (duplikasyon kontrolü ile)
        const mevcutIds = selectedIsEmirleri.map(ie => ie.id || ie.is_emri_id);
        const yeniEklenecekler = yeniIsEmirleri.filter(ie => 
            !mevcutIds.includes(ie.id || ie.is_emri_id)
        );
        
        if (yeniEklenecekler.length > 0) {
            setSelectedIsEmirleri([...selectedIsEmirleri, ...yeniEklenecekler]);
        }
        
        setIsEmriModalOpen(false);
    };

    // İş emrini listeden çıkart
    const handleIsEmriCikart = (isEmriId) => {
        setSelectedIsEmirleri(selectedIsEmirleri.filter(ie => (ie.id || ie.is_emri_id) !== isEmriId));
    };

    // Üretim planını kaydet
    const handleSave = async () => {
        if (!planAdi.trim()) {
            setSaveError('Üretim planı adı gereklidir');
            return;
        }

        if (selectedIsEmirleri.length === 0) {
            setSaveError('En az bir iş emri seçmelisiniz');
            return;
        }

        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        try {
            const uretimPlaniData = {
                plan_adi: planAdi.trim(),
                is_emirleri: selectedIsEmirleri.map(ie => ({
                    is_emri_id: ie.id || ie.is_emri_id,
                    is_emri_no: ie.is_emri_no,
                    is_adi: ie.is_adi,
                    parca_kodu: ie.parca_kodu,
                    adet: ie.adet,
                    durum: ie.durum
                })),
                durum: 'aktif',
                olusturma_tarihi: new Date().toISOString()
            };

            const response = await axios.post('/api/uretim-plani/is-emri-tabanli', uretimPlaniData);
            
            console.log('Üretim planı başarıyla kaydedildi:', response.data);
            setSaveSuccess(true);
            
            // Form temizle
            setPlanAdi('');
            setSelectedIsEmirleri([]);
            
            // Başarı mesajını 3 saniye sonra gizle
            setTimeout(() => {
                setSaveSuccess(false);
            }, 3000);

        } catch (error) {
            console.error('Üretim planı kaydedilirken hata:', error);
            setSaveError(
                error.response?.data?.error || 
                error.response?.data?.message || 
                'Üretim planı kaydedilirken bir hata oluştu'
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            {/* Başlık */}
            <Typography variant="h4" gutterBottom>
                Yeni Üretim Planı
            </Typography>

            {/* Plan Adı */}
            <Box sx={{ mb: 3 }}>
                <TextField
                    label="Üretim Planı Adı"
                    value={planAdi}
                    onChange={(e) => setPlanAdi(e.target.value)}
                    fullWidth
                    variant="outlined"
                    placeholder="Üretim planınıza bir ad verin"
                    helperText="Bu ad üretim planını tanımlamak için kullanılacak"
                />
            </Box>

            {/* İş Emri Ekle Butonları */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleIsEmriEkleClick}
                    size="large"
                    color="primary"
                >
                    İş Emri Ekle
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<TableViewIcon />}
                    onClick={handleExcelModalOpen}
                    size="large"
                    color="success"
                >
                    Excel'den Oluştur
                </Button>
            </Box>

            {/* Hata ve Başarı Mesajları */}
            {saveError && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSaveError(null)}>
                    {saveError}
                </Alert>
            )}
            
            {saveSuccess && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    {selectedIsEmirleri.length > 0 && selectedIsEmirleri.some(ie => ie.fromExcel) 
                        ? 'Excel\'den iş emirleri başarıyla oluşturuldu ve eklendi!'
                        : 'Üretim planı başarıyla kaydedildi!'
                    }
                </Alert>
            )}

            {/* Seçilen İş Emirleri Listesi */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Seçilen İş Emirleri ({selectedIsEmirleri.length})
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    {selectedIsEmirleri.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                            Henüz iş emri eklenmedi. Yukarıdaki "İş Emri Ekle" butonunu kullanarak iş emri ekleyebilirsiniz.
                        </Typography>
                    ) : (
                        <Grid container spacing={2}>
                            {selectedIsEmirleri.map((isEmri) => {
                                const emriId = isEmri.id || isEmri.is_emri_id;
                                return (
                                    <Grid item xs={12} sm={6} md={4} key={emriId}>
                                        <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                            <CardMedia
                                                component="img"
                                                height="120"
                                                image={
                                                    isEmri.parca?.foto_path ? getFotoPath(isEmri.parca.foto_path) : 
                                                    isEmri.resim ? getFotoPath(isEmri.resim) : 
                                                    placeholderImage
                                                }
                                                alt={isEmri.parca?.parca_adi || isEmri.is_adi}
                                                sx={{ objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.target.src = placeholderImage;
                                                }}
                                            />
                                            <CardContent sx={{ flexGrow: 1 }}>
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    {isEmri.is_emri_no}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {isEmri.is_adi || 'İş adı belirtilmemiş'}
                                                </Typography>
                                                {isEmri.parca && (
                                                    <Typography variant="body2">
                                                        Parça: {isEmri.parca.parca_kodu}
                                                    </Typography>
                                                )}
                                                {isEmri.siparis && (
                                                    <Typography variant="body2" color="info.main">
                                                        Sipariş: {isEmri.siparis.siparis_no}
                                                        {isEmri.siparis.musteri_adi && ` - ${isEmri.siparis.musteri_adi}`}
                                                    </Typography>
                                                )}
                                                <Typography variant="body2">
                                                    Miktar: {isEmri.adet || 0} adet
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                                                    <Chip 
                                                        label={isEmri.durum || 'Beklemede'} 
                                                        size="small" 
                                                        color="primary"
                                                    />
                                                    {isEmri.siparis && (
                                                        <Chip 
                                                            label="Sipariş" 
                                                            size="small" 
                                                            color="info"
                                                        />
                                                    )}
                                                </Box>
                                            </CardContent>
                                            <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                                <IconButton 
                                                    color="error" 
                                                    onClick={() => handleIsEmriCikart(emriId)}
                                                    size="small"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}
                </CardContent>
            </Card>

            {/* Kaydet Butonu */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    onClick={handleSave}
                    disabled={saving || !planAdi.trim() || selectedIsEmirleri.length === 0}
                >
                    {saving ? 'Kaydediliyor...' : 'Üretim Planını Kaydet'}
                </Button>
            </Box>

            {/* Üretim Planı İş Emri Seçimi Modalı */}
            <UretimPlaniIsEmriSecimiModal
                open={isEmriModalOpen}
                onClose={handleModalClose}
                onSelectIsEmirleri={handleIsEmirleriSec}
            />

            {/* Excel Üretim Planı Modalı */}
            <ExcelUretimPlaniModal
                open={excelModalOpen}
                onClose={handleExcelModalClose}
                onSuccess={handleExcelSuccess}
            />
        </Box>
    );
};

export default UretimPlaniForm;