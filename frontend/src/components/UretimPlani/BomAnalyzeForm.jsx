import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Button, Typography, Grid, Card, CardContent,
    CardMedia, Chip, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper,
    IconButton, Tooltip, Alert, CircularProgress,
    Avatar, Stack, Divider
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Build as BuildIcon,
    Inventory as InventoryIcon
} from '@mui/icons-material';
import ParcaDetayModal from './ParcaDetayModal';

const BomAnalyzeForm = ({ 
    open, 
    onClose, 
    onConfirm, 
    makinaData, 
    miktar = 1,
    bomAnalysisData 
}) => {
    const [parcaDetayModal, setParcaDetayModal] = useState({
        open: false,
        parcaData: null
    });
    const [loading, setLoading] = useState(false);

    // Debug logs
    console.log('BomAnalyzeForm props:', { 
        open, 
        makinaData, 
        miktar, 
        bomAnalysisData 
    });

    // BOM analizi verisini parse et
    const parcaListesi = bomAnalysisData?.parcaListesi || [];
    const kritikStokParcalari = bomAnalysisData?.kritikStokParcalari || [];

    console.log('Parsed data:', { parcaListesi, kritikStokParcalari });

    // Modal'ın kapanma problemini debug et
    useEffect(() => {
        console.log('BomAnalyzeForm useEffect - open değişti:', open);
    }, [open]);

    useEffect(() => {
        console.log('BomAnalyzeForm useEffect - bomAnalysisData değişti:', bomAnalysisData);
    }, [bomAnalysisData]);

    const handleParcaDetayAc = (parca) => {
        setParcaDetayModal({
            open: true,
            parcaData: parca
        });
    };

    const handleParcaDetayKapat = () => {
        setParcaDetayModal({
            open: false,
            parcaData: null
        });
    };

    const getStokDurumRenk = (parca) => {
        if (parca.kritikStokUyarisi) {
            return 'error';
        }
        if (parca.uretimSonrasiStok < parca.kritikStokMiktari * 1.5) {
            return 'warning';
        }
        return 'success';
    };

    const getStokDurumIcon = (parca) => {
        if (parca.kritikStokUyarisi) {
            return <ErrorIcon color="error" />;
        }
        if (parca.uretimSonrasiStok < parca.kritikStokMiktari * 1.5) {
            return <WarningIcon color="warning" />;
        }
        return <CheckCircleIcon color="success" />;
    };

    const handleDevamEt = () => {
        setLoading(true);
        // Kullanıcı BOM analizi sonrasında devam etmek istiyor
        onConfirm();
        setLoading(false);
    };

    return (
        <>
            <Dialog 
                open={open} 
                onClose={onClose}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: { minHeight: '80vh' }
                }}
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={2}>
                        <BuildIcon color="primary" />
                        <Typography variant="h6" component="div" flexGrow={1}>
                            BOM Analizi - {makinaData?.name}
                        </Typography>
                        <Chip 
                            label={`Miktar: ${miktar}`} 
                            color="primary" 
                            variant="outlined" 
                        />
                    </Box>
                </DialogTitle>

                <DialogContent>
                    {/* Kritik Stok Uyarıları */}
                    {kritikStokParcalari.length > 0 && (
                        <Alert 
                            severity="warning" 
                            sx={{ mb: 3 }}
                            icon={<WarningIcon />}
                        >
                            <Typography variant="h6" gutterBottom>
                                Kritik Stok Uyarısı!
                            </Typography>
                            <Typography variant="body2">
                                {kritikStokParcalari.length} parça kritik stok seviyesinde veya altında kalacak.
                                Detayları görmek için parça kartlarına tıklayın.
                            </Typography>
                        </Alert>
                    )}

                    {/* İstatistikler */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={4}>
                            <Card variant="outlined">
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <InventoryIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                                    <Typography variant="h4" color="primary">
                                        {parcaListesi.length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Toplam Parça Türü
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Card variant="outlined">
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <ErrorIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
                                    <Typography variant="h4" color="error">
                                        {kritikStokParcalari.length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Kritik Stok Parçası
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Card variant="outlined">
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                                    <Typography variant="h4" color="success">
                                        {parcaListesi.filter(p => !p.kritikStokUyarisi).length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Yeterli Stok
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    {/* Parça Listesi */}
                    <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                        Parça Listesi ve Stok Analizi
                    </Typography>

                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Durum</TableCell>
                                    <TableCell>Parça Adı</TableCell>
                                    <TableCell>Hiyerarşi</TableCell>
                                    <TableCell align="right">İhtiyaç</TableCell>
                                    <TableCell align="right">Mevcut Stok</TableCell>
                                    <TableCell align="right">Üretim Sonrası</TableCell>
                                    <TableCell align="center">İşlemler</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {parcaListesi.map((parca, index) => (
                                    <TableRow 
                                        key={`${parca.parcaKodu}-${index}`}
                                        sx={{ 
                                            backgroundColor: parca.kritikStokUyarisi ? 'rgba(244, 67, 54, 0.08)' : 'transparent',
                                            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                                        }}
                                    >
                                        <TableCell>
                                            <Tooltip title={
                                                parca.kritikStokUyarisi 
                                                    ? 'Kritik stok seviyesinde!' 
                                                    : 'Stok yeterli'
                                            }>
                                                <Box display="flex" alignItems="center">
                                                    {getStokDurumIcon(parca)}
                                                </Box>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                                                    {parca.parcaAdi.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {parca.parcaAdi}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {parca.parcaKodu}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" color="text.secondary">
                                                {parca.path}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Chip 
                                                label={parca.miktar}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2">
                                                {parca.stokMiktari || 0}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography 
                                                variant="body2"
                                                color={getStokDurumRenk(parca)}
                                                fontWeight="medium"
                                            >
                                                {parca.uretimSonrasiStok}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Parça detayını görüntüle">
                                                <IconButton 
                                                    size="small"
                                                    onClick={() => handleParcaDetayAc(parca)}
                                                >
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>

                <DialogActions>
                    <Button onClick={onClose} variant="outlined">
                        İptal
                    </Button>
                    <Button 
                        onClick={handleDevamEt}
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {loading ? 'İşleniyor...' : 'Üretim Planını Oluştur'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Parça Detay Modalı */}
            <ParcaDetayModal
                open={parcaDetayModal.open}
                onClose={handleParcaDetayKapat}
                parcaData={parcaDetayModal.parcaData}
                miktar={miktar}
            />
        </>
    );
};

export default BomAnalyzeForm;
