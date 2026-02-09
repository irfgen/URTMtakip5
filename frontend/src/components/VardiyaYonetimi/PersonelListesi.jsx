import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Badge as BadgeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Work as WorkIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

// Türkçe locale ayarla
dayjs.locale('tr');

function PersonelListesi({ onMessage, setLoading }) {
  const [personeller, setPersoneller] = useState([]);
  const [vardiyalar, setVardiyalar] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPersonel, setEditingPersonel] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePersonel, setDeletePersonel] = useState(null);
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

  const POZISYONLAR = [
    'CNC Operatörü',
    'Torna Operatörü',
    'Freze Operatörü',
    'Kaynak Operatörü',
    'Kalite Kontrol',
    'Usta',
    'Vardiya Amiri',
    'Teknisyen',
    'Diğer'
  ];

  useEffect(() => {
    fetchPersoneller();
    fetchVardiyalar();
  }, []);

  const fetchPersoneller = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/personel');
      if (!response.ok) throw new Error('Personeller getirilemedi');
      const data = await response.json();
      setPersoneller(data);
    } catch (error) {
      console.error('Personeller getirilirken hata:', error);
      onMessage('Personeller getirilemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchVardiyalar = async () => {
    try {
      const response = await fetch('/api/vardiyalar?aktif=true');
      if (!response.ok) throw new Error('Vardiyalar getirilemedi');
      const data = await response.json();
      setVardiyalar(data);
    } catch (error) {
      console.error('Vardiyalar getirilirken hata:', error);
    }
  };

  const handleFormOpen = (personel = null) => {
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
        ise_baslama_tarihi: personel.ise_baslama_tarihi ? dayjs(personel.ise_baslama_tarihi) : null,
        notlar: personel.notlar || ''
      });
    } else {
      setEditingPersonel(null);
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
    }
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingPersonel(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.personel_adi) {
      onMessage('Personel adı gereklidir', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        personel_adi: formData.personel_adi,
        sicil_no: formData.sicil_no || null,
        pozisyon: formData.pozisyon || null,
        telefon: formData.telefon || null,
        email: formData.email || null,
        vardiya_id: formData.vardiya_id || null,
        aktif: formData.aktif,
        maas: formData.maas ? parseFloat(formData.maas) : null,
        ise_baslama_tarihi: formData.ise_baslama_tarihi ? formData.ise_baslama_tarihi.format('YYYY-MM-DD') : null,
        notlar: formData.notlar || null
      };

      const url = editingPersonel 
        ? `/api/personel/${editingPersonel.id}` 
        : '/api/personel';
      
      const method = editingPersonel ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Personel kaydedilemedi');
      }

      onMessage(
        editingPersonel ? 'Personel güncellendi' : 'Personel eklendi',
        'success'
      );
      
      handleFormClose();
      fetchPersoneller();
    } catch (error) {
      console.error('Personel kaydedilirken hata:', error);
      onMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePersonel) return;

    try {
      setLoading(true);
      
      const response = await fetch(`/api/personel/${deletePersonel.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Personel silinemedi');
      }

      onMessage('Personel pasif hale getirildi', 'success');
      setDeleteConfirmOpen(false);
      setDeletePersonel(null);
      fetchPersoneller();
    } catch (error) {
      console.error('Personel silinirken hata:', error);
      onMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return dayjs(dateString).format('DD.MM.YYYY');
  };

  const formatSalary = (salary) => {
    if (!salary) return '-';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(salary);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="tr">
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Personel Yönetimi</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleFormOpen()}
          >
            Yeni Personel
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Personel</TableCell>
                <TableCell>Sicil No</TableCell>
                <TableCell>Pozisyon</TableCell>
                <TableCell>Vardiya</TableCell>
                <TableCell>İletişim</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {personeller.map((personel) => (
                <TableRow key={personel.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {personel.personel_adi}
                      </Typography>
                      {personel.ise_baslama_tarihi && (
                        <Typography variant="caption" color="text.secondary">
                          İşe Başlama: {formatDate(personel.ise_baslama_tarihi)}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BadgeIcon fontSize="small" />
                      {personel.sicil_no || '-'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WorkIcon fontSize="small" />
                      {personel.pozisyon || '-'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {personel.vardiya ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            backgroundColor: personel.vardiya.renk,
                            borderRadius: '50%'
                          }}
                        />
                        <Typography variant="body2">
                          {personel.vardiya.vardiya_adi}
                        </Typography>
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {personel.telefon && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon fontSize="small" />
                          <Typography variant="caption">
                            {personel.telefon}
                          </Typography>
                        </Box>
                      )}
                      {personel.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmailIcon fontSize="small" />
                          <Typography variant="caption">
                            {personel.email}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={personel.aktif ? 'Aktif' : 'Pasif'}
                      color={personel.aktif ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Düzenle">
                        <IconButton
                          size="small"
                          onClick={() => handleFormOpen(personel)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Pasif Yap">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setDeletePersonel(personel);
                            setDeleteConfirmOpen(true);
                          }}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Personel Formu */}
        <Dialog open={formOpen} onClose={handleFormClose} maxWidth="md" fullWidth>
          <form onSubmit={handleFormSubmit}>
            <DialogTitle>
              {editingPersonel ? 'Personel Düzenle' : 'Yeni Personel Ekle'}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Personel Adı"
                      value={formData.personel_adi}
                      onChange={(e) => setFormData({...formData, personel_adi: e.target.value})}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Sicil No"
                      value={formData.sicil_no}
                      onChange={(e) => setFormData({...formData, sicil_no: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Pozisyon</InputLabel>
                      <Select
                        value={formData.pozisyon}
                        onChange={(e) => setFormData({...formData, pozisyon: e.target.value})}
                      >
                        {POZISYONLAR.map((pozisyon) => (
                          <MenuItem key={pozisyon} value={pozisyon}>
                            {pozisyon}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Vardiya</InputLabel>
                      <Select
                        value={formData.vardiya_id}
                        onChange={(e) => setFormData({...formData, vardiya_id: e.target.value})}
                      >
                        <MenuItem value="">Seçilmedi</MenuItem>
                        {vardiyalar.map((vardiya) => (
                          <MenuItem key={vardiya.id} value={vardiya.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  backgroundColor: vardiya.renk,
                                  borderRadius: '50%'
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
                      label="Telefon"
                      value={formData.telefon}
                      onChange={(e) => setFormData({...formData, telefon: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="E-posta"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Maaş"
                      type="number"
                      value={formData.maas}
                      onChange={(e) => setFormData({...formData, maas: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <DatePicker
                      label="İşe Başlama Tarihi"
                      value={formData.ise_baslama_tarihi}
                      onChange={(newValue) => setFormData({...formData, ise_baslama_tarihi: newValue})}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Notlar"
                      multiline
                      rows={3}
                      value={formData.notlar}
                      onChange={(e) => setFormData({...formData, notlar: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.aktif}
                          onChange={(e) => setFormData({...formData, aktif: e.target.checked})}
                        />
                      }
                      label="Aktif"
                    />
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleFormClose}>İptal</Button>
              <Button type="submit" variant="contained">
                {editingPersonel ? 'Güncelle' : 'Ekle'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Silme Onayı */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
          <DialogTitle>Personel Pasif Yap</DialogTitle>
          <DialogContent>
            <Alert severity="warning">
              <strong>{deletePersonel?.personel_adi}</strong> personelini pasif yapmak istediğinizden emin misiniz?
              Bu işlem personeli listede pasif olarak gösterecektir.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>İptal</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Pasif Yap
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}

export default PersonelListesi;
