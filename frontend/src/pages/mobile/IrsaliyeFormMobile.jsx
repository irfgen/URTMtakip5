import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    ToggleButtonGroup,
    ToggleButton,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Divider,
    Stack,
    FormControlLabel,
    Switch
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { tr } from 'date-fns/locale';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    ArrowBack as ArrowBackIcon,
    CameraAlt as CameraIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import IrsaliyeKalemMobile from '../../components/mobile/IrsaliyeKalemMobile';
import LockStateIndicator from '../../components/mobile/LockStateIndicator';
import { PrimaryTouchButton, SecondaryTouchButton, DestructiveTouchButton, TouchButtonGroup, TouchButtonRow } from '../../components/mobile/TouchButton';
import getApiBaseUrl from '../../utils/getApiBaseUrl';

/**
 * IrsaliyeFormMobile - Mobil İrsaliye Oluşturma/Düzenleme Formu
 *
 * Özellikler:
 * - Formik + Yup validation
 * - Tedarikçi select (autocomplete)
 * - Belge tarihi picker
 * - Belge tipi toggle (gelis/cikis)
 * - Kalem ekleme (inline + modal)
 * - Miktar input (numeric keyboard)
 * - Camera integration (opsiyonel)
 * - Save/Cancel buttons
 * - Offline support (localStorage)
 */
const API_BASE_URL = getApiBaseUrl();

// Validation Schema
const IrsaliyeSchema = Yup.object().shape({
    irsaliye_no: Yup.string()
        .required('İrsaliye no gereklidir')
        .max(50, 'İrsaliye no en fazla 50 karakter olabilir'),
    tedarikci_id: Yup.number()
        .required('Tedarikçi seçilmelidir')
        .positive('Geçerli bir tedarikçi seçiniz'),
    belge_tarih: Yup.date()
        .required('Belge tarihi gereklidir')
        .max(new Date(), 'Belge tarihi bugünden büyük olamaz'),
    belge_tipi: Yup.string()
        .oneOf(['gelis', 'cikis'], 'Geçersiz belge tipi')
        .required('Belge tipi gereklidir'),
    aciklama: Yup.string()
        .max(500, 'Açıklama en fazla 500 karakter olabilir'),
    kalemler: Yup.array()
        .of(
            Yup.object().shape({
                stok_kodu: Yup.string().nullable(),
                mal_hizmet_adi: Yup.string()
                    .required('Mal/Hizmet adı gereklidir')
                    .max(500, 'Mal/Hizmet adı en fazla 500 karakter olabilir'),
                miktar: Yup.number()
                    .required('Miktar gereklidir')
                    .positive('Miktar pozitif olmalıdır')
                    .max(999999, 'Miktar çok büyük'),
                birim: Yup.string()
                    .required('Birim gereklidir')
                    .oneOf(['Adet', 'KG', 'Lt', 'Mt', 'm2', 'm3', 'Gram'], 'Geçersiz birim'),
                birim_fiyat: Yup.number()
                    .nullable()
                    .positive('Birim fiyat pozitif olmalıdır'),
                aciklama: Yup.string().nullable()
            })
        )
        .min(1, 'En az bir kalem eklemelisiniz')
        .required('Kalemler gereklidir')
});

