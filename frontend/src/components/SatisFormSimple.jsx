import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box, Button, Card, CardContent, Typography, TextField, Grid,
    FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert, Paper
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const SatisFormSimple = () => {
    const navigate = useNavigate();

    const [makinalar, setMakinalar] = useState([]);
    const [selectedMakina, setSelectedMakina] = useState('');
    const [satisAdedi, setSatisAdedi] = useState(1);
    const [aciklama, setAciklama] = useState('');

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [warning, setWarning] = useState(null);

    // Makinaları yükle
    useEffect(() => {
        setFetching(true);
        axios.get('/api/satis/satislar/makinalar')
            .then(response => {
                setMakinalar(response.data || []);
                setError(null);
            })
            .catch(err => {
                console.error('Makinalar yüklenirken hata:', err);
                setError('Makinalar yüklenirken bir hata oluştu.');
            })
            .finally(() => setFetching(false));
    }, []);

    // Satış yap
    const handleSatisYap = async () => {
        if (!selectedMakina) {
            setError('Lütfen bir makina seçin.');
            return;
        }

        if (satisAdedi < 1) {
            setError('Satış adedi en az 1 olmalıdır.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);
        setWarning(null);

        try {
            const response = await axios.post('/api/satis/satislar/makina-sat', {
                makina_id: selectedMakina,
                satis_adedi: parseInt(satisAdedi),
                aciklama: aciklama || null
            });

            setSuccess(true);
            setError(null);

            // Form'u resetle
            setSelectedMakina('');
            setSatisAdedi(1);
            setAciklama('');

            // 3 saniye sonra success mesajını gizle
            setTimeout(() => setSuccess(false), 3000);

            // Yetersiz stok uyarısı varsa göster
            if (response.data.uyari) {
                const uyariDetay = response.data.yetersiz_stok || [];
                const uyariMsg = uyariDetay.map(d =>
                    `• ${d.parca_adi}: Mevcut ${d.mevcut_stok}, Gereken ${d.gereken_miktar} (Eksik: ${d.eksik})`
                ).join('\n');
                setWarning(`${response.data.uyari}\n\n${uyariMsg}`);
            }

        } catch (err) {
            console.error('Satış yapılırken hata:', err);
            if (err.response && err.response.data) {
                let errorMsg = err.response.data.message || 'Satış yapılırken bir hata oluştu.';

                // Detay varsa ekle
                if (err.response.data.detay) {
                    const detay = err.response.data.detay;
                    errorMsg += `\n\nParça: ${detay.parca_adi}\nMevcut: ${detay.mevcut_stok}\nGereken: ${detay.gereken_miktar}\nEksik: ${detay.eksik}`;
                }

                setError(errorMsg);
                console.error('Backend hatası:', err.response.data);
            } else {
                setError('Satış yapılırken bir hata oluştu.');
            }
            setSuccess(false);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
            <Paper sx={{ p: 2, mb: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h5" component="h1">
                        Makina Satışı
                    </Typography>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/')}
                        color="primary"
                    >
                        Geri
                    </Button>
                </Box>
            </Paper>

            <Card>
                <CardContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }} onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Satış başarıyla tamamlandı!
                        </Alert>
                    )}

                    {warning && (
                        <Alert severity="warning" sx={{ mb: 2, whiteSpace: 'pre-line' }} onClose={() => setWarning(null)}>
                            {warning}
                        </Alert>
                    )}

                    <Grid container spacing={2}>
                        {/* Makina Seçimi */}
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel id="makina-select-label">Makina Seçin</InputLabel>
                                <Select
                                    labelId="makina-select-label"
                                    value={selectedMakina}
                                    label="Makina Seçin"
                                    onChange={(e) => setSelectedMakina(e.target.value)}
                                    disabled={loading}
                                >
                                    {makinalar.map((makina) => (
                                        <MenuItem key={makina.makina_id} value={makina.makina_id}>
                                            {makina.makinaAdi}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Satış Adedi */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Satış Adedi"
                                type="number"
                                value={satisAdedi}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    if (value > 0) {
                                        setSatisAdedi(value);
                                    }
                                }}
                                inputProps={{ min: 1 }}
                                disabled={loading}
                            />
                        </Grid>

                        {/* Açıklama */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Açıklama (Opsiyonel)"
                                multiline
                                rows={3}
                                value={aciklama}
                                onChange={(e) => setAciklama(e.target.value)}
                                disabled={loading}
                            />
                        </Grid>

                        {/* Satış Yap Butonu */}
                        <Grid item xs={12}>
                            <Button
                                fullWidth
                                variant="contained"
                                color="primary"
                                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                                onClick={handleSatisYap}
                                disabled={loading || !selectedMakina}
                                sx={{ py: 1.5 }}
                            >
                                {loading ? 'İşleniyor...' : 'Satış Yap'}
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
};

export default SatisFormSimple;
