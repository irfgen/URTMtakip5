import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  IconButton,
  Autocomplete,
  InputAdornment,
  FormHelperText,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import stokKartlariService from '../../services/stokKartlariService';

// Form validation schema
const validationSchema = Yup.object({
  kesit: Yup.string()
    .required('Kesit bilgisi zorunludur')
    .min(1, 'En az 1 karakter olmalı')
    .max(50, 'Maksimum 50 karakter olabilir'),
  boy: Yup.number()
    .nullable()
    .min(0, 'Boy 0\'dan küçük olamaz'),
  malzeme_cinsi: Yup.string()
    .required('Malzeme cinsi zorunludur')
    .min(1, 'En az 1 karakter olmalı')
    .max(100, 'Maksimum 100 karakter olabilir'),
  malzeme_adi: Yup.string()
    .nullable()
    .max(200, 'Maksimum 200 karakter olabilir'),
  adet: Yup.number()
    .required('Adet zorunludur')
    .min(0, 'Adet 0\'dan küçük olamaz')
    .integer('Adet tam sayı olmalı'),
  kritik_stok_miktari: Yup.number()
    .required('Kritik stok miktarı zorunludur')
    .min(0, 'Kritik stok miktarı 0\'dan küçük olamaz')
    .integer('Kritik stok miktarı tam sayı olmalı'),
  lokasyon: Yup.string()
    .nullable()
    .max(50, 'Maksimum 50 karakter olabilir'),
  adres: Yup.string()
    .nullable(),
  firma: Yup.string()
    .nullable()
    .max(100, 'Maksimum 100 karakter olabilir')
});

