import React, { useEffect, useMemo, useState } from 'react';
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
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import StokKartiSecici from '../StokKartiSecici';
import stokTakipListeleriService from '../../services/stokTakipListeleriService';
import stokKartlariService from '../../services/stokKartlariService';

const defaultList = { ad: '', kalemler: [] };

const StokTakipListesiModal = ({ open, onClose, onSaved, initialList = null }) => {
  const [form, setForm] = useState(defaultList);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [seciciOpen, setSeciciOpen] = useState(false);

  useEffect(() => {
    if (initialList) {
      // Normalize kalemler
      const safeKalemler = Array.isArray(initialList.kalemler) ? initialList.kalemler : [];
      setForm({ ad: initialList.ad || '', kalemler: safeKalemler });
      // _display alanı yoksa stok kartı detayından doldur
      (async () => {
        try {
          const needsEnrich = safeKalemler.filter(k => !k._display && k.stok_karti_id);
          if (!needsEnrich.length) return;
          const enriched = await Promise.all(safeKalemler.map(async (k) => {
            if (k._display || !k.stok_karti_id) return k;
            try {
              const resp = await stokKartlariService.getStokKarti(k.stok_karti_id);
              const card = resp?.data || resp; // service dönen JSON: { success, data }
              if (card) {
                return {
                  ...k,
                  _display: {
                    malzeme_cinsi: card.malzeme_cinsi,
                    malzeme_adi: card.malzeme_adi,
                    kesit: card.kesit,
                    boy: card.boy
                  }
                };
              }
            } catch (e) {
              // yoksay
            }
            return k;
          }));
          setForm(prev => ({ ...prev, kalemler: enriched }));
        } catch (e) {
          // yoksay
        }
      })();
    } else {
      setForm(defaultList);
    }
    setError('');
  }, [initialList, open]);

  const handleAddStokKarti = (stokKarti) => {
    if (!stokKarti || !stokKarti.id) return;
    setForm((prev) => {
      const exists = prev.kalemler?.some(k => parseInt(k.stok_karti_id) === parseInt(stokKarti.id));
      if (exists) return prev;
      const nextKalemler = [...(prev.kalemler || []), {
        stok_karti_id: stokKarti.id,
        adet: 1,
        not: '',
        _display: {
          malzeme_cinsi: stokKarti.malzeme_cinsi,
          malzeme_adi: stokKarti.malzeme_adi,
          kesit: stokKarti.kesit,
          boy: stokKarti.boy
        }
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
          stok_karti_id: k.stok_karti_id,
          adet: parseInt(k.adet || 1),
          not: k.not || ''
        }))
      };
      let result;
      if (initialList?.id) {
        result = await stokTakipListeleriService.update(initialList.id, payload);
      } else {
        result = await stokTakipListeleriService.create(payload);
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
            {initialList?.id ? 'Stok Takip Listesini Düzenle' : 'Yeni Stok Takip Listesi'}
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
            label="Stok takip listesi adı"
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
              Stok kartı ekle
            </Button>

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Malzeme</TableCell>
                    <TableCell>Boyut</TableCell>
                    <TableCell width={100}>Adet</TableCell>
                    <TableCell>Not</TableCell>
                    <TableCell align="right">İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(form.kalemler || []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography variant="body2" color="text.secondary">Listeye henüz stok kartı eklenmedi.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {(form.kalemler || []).map((k, idx) => (
                    <TableRow key={`${k.stok_karti_id}-${idx}`}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {k._display?.malzeme_adi || '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {k._display?.malzeme_cinsi || ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {k._display?.kesit}{k._display?.boy ? ` x ${k._display?.boy}mm` : ''}
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

      {/* Stok kartı seçici */}
      <StokKartiSecici
        open={seciciOpen}
        onClose={() => setSeciciOpen(false)}
        onSelect={handleAddStokKarti}
      />
    </Dialog>
  );
};

export default StokTakipListesiModal;


