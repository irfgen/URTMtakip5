import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  FormControlLabel,
  Switch,
  CircularProgress,
  Grid,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  ColorLens as ColorIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import axios from 'axios';
import { isEmriDurumAPI } from '../services/api';

const IsEmriDurumYonetimi = () => {
  const [durumlar, setDurumlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDurum, setEditingDurum] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingDurum, setDeletingDurum] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    durum_kodu: '',
    durum_adi: '',
    durum_aciklamasi: '',
    renk_kodu: '#1976d2',
    sira_no: 999,
    aktif: true
  });

  const renkSecenekleri = [
    { value: '#f44336', name: 'Kırmızı' },
    { value: '#e91e63', name: 'Pembe' },
    { value: '#9c27b0', name: 'Mor' },
    { value: '#673ab7', name: 'Koyu Mor' },
    { value: '#3f51b5', name: 'Indigo' },
    { value: '#2196f3', name: 'Mavi' },
    { value: '#03a9f4', name: 'Açık Mavi' },
    { value: '#00bcd4', name: 'Cyan' },
    { value: '#009688', name: 'Teal' },
    { value: '#4caf50', name: 'Yeşil' },
    { value: '#8bc34a', name: 'Açık Yeşil' },
    { value: '#cddc39', name: 'Lime' },
    { value: '#ffeb3b', name: 'Sarı' },
    { value: '#ffc107', name: 'Amber' },
    { value: '#ff9800', name: 'Turuncu' },
    { value: '#ff5722', name: 'Koyu Turuncu' },
    { value: '#795548', name: 'Kahverengi' },
    { value: '#9e9e9e', name: 'Gri' },
    { value: '#607d8b', name: 'Mavi Gri' }
  ];

  // Durumları yükle
  const loadDurumlar = async () => {
    try {
      setLoading(true);
      const response = await isEmriDurumAPI.getAll();
      setDurumlar(response.data);
    } catch (error) {
      console.error('Durumlar yüklenirken hata:', error);
      setSnackbar({
        open: true,
        message: 'Durumlar yüklenirken bir hata oluştu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDurumlar();
  }, []);

  // Form işlemleri
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      durum_kodu: '',
      durum_adi: '',
      durum_aciklamasi: '',
      renk_kodu: '#1976d2',
      sira_no: 999,
      aktif: true
    });
    setEditingDurum(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (durum) => {
    setEditingDurum(durum);
    setFormData({
      durum_kodu: durum.durum_kodu || '',
      durum_adi: durum.durum_adi || '',
      durum_aciklamasi: durum.durum_aciklamasi || '',
      renk_kodu: durum.renk_kodu || '#1976d2',
      sira_no: durum.sira_no || 999,
      aktif: durum.aktif !== undefined ? durum.aktif : true
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.durum_kodu || !formData.durum_adi) {
        setSnackbar({
          open: true,
          message: 'Durum kodu ve durum adı zorunludur',
          severity: 'error'
        });
        return;
      }

      if (editingDurum) {
        // Güncelleme
        await isEmriDurumAPI.update(editingDurum.durum_id, formData);
        setSnackbar({
          open: true,
          message: 'Durum başarıyla güncellendi',
          severity: 'success'
        });
      } else {
        // Yeni oluşturma
        await isEmriDurumAPI.create(formData);
        setSnackbar({
          open: true,
          message: 'Yeni durum başarıyla oluşturuldu',
          severity: 'success'
        });
      }

      handleDialogClose();
      loadDurumlar();
    } catch (error) {
      console.error('Durum kaydedilirken hata:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Durum kaydedilirken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  const handleDelete = (durum) => {
    setDeletingDurum(durum);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await isEmriDurumAPI.delete(deletingDurum.durum_id);
      setSnackbar({
        open: true,
        message: 'Durum başarıyla silindi',
        severity: 'success'
      });
      setDeleteConfirmOpen(false);
      setDeletingDurum(null);
      loadDurumlar();
    } catch (error) {
      console.error('Durum silinirken hata:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Durum silinirken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  // Sürükle-bırak işlemleri
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(durumlar);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Sıra numaralarını güncelle
    const updatedItems = items.map((item, index) => ({
      ...item,
      sira_no: index + 1
    }));

    setDurumlar(updatedItems);

    try {
      const reorderData = updatedItems.map(item => ({
        durum_id: item.durum_id,
        sira_no: item.sira_no
      }));

      await isEmriDurumAPI.reorder(reorderData);
      setSnackbar({
        open: true,
        message: 'Durum sıralaması güncellendi',
        severity: 'success'
      });
    } catch (error) {
      console.error('Sıralama güncellenirken hata:', error);
      setSnackbar({
        open: true,
        message: 'Sıralama güncellenirken bir hata oluştu',
        severity: 'error'
      });
      // Hata durumunda listeyi yeniden yükle
      loadDurumlar();
    }
  };

  const varsayilanDurumlariOlustur = async () => {
    try {
      await isEmriDurumAPI.createDefaults();
      setSnackbar({
        open: true,
        message: 'Varsayılan durumlar oluşturuldu',
        severity: 'success'
      });
      loadDurumlar();
    } catch (error) {
      console.error('Varsayılan durumlar oluşturulurken hata:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Varsayılan durumlar oluşturulurken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h2">
            İş Emri Durum Yönetimi
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              onClick={varsayilanDurumlariOlustur}
              size="small"
            >
              Varsayılan Durumları Oluştur
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Yeni Durum Ekle
            </Button>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          İş emirlerinin durumlarını yönetebilir, yeni durumlar ekleyebilir ve mevcut durumları düzenleyebilirsiniz.
          Durumları sürükleyerek yeniden sıralayabilirsiniz.
        </Typography>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="durumlar">
            {(provided) => (
              <TableContainer 
                component={Paper} 
                variant="outlined"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell width="50px"></TableCell>
                      <TableCell>Durum Kodu</TableCell>
                      <TableCell>Durum Adı</TableCell>
                      <TableCell>Açıklama</TableCell>
                      <TableCell width="100px">Renk</TableCell>
                      <TableCell width="80px">Sıra</TableCell>
                      <TableCell width="100px">İş Sayısı</TableCell>
                      <TableCell width="80px">Aktif</TableCell>
                      <TableCell width="100px">İşlemler</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {durumlar.map((durum, index) => (
                      <Draggable 
                        key={durum.durum_id} 
                        draggableId={durum.durum_id.toString()} 
                        index={index}
                        isDragDisabled={durum.sistem_durumu} // Sistem durumları sürüklenemez
                      >
                        {(provided, snapshot) => (
                          <TableRow
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            sx={{
                              backgroundColor: snapshot.isDragging ? 'action.hover' : 'inherit',
                              opacity: durum.aktif ? 1 : 0.6
                            }}
                          >
                            <TableCell {...provided.dragHandleProps}>
                              {!durum.sistem_durumu && <DragIcon color="action" />}
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <code>{durum.durum_kodu}</code>
                                {durum.sistem_durumu && (
                                  <Chip label="Sistem" size="small" color="primary" variant="outlined" />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {durum.durum_adi}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {durum.durum_aciklamasi || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box 
                                sx={{ 
                                  width: 24, 
                                  height: 24, 
                                  backgroundColor: durum.renk_kodu,
                                  borderRadius: 1,
                                  border: '1px solid',
                                  borderColor: 'divider'
                                }} 
                              />
                            </TableCell>
                            <TableCell>{durum.sira_no}</TableCell>
                            <TableCell>
                              <Chip 
                                label={durum.is_emri_sayisi || 0} 
                                size="small" 
                                color={durum.is_emri_sayisi > 0 ? "primary" : "default"}
                              />
                            </TableCell>
                            <TableCell>
                              <Switch 
                                checked={durum.aktif} 
                                size="small"
                                disabled={durum.sistem_durumu} // Sistem durumları deaktif edilemez
                                onChange={(e) => {
                                  const updatedDurum = { ...durum, aktif: e.target.checked };
                                  handleEdit(updatedDurum);
                                  setDialogOpen(false); // Dialog'u açma, sadece güncelle
                                  isEmriDurumAPI.update(durum.durum_id, { aktif: e.target.checked })
                                    .then(() => {
                                      loadDurumlar();
                                      setSnackbar({
                                        open: true,
                                        message: 'Durum aktiflik durumu güncellendi',
                                        severity: 'success'
                                      });
                                    })
                                    .catch((error) => {
                                      console.error('Aktiflik durumu güncellenirken hata:', error);
                                      setSnackbar({
                                        open: true,
                                        message: 'Güncelleme sırasında bir hata oluştu',
                                        severity: 'error'
                                      });
                                    });
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box display="flex" gap={1}>
                                <Tooltip title="Düzenle">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleEdit(durum)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={durum.sistem_durumu ? "Sistem durumu silinemez" : "Sil"}>
                                  <span>
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleDelete(durum)}
                                      disabled={durum.sistem_durumu || durum.is_emri_sayisi > 0}
                                      color="error"
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Droppable>
        </DragDropContext>

        {/* Durum Ekleme/Düzenleme Dialog */}
        <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingDurum ? 'Durum Düzenle' : 'Yeni Durum Ekle'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Durum Kodu"
                  name="durum_kodu"
                  value={formData.durum_kodu}
                  onChange={handleInputChange}
                  required
                  disabled={editingDurum?.sistem_durumu}
                  helperText="Sistem içinde kullanılacak benzersiz kod (örn: beklemede, freze)"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Durum Adı"
                  name="durum_adi"
                  value={formData.durum_adi}
                  onChange={handleInputChange}
                  required
                  helperText="Kullanıcılara gösterilecek durum adı"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Açıklama"
                  name="durum_aciklamasi"
                  value={formData.durum_aciklamasi}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                  helperText="Bu durum hakkında açıklama (opsiyonel)"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Renk</InputLabel>
                  <Select
                    name="renk_kodu"
                    value={formData.renk_kodu}
                    onChange={handleInputChange}
                    label="Renk"
                  >
                    {renkSecenekleri.map((renk) => (
                      <MenuItem key={renk.value} value={renk.value}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box 
                            sx={{ 
                              width: 20, 
                              height: 20, 
                              backgroundColor: renk.value,
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider'
                            }} 
                          />
                          {renk.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Sıra Numarası"
                  name="sira_no"
                  type="number"
                  value={formData.sira_no}
                  onChange={handleInputChange}
                  helperText="Durumların görüntülenme sırası"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.aktif}
                      onChange={handleInputChange}
                      name="aktif"
                      disabled={editingDurum?.sistem_durumu}
                    />
                  }
                  label="Durum Aktif"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>İptal</Button>
            <Button onClick={handleSave} variant="contained">
              {editingDurum ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Silme Onay Dialog */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
          <DialogTitle>Durumu Sil</DialogTitle>
          <DialogContent>
            <Typography>
              "{deletingDurum?.durum_adi}" durumunu silmek istediğinizden emin misiniz?
              {deletingDurum?.is_emri_sayisi > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Bu durumda {deletingDurum.is_emri_sayisi} adet iş emri bulunmaktadır. 
                  Durumu silebilmek için önce iş emirlerini başka bir duruma taşımanız gerekir.
                </Alert>
              )}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>İptal</Button>
            <Button 
              onClick={confirmDelete} 
              variant="contained" 
              color="error"
              disabled={deletingDurum?.is_emri_sayisi > 0}
            >
              Sil
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Paper>
    </Box>
  );
};

export default IsEmriDurumYonetimi;