function StokKartiForm({ 
  open, 
  onClose, 
  stokKarti = null, 
  onSuccess 
}) {
  const [loading, setLoading] = useState(false);
  const [malzemeCinsleri, setMalzemeCinsleri] = useState([]);
  const [firmalar, setFirmalar] = useState([]);
  
  const isEditMode = Boolean(stokKarti?.id);

  const formatBoyutPreview = () => {
    const kesit = formik.values.kesit;
    const boy = formik.values.boy;
    
    if (!kesit) return '';
    
    return boy ? `${kesit} x ${boy}mm` : kesit;
  };

  const formik = useFormik({
    initialValues: {
      kesit: stokKarti?.kesit ?? '',
      boy: stokKarti?.boy ?? '',
      malzeme_cinsi: stokKarti?.malzeme_cinsi ?? '',
      malzeme_adi: stokKarti?.malzeme_adi ?? '',
      adet: stokKarti?.adet ?? 0,
      kritik_stok_miktari: stokKarti?.kritik_stok_miktari ?? 0,
      lokasyon: stokKarti?.lokasyon ?? '',
      adres: stokKarti?.adres ?? '',
      firma: stokKarti?.firma ?? ''
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: handleSubmit
  });

  // Load dropdown data
  useEffect(() => {
    if (open) {
      loadDropdownData();
    }
  }, [open]);

  const loadDropdownData = async () => {
    try {
      setLoading(true);
      const [malzemeResponse, firmaResponse] = await Promise.all([
        stokKartlariService.getMalzemeCinsleri(),
        stokKartlariService.getFirmalar()
      ]);

      if (malzemeResponse.success) {
        setMalzemeCinsleri(malzemeResponse.data);
      }

      if (firmaResponse.success) {
        setFirmalar(firmaResponse.data);
      }
    } catch (error) {
      console.error('Dropdown verisi yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  async function handleSubmit(values) {
    try {
      setLoading(true);
      
      const response = isEditMode 
        ? await stokKartlariService.updateStokKarti(stokKarti.id, values)
        : await stokKartlariService.createStokKarti(values);

      if (response.success) {
        // Diğer sayfaları bilgilendirmek için custom event dispatch et
        const updateEvent = new CustomEvent('stokKartiUpdated', {
          detail: {
            updatedStokKarti: response.data,
            action: isEditMode ? 'update' : 'create',
            stokKartiId: isEditMode ? stokKarti.id : response.data.id
          }
        });
        window.dispatchEvent(updateEvent);
        
        if (onSuccess) {
          onSuccess(response.data, isEditMode ? 'update' : 'create');
        }
        handleClose();
      }
    } catch (error) {
      console.error('Form gönderim hatası:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { 
          minHeight: '500px',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          {isEditMode ? 'Stok Kartını Düzenle' : 'Yeni Stok Kartı'}
          {formatBoyutPreview() && (
            <Box component="span" sx={{ fontSize: '0.8em', color: 'text.secondary', ml: 1 }}>
              ({formatBoyutPreview()})
            </Box>
          )}
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* Boyut Bilgileri */}
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'grey.50', 
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.300'
                }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <TextField
                        fullWidth
                        name="kesit"
                        label="Kesit *"
                        placeholder="Örn: 10x20x2, 15x15x1.5"
                        value={formik.values.kesit}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.kesit && Boolean(formik.errors.kesit)}
                        helperText={formik.touched.kesit && formik.errors.kesit}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        name="boy"
                        label="Boy"
                        type="number"
                        value={formik.values.boy || ''}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.boy && Boolean(formik.errors.boy)}
                        helperText={formik.touched.boy && formik.errors.boy}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                  </Grid>
                  {formatBoyutPreview() && (
                    <FormHelperText sx={{ mt: 1, fontSize: '0.9em', color: 'primary.main' }}>
                      Formatlanmış boyut: {formatBoyutPreview()}
                    </FormHelperText>
                  )}
                </Box>
              </Grid>

              {/* Malzeme Cinsi */}
              <Grid item xs={12} md={6}>
                <Autocomplete
                  freeSolo
                  options={malzemeCinsleri}
                  value={formik.values.malzeme_cinsi || ''}
                  onChange={(event, newValue) => {
                    formik.setFieldValue('malzeme_cinsi', newValue || '');
                  }}
                  onInputChange={(event, newInputValue) => {
                    formik.setFieldValue('malzeme_cinsi', newInputValue || '');
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      name="malzeme_cinsi"
                      label="Malzeme Cinsi *"
                      value={formik.values.malzeme_cinsi || ''}
                      onBlur={formik.handleBlur}
                      error={formik.touched.malzeme_cinsi && Boolean(formik.errors.malzeme_cinsi)}
                      helperText={formik.touched.malzeme_cinsi && formik.errors.malzeme_cinsi}
                    />
                  )}
                />
              </Grid>

              {/* Malzeme Adı */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="malzeme_adi"
                  label="Malzeme Adı"
                  placeholder="Detaylı malzeme açıklaması"
                  value={formik.values.malzeme_adi}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.malzeme_adi && Boolean(formik.errors.malzeme_adi)}
                  helperText={formik.touched.malzeme_adi && formik.errors.malzeme_adi}
                />
              </Grid>

              {/* Firma */}
              <Grid item xs={12} md={6}>
                <Autocomplete
                  freeSolo
                  options={firmalar}
                  value={formik.values.firma || ''}
                  onChange={(event, newValue) => {
                    formik.setFieldValue('firma', newValue || '');
                  }}
                  onInputChange={(event, newInputValue) => {
                    formik.setFieldValue('firma', newInputValue || '');
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      name="firma"
                      label="Firma"
                      value={formik.values.firma || ''}
                      onBlur={formik.handleBlur}
                      error={formik.touched.firma && Boolean(formik.errors.firma)}
                      helperText={formik.touched.firma && formik.errors.firma}
                    />
                  )}
                />
              </Grid>

              {/* Stok Bilgileri */}
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'primary.50', 
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'primary.200'
                }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        name="adet"
                        label="Mevcut Adet *"
                        type="number"
                        value={formik.values.adet}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.adet && Boolean(formik.errors.adet)}
                        helperText={formik.touched.adet && formik.errors.adet}
                        inputProps={{ min: 0, step: 1 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        name="kritik_stok_miktari"
                        label="Kritik Stok Miktarı *"
                        type="number"
                        value={formik.values.kritik_stok_miktari}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.kritik_stok_miktari && Boolean(formik.errors.kritik_stok_miktari)}
                        helperText={formik.touched.kritik_stok_miktari && formik.errors.kritik_stok_miktari}
                        inputProps={{ min: 0, step: 1 }}
                      />
                    </Grid>
                  </Grid>
                  {formik.values.adet && formik.values.kritik_stok_miktari && (
                    <FormHelperText sx={{ mt: 1 }}>
                      {formik.values.adet <= formik.values.kritik_stok_miktari ? (
                        <Box component="span" sx={{ color: 'warning.main' }}>
                          ⚠️ Kritik stok seviyesinde!
                        </Box>
                      ) : (
                        <Box component="span" sx={{ color: 'success.main' }}>
                          ✅ Stok durumu normal
                        </Box>
                      )}
                    </FormHelperText>
                  )}
                </Box>
              </Grid>

              {/* Lokasyon Bilgileri */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="lokasyon"
                  label="Lokasyon"
                  placeholder="Örn: A-1-3, Depo-2-Raf-5"
                  value={formik.values.lokasyon}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.lokasyon && Boolean(formik.errors.lokasyon)}
                  helperText={formik.touched.lokasyon && formik.errors.lokasyon}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="adres"
                  label="Detaylı Adres"
                  multiline
                  rows={2}
                  placeholder="Depo içindeki detaylı konum bilgisi"
                  value={formik.values.adres}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.adres && Boolean(formik.errors.adres)}
                  helperText={formik.touched.adres && formik.errors.adres}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={handleClose}
            disabled={loading}
          >
            İptal
          </Button>
          <Button 
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
            disabled={loading || !formik.isValid}
          >
            {loading ? 'Kaydediliyor...' : (isEditMode ? 'Güncelle' : 'Kaydet')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default StokKartiForm;
