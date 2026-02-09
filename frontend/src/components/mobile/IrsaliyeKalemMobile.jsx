import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Grid,
    Alert,
    Divider,
    Stack
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

/**
 * IrsaliyeKalemMobile - Mobil İrsaliye Kalem Ekleme Component
 *
 * Özellikler:
 * - Mal/Hizmet adı serbest metin girişi (zorunlu)
 * - Stok kodu opsiyonel
 * - Miktar input (numeric keyboard)
 * - Birim seçimi
 * - Birim fiyat input
 * - Toplam tutar hesaplama
 */
const KalemSchema = Yup.object().shape({
    stok_kodu: Yup.string().nullable(),
    mal_hizmet_adi: Yup.string()
        .required('Mal/Hizmet adı gereklidir')
        .max(500, 'Mal/Hizmet adı en fazla 500 karakter olabilir'),
    miktar: Yup.number()
        .required('Miktar gereklidir')
        .positive('Miktar pozitif olmalıdır')
        .max(999999, 'Miktar çok büyük'),
    birim: Yup.string().required('Birim gereklidir'),
    birim_fiyat: Yup.number()
        .nullable()
        .positive('Birim fiyat pozitif olmalıdır')
        .max(999999, 'Birim fiyat çok büyük'),
    aciklama: Yup.string().nullable()
});

const IrsaliyeKalemMobile = ({ initialData, onSave, onCancel }) => {
    const [toplamTutar, setToplamTutar] = useState(0);

    const formik = useFormik({
        initialValues: {
            stok_kodu: initialData?.stok_kodu || '',
            mal_hizmet_adi: initialData?.mal_hizmet_adi || '',
            miktar: initialData?.miktar || '',
            birim: initialData?.birim || 'Adet',
            birim_fiyat: initialData?.birim_fiyat || '',
            aciklama: initialData?.aciklama || ''
        },
        validationSchema: KalemSchema,
        onSubmit: (values) => {
            onSave(values);
        },
        enableReinitialize: true
    });

    // Toplam tutar hesaplama
    useEffect(() => {
        const miktar = parseFloat(formik.values.miktar) || 0;
        const birimFiyat = parseFloat(formik.values.birim_fiyat) || 0;
        setToplamTutar(miktar * birimFiyat);
    }, [formik.values.miktar, formik.values.birim_fiyat]);

    // Miktar değiştiğinde
    const handleMiktarChange = (e) => {
        const value = e.target.value;
        // Sadece sayı ve ondalık nokta
        if (/^\d*\.?\d*$/.test(value)) {
            formik.handleChange(e);
        }
    };

    return (
        <Box>
            {/* Mal/Hizmet Adı */}
            <TextField
                fullWidth
                id="mal_hizmet_adi"
                name="mal_hizmet_adi"
                label="Mal/Hizmet Adı *"
                value={formik.values.mal_hizmet_adi}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.mal_hizmet_adi && Boolean(formik.errors.mal_hizmet_adi)}
                helperText={formik.touched.mal_hizmet_adi && formik.errors.mal_hizmet_adi}
                sx={{ mb: 2 }}
                placeholder="İrsaliyedeki mal/hizmet adı"
            />

            {/* Stok Kodu (Opsiyonel) */}
            <TextField
                fullWidth
                id="stok_kodu"
                name="stok_kodu"
                label="Stok Kodu"
                value={formik.values.stok_kodu}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                helperText={formik.touched.stok_kodu && formik.errors.stok_kodu}
                sx={{ mb: 2 }}
                placeholder="Opsiyonel"
            />

            {/* Miktar ve Birim - Grid */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={7}>
                    <TextField
                        fullWidth
                        id="miktar"
                        name="miktar"
                        label="Miktar *"
                        type="number"
                        value={formik.values.miktar}
                        onChange={handleMiktarChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.miktar && Boolean(formik.errors.miktar)}
                        helperText={formik.touched.miktar && formik.errors.miktar}
                        inputProps={{
                            inputMode: 'decimal',
                            step: '0.01'
                        }}
                    />
                </Grid>
                <Grid item xs={5}>
                    <FormControl fullWidth>
                        <InputLabel>Birim *</InputLabel>
                        <Select
                            id="birim"
                            name="birim"
                            value={formik.values.birim}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.birim && Boolean(formik.errors.birim)}
                            label="Birim *"
                        >
                            <MenuItem value="Adet">Adet</MenuItem>
                            <MenuItem value="KG">KG</MenuItem>
                            <MenuItem value="Lt">Lt</MenuItem>
                            <MenuItem value="Mt">Mt</MenuItem>
                            <MenuItem value="m2">m2</MenuItem>
                            <MenuItem value="m3">m3</MenuItem>
                            <MenuItem value="Gram">Gram</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            {/* Birim Fiyat */}
            <TextField
                fullWidth
                id="birim_fiyat"
                name="birim_fiyat"
                label="Birim Fiyat (₺)"
                type="number"
                value={formik.values.birim_fiyat}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.birim_fiyat && Boolean(formik.errors.birim_fiyat)}
                helperText={formik.touched.birim_fiyat && formik.errors.birim_fiyat}
                sx={{ mb: 2 }}
                inputProps={{
                    inputMode: 'decimal',
                    step: '0.01'
                }}
            />

            {/* Toplam Tutar */}
            {toplamTutar > 0 && (
                <Box
                    sx={{
                        p: 2,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        borderRadius: 1,
                        mb: 2,
                        textAlign: 'center'
                    }}
                >
                    <Typography variant="body2">
                        Toplam Tutar
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                        ₺{toplamTutar.toFixed(2)}
                    </Typography>
                </Box>
            )}

            {/* Açıklama */}
            <TextField
                fullWidth
                multiline
                rows={2}
                id="aciklama"
                name="aciklama"
                label="Açıklama"
                value={formik.values.aciklama}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                sx={{ mb: 2 }}
            />

            <Divider sx={{ my: 2 }} />

            {/* Action Buttons */}
            <Stack direction="row" spacing={2}>
                <Button
                    fullWidth
                    variant="outlined"
                    onClick={onCancel}
                    sx={{ minHeight: 48 }}
                >
                    İptal
                </Button>
                <Button
                    fullWidth
                    variant="contained"
                    onClick={formik.submitForm}
                    sx={{ minHeight: 48 }}
                >
                    Kaydet
                </Button>
            </Stack>
        </Box>
    );
};

export default IrsaliyeKalemMobile;
