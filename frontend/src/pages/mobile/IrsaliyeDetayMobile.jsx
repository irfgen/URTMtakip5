import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Chip,
    IconButton,
    Divider,
    Stack,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    LockOpen as LockOpenIcon,
    Description as DescriptionIcon,
    Business as BusinessIcon,
    CalendarToday as CalendarIcon,
    Inventory as InventoryIcon,
    AttachMoney as AttachMoneyIcon,
    MoreVert as MoreVertIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import getApiBaseUrl from '../../utils/getApiBaseUrl';
import LockStateIndicator from '../../components/mobile/LockStateIndicator';
import { PrimaryTouchButton, SecondaryTouchButton, DestructiveTouchButton, TouchButtonGroup } from '../../components/mobile/TouchButton';

const API_BASE_URL = getApiBaseUrl();

/**
 * IrsaliyeDetayMobile - Mobil İrsaliye Detay Sayfası
 *
 * Özellikler:
 * - İrsaliye detay bilgileri gösterimi
 * - Kalem listesi
 * - Lock/unlock işlemleri
 * - Düzenle/Sil butonları
 * - Eşleşme durumu gösterimi
 * - Socket.IO ile gerçek zamanlı güncelleme
 */
const IrsaliyeDetayMobile = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [irsaliye, setIrsaliye] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lockState, setLockState] = useState(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // İrsaliye detayını yükle
    const loadIrsaliye = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/irsaliyeler/${id}`);
            const data = response.data.data;

            // Backend snake_case → frontend expected format mapping
            // IMPORTANT: kalemler must be explicitly copied since it's nested
            const irsaliye = {
                id: data.id,
                irsaliye_no: data.irsaliyeNo || data.irsaliye_no,
                belge_tarih: data.irsaliyeTarihi || data.belge_tarih,
                belge_tipi: data.tur === 'alis' ? 'gelis' : 'cikis' || data.belge_tipi,
                tur: data.tur,
                durum: data.durum,
                aciklama: data.aciklama,
                toplam_kalem: data.toplamKalem || data.toplam_kalem,
                toplam_miktar: data.toplamMiktar || data.toplam_miktar,
                tedarikci: data.tedarikci || data.firmaAdi,
                kayit_tarih: data.createdAt || data.created_at,
                kalemler: data.kalemler || [], // Explicitly include kalemler array
                olusturan: data.olusturan
            };

            console.log('Loaded irsaliye:', irsaliye);
            console.log('Kalemler:', irsaliye.kalemler);

            setIrsaliye(irsaliye);
            setLockState(data.lockState || null);
        } catch (err) {
            console.error('İrsaliye detay yüklenirken hata:', err);
            setError(err.response?.data?.error || 'İrsaliye yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadIrsaliye();
    }, [loadIrsaliye]);

    // Lock al
    const handleAcquireLock = async () => {
        try {
            const response = await axios.post(`${API_BASE_URL}/irsaliyeler/${id}/lock`);
            setLockState({
                state: 'LOCKED_BY_ME',
                lockedAt: new Date()
            });
        } catch (err) {
            if (err.response?.status === 409) {
                setLockState(err.response.data);
            } else {
                setError('Lock alınamadı');
            }
        }
    };

    // Lock bırak
    const handleReleaseLock = async () => {
        try {
            await axios.delete(`${API_BASE_URL}/irsaliyeler/${id}/lock`);
            setLockState({ state: 'UNLOCKED' });
        } catch (err) {
            setError('Lock bırakılamadı');
        }
    };

    // İrsaliye sil
    const handleDelete = async () => {
        try {
            setDeleting(true);
            await axios.delete(`${API_BASE_URL}/irsaliyeler/${id}`);
            navigate('/mobile/irsaliyeler', { replace: true });
        } catch (err) {
            setError(err.response?.data?.error || 'İrsaliye silinirken hata oluştu');
            setDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    // Durum rengi belirle
    const getDurumColor = (durum) => {
        switch (durum) {
            case 'bekliyor': return 'default';
            case 'kismi_eslesti': return 'warning';
            case 'tam_eslesti': return 'success';
            default: return 'default';
        }
    };

    // Durum label
    const getDurumLabel = (durum) => {
        switch (durum) {
            case 'bekliyor': return 'Bekliyor';
            case 'kismi_eslesti': return 'Kısmi Eşleşti';
            case 'tam_eslesti': return 'Tam Eşleşti';
            default: return durum;
        }
    };

    // Zorla kilit bırak (admin)
    const handleForceReleaseLock = async () => {
        try {
            await axios.delete(`${API_BASE_URL}/irsaliyeler/${id}/lock?force=true`);
            setLockState({ state: 'UNLOCKED' });
        } catch (err) {
            setError('Kilit zorla bırakılamadı');
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error && !irsaliye) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!irsaliye) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="info">İrsaliye bulunamadı</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ pb: 8 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 2 }}>
                <IconButton onClick={() => navigate('/mobile/irsaliyeler')}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6" sx={{ ml: 1, flex: 1 }}>
                    İrsaliye Detay
                </Typography>
                <IconButton>
                    <MoreVertIcon />
                </IconButton>
            </Box>

            {/* Lock Indicator */}
            <Box sx={{ px: 2 }}>
                <LockStateIndicator
                    lockState={lockState}
                    onAcquireLock={handleAcquireLock}
                    onReleaseLock={handleReleaseLock}
                    onForceRelease={handleForceReleaseLock}
                    showActions={false}
                />
            </Box>

            {/* Ana Bilgiler Card */}
            <Card sx={{ mx: 2, mb: 2 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                            <Typography variant="h5" gutterBottom>
                                {irsaliye.irsaliye_no}
                            </Typography>
                            <Chip
                                label={getDurumLabel(irsaliye.durum)}
                                color={getDurumColor(irsaliye.durum)}
                                size="small"
                            />
                        </Box>
                        <Chip
                            label={irsaliye.belge_tipi === 'gelis' ? 'Geliş' : 'Çıkış'}
                            color={irsaliye.belge_tipi === 'gelis' ? 'info' : 'secondary'}
                            size="small"
                        />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Tedarikçi */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <BusinessIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Tedarikçi
                            </Typography>
                            <Typography variant="body2">
                                {irsaliye.tedarikci?.adi || '-'}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Tarih */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <CalendarIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Belge Tarihi
                            </Typography>
                            <Typography variant="body2">
                                {new Date(irsaliye.belge_tarih).toLocaleDateString('tr-TR')}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Kayıt Tarihi */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <CalendarIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Kayıt Tarihi
                            </Typography>
                            <Typography variant="body2">
                                {new Date(irsaliye.kayit_tarih).toLocaleString('tr-TR')}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Toplam Bilgileri */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <InventoryIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Toplam
                            </Typography>
                            <Typography variant="body2">
                                {irsaliye.toplam_kalem || 0} kalem, {irsaliye.toplam_miktar || 0} {irsaliye.kalemler?.[0]?.birim || ''}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Oluşturan */}
                    {irsaliye.olusturan && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <DescriptionIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Oluşturan
                                </Typography>
                                <Typography variant="body2">
                                    {irsaliye.olusturan.ad_soyad || '-'}
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {/* Açıklama */}
                    {irsaliye.aciklama && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                                Açıklama
                            </Typography>
                            <Typography variant="body2" color="text.primary">
                                {irsaliye.aciklama}
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Kalemler Card */}
            <Card sx={{ mx: 2, mb: 2 }}>
                <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Kalemler ({irsaliye.kalemler?.length || 0})
                    </Typography>

                    {irsaliye.kalemler && irsaliye.kalemler.length > 0 ? (
                        <List disablePadding>
                            {irsaliye.kalemler.map((kalem, index) => (
                                <React.Fragment key={kalem.id || index}>
                                    <ListItem alignItems="flex-start">
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" fontWeight="bold">
                                                {kalem.mal_hizmet_adi || kalem.parca_adi}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {kalem.stok_kodu || 'Stok kodu yok'}
                                            </Typography>
                                            <Box sx={{ mt: 0.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                <Chip
                                                    label={`${kalem.miktar} ${kalem.birim}`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                                {kalem.birim_fiyat && (
                                                    <Chip
                                                        label={`₺${kalem.birim_fiyat} / ${kalem.birim}`}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                )}
                                                {kalem.eslesme_durumu === 1 && (
                                                    <Chip
                                                        icon={<CheckCircleIcon fontSize="small" />}
                                                        label="Eşleşti"
                                                        color="success"
                                                        size="small"
                                                    />
                                                )}
                                            </Box>
                                        </Box>
                                    </ListItem>
                                    {index < irsaliye.kalemler.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 3, bgcolor: 'background.default', borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Henüz kalem eklenmemiş
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <Box sx={{ px: 2 }}>
                {/* Edit Button - Only if locked by me or unlocked */}
                {lockState?.state !== 'LOCKED_BY_OTHER' && (
                    <PrimaryTouchButton
                        startIcon={<EditIcon />}
                        onClick={() => navigate(`/mobile/irsaliyeler/${id}/duzenle`)}
                    >
                        Düzenle
                    </PrimaryTouchButton>
                )}

                {/* Delete Button */}
                <DestructiveTouchButton
                    startIcon={<DeleteIcon />}
                    onClick={() => setShowDeleteDialog(true)}
                >
                    Sil
                </DestructiveTouchButton>
            </Box>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
                <DialogTitle>İrsaliye Sil</DialogTitle>
                <DialogContent>
                    <Typography>
                        "{irsaliye.irsaliye_no}" irsaliyesini silmek istediğinizden emin misiniz?
                        {irsaliye.kalemler?.some(k => k.eslesme_durumu === 1) && (
                            <Alert severity="warning" sx={{ mt: 2 }}>
                                Bu irsaliyenin eşleşmiş kalemleri var. Silme işlemi eşleşmeleri kaldıracaktır.
                            </Alert>
                        )}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ flexDirection: 'column', gap: 1, px: 2, pb: 2 }}>
                    <SecondaryTouchButton
                        onClick={() => setShowDeleteDialog(false)}
                        disabled={deleting}
                    >
                        İptal
                    </SecondaryTouchButton>
                    <DestructiveTouchButton
                        onClick={handleDelete}
                        disabled={deleting}
                        startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
                    >
                        {deleting ? 'Siliniyor...' : 'Sil'}
                    </DestructiveTouchButton>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default IrsaliyeDetayMobile;
