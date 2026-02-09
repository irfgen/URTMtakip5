import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Divider,
    CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import axios from 'axios';
import ImageWithFallback from './ImageWithFallback';
import getFotoPath from './getFotoPath';

// Print stilleri
const printStyles = `
@media print {
    @page {
        margin: 10mm;
        size: A4 portrait;
    }

    /* Tüm sayfayı temizle */
    body * {
        visibility: hidden !important;
    }

    /* Print content'i ve alt elementlerini görünür yap */
    .bom-print-content,
    .bom-print-content *,
    .print-page-group,
    .print-page-group * {
        visibility: visible !important;
    }

    /* Print content'i konumlandır */
    .bom-print-content {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        height: auto !important;
        background: white !important;
        padding: 0 !important;
        margin: 0 !important;
    }

    /* Başlıklar */
    .bom-print-content h1,
    .bom-print-content h2,
    .bom-print-content h3,
    .bom-print-content h4,
    .bom-print-content h5,
    .bom-print-content h6 {
        color: black !important;
        page-break-after: avoid !important;
        margin: 0 0 5mm 0 !important;
        text-align: center !important;
    }

    /* Divider */
    .bom-print-content hr,
    .bom-print-content .MuiDivider-root {
        border: 0.5px solid #333 !important;
        margin: 3mm 0 !important;
        page-break-after: avoid !important;
    }

    /* Sayfa grupları */
    .print-page-group {
        display: grid !important;
        grid-template-columns: 1fr 1fr 1fr !important;
        grid-template-rows: 1fr 1fr !important;
        gap: 3mm !important;
        width: 100% !important;
        height: auto !important;
        margin-bottom: 5mm !important;
        page-break-after: always !important;
    }

    .print-page-group:last-child {
        page-break-after: avoid !important;
    }

    /* Kartlar */
    .print-page-group .MuiCard-root {
        width: 100% !important;
        height: 90mm !important;
        border: 1px solid #000 !important;
        background: white !important;
        display: block !important;
        page-break-inside: avoid !important;
        overflow: hidden !important;
    }

    /* Kart içeriği */
    .print-page-group .MuiCardContent-root {
        padding: 2mm !important;
        height: 100% !important;
        display: block !important;
    }

    /* Resim kutusu */
    .print-page-group div[style*="height: 200"] {
        height: 55mm !important;
        background: #f0f0f0 !important;
        border: 1px solid #ccc !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        margin-bottom: 2mm !important;
    }

    /* Resimler */
    .print-page-group img {
        max-width: 100% !important;
        max-height: 100% !important;
        object-fit: contain !important;
    }

    /* Metin */
    .print-page-group p,
    .print-page-group h6,
    .print-page-group span,
    .print-page-group div {
        color: black !important;
        font-family: Arial, sans-serif !important;
    }

    .print-page-group h6 {
        font-size: 10px !important;
        font-weight: bold !important;
        margin: 0 0 1mm 0 !important;
        text-align: center !important;
    }

    .print-page-group p {
        font-size: 8px !important;
        margin: 0 0 1mm 0 !important;
        text-align: center !important;
    }

    /* Kart divider'ı */
    .print-page-group .MuiDivider-root {
        margin: 1mm 0 !important;
        border-color: #666 !important;
    }
}
`;

