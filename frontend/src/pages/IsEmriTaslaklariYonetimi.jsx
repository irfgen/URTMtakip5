import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    Chip,
    Alert,
    CircularProgress,
    Tooltip,
    Card,
    CardContent,
    Avatar
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Publish as PublishIcon,
    Visibility as ViewIcon,
    Cancel as CancelIcon,
    Save as SaveIcon,
    Warning as WarningIcon,
    CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getFotoPath } from '../utils/imageUtils.js';


import apiClient from '../utils/apiClient';const IsEmriTaslaklariYonetimi = () => {
    const { oturumId } = useParams();
    const navigate = useNavigate();
    
    const [taslaklar, setTaslaklar] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTaslak, setSelectedTaslak] = useState(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [publishLoading, setPublishLoading] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [taslakToDelete, setTaslakToDelete] = useState(null);

    // Edit form state'leri
    const [editForm, setEditForm] = useState({
        is_adi: '',
        parca_kodu: '',
        adet: 1,
        malzeme: '',
        teslim_tarihi: '',
        oncelik: 'normal',
        aciklama: ''
    });

    // Base64 placeholder image
    const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Gb3RvPC90ZXh0Pjwvc3ZnPg==';

    // Taslakları yükle
    const loadTaslaklar = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/is-emri-taslaklari/oturum/${oturumId}`);
            
            if (response.data.success) {
                setTaslaklar(response.data.data.taslaklar);
            } else {
                setError('Taslaklar yüklenemedi');
            }
        } catch (err) {
            console.error('Taslaklar yüklenirken hata:', err);
            setError('Taslaklar yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (oturumId) {
            loadTaslaklar();
        }
    }, [oturumId]);

    // Düzenleme modalını aç
    const handleEdit = (taslak) => {
        setSelectedTaslak(taslak);
        setEditForm({
            is_adi: taslak.is_adi || '',
            parca_kodu: taslak.parca_kodu || '',
            adet: taslak.adet || 1,
            malzeme: taslak.malzeme || '',
            teslim_tarihi: taslak.teslim_tarihi ? 
                new Date(taslak.teslim_tarihi).toISOString().split('T')[0] : '',
            oncelik: taslak.oncelik || 'normal',
            aciklama: taslak.aciklama || ''
        });
        setEditModalOpen(true);
    };

    // Taslağı güncelle
    const handleUpdate = async () => {
        try {
            const response = await axios.put(
                `/api/is-emri-taslaklari/${selectedTaslak.taslak_id}`,
                editForm
            );

            if (response.data.success) {
                // Taslaklar listesini güncelle
                setTaslaklar(prev => prev.map(t => 
                    t.taslak_id === selectedTaslak.taslak_id ? 
                    { ...t, ...editForm } : t
                ));
                setEditModalOpen(false);
                setSelectedTaslak(null);
            }
        } catch (err) {
            console.error('Taslak güncellenirken hata:', err);
            setError('Taslak güncellenemedi');
        }
    };

    // Taslağı sil
    const handleDelete = async (taslakId) => {
        try {
            await axios.delete(`/api/is-emri-taslaklari/${taslakId}`);
            
            // Taslaklar listesinden kaldır
            setTaslaklar(prev => prev.filter(t => t.taslak_id !== taslakId));
            setDeleteConfirmOpen(false);
            setTaslakToDelete(null);
        } catch (err) {
            console.error('Taslak silinirken hata:', err);
            setError('Taslak silinemedi');
        }
    };

    // Tüm taslakları yayınla
    const handlePublishAll = async () => {
        try {
            setPublishLoading(true);
            const response = await axios.post(
                `/api/is-emri-taslaklari/oturum/${oturumId}/publish`
            );

            if (response.data.success) {
                // Başarı mesajı göster ve ana sayfaya yönlendir
                alert(`${response.data.data.oluşturulan_is_emri_sayisi} iş emri başarıyla oluşturuldu!`);
                navigate('/is-emirleri');
            }
        } catch (err) {
            console.error('Taslaklar yayınlanırken hata:', err);
            setError('Taslaklar yayınlanamadı');
        } finally {
            setPublishLoading(false);
        }
    };

    // Tüm taslakları iptal et
    const handleCancelAll = async () => {
        try {
            await axios.delete(`/api/is-emri-taslaklari/oturum/${oturumId}`);
            navigate('/uretim-plani');
        } catch (err) {
            console.error('Taslaklar silinirken hata:', err);
            setError('Taslaklar silinemedi');
        }
    };

    const getStatusColor = (durum) => {
        switch (durum) {
            case 'taslak': return 'warning';
            case 'hazir': return 'info';
            case 'yayinlandi': return 'success';
            default: return 'default';
        }
    };

    const getStatusText = (durum) => {
        switch (durum) {
            case 'taslak': return 'Taslak';
            case 'hazir': return 'Hazır';
            case 'yayinlandi': return 'Yayınlandı';
            default: return durum;
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Başlık ve Aksiyon Butonları */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h1">
                    İş Emri Taslakları Yönetimi
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={handleCancelAll}
                        startIcon={<CancelIcon />}
                        disabled={publishLoading}
                    >
                        Tümünü İptal Et
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handlePublishAll}
                        startIcon={<PublishIcon />}
                        disabled={taslaklar.length === 0 || publishLoading}
                        sx={{
                            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                        }}
                    >
                        {publishLoading ? 'Yayınlanıyor...' : `Tümünü Yayınla (${taslaklar.length})`}
                    </Button>
                </Box>
            </Box>

            {/* Özet Bilgiler */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Toplam Taslak
                            </Typography>
                            <Typography variant="h4">
                                {taslaklar.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Toplam Adet
                            </Typography>
                            <Typography variant="h4">
                                {taslaklar.reduce((sum, t) => sum + (t.adet || 0), 0)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Oturum ID
                            </Typography>
                            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                {oturumId}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Hata Mesajı */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Taslaklar Tablosu */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Resim</TableCell>
                            <TableCell>İş Adı</TableCell>
                            <TableCell>Parça Kodu</TableCell>
                            <TableCell>Adet</TableCell>
                            <TableCell>Malzeme</TableCell>
                            <TableCell>Teslim Tarihi</TableCell>
                            <TableCell>Öncelik</TableCell>
                            <TableCell>Durum</TableCell>
                            <TableCell>İşlemler</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {taslaklar.map((taslak) => (
                            <TableRow key={taslak.taslak_id}>
                                <TableCell>
                                    <Avatar
                                        src={taslak.parca?.foto_path ? getFotoPath(taslak.parca.foto_path) : placeholderImage}
                                        alt={taslak.parca_kodu}
                                        sx={{ width: 60, height: 60 }}
                                        variant="rounded"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight="bold">
                                        {taslak.is_adi}
                                    </Typography>
                                    {taslak.excel_satir_no && (
                                        <Typography variant="caption" color="textSecondary">
                                            Excel Satır: {taslak.excel_satir_no}
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {taslak.parca_kodu}
                                    </Typography>
                                    {taslak.parca?.parcaAdi && (
                                        <Typography variant="caption" color="textSecondary">
                                            {taslak.parca.parcaAdi}
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Chip 
                                        label={taslak.adet} 
                                        size="small" 
                                        color="primary"
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {taslak.malzeme}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {taslak.teslim_tarihi ? 
                                            new Date(taslak.teslim_tarihi).toLocaleDateString('tr-TR') : 
                                            '-'
                                        }
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip 
                                        label={taslak.oncelik} 
                                        size="small"
                                        color={taslak.oncelik === 'yüksek' ? 'error' : 
                                               taslak.oncelik === 'acil' ? 'warning' : 'default'}
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip 
                                        label={getStatusText(taslak.durum)} 
                                        size="small"
                                        color={getStatusColor(taslak.durum)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Tooltip title="Düzenle">
                                            <IconButton 
                                                size="small" 
                                                onClick={() => handleEdit(taslak)}
                                                disabled={taslak.durum === 'yayinlandi'}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Sil">
                                            <IconButton 
                                                size="small" 
                                                color="error"
                                                onClick={() => {
                                                    setTaslakToDelete(taslak);
                                                    setDeleteConfirmOpen(true);
                                                }}
                                                disabled={taslak.durum === 'yayinlandi'}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {taslaklar.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <WarningIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">
                        Bu oturumda henüz taslak bulunmuyor
                    </Typography>
                </Box>
            )}

            {/* Düzenleme Modalı */}
            <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>İş Emri Taslağını Düzenle</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="İş Adı"
                                value={editForm.is_adi}
                                onChange={(e) => setEditForm({...editForm, is_adi: e.target.value})}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Parça Kodu"
                                value={editForm.parca_kodu}
                                onChange={(e) => setEditForm({...editForm, parca_kodu: e.target.value})}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Adet"
                                type="number"
                                value={editForm.adet}
                                onChange={(e) => setEditForm({...editForm, adet: parseInt(e.target.value)})}
                                inputProps={{ min: 1 }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Malzeme"
                                value={editForm.malzeme}
                                onChange={(e) => setEditForm({...editForm, malzeme: e.target.value})}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Teslim Tarihi"
                                type="date"
                                value={editForm.teslim_tarihi}
                                onChange={(e) => setEditForm({...editForm, teslim_tarihi: e.target.value})}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Öncelik"
                                select
                                value={editForm.oncelik}
                                onChange={(e) => setEditForm({...editForm, oncelik: e.target.value})}
                                SelectProps={{ native: true }}
                            >
                                <option value="düşük">Düşük</option>
                                <option value="normal">Normal</option>
                                <option value="yüksek">Yüksek</option>
                                <option value="acil">Acil</option>
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Açıklama"
                                multiline
                                rows={3}
                                value={editForm.aciklama}
                                onChange={(e) => setEditForm({...editForm, aciklama: e.target.value})}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditModalOpen(false)}>İptal</Button>
                    <Button onClick={handleUpdate} variant="contained" startIcon={<SaveIcon />}>
                        Kaydet
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Silme Onay Modalı */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <DialogTitle>Taslağı Sil</DialogTitle>
                <DialogContent>
                    <Typography>
                        "{taslakToDelete?.is_adi}" taslağını silmek istediğinizden emin misiniz?
                        Bu işlem geri alınamaz.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>İptal</Button>
                    <Button 
                        onClick={() => handleDelete(taslakToDelete?.taslak_id)} 
                        color="error"
                        variant="contained"
                    >
                        Sil
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default IsEmriTaslaklariYonetimi;
