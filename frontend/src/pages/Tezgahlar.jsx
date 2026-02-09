import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BuildIcon from '@mui/icons-material/Build';
import Draggable from 'react-draggable';
import { tezgahAPI, isEmirleriAPI } from '../services/api';
import { useSelector, useDispatch } from 'react-redux';
import HandymanIcon from '@mui/icons-material/Handyman';
import ErrorIcon from '@mui/icons-material/Error';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import EngineeringIcon from '@mui/icons-material/Engineering';
import TezgahKarti from '../components/TezgahKarti';
import { fetchIsEmirleri } from '../store/slices/isEmirleriSlice';

const TezgahForm = ({ open, onClose, onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState({
    tezgah_tanimi: '',
    tip: 'torna',
    calisma_durumu: 'musait',
    ...initialData
  });

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{initialData ? 'Tezgah Düzenle' : 'Yeni Tezgah Ekle'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Tezgah Tanımı"
            name="tezgah_tanimi"
            value={formData.tezgah_tanimi}
            onChange={handleChange}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Tip</InputLabel>
            <Select
              name="tip"
              value={formData.tip}
              onChange={handleChange}
              label="Tip"
            >
              <MenuItem value="torna">Torna</MenuItem>
              <MenuItem value="freze">Freze</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Çalışma Durumu</InputLabel>
            <Select
              name="calisma_durumu"
              value={formData.calisma_durumu}
              onChange={handleChange}
              label="Çalışma Durumu"
            >
              <MenuItem value="musait">Müsait</MenuItem>
              <MenuItem value="calisiyor">Çalışıyor</MenuItem>
              <MenuItem value="bakim">Bakımda</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button onClick={handleSubmit} variant="contained">
          {initialData ? 'Güncelle' : 'Ekle'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const Tezgahlar = () => {
  const [tezgahlar, setTezgahlar] = useState([]);
  const [bekleyenIsEmirleri, setBekleyenIsEmirleri] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [pozisyonlar, setPozisyonlar] = useState({});
  const [zoom, setZoom] = useState(0.8); // Varsayılan %80 zoom
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    loadTezgahlar();
    
    // Tezgah listesini 10 saniyede bir güncelle
    const interval = setInterval(() => {
      loadTezgahlar();
    }, 10000); // 10 saniye
    
    return () => clearInterval(interval);
  }, []);

  const loadTezgahlar = async () => {
    try {
      // Paralel olarak hem tezgahları hem bekleyen iş emirlerini çek
      const [tezgahResponse, bekleyenIsResponse] = await Promise.all([
        tezgahAPI.getAll(),
        isEmirleriAPI.getBekleyenIsEmirleri()
      ]);

      // Yeni API formatını işle
      const tezgahData = tezgahResponse.data?.data || tezgahResponse.data || [];
      setTezgahlar(Array.isArray(tezgahData) ? tezgahData : []);
      setBekleyenIsEmirleri(Array.isArray(bekleyenIsResponse.data) ? bekleyenIsResponse.data : []);

      const yeniPozisyonlar = {};
      tezgahData.forEach(tezgah => {
        yeniPozisyonlar[tezgah.tezgah_id] = {
          x: tezgah.pozisyon_x || 0,
          y: tezgah.pozisyon_y || 0
        };
      });
      setPozisyonlar(yeniPozisyonlar);
    } catch (error) {
      console.error('Tezgah listesi yükleme hatası:', error);
      setError('Tezgahlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStop = (tezgahId, x, y) => {
    setPozisyonlar(prev => ({
      ...prev,
      [tezgahId]: { x, y }
    }));
  };

  const handlePozisyonKaydet = async () => {
    try {
      const pozisyonListesi = Object.entries(pozisyonlar).map(([tezgah_id, pos]) => ({
        tezgah_id: parseInt(tezgah_id),
        x: pos.x,
        y: pos.y
      }));

      await tezgahAPI.updatePozisyonlar(pozisyonListesi);
      
      setSnackbar({
        open: true,
        message: 'Tezgah pozisyonları başarıyla kaydedildi',
        severity: 'success'
      });
    } catch (error) {
      console.error('Pozisyon kaydetme hatası:', error);
      setSnackbar({
        open: true,
        message: 'Pozisyonlar kaydedilirken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  const handleTezgahEkle = async (data) => {
    try {
      await tezgahAPI.create(data);
      loadTezgahlar();
      setSnackbar({
        open: true,
        message: 'Tezgah başarıyla eklendi',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Tezgah eklenirken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  const handleTezgahDuzenle = async (data) => {
    try {
      await tezgahAPI.update(editData.tezgah_id, data);
      loadTezgahlar();
      setSnackbar({
        open: true,
        message: 'Tezgah başarıyla güncellendi',
        severity: 'success'
      });
      setEditData(null);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Tezgah güncellenirken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  const handleTezgahSil = async (tezgahId) => {
    if (window.confirm('Bu tezgahı silmek istediğinizden emin misiniz?')) {
      try {
        const response = await tezgahAPI.delete(tezgahId);
        loadTezgahlar();
        setSnackbar({
          open: true,
          message: 'Tezgah başarıyla silindi',
          severity: 'success'
        });
      } catch (error) {
        const errorMessage = error.response?.data?.details || error.response?.data?.error || 'Tezgah silinirken bir hata oluştu';
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error'
        });
      }
    }
  };

  const handleIsEmriAta = (tezgah) => {
    // İş emri atama işlemi için gerekli kodlar
    console.log('İş emri atanacak tezgah:', tezgah);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  // Tezgah güncellendiğinde çağrılacak fonksiyon
  const handleTezgahGuncellendi = async () => {
    await loadTezgahlar();
    await dispatch(fetchIsEmirleri()).unwrap();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100vh',
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      bgcolor: '#f5f5f5'
    }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ 
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'background.paper',
          borderBottom: 1, 
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          zIndex: 2
        }}>
          <Typography variant="h4">Tezgahlar</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={handleZoomOut}>
                <ZoomOutIcon />
              </IconButton>
              <Typography sx={{ mx: 1 }}>
                {Math.round(zoom * 100)}%
              </Typography>
              <IconButton onClick={handleZoomIn}>
                <ZoomInIcon />
              </IconButton>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setFormOpen(true)}
            >
              Yeni Tezgah
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handlePozisyonKaydet}
            >
              Pozisyonları Kaydet
            </Button>
          </Box>
        </Box>

        <Box
          sx={{ 
            position: 'relative',
            flex: 1,
            overflow: 'auto',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: '1500px',
              height: '1200px',
              transform: `scale(${zoom})`,
              transformOrigin: '0 0',
              backgroundColor: '#f5f5f5',
              backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
              border: '1px solid rgba(0, 0, 0, 0.1)'
            }}
          >
            {Array.isArray(tezgahlar) && tezgahlar.map(tezgah => (
              <TezgahKarti
                key={tezgah.tezgah_id}
                tezgah={tezgah}
                bekleyenIsEmirleri={bekleyenIsEmirleri}
                onDragStop={handleDragStop}
                onEdit={(tezgah) => { setEditData(tezgah); setFormOpen(true); }}
                onDelete={handleTezgahSil}
                onIsEmriAta={handleIsEmriAta}
                onTezgahGuncellendi={handleTezgahGuncellendi}
              />
            ))}
          </Box>
        </Box>
      </Box>

      <TezgahForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditData(null); }}
        onSubmit={editData ? handleTezgahDuzenle : handleTezgahEkle}
        initialData={editData}
      />

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
  );
};

export default Tezgahlar; 