import { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Stack,
  Badge,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Build as BuildIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Timer as TimerIcon,
  Inventory as InventoryIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import TezgahDuzenleForm from './TezgahDuzenleForm';

const TezgahKutusu = ({ tezgah, onDragStop, onGuncelle, onSil }) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [duzenleDialogAcik, setDuzenleDialogAcik] = useState(false);
  const [silDialogAcik, setSilDialogAcik] = useState(false);
  const [planlanmisIslerDialogAcik, setPlanlanmisIslerDialogAcik] = useState(false);
  const [planlanmisIsler, setPlanlanmisIsler] = useState([]);
  const [planlanmisIsSayisi, setPlanlanmisIsSayisi] = useState(0);

  // Aktif iş bilgilerini tezgah verilerinden al
  const aktifIs = tezgah.is_emirleri && tezgah.is_emirleri.length > 0 
    ? {
        parcaAdi: tezgah.is_emirleri[0].is_adi || tezgah.is_emirleri[0].parca_adi || "Belirtilmemiş",
        adet: tezgah.is_emirleri[0].toplam_adet || 0,
        baslamaTarihi: tezgah.is_emirleri[0].atama_tarihi ? new Date(tezgah.is_emirleri[0].atama_tarihi).toLocaleString('tr-TR') : "-",
        setup_sayisi: tezgah.is_emirleri[0].setup_sayisi || 0,
        cnc_suresi: tezgah.is_emirleri[0].cnc_suresi || 0
      }
    : {
        parcaAdi: "İş atanmamış",
        adet: 0,
        baslamaTarihi: "-",
        setup_sayisi: 0,
        cnc_suresi: 0
      };
  
  // Planlanan işleri çek
  useEffect(() => {
    fetchPlanlanmisIsSayisi();
  }, [tezgah.tezgah_id]);
  
  // Planlanan iş sayısını getir
  const fetchPlanlanmisIsSayisi = async () => {
    try {
      const response = await axios.get(`/api/tezgah-plan/${tezgah.tezgah_id}/planlanan-is-sayisi`);
      setPlanlanmisIsSayisi(response.data.count);
    } catch (error) {
      console.error('Planlanan iş sayısı çekilemedi:', error);
    }
  };
  
  // Planlanan işleri getir
  const fetchPlanlanmisIsler = async () => {
    try {
      const response = await axios.get(`/api/tezgah-plan/${tezgah.tezgah_id}/planlanan-isler`);
      setPlanlanmisIsler(response.data);
    } catch (error) {
      console.error('Planlanan işler çekilemedi:', error);
    }
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const getDurumIcon = () => {
    switch (tezgah.durum) {
      case 'aktif':
        return <CheckCircleIcon color="success" />;
      case 'bakim':
        return <BuildIcon color="warning" />;
      case 'ariza':
        return <ErrorIcon color="error" />;
      case 'devre_disi':
        return <WarningIcon color="disabled" />;
      default:
        return null;
    }
  };

  const handleDragStop = (e, data) => {
    onDragStop(tezgah.id, { x: data.x, y: data.y });
  };

  return (
    <>
      <Draggable
        position={tezgah.position}
        onStop={handleDragStop}
        bounds="parent"
      >
        <Paper
          elevation={3}
          onContextMenu={handleContextMenu}
          sx={{
            position: 'absolute',
            width: 280,
            p: 2,
            cursor: 'move',
            userSelect: 'none',
            backgroundColor: '#fff',
            '&:hover': {
              boxShadow: 6,
            },
          }}
        >
          {/* Tezgah Başlık */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {getDurumIcon()}
            <Typography variant="h6" sx={{ ml: 1, fontSize: '1.1rem' }}>
              {tezgah.tanim}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          {/* Aktif İş Bilgileri */}
          <Stack spacing={1}>
            {/* Parça Adı */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <InventoryIcon sx={{ fontSize: '1rem', mr: 1, color: 'primary.main' }} />
              <Typography variant="body2">
                <strong>Parça:</strong> {aktifIs.parcaAdi}
              </Typography>
            </Box>
            {/* Adet Bilgisi */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ ml: 3 }}>
                <strong>Adet:</strong> {aktifIs.adet}
              </Typography>
            </Box>
            {/* Setup Sayısı */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ ml: 3 }}>
                <strong>Setup Sayısı:</strong> {aktifIs.setup_sayisi}
              </Typography>
            </Box>
            {/* CNC Süresi */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ ml: 3 }}>
                <strong>CNC Süresi:</strong> {aktifIs.cnc_suresi} dk
              </Typography>
            </Box>
            {/* Başlama Zamanı */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TimerIcon sx={{ fontSize: '1rem', mr: 1, color: 'primary.main' }} />
              <Typography variant="body2">
                <strong>Başlama:</strong> {aktifIs.baslamaTarihi}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Draggable>

      {/* Sağ tık menüsü */}
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => {
          handleContextMenuClose();
          setDuzenleDialogAcik(true);
        }}>
          Düzenle
        </MenuItem>
        <MenuItem onClick={() => {
          handleContextMenuClose();
          setSilDialogAcik(true);
        }}>
          Sil
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          handleContextMenuClose();
          fetchPlanlanmisIsler();
          setPlanlanmisIslerDialogAcik(true);
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AssignmentIcon sx={{ mr: 1 }} />
            Sıradaki İşler
            {planlanmisIsSayisi > 0 && (
              <Badge 
                badgeContent={planlanmisIsSayisi} 
                color="primary" 
                sx={{ ml: 1 }}
              />
            )}
          </Box>
        </MenuItem>
      </Menu>

      {/* Düzenleme formu */}
      <TezgahDuzenleForm
        open={duzenleDialogAcik}
        onClose={() => setDuzenleDialogAcik(false)}
        tezgah={tezgah}
        onSubmit={(guncelTezgah) => {
          onGuncelle(tezgah.id, guncelTezgah);
          setDuzenleDialogAcik(false);
        }}
      />

      {/* Silme onay dialogu */}
      <Dialog
        open={silDialogAcik}
        onClose={() => setSilDialogAcik(false)}
      >
        <DialogTitle>Tezgah Silme</DialogTitle>
        <DialogContent>
          <Typography>
            "{tezgah.tanim}" tezgahını silmek istediğinizden emin misiniz?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSilDialogAcik(false)}>İptal</Button>
          <Button
            onClick={() => {
              onSil(tezgah.id);
              setSilDialogAcik(false);
            }}
            color="error"
          >
            Sil
          </Button>
        </DialogActions>
      </Dialog>

      {/* Planlanan İşler dialogu */}
      <Dialog
        open={planlanmisIslerDialogAcik}
        onClose={() => setPlanlanmisIslerDialogAcik(false)}
        maxWidth="md"
      >
        <DialogTitle>
          "{tezgah.tanim}" Tezgahı İçin Planlanan İşler
        </DialogTitle>
        <DialogContent>
          {planlanmisIsler.length === 0 ? (
            <Typography>Bu tezgah için planlanan iş bulunmamaktadır.</Typography>
          ) : (
            <List>
              {planlanmisIsler.map((isEmri) => (
                <ListItem key={isEmri.is_emri_id} divider>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight="bold">
                        {isEmri.is_emri_no} - {isEmri.is_adi}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" display="block">
                          <strong>Üretim Planı:</strong> {isEmri.uretim_plani_id ? `Plan #${isEmri.uretim_plani_id}` : (isEmri.plan_liste_no || '-')}
                        </Typography>
                        <Typography variant="body2" display="block">
                          <strong>Malzeme:</strong> {isEmri.malzeme}
                        </Typography>
                        <Typography variant="body2" display="block">
                          <strong>Adet:</strong> {isEmri.adet}
                        </Typography>
                        <Typography variant="body2" display="block">
                          <strong>Teslim Tarihi:</strong> {new Date(isEmri.teslim_tarihi).toLocaleDateString('tr-TR')}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlanlanmisIslerDialogAcik(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TezgahKutusu;