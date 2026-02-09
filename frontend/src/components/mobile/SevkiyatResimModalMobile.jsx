// Mobil Sevkiyat Resim Yönetimi Modal Bileşeni
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    IconButton,
    Card,
    CardMedia,
    CardContent,
    CircularProgress,
    Alert,
    Fab,
    Grid,
    Chip,
    Divider,
    ImageList,
    ImageListItem,
    ImageListItemBar
} from '@mui/material';
import {
    Close as CloseIcon,
    CloudUpload as UploadIcon,
    Delete as DeleteIcon,
    Download as DownloadIcon,
    ZoomIn as ZoomIcon,
    PhotoCamera as CameraIcon
} from '@mui/icons-material';
import axios from 'axios';


import apiClient from '../../utils/apiClient';const SevkiyatResimModalMobile = ({ open, onClose, sevkiyat, onSuccess, onError }) => {
    const [resimler, setResimler] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);

    // API URL'sini localStorage'dan al veya varsayılan olarak yerel IP adresini kullan
    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
    console.log('SevkiyatResimModalMobile içinde API_BASE_URL:', API_BASE_URL);

    useEffect(() => {
        if (open && sevkiyat) {
            loadResimler();
        }
    }, [open, sevkiyat]);

    const loadResimler = async () => {
        if (!sevkiyat) return;
        
        try {
            setLoading(true);
            console.log(`Resimler API URL: ${API_BASE_URL}/sevkiyat/resimler/${sevkiyat.id}/resimler`);
            console.log('Sevkiyat obje:', sevkiyat); // Sevkiyat objesini logla
            const response = await axios.get(`${API_BASE_URL}/sevkiyat/resimler/${sevkiyat.id}/resimler`);
            console.log('Resimler cevabı:', response.data);
            setResimler(response.data);
        } catch (err) {
            console.error('Resimler yüklenirken hata:', err);
            console.error('Resim hatası detayları:', err.response?.data || err.message);
            onError('Resimler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        
        // Dosya validasyonu
        const validFiles = files.filter(file => {
            const isValidType = file.type.startsWith('image/');
            const isValidSize = file.size <= 500 * 1024 * 1024; // 500MB
            
            if (!isValidType) {
                onError(`${file.name} geçerli bir resim dosyası değil`);
                return false;
            }
            
            if (!isValidSize) {
                onError(`${file.name} dosyası 500MB'dan büyük`);
                return false;
            }
            
            return true;
        });
        
        setSelectedFiles(validFiles);
        
        // Hemen yükle
        if (validFiles.length > 0) {
            handleUpload(validFiles);
        }
    };

    const handleUpload = async (files = selectedFiles) => {
        if (files.length === 0) {
            onError('Lütfen en az bir resim seçiniz');
            return;
        }

        const formData = new FormData();
        files.forEach(file => {
            formData.append('resimler', file);
        });

        try {
            setUploading(true);
            await axios.post(`${API_BASE_URL}/sevkiyat/resimler/${sevkiyat.id}/resimler`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            setSelectedFiles([]);
            loadResimler();
            onSuccess();
        } catch (err) {
            console.error('Resim yükleme hatası:', err);
            onError(err.response?.data?.error || 'Resim yüklenemedi');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (resimId) => {
        if (!window.confirm('Bu resmi silmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            await axios.delete(`${API_BASE_URL}/sevkiyat/resimler/${resimId}`);
            loadResimler();
            onSuccess();
        } catch (err) {
            console.error('Resim silme hatası:', err);
            onError('Resim silinemedi');
        }
    };

    const handleDownload = async (resim) => {
        try {
            // resim_yolu'ndan gerçek dosya adını al
            const savedFileName = resim.resim_yolu.split('/').pop();
            const response = await axios.get(`${API_BASE_URL}/sevkiyat/resimler/dosya/${savedFileName}`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', resim.resim_adi); // Orijinal dosya adıyla indir
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Resim indirme hatası:', err);
            onError('Resim indirilemedi');
        }
    };

    const handlePreview = (resim) => {
        // resim_yolu'ndan gerçek dosya adını al
        const savedFileName = resim.resim_yolu.split('/').pop();
        setPreviewImage(`${API_BASE_URL}/sevkiyat/resimler/dosya/${savedFileName}`);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleClose = () => {
        setSelectedFiles([]);
        setPreviewImage(null);
        onClose();
    };

    if (!sevkiyat) return null;

    return (
        <>
            {/* Ana Modal */}
            <Dialog 
                open={open} 
                onClose={handleClose}
                fullScreen
                sx={{
                    '& .MuiDialog-paper': {
                        margin: 0,
                        maxHeight: '100vh'
                    }
                }}
            >
                {/* Header */}
                <DialogTitle sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    pb: 1
                }}>
                    <Box>
                        <Typography variant="h6">
                            Resim Yönetimi
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {sevkiyat.sevkiyat_no}
                        </Typography>
                    </Box>
                    <IconButton onClick={handleClose}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <Divider />

                {/* Content */}
                <DialogContent sx={{ p: 0, position: 'relative' }}>
                    {/* Upload Info */}
                    <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
                        {uploading && (
                            <Box display="flex" alignItems="center" gap={2} mb={2}>
                                <CircularProgress size={20} />
                                <Typography variant="body2">Resimler yükleniyor...</Typography>
                            </Box>
                        )}
                    </Box>

                    <Divider />

                    {/* Resim Listesi */}
                    <Box sx={{ p: 2 }}>
                        {loading ? (
                            <Box display="flex" justifyContent="center" p={4}>
                                <CircularProgress />
                            </Box>
                        ) : resimler.length === 0 ? (
                            <Box textAlign="center" py={8}>
                                <CameraIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    Henüz resim yok
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    İlk resminizi yüklemek için kamera butonuna dokunun
                                </Typography>
                            </Box>
                        ) : (
                            <ImageList cols={2} gap={8}>
                                {resimler.map((resim) => (
                                    <ImageListItem key={resim.id}>
                                        <img
                                            src={`${API_BASE_URL}/sevkiyat/resimler/dosya/${resim.resim_yolu.split('/').pop()}`}
                                            alt={resim.resim_adi}
                                            loading="lazy"
                                            style={{
                                                height: 200,
                                                objectFit: 'contain',
                                                cursor: 'pointer',
                                                background: '#f5f5f5'
                                            }}
                                            onClick={() => handlePreview(resim)}
                                        />
                                        <ImageListItemBar
                                            title={
                                                <Typography variant="caption" noWrap>
                                                    {resim.resim_adi.length > 15 
                                                        ? `${resim.resim_adi.substring(0, 15)}...`
                                                        : resim.resim_adi
                                                    }
                                                </Typography>
                                            }
                                            subtitle={
                                                <Typography variant="caption">
                                                    {resim.dosya_boyutu && formatFileSize(resim.dosya_boyutu)}
                                                </Typography>
                                            }
                                            actionIcon={
                                                <Box>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handlePreview(resim)}
                                                        sx={{ color: 'white' }}
                                                    >
                                                        <ZoomIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDownload(resim)}
                                                        sx={{ color: 'white' }}
                                                    >
                                                        <DownloadIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDelete(resim.id)}
                                                        sx={{ color: 'white' }}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Box>
                                            }
                                        />
                                    </ImageListItem>
                                ))}
                            </ImageList>
                        )}
                    </Box>
                </DialogContent>

                {/* File Inputs (Hidden) */}
                <input
                    type="file"
                    id="camera-input"
                    multiple
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                />
                
                <input
                    type="file"
                    id="gallery-input"
                    multiple
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                />

                {/* Floating Action Buttons */}
                <Box
                    sx={{
                        position: 'fixed',
                        bottom: 16,
                        right: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                    }}
                >
                    {/* Galeri Button */}
                    <Fab
                        color="secondary"
                        aria-label="gallery"
                        size="medium"
                        onClick={() => document.getElementById('gallery-input').click()}
                        disabled={uploading}
                        sx={{ mb: 1 }}
                    >
                        {uploading ? <CircularProgress size={20} /> : <UploadIcon />}
                    </Fab>
                    
                    {/* Kamera Button */}
                    <Fab
                        color="primary"
                        aria-label="camera"
                        onClick={() => document.getElementById('camera-input').click()}
                        disabled={uploading}
                    >
                        {uploading ? <CircularProgress size={24} /> : <CameraIcon />}
                    </Fab>
                </Box>
            </Dialog>

            {/* Resim Önizleme Modal */}
            <Dialog
                open={!!previewImage}
                onClose={() => setPreviewImage(null)}
                fullScreen
                sx={{
                    '& .MuiDialog-paper': {
                        bgcolor: 'black'
                    }
                }}
            >
                <DialogTitle sx={{ 
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Typography variant="h6">Resim Önizleme</Typography>
                    <IconButton onClick={() => setPreviewImage(null)} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    p: 0
                }}>
                    {previewImage && (
                        <img
                            src={previewImage}
                            alt="Resim önizleme"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain'
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default SevkiyatResimModalMobile;
