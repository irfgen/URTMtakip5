import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Tooltip,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import MobilParcaSecici from '../mobile/MobilParcaSecici';
import parcaTakipListeleriService from '../../services/parcaTakipListeleriService';

const defaultList = { ad: '', kalemler: [] };

const ParcaTakipListesiModal = ({ open, onClose, onSaved, initialList = null }) => {
  const [form, setForm] = useState(defaultList);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [seciciOpen, setSeciciOpen] = useState(false);

  useEffect(() => {
    if (initialList) {
      const safeKalemler = Array.isArray(initialList.kalemler) ? initialList.kalemler : [];
      setForm({ ad: initialList.ad || '', kalemler: safeKalemler });
    } else {
      setForm(defaultList);
    }
    setError('');
  }, [initialList, open]);

  const handleAddParca = (parca) => {
    if (!parca || !parca.parcaKodu) return;
    setForm((prev) => {
      const exists = prev.kalemler?.some(k => String(k.parca_kodu) === String(parca.parcaKodu));
      if (exists) return prev;
      const nextKalemler = [...(prev.kalemler || []), {
        parca_kodu: String(parca.parcaKodu),
        adet: 1,
        not: ''
      }];
      return { ...prev, kalemler: nextKalemler };
    });
    setSeciciOpen(false);
  };

  const handleKalemChange = (index, field, value) => {
    setForm((prev) => {
      const next = [...prev.kalemler];
      next[index] = { ...next[index], [field]: field === 'adet' ? parseInt(value || 0) : value };
      return { ...prev, kalemler: next };
    });
  };

  const handleKalemSil = (index) => {
    setForm((prev) => {
      const next = [...prev.kalemler];
      next.splice(index, 1);
      return { ...prev, kalemler: next };
    });
  };

  const handleSave = async () => {
    try {
      setError('');
      if (!form.ad?.trim()) {
        setError('Liste adı zorunludur.');
        return;
      }
      setSaving(true);
      const payload = {
        ad: form.ad.trim(),
        kalemler: (form.kalemler || []).map(k => ({
          parca_kodu: String(k.parca_kodu),
          adet: parseInt(k.adet || 1),
          not: k.not || ''
        }))
      };
      let result;
      if (initialList?.id) {
        result = await parcaTakipListeleriService.update(initialList.id, payload);
      } else {
        result = await parcaTakipListeleriService.create(payload);
      }
      onSaved && onSaved(result);
      onClose && onClose();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Kaydetme sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {initialList?.id ? 'Parça Takip Listesini Düzenle' : 'Yeni Parça Takip Listesi'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}
        <Stack spacing={2}>
          <TextField
            label="Parça takip listesi adı"
            value={form.ad}
            onChange={(e) => setForm({ ...form, ad: e.target.value })}
            fullWidth
            required
          />

          <Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setSeciciOpen(true)}
              sx={{ mb: 2 }}
            >
              Parça ekle
            </Button>

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Parça Kodu</TableCell>
                    <TableCell width={100}>Adet</TableCell>
                    <TableCell>Not</TableCell>
                    <TableCell align="right">İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(form.kalemler || []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography variant="body2" color="text.secondary">Listeye henüz parça eklenmedi.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {(form.kalemler || []).map((k, idx) => (
                    <TableRow key={`${k.parca_kodu}-${idx}`}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {k.parca_kodu}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={k.adet}
                          onChange={(e) => handleKalemChange(idx, 'adet', e.target.value)}
                          inputProps={{ min: 0 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={k.not}
                          onChange={(e) => handleKalemChange(idx, 'not', e.target.value)}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Sil">
                          <IconButton color="error" size="small" onClick={() => handleKalemSil(idx)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Kapat</Button>
        <Button variant="contained" disabled={saving || !form.ad?.trim()} onClick={handleSave}>
          {initialList?.id ? 'Kaydet' : 'Oluştur ve Kaydet'}
        </Button>
      </DialogActions>

      {/* Parça seçici */}
      <MobilParcaSecici
        open={seciciOpen}
        onClose={() => setSeciciOpen(false)}
        onSelect={handleAddParca}
      />
    </Dialog>
  );
};

export default ParcaTakipListesiModal;



