import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box, Button, Card, CardContent, Typography, TextField, Grid, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import { useNavigate } from 'react-router-dom';
import BomPrintModal from './BomPrintModal';

const BomListesi = () => {
    const navigate = useNavigate();
    const [boms, setBoms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [bomPrintModalOpen, setBomPrintModalOpen] = useState(false);

    useEffect(() => {
        fetchBoms();
    }, [searchTerm]); // Arama terimi değiştikçe yeniden yükle

    const fetchBoms = async () => {
        try {
            setLoading(true);
            console.log('BOM listesi yükleniyor...');
            const response = await axios.get('/api/boms', {
                params: { search: searchTerm }
            });
            console.log('BOM API yanıtı:', response.data);
            setBoms(response.data);
            setError(null);
        } catch (err) {
            console.error('BOM listesi yüklenirken hata:', err);
            setError('BOM listesi yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleEditBom = (bomId) => {
        navigate(`/boms/duzenle/${bomId}`);
    };

    const handleDeleteBom = async (bomId) => {
        if (window.confirm('Bu BOM\'u silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
            try {
                await axios.delete(`/api/boms/${bomId}`);
                // Listeyi yeniden yükle
                fetchBoms();
            } catch (err) {
                console.error('BOM silinirken hata:', err);
                alert(`BOM silinirken bir hata oluştu: ${err.response?.data?.message || err.message}`);
            }
        }
    };

    const handleAddBom = () => {
        navigate('/boms/ekle');
    };

    const handleBomPrint = () => {
        setBomPrintModalOpen(true);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h1">
                    Ürün Ağaçları (BOM) / Gruplar
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<PrintIcon />}
                        onClick={handleBomPrint}
                    >
                        BOM Print
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleAddBom}
                    >
                        Yeni BOM Ekle
                    </Button>
                </Box>
            </Box>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <TextField
                        label="BOM Ara (İsim veya Açıklama)"
                        variant="outlined"
                        fullWidth
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            endAdornment: <SearchIcon />
                        }}
                    />
                    {/* İleride buraya daha fazla filtre eklenebilir */}
                </CardContent>
            </Card>

            {loading && <Typography>Yükleniyor...</Typography>}
            {error && <Typography color="error">{error}</Typography>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ width: '120px' }}>İşlemler</TableCell>
                                <TableCell>BOM Adı</TableCell>
                                <TableCell>Açıklama</TableCell>
                                <TableCell align="right">Öğe Sayısı</TableCell>
                                <TableCell>Oluşturma Tarihi</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {boms.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        Kayıtlı BOM bulunamadı.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                boms.map((bom) => (
                                    <TableRow key={bom.id}>
                                        <TableCell>
                                            <Tooltip title="Düzenle">
                                                <IconButton size="small" color="primary" onClick={() => handleEditBom(bom.id)}>
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Sil">
                                                <IconButton size="small" color="error" onClick={() => handleDeleteBom(bom.id)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>
                                            <Typography 
                                                variant="body1" 
                                                sx={{ 
                                                    cursor: 'pointer', 
                                                    color: 'primary.main',
                                                    '&:hover': { 
                                                        textDecoration: 'underline',
                                                        fontWeight: 'medium'
                                                    }
                                                }}
                                                onClick={() => handleEditBom(bom.id)}
                                            >
                                                {bom.name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{bom.bom_aciklamasi || '-'}</TableCell>
                                        <TableCell align="right">{bom.items?.length || 0}</TableCell>
                                        <TableCell>{new Date(bom.createdAt || bom.created_at).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <BomPrintModal
                open={bomPrintModalOpen}
                onClose={() => setBomPrintModalOpen(false)}
            />
        </Box>
    );
};

export default BomListesi;