import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Box, Typography, TextField, Button, Card, CardContent,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Tooltip, CircularProgress, Paper, InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ReceiptIcon from '@mui/icons-material/Receipt';
import InventoryIcon from '@mui/icons-material/Inventory';
import MakinaSiparislerModal from './MakinaSiparislerModal';
import MakinaStoklariModal from './MakinaStoklariModal';

const MakinaListesi = () => {
    const navigate = useNavigate();
    const [makinalar, setMakinalar] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state'leri
    const [siparisModalOpen, setSiparisModalOpen] = useState(false);
    const [stokModalOpen, setStokModalOpen] = useState(false);
    const [selectedMakina, setSelectedMakina] = useState(null);

    // Makinaları yükle
    useEffect(() => {
        fetchMakinalar();
    }, [searchTerm]);

    const fetchMakinalar = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/makinalar', {
                params: { search: searchTerm }
            });

            // Gelen veriyi kontrol et ve işle
            let data = response.data;
            if (data && data.data && Array.isArray(data.data)) {
                data = data.data;
            } else if (!Array.isArray(data)) {
                console.warn('API yanıtı beklenen formatta değil:', data);
                data = [];
            }

            setMakinalar(data);
            setError(null);
        } catch (err) {
            console.error('Makina listesi yüklenirken hata:', err);
            setError('Makina listesi yüklenirken bir hata oluştu.');
            setMakinalar([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEditMakina = (makinaId) => {
        navigate(`/makinalar/duzenle/${makinaId}`);
    };

    const handleDeleteMakina = async (makinaId) => {
        if (window.confirm('Bu makinayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
            try {
                await axios.delete(`/api/makinalar/${makinaId}`);
                // Listeyi yeniden yükle
                fetchMakinalar();
            } catch (err) {
                console.error('Makina silinirken hata:', err);
                alert(`Makina silinirken bir hata oluştu: ${err.response?.data?.message || err.message}`);
            }
        }
    };

    const handleAddMakina = () => {
        navigate('/makinalar/ekle');
    };

    const handleSatisYap = () => {
        navigate('/satis');
    };

    const handleOpenSiparisler = () => {
        setSelectedMakina(null); // Clear selection - modal will show machine selection
        setSiparisModalOpen(true);
    };

    const handleOpenStok = () => {
        setSelectedMakina(null); // Clear selection - modal will show machine selection
        setStokModalOpen(true);
    };

    const handleCloseSiparisModal = () => {
        setSiparisModalOpen(false);
        setSelectedMakina(null);
    };

    const handleCloseStokModal = () => {
        setStokModalOpen(false);
        setSelectedMakina(null);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h1">
                    Makinalar
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<PointOfSaleIcon />}
                        onClick={handleSatisYap}
                    >
                        Makina Satışı Yap
                    </Button>
                    <Button
                        variant="contained"
                        color="info"
                        startIcon={<ReceiptIcon />}
                        onClick={handleOpenSiparisler}
                    >
                        Makina Sipariş Yönetimi
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<InventoryIcon />}
                        onClick={handleOpenStok}
                    >
                        Makina Stokları
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleAddMakina}
                    >
                        Yeni Makina Ekle
                    </Button>
                </Box>
            </Box>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <TextField
                        label="Makina Ara (İsim, Açıklama veya Model)"
                        variant="outlined"
                        fullWidth
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                            endAdornment: loading && searchTerm ? (
                                <InputAdornment position="end">
                                    <CircularProgress size={20} />
                                </InputAdornment>
                            ) : null
                        }}
                    />
                </CardContent>
            </Card>

            {loading && !searchTerm ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
                    {error}
                </Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>İşlemler</TableCell>
                                <TableCell>Makina Adı</TableCell>
                                <TableCell>Açıklama</TableCell>
                                <TableCell>Model</TableCell>
                                <TableCell>Seri No</TableCell>
                                <TableCell>Üretim Yılı</TableCell>
                                <TableCell>Durum</TableCell>
                                <TableCell>Bileşen Sayısı</TableCell>
                                <TableCell>Oluşturulma Tarihi</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {!Array.isArray(makinalar) || makinalar.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center">Makina bulunamadı.</TableCell>
                                </TableRow>
                            ) : (
                                makinalar.map((makina) => (
                                    <TableRow key={makina.makina_id}>
                                        <TableCell>
                                            <Tooltip title="Düzenle">
                                                <IconButton size="small" color="primary" onClick={() => handleEditMakina(makina.makina_id)}>
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Sil">
                                                <IconButton size="small" color="error" onClick={() => handleDeleteMakina(makina.makina_id)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>{makina.name}</TableCell>
                                        <TableCell>{makina.description || '-'}</TableCell>
                                        <TableCell>{makina.model || '-'}</TableCell>
                                        <TableCell>{makina.seri_no || '-'}</TableCell>
                                        <TableCell>{makina.uretim_yili || '-'}</TableCell>
                                        <TableCell>{
                                            makina.durum === 'aktif' ? 'Aktif' :
                                            makina.durum === 'pasif' ? 'Pasif' :
                                            makina.durum === 'bakim' ? 'Bakımda' : '-'
                                        }</TableCell>
                                        <TableCell align="right">{makina.items?.length || 0}</TableCell>
                                        <TableCell>{new Date(makina.created_at).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Modals */}
            <MakinaSiparislerModal
                open={siparisModalOpen}
                onClose={handleCloseSiparisModal}
                makina={selectedMakina}
            />

            <MakinaStoklariModal
                open={stokModalOpen}
                onClose={handleCloseStokModal}
                makina={selectedMakina}
            />
        </Box>
    );
};

export default MakinaListesi;