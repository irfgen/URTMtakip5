import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Chip,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import ParcaSecici from '../components/ParcaSecici';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import axios from 'axios';
import Tooltip from '@mui/material/Tooltip';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageWithFallback from '../components/ImageWithFallback';
import TeklifImportModal from '../components/TeklifImportModal';

function Teklifler() {
  const theme = useTheme();
  const [teklifler, setTeklifler] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [parcalar, setParcalar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [filteredTeklifler, setFilteredTeklifler] = useState([]);
  const [formData, setFormData] = useState({
    parca_kodu: '',
    tedarikci: '',
    teklif_fiyati: '',
    teslim_suresi: '',
    aciklama: ''
  });
  // Seçili parça objesini ayrıca tut
  const [selectedParcaObj, setSelectedParcaObj] = useState(null);
  
  // Teklif import modal durumu
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  // Fetch teklifler ve parça listesini getir
  useEffect(() => {
    fetchTeklifler();
    fetchParcalar();
  }, []);

  // Search functionality
  useEffect(() => {
    if (teklifler.length > 0 && searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = teklifler.filter((teklif) => {
        return (
          (teklif.parca_kodu && teklif.parca_kodu.toLowerCase().includes(lowercasedSearch)) ||
          (teklif.tedarikci && teklif.tedarikci.toLowerCase().includes(lowercasedSearch)) ||
          (teklif.parca && teklif.parca.parcaAdi && teklif.parca.parcaAdi.toLowerCase().includes(lowercasedSearch))
        );
      });
      setFilteredTeklifler(filtered);
    } else {
      setFilteredTeklifler(teklifler);
    }
  }, [searchTerm, teklifler]);

  // Teklifleri getir
  const fetchTeklifler = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/fason/teklifler');
      setTeklifler(response.data);
      setFilteredTeklifler(response.data);
      setError(null);
    } catch (err) {
      console.error('Teklifler getirilirken hata oluştu:', err);
      setError('Teklifler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  };

  // Parça listesini getir
  const fetchParcalar = async () => {
    try {
      const response = await axios.get('/api/parcalar');
      // API returns paginated data in the format {parcalar: Array, toplam, sayfa, sayfaBasi, sayfaSayisi}
      if (response.data && response.data.parcalar && Array.isArray(response.data.parcalar)) {
        setParcalar(response.data.parcalar);
      } else if (Array.isArray(response.data)) {
        // Handle case where API might return direct array
        setParcalar(response.data);
      } else {
        console.error('API response does not contain parcalar array:', response.data);
        setParcalar([]);
      }
    } catch (err) {
      console.error('Parçalar getirilirken hata oluştu:', err);
      setError('Parça listesi yüklenirken bir hata oluştu.');
      setParcalar([]);
    }
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setFormData({
      parca_kodu: '',
      tedarikci: '',
      teklif_fiyati: '',
      teslim_suresi: '',
      aciklama: ''
    });
    setSelectedParcaObj(null);
    setDialogOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      parca_kodu: item.parca_kodu,
      tedarikci: item.tedarikci,
      teklif_fiyati: item.teklif_fiyati,
      teslim_suresi: item.teslim_suresi,
      aciklama: item.aciklama || ''
    });
    // Düzenleme modunda da seçili parça objesini bul
    if (Array.isArray(parcalar)) {
      const found = parcalar.find(p => p.parcaKodu === item.parca_kodu || p.parca_kodu === item.parca_kodu);
      setSelectedParcaObj(found || null);
    } else {
      setSelectedParcaObj(null);
    }
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu teklifi silmek istediğinizden emin misiniz?')) {
      try {
        setLoading(true);
        await axios.delete(`/api/fason/teklifler/${id}`);
        fetchTeklifler(); // Tabloyu yenile
        setError(null);
      } catch (err) {
        console.error('Teklif silinirken hata:', err);
        setError('Teklif silinirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      const teklifData = {
        parca_kodu: formData.parca_kodu,
        tedarikci: formData.tedarikci,
        teklif_fiyati: Number(formData.teklif_fiyati),
        teslim_suresi: Number(formData.teslim_suresi),
        aciklama: formData.aciklama || ''
      };
      
      if (selectedItem) {
        // Güncelleme işlemi
        await axios.put(`/api/fason/teklifler/${selectedItem.teklif_id}`, teklifData);
      } else {
        // Yeni kayıt ekleme
        await axios.post('/api/fason/teklifler', teklifData);
      }
      
      fetchTeklifler(); // Tabloyu yenile
      setDialogOpen(false);
      setError(null);
      
    } catch (err) {
      console.error('Teklif kaydedilirken hata:', err);
      setError('Teklif kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Teklifler</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={() => setImportModalOpen(true)}
          >
            Teklif Import
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Yeni Teklif
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Parça kodu, tedarikçi veya parça adına göre ara"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </Paper>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Parça</TableCell>
              <TableCell>Parça Kodu</TableCell>
              <TableCell>Parça Adı</TableCell>
              <TableCell>Tedarikçi</TableCell>
              <TableCell>Teklif Fiyatı</TableCell>
              <TableCell>Teslim Süresi</TableCell>
              <TableCell>Teklif Tarihi</TableCell>
              <TableCell>Açıklama</TableCell>
              <TableCell align="right">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : filteredTeklifler.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">Teklif kaydı bulunamadı</TableCell>
              </TableRow>
            ) : (
              filteredTeklifler.map((teklif) => (
                <TableRow key={teklif.teklif_id}>
                  {/* Parça küçük resmi ve teknik resim ikonu */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {/* Küçük parça fotoğrafı */}
                      {teklif.parca?.foto_path ? (
                        <Tooltip
                          title={
                            <Box sx={{ p: 0 }}>
                              <ImageWithFallback
                                src={getFotoPath(teklif.parca.foto_path)}
                                alt="Parça Fotoğrafı"
                                imgStyle={{ maxWidth: '300px', maxHeight: '300px', objectFit: 'contain' }}
                                fallbackText="Görsel yok"
                              />
                            </Box>
                          }
                          arrow
                          placement="right"
                          enterDelay={500}
                          componentsProps={{
                            tooltip: {
                              sx: {
                                bgcolor: 'white',
                                '& .MuiTooltip-arrow': { color: 'white' },
                                maxWidth: 'none !important',
                                boxShadow: 3,
                                p: 1
                              }
                            }
                          }}
                        >
                          <ImageWithFallback
                            src={getFotoPath(teklif.parca.foto_path) || '/no-image.png'}
                            alt="Parça Fotoğrafı"
                            imgStyle={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee', cursor: 'pointer' }}
                            fallbackText="Yok"
                          />
                        </Tooltip>
                      ) : (
                        <ImageWithFallback
                          src="/no-image.png"
                          alt="Parça Fotoğrafı"
                          imgStyle={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }}
                          fallbackText="Yok"
                        />
                      )}
                      {/* Teknik resim ikonu */}
                      {teklif.parca?.teknik_resim_path && (
                        <Tooltip
                          title={teklif.parca.teknik_resim_path.endsWith('.pdf') ? (
                            'Teknik resmi açmak için tıklayın'
                          ) : (
                            <Box sx={{ p: 0 }}>
                              <ImageWithFallback
                                src={getTeknikResimPath(teklif.parca.teknik_resim_path)}
                                alt="Teknik Resim"
                                imgStyle={{ maxWidth: '300px', maxHeight: '300px', objectFit: 'contain' }}
                                fallbackText="Teknik resim yok"
                              />
                            </Box>
                          )}
                          arrow
                          placement="right"
                          enterDelay={500}
                          componentsProps={{
                            tooltip: {
                              sx: {
                                bgcolor: 'white',
                                '& .MuiTooltip-arrow': { color: 'white' },
                                maxWidth: 'none !important',
                                boxShadow: 3,
                                p: 1
                              }
                            }
                          }}
                        >
                          <IconButton size="small" onClick={() => window.open(getTeknikResimPath(teklif.parca.teknik_resim_path), '_blank')}>
                            {teklif.parca.teknik_resim_path.endsWith('.pdf') ? (
                              <PictureAsPdfIcon fontSize="small" color="error" />
                            ) : (
                              <DescriptionIcon fontSize="small" color="info" />
                            )}
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{teklif.parca_kodu}</TableCell>
                  <TableCell>{teklif.parca?.parcaAdi || '-'}</TableCell>
                  <TableCell>{teklif.tedarikci}</TableCell>
                  <TableCell>{teklif.teklif_fiyati} ₺</TableCell>
                  <TableCell>{teklif.teslim_suresi} gün</TableCell>
                  <TableCell>{formatDate(teklif.teklif_tarihi)}</TableCell>
                  <TableCell>{teklif.aciklama || '-'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEdit(teklif)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(teklif.teklif_id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {selectedItem ? 'Teklif Düzenle' : 'Yeni Teklif'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 0 }}>
              <Grid item xs={12}>
                <ParcaSecici
                  selectedParca={selectedParcaObj}
                  onSec={(parca) => {
                    setFormData({
                      ...formData,
                      parca_kodu: parca ? (parca.parcaKodu || parca.parca_kodu) : '',
                    });
                    setSelectedParcaObj(parca || null);
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tedarikçi"
                  value={formData.tedarikci}
                  onChange={(e) => setFormData({ ...formData, tedarikci: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Teklif Fiyatı (₺)"
                  type="number"
                  value={formData.teklif_fiyati}
                  onChange={(e) => setFormData({ ...formData, teklif_fiyati: e.target.value })}
                  required
                  inputProps={{ min: 0, step: "0.01" }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Teslim Süresi (gün)"
                  type="number"
                  value={formData.teslim_suresi}
                  onChange={(e) => setFormData({ ...formData, teslim_suresi: e.target.value })}
                  required
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Açıklama"
                  multiline
                  rows={3}
                  value={formData.aciklama || ''}
                  onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={!formData.parca_kodu || !formData.tedarikci || !formData.teklif_fiyati || !formData.teslim_suresi}
            >
              {selectedItem ? 'Güncelle' : 'Kaydet'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Teklif Import Modal */}
      <TeklifImportModal
        key={importModalOpen ? 'import-modal-open' : 'import-modal-closed'}
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportComplete={() => {
          setImportModalOpen(false);
          fetchTeklifler(); // Tabloyu yenile
        }}
      />
    </Box>
  );
}

export default Teklifler;

// Yardımcı fonksiyonlar (dosyanın sonuna eklenmeli)
function getFotoPath(foto_path) {
  if (!foto_path) return '';
  if (foto_path.startsWith('/uploads/')) return foto_path;
  if (foto_path.startsWith('/fotograflar/')) return '/uploads' + foto_path;
  if (foto_path.includes('/')) return '/uploads/fotograflar/' + foto_path.split('/').pop();
  return '/uploads/fotograflar/' + foto_path;
}
function getTeknikResimPath(teknik_resim_path) {
  if (!teknik_resim_path) return '';
  if (teknik_resim_path.startsWith('/uploads/')) return teknik_resim_path;
  if (teknik_resim_path.startsWith('/teknik_resimler/')) return '/uploads' + teknik_resim_path;
  if (teknik_resim_path.includes('/')) return '/uploads/teknik_resimler/' + teknik_resim_path.split('/').pop();
  return '/uploads/teknik_resimler/' + teknik_resim_path;
}
