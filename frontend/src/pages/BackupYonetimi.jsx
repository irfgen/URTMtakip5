import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import api from '../services/api';

const BackupYonetimi = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: '', fileName: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadBackups = async () => {
    setLoading(true);
    try {
      const response = await api.get('/backups');
      setBackups(response.data.backups);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Yedekler yüklenirken bir hata oluştu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const handleCreateBackup = async () => {
    try {
      await api.post('/backups');
      await loadBackups();
      setSnackbar({
        open: true,
        message: 'Yedek başarıyla oluşturuldu',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Yedek oluşturulurken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  const handleRestore = async () => {
    try {
      await api.post(`/backups/${confirmDialog.fileName}/restore`);
      setConfirmDialog({ open: false, type: '', fileName: '' });
      setSnackbar({
        open: true,
        message: 'Yedek başarıyla geri yüklendi',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Yedek geri yüklenirken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/backups/${confirmDialog.fileName}`);
      await loadBackups();
      setConfirmDialog({ open: false, type: '', fileName: '' });
      setSnackbar({
        open: true,
        message: 'Yedek başarıyla silindi',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Yedek silinirken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('tr-TR');
  };

  const formatFileSize = (bytes) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Yedekleme Yönetimi</Typography>
        <Button
          variant="contained"
          startIcon={<BackupIcon />}
          onClick={handleCreateBackup}
          disabled={loading}
        >
          Yeni Yedek Oluştur
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Yedek Adı</TableCell>
                <TableCell>Oluşturulma Tarihi</TableCell>
                <TableCell>Boyut</TableCell>
                <TableCell align="right">İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {backups.map((backup) => (
                <TableRow key={backup.fileName}>
                  <TableCell>{backup.fileName}</TableCell>
                  <TableCell>{formatDate(backup.createdAt)}</TableCell>
                  <TableCell>{formatFileSize(backup.size)}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="primary"
                      onClick={() => setConfirmDialog({
                        open: true,
                        type: 'restore',
                        fileName: backup.fileName
                      })}
                    >
                      <RestoreIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => setConfirmDialog({
                        open: true,
                        type: 'delete',
                        fileName: backup.fileName
                      })}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {backups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    Henüz yedek bulunmuyor
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, type: '', fileName: '' })}
      >
        <DialogTitle>
          {confirmDialog.type === 'restore' ? 'Yedeği Geri Yükle' : 'Yedeği Sil'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmDialog.type === 'restore'
              ? 'Bu yedeği geri yüklemek istediğinizden emin misiniz? Mevcut veriler değiştirilecektir.'
              : 'Bu yedeği silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog({ open: false, type: '', fileName: '' })}
          >
            İptal
          </Button>
          <Button
            color={confirmDialog.type === 'restore' ? 'primary' : 'error'}
            onClick={confirmDialog.type === 'restore' ? handleRestore : handleDelete}
            autoFocus
          >
            {confirmDialog.type === 'restore' ? 'Geri Yükle' : 'Sil'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
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

export default BackupYonetimi;