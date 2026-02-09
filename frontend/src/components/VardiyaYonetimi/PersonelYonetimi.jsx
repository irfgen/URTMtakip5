import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  FormControlLabel,
  Switch,
  Alert,
  Snackbar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Work as WorkIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { tr } from 'date-fns/locale';
import axios from 'axios';
import getApiBaseUrl from '../../utils/getApiBaseUrl';

const API_BASE_URL = getApiBaseUrl();

function PersonelYonetimi() {
  const [personeller, setPersoneller] = useState([]);
  const [vardiyalar, setVardiyalar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPersonel, setEditingPersonel] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  
  const [formData, setFormData] = useState({
    personel_adi: '',
    sicil_no: '',
    pozisyon: '',
    telefon: '',
    email: '',
    vardiya_id: '',
    aktif: true,
    maas: '',
    ise_baslama_tarihi: null,
    notlar: ''
  });

  // Personelleri getir
  const fetchPersoneller = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/personel`);
      setPersoneller(response.data);
    } catch (error) {
      console.error('Personeller getirilirken hata:', error);
      setSnackbar({
        open: true,
        message: 'Personeller getirilemedi',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Vardiyaları getir
  const fetchVardiyalar = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vardiyalar?aktif=true`);
      setVardiyalar(response.data);
    } catch (error) {
      console.error('Vardiyalar getirilirken hata:', error);
    }
  };

  useEffect(() => {
    fetchPersoneller();
    fetchVardiyalar();
  }, []);

  // Form verilerini sıfırla
  const resetForm = () => {
    setFormData({
      personel_adi: '',
      sicil_no: '',
      pozisyon: '',
      telefon: '',
      email: '',
      vardiya_id: '',
      aktif: true,
      maas: '',
      ise_baslama_tarihi: null,
      notlar: ''
    });
    setEditingPersonel(null);
  };

  // Dialog aç
  const handleDialogOpen = (personel = null) => {
    if (personel) {
      setEditingPersonel(personel);
      setFormData({
        personel_adi: personel.personel_adi,
        sicil_no: personel.sicil_no || '',
        pozisyon: personel.pozisyon || '',
        telefon: personel.telefon || '',
        email: personel.email || '',
        vardiya_id: personel.vardiya_id || '',
        aktif: personel.aktif,
        maas: personel.maas || '',
        ise_baslama_tarihi: personel.ise_baslama_tarihi ? new Date(personel.ise_baslama_tarihi) : null,
        notlar: personel.notlar || ''
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  // Dialog kapat
  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  // Personel kaydet
  const handleSave = async () => {
    try {
      if (!formData.personel_adi) {
        setSnackbar({
          open: true,
          message: 'Personel adı gereklidir',
          severity: 'warning'
        });
        return;
      }

      const requestData = {
        personel_adi: formData.personel_adi,
        sicil_no: formData.sicil_no || null,
        pozisyon: formData.pozisyon || null,
        telefon: formData.telefon || null,
        email: formData.email || null,
        vardiya_id: formData.vardiya_id || null,
        aktif: formData.aktif,
        maas: formData.maas ? parseFloat(formData.maas) : null,
        ise_baslama_tarihi: formData.ise_baslama_tarihi ? formData.ise_baslama_tarihi.toISOString() : null,
        notlar: formData.notlar || null
      };

      if (editingPersonel) {
        await axios.put(`${API_BASE_URL}/personel/${editingPersonel.id}`, requestData);
        setSnackbar({
          open: true,
          message: 'Personel başarıyla güncellendi',
          severity: 'success'
        });
      } else {
        await axios.post(`${API_BASE_URL}/personel`, requestData);
        setSnackbar({
          open: true,
          message: 'Personel başarıyla eklendi',
          severity: 'success'
        });
      }

      handleDialogClose();
      fetchPersoneller();
    } catch (error) {
      console.error('Personel kaydedilirken hata:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Personel kaydedilemedi',
        severity: 'error'
      });
    }
  };

  // Personel sil (pasif yap)
  const handleDelete = async (id) => {
    if (window.confirm('Bu personeli pasif hale getirmek istediğinizden emin misiniz?')) {
      try {
        await axios.delete(`${API_BASE_URL}/personel/${id}`);
        setSnackbar({
          open: true,
          message: 'Personel başarıyla pasif hale getirildi',
          severity: 'success'
        });
        fetchPersoneller();
      } catch (error) {
        console.error('Personel silinirken hata:', error);
        setSnackbar({
          open: true,
          message: error.response?.data?.error || 'Personel silinemedi',
          severity: 'error'
        });
      }
    }
  };

  // Tarih formatla
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  // Personel arama
  const filteredPersoneller = personeller.filter(personel =>
    personel.personel_adi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (personel.sicil_no && personel.sicil_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (personel.pozisyon && personel.pozisyon.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sayfalama için personeller
  const paginatedPersoneller = filteredPersoneller.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const renderCardView = () => (
    <Grid container spacing={3}>
      {paginatedPersoneller.map((personel) => (
        <Grid item xs={12} md={6} lg={4} key={personel.id}>
          <Card 
            sx={{ 
              height: '100%',
              opacity: personel.aktif ? 1 : 0.7,
              borderLeft: personel.vardiya?.renk ? `4px solid ${personel.vardiya.renk}` : 'none'
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ mr: 2, bgcolor: personel.aktif ? 'primary.main' : 'grey.500' }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" component="h2">
                    {personel.personel_adi}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {personel.pozisyon || 'Pozisyon belirtilmemiş'}
                  </Typography>
                </Box>
              </Box>

              <Box mb={2}>
                {personel.sicil_no && (
                  <Box display="flex" alignItems="center" mb={1}>
                    <BadgeIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      Sicil No: {personel.sicil_no}
                    </Typography>
                  </Box>
                )}
                
                {personel.telefon && (
                  <Box display="flex" alignItems="center" mb={1}>
                    <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {personel.telefon}
                    </Typography>
                  </Box>
                )}
                
                {personel.email && (
                  <Box display="flex" alignItems="center" mb={1}>
                    <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {personel.email}
                    </Typography>
                  </Box>
                )}

                {personel.vardiya && (
                  <Box display="flex" alignItems="center" mb={1}>
                    <ScheduleIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {personel.vardiya.vardiya_adi}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Box display="flex" gap={1} mb={2}>
                <Chip 
                  label={personel.aktif ? 'Aktif' : 'Pasif'}
                  color={personel.aktif ? 'success' : 'default'}
                  size="small"
                />
                {personel.vardiya && (
                  <Chip 
                    label={personel.vardiya.vardiya_adi}
                    size="small"
                    sx={{ 
                      backgroundColor: personel.vardiya.renk,
                      color: 'white'
                    }}
                  />
                )}
              </Box>

              {personel.ise_baslama_tarihi && (
                <Typography variant="body2" color="text.secondary">
                  İşe Başlama: {formatDate(personel.ise_baslama_tarihi)}
                </Typography>
              )}
            </CardContent>

            <CardActions>
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={() => handleDialogOpen(personel)}
              >
                Düzenle
              </Button>
              <Button
                size="small"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => handleDelete(personel.id)}
              >
                Pasif Yap
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderTableView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Personel Adı</TableCell>
            <TableCell>Sicil No</TableCell>
            <TableCell>Pozisyon</TableCell>
            <TableCell>Telefon</TableCell>
            <TableCell>Vardiya</TableCell>
            <TableCell>Durum</TableCell>
            <TableCell>İşlemler</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedPersoneller.map((personel) => (
            <TableRow key={personel.id} sx={{ opacity: personel.aktif ? 1 : 0.7 }}>
              <TableCell>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ mr: 2, bgcolor: personel.aktif ? 'primary.main' : 'grey.500' }}>
                    <PersonIcon />
                  </Avatar>
                  {personel.personel_adi}
                </Box>
              </TableCell>
              <TableCell>{personel.sicil_no || '-'}</TableCell>
              <TableCell>{personel.pozisyon || '-'}</TableCell>
              <TableCell>{personel.telefon || '-'}</TableCell>
              <TableCell>
                {personel.vardiya ? (
                  <Chip 
                    label={personel.vardiya.vardiya_adi}
                    size="small"
                    sx={{ 
                      backgroundColor: personel.vardiya.renk,
                      color: 'white'
                    }}
                  />
                ) : '-'}
              </TableCell>
              <TableCell>
                <Chip 
                  label={personel.aktif ? 'Aktif' : 'Pasif'}
                  color={personel.aktif ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <IconButton
                  size="small"
                  onClick={() => handleDialogOpen(personel)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(personel.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Personel Yönetimi
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleDialogOpen()}
            size="large"
          >
            Yeni Personel
          </Button>
        </Box>

        {/* Arama ve Filtreler */}
        <Box mb={3}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Personel ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" gap={2}>
                <Button
                  variant={viewMode === 'table' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('table')}
                >
                  Tablo
                </Button>
                <Button
                  variant={viewMode === 'card' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('card')}
                >
                  Kartlar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* İçerik */}
        {viewMode === 'table' ? renderTableView() : renderCardView()}

        {/* Sayfalama */}
        <TablePagination
          component="div"
          count={filteredPersoneller.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Sayfa başına:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
        />

        {personeller.length === 0 && !loading && (
          <Box textAlign="center" mt={4}>
            <Typography variant="h6" color="text.secondary">
              Henüz personel kaydı bulunmuyor
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Yeni bir personel eklemek için yukarıdaki "Yeni Personel" butonunu kullanın
            </Typography>
          </Box>
        )}

        {/* Personel Formu Dialog */}
        <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingPersonel ? 'Personel Düzenle' : 'Yeni Personel'}
          </DialogTitle>
          <DialogContent>
            <Box mt={1}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Personel Adı"
                    value={formData.personel_adi}
                    onChange={(e) => setFormData({ ...formData, personel_adi: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Sicil No"
                    value={formData.sicil_no}
                    onChange={(e) => setFormData({ ...formData, sicil_no: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Pozisyon"
                    value={formData.pozisyon}
                    onChange={(e) => setFormData({ ...formData, pozisyon: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Telefon"
                    value={formData.telefon}
                    onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="E-posta"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Vardiya</InputLabel>
                    <Select
                      value={formData.vardiya_id}
                      onChange={(e) => setFormData({ ...formData, vardiya_id: e.target.value })}
                      label="Vardiya"
                    >
                      <MenuItem value="">Seçiniz</MenuItem>
                      {vardiyalar.map((vardiya) => (
                        <MenuItem key={vardiya.id} value={vardiya.id}>
                          <Box display="flex" alignItems="center">
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                backgroundColor: vardiya.renk,
                                borderRadius: '50%',
                                mr: 1
                              }}
                            />
                            {vardiya.vardiya_adi}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Maaş"
                    type="number"
                    value={formData.maas}
                    onChange={(e) => setFormData({ ...formData, maas: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="İşe Başlama Tarihi"
                    value={formData.ise_baslama_tarihi}
                    onChange={(newValue) => setFormData({ ...formData, ise_baslama_tarihi: newValue })}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.aktif}
                        onChange={(e) => setFormData({ ...formData, aktif: e.target.checked })}
                      />
                    }
                    label="Aktif"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notlar"
                    multiline
                    rows={3}
                    value={formData.notlar}
                    onChange={(e) => setFormData({ ...formData, notlar: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>İptal</Button>
            <Button onClick={handleSave} variant="contained">
              {editingPersonel ? 'Güncelle' : 'Kaydet'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
}

export default PersonelYonetimi;
