import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Typography,
  Box,
  Paper,
  Alert,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  Visibility as VisibilityIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import tedarikService from '../../services/tedarikService';
import StokKartiSecimModal from '../StokKartiSecimModal';
import ParcaSecimFormu from '../ParcaSecimFormu';
import StokKartlariService from '../../services/stokKartlariService';

const TedarikTalepForm = ({
  open,
  onClose,
  onSave,
  editData = null,
  kaynakTipi = null,
  kaynakId = null,
  parcaKodu = null,
  stokKartiId = null,
  prefillData = null
}) => {
  const [formData, setFormData] = useState({
    kaynak_tipi: kaynakTipi || 'manuel',
    kaynak_id: kaynakId || '',
    parca_kodu: parcaKodu || '',
    stok_karti_id: stokKartiId || '',
    aciklama: '',
    talep_eden_kullanici: 'Sistem Kullanıcısı',
    termin_tarihi: '',
    miktar: '',
    birim: 'adet',
    birim_fiyat: ''
  });

  const [detaylar, setDetaylar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [stokKartiModalOpen, setStokKartiModalOpen] = useState(false);
  const [parcaSecimModalOpen, setParcaSecimModalOpen] = useState(false);
  const [secilenStokKarti, setSecilenStokKarti] = useState(null);
  const [secilenParca, setSecilenParca] = useState(null);
  const [toplamTutar, setToplamTutar] = useState(0);

  useEffect(() => {
    if (open) {
      if (editData) {
        // Edit mode - populate form with existing data
        setFormData({
          kaynak_tipi: editData.kaynak_tipi,
          kaynak_id: editData.kaynak_id || '',
          parca_kodu: editData.parca_kodu || '',
          stok_karti_id: editData.stok_karti_id || '',
          aciklama: editData.aciklama || '',
          talep_eden_kullanici: editData.talep_eden_kullanici || 'Sistem Kullanıcısı',
          termin_tarihi: editData.detaylar?.[0]?.termin_tarihi || '',
          miktar: editData.miktar || '',
          birim: editData.birim || 'adet',
          birim_fiyat: editData.birim_fiyat || ''
        });

        setDetaylar(editData.detaylar || []);

        // Load related data
        if (editData.stok_karti_id) {
          loadStokKarti(editData.stok_karti_id);
        }
      } else {
        // New form mode
        if (prefillData) {
          // Pre-fill form with provided data
          setFormData({
            kaynak_tipi: prefillData.kaynak_tipi || kaynakTipi || 'manuel',
            kaynak_id: prefillData.kaynak_id || kaynakId || '',
            parca_kodu: prefillData.parca_kodu || parcaKodu || '',
            stok_karti_id: prefillData.stok_karti_id || prefillData.stok_karti?.id || stokKartiId || '',
            aciklama: prefillData.aciklama || '',
            talep_eden_kullanici: prefillData.talep_eden_kullanici || 'Sistem Kullanıcısı',
            termin_tarihi: prefillData.termin_tarihi || '',
            miktar: prefillData.miktar || '',
            birim: prefillData.birim || 'adet',
            birim_fiyat: prefillData.birim_fiyat || ''
          });

          // Set selected entities if provided
          if (prefillData.stok_karti) {
            setSecilenStokKarti(prefillData.stok_karti);
          }
          if (prefillData.parca) {
            setSecilenParca(prefillData.parca);
          }

          // Load related data if needed
          if (prefillData.stok_karti_id && !prefillData.stok_karti) {
            loadStokKarti(prefillData.stok_karti_id);
          }
        } else {
          resetForm();
        }
      }
    }
  }, [open, editData, prefillData]);

  useEffect(() => {
    // Calculate total when details change
    const yeniToplam = detaylar.reduce((total, detay) => {
      const miktar = parseFloat(detay.miktar) || 0;
      const birimFiyat = parseFloat(detay.birim_fiyat) || 0;
      return total + (miktar * birimFiyat);
    }, 0);
    setToplamTutar(yeniToplam);
  }, [detaylar]);

  useEffect(() => {
    // Load stok karti if ID provided
    if (stokKartiId && !editData) {
      loadStokKarti(stokKartiId);
    }
  }, [stokKartiId]);

  const resetForm = () => {
    // If prefillData exists, use it to initialize form
    const initialData = prefillData || {};

    setFormData({
      kaynak_tipi: initialData.kaynak_tipi || kaynakTipi || 'manuel',
      kaynak_id: initialData.kaynak_id || kaynakId || '',
      parca_kodu: initialData.parca_kodu || parcaKodu || '',
      stok_karti_id: initialData.stok_karti_id || initialData.stok_karti?.id || stokKartiId || '',
      aciklama: initialData.aciklama || '',
      talep_eden_kullanici: initialData.talep_eden_kullanici || 'Sistem Kullanıcısı',
      termin_tarihi: initialData.termin_tarihi || '',
      miktar: initialData.miktar || '',
      birim: initialData.birim || 'adet',
      birim_fiyat: initialData.birim_fiyat || ''
    });
    setDetaylar([]);
    setSecilenStokKarti(initialData.stok_karti || null);
    setSecilenParca(initialData.parca || null);
    setErrors({});
  };

  const loadStokKarti = async (id) => {
    try {
      const response = await StokKartlariService.getStokKarti(id);
      setSecilenStokKarti(response.data);
    } catch (error) {
      console.error('Stok kartı yüklenirken hata:', error);
    }
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleStokKartiModalAc = () => {
    setStokKartiModalOpen(true);
  };

  const handleStokKartiSec = (stokKarti) => {
    setSecilenStokKarti(stokKarti);
    setFormData(prev => ({
      ...prev,
      stok_karti_id: stokKarti.id,
      parca_kodu: stokKarti.kesit
    }));
    setStokKartiModalOpen(false);
  };

  const handleParcaSecimModalAc = () => {
    setParcaSecimModalOpen(true);
  };

  const handleParcaSec = (parca) => {
    setSecilenParca(parca);
    setFormData(prev => ({
      ...prev,
      parca_kodu: parca.parcaKodu
    }));
    setParcaSecimModalOpen(false);
  };

  const addDetay = () => {
    // Miktar bilgisini formdan al, boş ise 1 kullan
    const miktar = formData.miktar || 1;

    const yeniDetay = {
      id: Date.now(), // Temporary ID
      malzeme_adi: secilenParca?.parcaAdi || secilenStokKarti?.malzeme_cinsi || secilenStokKarti?.kesit || 'Malzeme',
      malzeme_kodu: secilenParca?.parcaKodu || secilenStokKarti?.kesit || '',
      miktar: miktar, // Formdan gelen miktar
      birim: formData.birim || 'adet',
      birim_fiyat: formData.birim_fiyat || 0,
      stok_karti_id: secilenStokKarti?.id || '',
      termin_tarihi: formData.termin_tarihi || '',
      teknik_ozellikler: ''
    };

    setDetaylar(prev => [...prev, yeniDetay]);

    // Clear form fields
    setFormData(prev => ({
      ...prev,
      miktar: '',
      birim_fiyat: ''
    }));
  };

  const updateDetay = (detayId, field) => (event) => {
    const value = event.target.value;
    setDetaylar(prev => prev.map(detay =>
      detay.id === detayId ? { ...detay, [field]: value } : detay
    ));
  };

  const removeDetay = (detayId) => {
    setDetaylar(prev => prev.filter(detay => detay.id !== detayId));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.aciklama.trim()) {
      newErrors.aciklama = 'Talep açıklaması zorunludur';
    }

    if (detaylar.length === 0) {
      newErrors.detaylar = 'En az bir malzeme detayı eklemelisiniz';
    } else {
      detaylar.forEach((detay, index) => {
        if (!detay.malzeme_adi.trim()) {
          newErrors[`detay_${index}_adi`] = 'Malzeme adı zorunludur';
        }
        if (!detay.miktar || parseFloat(detay.miktar) <= 0) {
          newErrors[`detay_${index}_miktar`] = 'Miktar 0\'dan büyük olmalıdır';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const talepData = {
        ...formData,
        detaylar: detaylar.map(({ id, ...detay }) => detay) // Remove temporary ID
      };

      if (editData) {
        const response = await tedarikService.updateTedarikTalebi(editData.id, talepData);
        onSave?.(response.data);
      } else {
        const response = await tedarikService.createTedarikTalebi(talepData);
        onSave?.(response.data);
      }

      onClose();
      resetForm();
    } catch (error) {
      console.error('Tedarik talebi kaydedilirken hata:', error);
      setErrors({
        submit: error.message || 'Tedarik talebi kaydedilemedi'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '70vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              {editData ? 'Tedarik Talebini Düzenle' : 'Yeni Tedarik Talebi'}
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Kaynak Bilgileri */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Kaynak Tipi</InputLabel>
                <Select
                  value={formData.kaynak_tipi}
                  onChange={handleInputChange('kaynak_tipi')}
                  label="Kaynak Tipi"
                  disabled={editData !== null || kaynakTipi !== null}
                >
                  <MenuItem value="manuel">Manuel</MenuItem>
                  <MenuItem value="is_emri">İş Emri</MenuItem>
                  <MenuItem value="parca">Parça</MenuItem>
                  <MenuItem value="stok_karti">Stok Kartı</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Termin Tarihi"
                type="date"
                value={formData.termin_tarihi}
                onChange={handleInputChange('termin_tarihi')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Parça ve Stok Kartı Bilgileri */}
            {(formData.kaynak_tipi === 'parca' || formData.kaynak_tipi === 'stok_karti' || !kaynakTipi) && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Malzeme Bilgileri
                  </Typography>

                  {/* Stok Kartı Seçimi */}
                  {formData.kaynak_tipi !== 'parca' && (
                    <Box sx={{ mb: 2 }}>
                      <Button
                        startIcon={<SearchIcon />}
                        variant="outlined"
                        onClick={handleStokKartiModalAc}
                        sx={{ mr: 2 }}
                      >
                        Stok Kartı Seç
                      </Button>

                      {formData.kaynak_tipi !== 'stok_karti' && (
                        <Button
                          variant="outlined"
                          onClick={handleParcaSecimModalAc}
                        >
                          Parça Seç
                        </Button>
                      )}
                    </Box>
                  )}

                  {/* Seçili Malzeme Bilgileri */}
                  {(secilenStokKarti || secilenParca) && (
                    <Paper sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0' }} elevation={0}>
                      {secilenStokKarti && (
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                              Stok Kartı Seçildi
                            </Typography>
                            <Tooltip title="Stok kartı detayını görüntüle">
                              <Button
                                size="small"
                                startIcon={<OpenInNewIcon />}
                                onClick={() => window.open(`/stok-kartlari/${secilenStokKarti.id}`, '_blank')}
                                variant="outlined"
                              >
                                Stok Kartı
                              </Button>
                            </Tooltip>
                          </Box>
                          <Box
                            sx={{
                              cursor: 'pointer',
                              p: 1,
                              border: '1px solid #e0e0e0',
                              borderRadius: 1,
                              backgroundColor: '#fafafa',
                              '&:hover': {
                                backgroundColor: '#f5f5f5',
                                borderColor: 'primary.main'
                              }
                            }}
                            onClick={() => window.open(`/stok-kartlari/${secilenStokKarti.id}`, '_blank')}
                          >
                            <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'primary.main', mb: 0.5 }}>
                              {secilenStokKarti.stok_kodu || secilenStokKarti.kesit}
                              {secilenStokKarti.boy && ` x ${secilenStokKarti.boy}mm`}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              <strong>Malzeme:</strong> {secilenStokKarti.malzeme_cinsi}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Stok:</strong> {secilenStokKarti.adet} {secilenStokKarti.birim || 'adet'}
                            </Typography>
                          </Box>
                        </>
                      )}

                      {secilenParca && (
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                              Parça Seçildi
                            </Typography>
                            <Tooltip title="Parça kartı detayını görüntüle">
                              <Button
                                size="small"
                                startIcon={<OpenInNewIcon />}
                                onClick={() => window.open(`/parcalar/${secilenParca.parcaKodu}`, '_blank')}
                                variant="outlined"
                                color="primary"
                              >
                                Parça Kartı
                              </Button>
                            </Tooltip>
                          </Box>
                          <Box
                            sx={{
                              cursor: 'pointer',
                              p: 1,
                              border: '1px solid #e0e0e0',
                              borderRadius: 1,
                              backgroundColor: '#fafafa',
                              '&:hover': {
                                backgroundColor: '#f5f5f5',
                                borderColor: 'primary.main'
                              }
                            }}
                            onClick={() => window.open(`/parcalar/${secilenParca.parcaKodu}`, '_blank')}
                          >
                            <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'primary.main', mb: 0.5 }}>
                              {secilenParca.parcaKodu}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              <strong>Parça Adı:</strong> {secilenParca.parcaAdi}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              <strong>Kategori:</strong> {secilenParca.kategori || 'Belirtilmemiş'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              <strong>Stok:</strong> {secilenParca.stokAdeti || 0} adet
                              {secilenParca.kritik_stok > 0 && ` (Kritik: ${secilenParca.kritik_stok})`}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Tür:</strong> {secilenParca.imalMi ? 'İmal Edilen' : 'Tedarik Edilen'}
                            </Typography>
                          </Box>
                        </>
                      )}
                    </Paper>
                  )}
                </Grid>
              </>
            )}

            {/* Açıklama */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Talep Açıklaması"
                value={formData.aciklama}
                onChange={handleInputChange('aciklama')}
                error={!!errors.aciklama}
                helperText={errors.aciklama}
              />
            </Grid>

            {/* Detaylar Tablosu */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Malzeme Detayları
              </Typography>

              {errors.detaylar && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.detaylar}
                </Alert>
              )}

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Kodu</TableCell>
                      <TableCell>Tip</TableCell>
                      <TableCell>Miktar</TableCell>
                      <TableCell>Birim</TableCell>
                      <TableCell>Birim Fiyat</TableCell>
                      <TableCell>Tutar</TableCell>
                      <TableCell>İşlem</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detaylar.map((detay, index) => {
                      // Malzeme tipini belirle
                      const isParca = detay.malzeme_kodu && detay.malzeme_kodu !== '';
                      const hasStokKartiId = detay.stok_karti_id && detay.stok_karti_id > 0;
                      const isStokKarti = hasStokKartiId && !isParca;

                      return (
                        <TableRow key={detay.id}>
                          <TableCell>
                            {isParca ? (
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {detay.malzeme_kodu}
                                </Typography>
                                <Typography variant="caption" color="primary.main">
                                  Parça Kodu
                                </Typography>
                              </Box>
                            ) : isStokKarti ? (
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {secilenStokKarti?.kesit || 'Stok Kartı'}{secilenStokKarti?.boy ? ` x ${secilenStokKarti.boy}mm` : ''}
                                </Typography>
                                <Typography variant="caption" color="secondary.main">
                                  Stok Kartı
                                </Typography>
                              </Box>
                            ) : (
                              <Box>
                                <Typography variant="body2">
                                  Ham Malzeme
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Kod Yok
                                </Typography>
                              </Box>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={isParca ? 'Parça' : isStokKarti ? 'Stok Kartı' : 'Ham Malzeme'}
                              size="small"
                              color={isParca ? 'primary' : isStokKarti ? 'info' : 'secondary'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              type="number"
                              value={detay.miktar}
                              onChange={updateDetay(detay.id, 'miktar')}
                              error={!!errors[`detay_${index}_miktar`]}
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              size="small"
                              fullWidth
                              value={detay.birim}
                              onChange={(e) => updateDetay(detay.id, 'birim')(e)}
                            >
                              <MenuItem value="adet">Adet</MenuItem>
                              <MenuItem value="kg">Kg</MenuItem>
                              <MenuItem value="metre">Metre</MenuItem>
                              <MenuItem value="metrekare">m²</MenuItem>
                              <MenuItem value="litre">Litre</MenuItem>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              type="number"
                              value={detay.birim_fiyat}
                              onChange={updateDetay(detay.id, 'birim_fiyat')}
                            />
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('tr-TR', {
                              style: 'currency',
                              currency: 'TRY'
                            }).format((parseFloat(detay.miktar) || 0) * (parseFloat(detay.birim_fiyat) || 0))}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {isParca ? (
                                <Tooltip title="Parça detayına git">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => window.open(`/parcalar/${detay.malzeme_kodu}`, '_blank')}
                                  >
                                    <VisibilityIcon />
                                  </IconButton>
                                </Tooltip>
                              ) : isStokKarti ? (
                                <Tooltip title="Stok kartı düzenle">
                                  <IconButton
                                    size="small"
                                    color="info"
                                    onClick={() => window.open(`/stok-kartlari/${detay.stok_karti_id}`, '_blank')}
                                  >
                                    <VisibilityIcon />
                                  </IconButton>
                                </Tooltip>
                              ) : null}
                              <Tooltip title="Malzeme detayını sil">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => removeDetay(detay.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {detaylar.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                          <Typography color="text.secondary">
                            Henüz malzeme detayı eklenmedi
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Hızlı Ekleme Alanı */}
              <Box sx={{ mt: 2, p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Hızlı Detay Ekle
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Miktar"
                      type="number"
                      value={formData.miktar}
                      onChange={handleInputChange('miktar')}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Birim</InputLabel>
                      <Select
                        value={formData.birim}
                        onChange={handleInputChange('birim')}
                        label="Birim"
                      >
                        <MenuItem value="adet">Adet</MenuItem>
                        <MenuItem value="kg">Kg</MenuItem>
                        <MenuItem value="metre">Metre</MenuItem>
                        <MenuItem value="metrekare">m²</MenuItem>
                        <MenuItem value="litre">Litre</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Birim Fiyat"
                      type="number"
                      value={formData.birim_fiyat}
                      onChange={handleInputChange('birim_fiyat')}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={addDetay}
                      disabled={!secilenStokKarti && !secilenParca}
                    >
                      Detay Ekle
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            {/* Toplam Tutar */}
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'right', mt: 2 }}>
                <Typography variant="h6">
                  Toplam Tutar: {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: 'TRY'
                  }).format(toplamTutar)}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {errors.submit && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errors.submit}
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            İptal
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {loading ? 'Kaydediliyor...' : (editData ? 'Güncelle' : 'Kaydet')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Components */}
      {stokKartiModalOpen && (
        <StokKartiSecimModal
          open={stokKartiModalOpen}
          onClose={() => setStokKartiModalOpen(false)}
          onSec={handleStokKartiSec}
        />
      )}

      {parcaSecimModalOpen && (
        <ParcaSecimFormu
          open={parcaSecimModalOpen}
          onClose={() => setParcaSecimModalOpen(false)}
          onSec={handleParcaSec}
        />
      )}
    </>
  );
};

export default TedarikTalepForm;