const BomPrintModal = ({ open, onClose }) => {
    const [boms, setBoms] = useState([]);
    const [selectedBomId, setSelectedBomId] = useState('');
    const [selectedBom, setSelectedBom] = useState(null);
    const [loading, setLoading] = useState(false);
    const [bomDetailsLoading, setBomDetailsLoading] = useState(false);

    // Print stilleri DOM'a ekle
    useEffect(() => {
        const styleElement = document.createElement('style');
        styleElement.textContent = printStyles;
        document.head.appendChild(styleElement);

        return () => {
            // Cleanup
            if (document.head.contains(styleElement)) {
                document.head.removeChild(styleElement);
            }
        };
    }, []);

    useEffect(() => {
        if (open) {
            fetchBoms();
        }
    }, [open]);

    useEffect(() => {
        if (selectedBomId) {
            fetchBomDetails();
        } else {
            setSelectedBom(null);
        }
    }, [selectedBomId]);

    const fetchBoms = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/boms');
            setBoms(response.data);
        } catch (error) {
            console.error('BOM listesi yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBomDetails = async () => {
        try {
            setBomDetailsLoading(true);
            const response = await axios.get(`/api/boms/${selectedBomId}`);
            const bomData = response.data;

            // items'ı güvenli bir şekilde parse et
            if (typeof bomData.items === 'string') {
                try {
                    bomData.items = JSON.parse(bomData.items);
                } catch (e) {
                    console.warn('BOM items parse edilemedi:', e);
                    bomData.items = [];
                }
            }

            // items array değilse boş array yap
            if (!Array.isArray(bomData.items)) {
                bomData.items = [];
            }

            setSelectedBom(bomData);
        } catch (error) {
            console.error('BOM detayları yüklenirken hata:', error);
        } finally {
            setBomDetailsLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedBomId('');
        setSelectedBom(null);
        onClose();
    };

    const handlePrint = () => {
        window.print();
    };


    const renderPartCard = (item, index) => {
        if (item.type !== 'PART' && item.type !== 'PARCA') {
            return null;
        }

        const partCode = item.id || item.name || 'Bilinmeyen Parça';
        const quantity = item.quantity || 1;
        const description = item.description || item.partDetails?.name || '';

        // Parça detayları varsa foto_path'i kullan, yoksa parça kodundan resim yolu oluştur
        const fotoPath = item.partDetails?.foto_path || '';
        let imageUrl = '';

        if (fotoPath) {
            imageUrl = getFotoPath(fotoPath);
        } else {
            // Alternatif: parça kodu ile resim ara
            imageUrl = getFotoPath(`${partCode}.jpg`);
        }

        console.log('Part details for', partCode, ':', item.partDetails, 'Image URL:', imageUrl);

        return (
            <Card key={index} sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '300px' // Ekranda da yeterli yükseklik
            }}>
                <Box sx={{ height: 200, p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageWithFallback
                        src={imageUrl}
                        alt={partCode}
                        imgStyle={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                        }}
                        fallbackText="Resim Yok"
                        sx={{ height: '100%', width: '100%' }}
                    />
                </Box>
                <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                    <Typography variant="h6" component="div" gutterBottom sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
                        {partCode}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem' }}>
                        {description}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                        Adet: {quantity}
                    </Typography>
                </CardContent>
            </Card>
        );
    };

    // Kartları sayfa başına 6'şar gruplara böl (3x2 grid)
    const renderPartCardsGrouped = (items) => {
        const itemsPerPage = 6;
        const pages = [];

        for (let i = 0; i < items.length; i += itemsPerPage) {
            const pageItems = items.slice(i, i + itemsPerPage);
            pages.push(pageItems);
        }

        return (
            <Box>
                {pages.map((pageItems, pageIndex) => (
                    <Box key={pageIndex} className="print-page-group">
                        {pageItems.map((item, index) => renderPartCard(item, pageIndex * itemsPerPage + index))}
                    </Box>
                ))}
            </Box>
        );
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { height: '90vh' }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                BOM Print
                <IconButton onClick={handleClose}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Box sx={{ mb: 3 }}>
                    <FormControl fullWidth>
                        <InputLabel>BOM Seçiniz</InputLabel>
                        <Select
                            value={selectedBomId}
                            label="BOM Seçiniz"
                            onChange={(e) => setSelectedBomId(e.target.value)}
                            disabled={loading}
                        >
                            {loading ? (
                                <MenuItem disabled>
                                    <CircularProgress size={20} sx={{ mr: 1 }} />
                                    Yükleniyor...
                                </MenuItem>
                            ) : (
                                boms.map((bom) => (
                                    <MenuItem key={bom.id} value={bom.id}>
                                        {bom.name} {bom.bom_aciklamasi && `- ${bom.bom_aciklamasi}`}
                                    </MenuItem>
                                ))
                            )}
                        </Select>
                    </FormControl>
                </Box>

                {bomDetailsLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                )}

                {selectedBom && !bomDetailsLoading && (
                    <Box className="bom-print-content">
                        <Typography variant="h4" align="center" sx={{ mb: 1 }}>
                            {selectedBom.name}
                        </Typography>
                        {selectedBom.bom_aciklamasi && (
                            <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 1 }}>
                                {selectedBom.bom_aciklamasi}
                            </Typography>
                        )}

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="h5" align="center" sx={{ mb: 3 }}>
                            Parça Listesi
                        </Typography>

                        {selectedBom.items && Array.isArray(selectedBom.items) && selectedBom.items.length > 0 ? (
                            renderPartCardsGrouped(selectedBom.items.filter(item => item.type === 'PART' || item.type === 'PARCA'))
                        ) : (
                            <Typography variant="body1" color="text.secondary" align="center">
                                Bu BOM'da parça bulunamadı.
                            </Typography>
                        )}
                    </Box>
                )}

                {!selectedBomId && !bomDetailsLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                            Lütfen yazdırmak istediğiniz BOM'u seçin.
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose}>
                    İptal
                </Button>
                <Button
                    variant="contained"
                    onClick={handlePrint}
                    disabled={!selectedBom}
                >
                    Yazdır
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BomPrintModal;