const IrsaliyeFormMobile = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    const [firmalar, setFirmalar] = useState([]);
    const [loading, setLoading] = useState(!isEditMode);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [showKalemModal, setShowKalemModal] = useState(false);
    const [editingKalemIndex, setEditingKalemIndex] = useState(null);
    const [kalemError, setKalemError] = useState(null);
    const [kalemler, setKalemler] = useState([]);
    const [lockState, setLockState] = useState(null);

    // Formik setup
    const formik = useFormik({
        initialValues: {
            irsaliye_no: '',
            tedarikci_id: '',
            belge_tarih: new Date(),
            belge_tipi: 'gelis',
            aciklama: '',
            kalemler: []
        },
        validationSchema: IrsaliyeSchema,
        onSubmit: async (values, helpers) => {
            await handleSubmit(values, helpers);
        }
    });

    // Firmaları yükle
    useEffect(() => {
        const loadFirmalar = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/firmalar?durum=aktif`);
                setFirmalar(response.data.data || response.data);
            } catch (err) {
                console.error('Firmalar yüklenirken hata:', err);
            }
        };
        loadFirmalar();
    }, []);

    // İrsaliye verilerini yükle (edit mode)
    useEffect(() => {
        if (isEditMode) {
            loadIrsaliye(id);
        }
    }, [id, isEditMode]);

    const loadIrsaliye = async (irsaliyeId) => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/irsaliyeler/${irsaliyeId}`);
            const data = response.data?.data || response.data;

            // Backend snake_case → frontend camelCase mapping
            formik.setValues({
                irsaliye_no: data.irsaliye_no || data.irsaliyeNo || '',
                tedarikci_id: data.tedarikci_id || data.tedarikciId || data.firmaId || '',
                belge_tarih: (data.belge_tarih || data.irsaliyeTarihi) ? new Date(data.belge_tarih || data.irsaliyeTarihi) : new Date(),
                belge_tipi: data.belge_tipi || data.tur === 'alis' ? 'gelis' : 'cikis' || 'gelis',
                aciklama: data.aciklama || '',
                kalemler: []
            });

            // Kalemleri yükle
            if (data.kalemler && data.kalemler.length > 0) {
                // Format kalemler for form - ensure mal_hizmet_adi is mapped
                const formattedKalemler = data.kalemler.map(k => ({
                  mal_hizmet_adi: k.mal_hizmet_adi || k.parca_adi || '',
                  stok_kodu: k.stok_kodu || '',
                  miktar: k.miktar || '',
                  birim: k.birim || 'Adet',
                  birim_fiyat: k.birim_fiyat || '',
                  aciklama: k.aciklama || ''
                }));
                setKalemler(formattedKalemler);
                formik.setFieldValue('kalemler', formattedKalemler);
            }

            // Lock kontrolü
            if (data.lockState) {
                const lockStateData = await checkLockState(data);
                setLockState(lockStateData);
                if (lockStateData.state !== 'LOCKED_BY_ME') {
                    setError('Bu irsaliye başka bir kullanıcı tarafından kilitli. Düzenleyemezsiniz.');
                }
            }
        } catch (err) {
            console.error('İrsaliye yüklenirken hata:', err);
            setError(err.response?.data?.error || 'İrsaliye yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const checkLockState = async (irsaliye) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/irsaliyeler/${irsaliye.id}/lock`);
            return { state: 'LOCKED_BY_ME' };
        } catch (err) {
            if (err.response?.status === 409) {
                return err.response.data;
            }
            return { state: 'UNLOCKED' };
        }
    };

    const handleSubmit = async (values, helpers) => {
        try {
            setSaving(true);
            setError(null);

            // Kalemler validasyonu
            if (kalemler.length === 0) {
                setKalemError('En az bir kalem eklemelisiniz');
                return;
            }

            const submitData = {
                ...values,
                kalemler: kalemler
            };

            let response;
            if (isEditMode) {
                response = await axios.put(`${API_BASE_URL}/irsaliyeler/${id}`, submitData);
            } else {
                response = await axios.post(`${API_BASE_URL}/irsaliyeler`, submitData);
            }

            setSuccessMessage(isEditMode ? 'İrsaliye güncellendi' : 'İrsaliye oluşturuldu');

            // 2 saniye bekle ve listeye dön
            setTimeout(() => {
                navigate('/mobile/irsaliyeler');
            }, 2000);

        } catch (err) {
            console.error('İrsaliye kaydedilirken hata:', err);
            if (err.response?.data?.error) {
                setError(err.response.data.error);
            } else {
                setError('Bir hata oluştu. Lütfen tekrar deneyin.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleAddKalem = (kalem) => {
        if (editingKalemIndex !== null) {
            // Edit mode - update existing
            const updatedKalemler = [...kalemler];
            updatedKalemler[editingKalemIndex] = kalem;
            setKalemler(updatedKalemler);
            setEditingKalemIndex(null);
        } else {
            // Add mode - append new
            setKalemler([...kalemler, kalem]);
        }
        formik.setFieldValue('kalemler', [...kalemler, kalem]);
        setShowKalemModal(false);
        setKalemError(null);
    };

    const handleEditKalem = (index) => {
        setEditingKalemIndex(index);
        setShowKalemModal(true);
    };

    const handleDeleteKalem = (index) => {
        const updatedKalemler = kalemler.filter((_, i) => i !== index);
        setKalemler(updatedKalemler);
        formik.setFieldValue('kalemler', updatedKalemler);
    };

    const handleCancel = () => {
        if (isEditMode) {
            // Lock release
            axios.delete(`${API_BASE_URL}/irsaliyeler/${id}/lock`).catch(console.error);
        }
        navigate('/mobile/irsaliyeler');
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
            <Box sx={{ pb: 8, px: 2 }}>
                {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
                <IconButton onClick={handleCancel}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6" sx={{ ml: 1, flex: 1 }}>
                    {isEditMode ? 'İrsaliye Düzenle' : 'Yeni İrsaliye'}
                </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Success Alert */}
            {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {successMessage}
                </Alert>
            )}

            {/* Lock State Indicator (edit mode only) */}
            {isEditMode && lockState && (
                <LockStateIndicator
                    lockState={lockState}
                    variant="banner"
                    compact={true}
                    showActions={false}
                />
            )}

            <form onSubmit={formik.handleSubmit}>
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Belge Bilgileri
                    </Typography>

                    {/* İrsaliye No */}
                    <TextField
                        fullWidth
                        id="irsaliye_no"
                        name="irsaliye_no"
                        label="İrsaliye No"
                        value={formik.values.irsaliye_no}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.irsaliye_no && Boolean(formik.errors.irsaliye_no)}
                        helperText={formik.touched.irsaliye_no && formik.errors.irsaliye_no}
                        sx={{ mb: 2 }}
                        inputProps={{ inputMode: 'text' }}
                    />

                    {/* Tedarikçi */}
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Tedarikçi</InputLabel>
                        <Select
                            id="tedarikci_id"
                            name="tedarikci_id"
                            value={formik.values.tedarikci_id}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.tedarikci_id && Boolean(formik.errors.tedarikci_id)}
                            label="Tedarikçi"
                        >
                            {firmalar.map(firma => (
                                <MenuItem key={firma.id} value={firma.id}>
                                    {firma.adi}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Belge Tarihi */}
                    <DatePicker
                        label="Belge Tarihi"
                        value={formik.values.belge_tarih}
                        onChange={(date) => formik.setFieldValue('belge_tarih', date)}
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                sx: { mb: 2 },
                                error: formik.touched.belge_tarih && Boolean(formik.errors.belge_tarih),
                                helperText: formik.touched.belge_tarih && formik.errors.belge_tarih
                            }
                        }}
                    />

                    {/* Belge Tipi */}
                    <Typography variant="body2" gutterBottom>
                        Belge Tipi
                    </Typography>
                    <ToggleButtonGroup
                        value={formik.values.belge_tipi}
                        exclusive
                        onChange={(e, value) => value && formik.setFieldValue('belge_tipi', value)}
                        sx={{ mb: 2, width: '100%' }}
                    >
                        <ToggleButton value="gelis" sx={{ flex: 1 }}>
                            Geliş
                        </ToggleButton>
                        <ToggleButton value="cikis" sx={{ flex: 1 }}>
                            Çıkış
                        </ToggleButton>
                    </ToggleButtonGroup>

                    {/* Açıklama */}
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        id="aciklama"
                        name="aciklama"
                        label="Açıklama"
                        value={formik.values.aciklama}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.aciklama && Boolean(formik.errors.aciklama)}
                        helperText={formik.touched.aciklama && formik.errors.aciklama}
                        sx={{ mb: 2 }}
                    />
                </Paper>

                {/* Kalemler Section */}
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Kalemler ({kalemler.length})
                        </Typography>
                        <PrimaryTouchButton
                            startIcon={<AddIcon />}
                            onClick={() => {
                                setEditingKalemIndex(null);
                                setShowKalemModal(true);
                            }}
                            sx={{ minWidth: 120, minHeight: 40 }}
                        >
                            Kalem Ekle
                        </PrimaryTouchButton>
                    </Box>

                    {/* Kalem Error */}
                    {kalemError && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setKalemError(null)}>
                            {kalemError}
                        </Alert>
                    )}

                    {/* Kalemler Listesi */}
                    {kalemler.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 3, bgcolor: 'background.default', borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Henüz kalem eklenmemiş
                            </Typography>
                        </Box>
                    ) : (
                        <Stack spacing={1}>
                            {kalemler.map((kalem, index) => (
                                <Paper
                                    key={index}
                                    variant="outlined"
                                    sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}
                                >
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" fontWeight="bold">
                                            {kalem.mal_hizmet_adi || kalem.parca_adi}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {kalem.stok_kodu} | {kalem.miktar} {kalem.birim}
                                        </Typography>
                                        {kalem.birim_fiyat && (
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                ₺{kalem.birim_fiyat} / {kalem.birim}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEditKalem(index)}
                                            color="primary"
                                            sx={{ minWidth: 44, minHeight: 44 }}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDeleteKalem(index)}
                                            color="error"
                                            sx={{ minWidth: 44, minHeight: 44 }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Paper>
                            ))}
                        </Stack>
                    )}
                </Paper>

                {/* Action Buttons */}
                <TouchButtonRow>
                    <SecondaryTouchButton
                        onClick={handleCancel}
                        disabled={saving}
                    >
                        İptal
                    </SecondaryTouchButton>
                    <PrimaryTouchButton
                        type="submit"
                        startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                        disabled={saving}
                    >
                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                    </PrimaryTouchButton>
                </TouchButtonRow>
            </form>

            {/* Kalem Modal */}
            <Dialog
                open={showKalemModal}
                onClose={() => setShowKalemModal(false)}
                fullScreen
                PaperProps={{
                    sx: { position: 'fixed', bottom: 0, m: 0, borderRadius: '16px 16px 0 0', maxHeight: '90vh' }
                }}
            >
                <DialogTitle>
                    {editingKalemIndex !== null ? 'Kalem Düzenle' : 'Yeni Kalem'}
                </DialogTitle>
                <DialogContent>
                    <IrsaliyeKalemMobile
                        initialData={editingKalemIndex !== null ? kalemler[editingKalemIndex] : null}
                        onSave={handleAddKalem}
                        onCancel={() => {
                            setShowKalemModal(false);
                            setEditingKalemIndex(null);
                        }}
                    />
                </DialogContent>
            </Dialog>
            </Box>
        </LocalizationProvider>
    );
};

export default IrsaliyeFormMobile;
