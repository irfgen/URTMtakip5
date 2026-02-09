import React, { useState } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  CheckCircle as CompleteIcon
} from '@mui/icons-material';

const TaskContextMenu = ({
  anchorEl,
  open,
  onClose,
  task,
  workstation,
  onEditTask,
  onDeleteTask,
  onDuplicateTask,
  onViewDetails,
  onUpdateTaskStatus
}) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editedTask, setEditedTask] = useState(null);

  // Context menu item click handlers
  const handleEditClick = () => {
    setEditedTask({
      ...task,
      duration: task.duration || 1,
      priority: task.priority || 'Normal'
    });
    setEditDialogOpen(true);
    onClose();
  };

  const handleDeleteClick = () => {
    setDeleteConfirmOpen(true);
    onClose();
  };

  const handleDuplicateClick = () => {
    if (onDuplicateTask) {
      onDuplicateTask(task);
    }
    onClose();
  };

  const handleViewDetailsClick = () => {
    setDetailsDialogOpen(true);
    onClose();
  };

  const handleStatusChange = (newStatus) => {
    if (onUpdateTaskStatus) {
      onUpdateTaskStatus(task.id, newStatus);
    }
    onClose();
  };

  // Edit dialog handlers
  const handleEditSave = () => {
    if (onEditTask && editedTask) {
      onEditTask(editedTask);
    }
    setEditDialogOpen(false);
    setEditedTask(null);
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setEditedTask(null);
  };

  // Delete confirmation handlers
  const handleDeleteConfirm = () => {
    if (onDeleteTask) {
      onDeleteTask(task.id);
    }
    setDeleteConfirmOpen(false);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
  };

  if (!task) return null;

  return (
    <>
      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={handleViewDetailsClick}>
          <ListItemIcon>
            <InfoIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Detayları Görüntüle</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleEditClick}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Düzenle</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleDuplicateClick}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Kopyala</ListItemText>
        </MenuItem>

        <Divider />

        {/* Status Change Options */}
        {task.status !== 'devam ediyor' && (
          <MenuItem onClick={() => handleStatusChange('devam ediyor')}>
            <ListItemIcon>
              <StartIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Başlat</ListItemText>
          </MenuItem>
        )}

        {task.status === 'devam ediyor' && (
          <MenuItem onClick={() => handleStatusChange('beklemede')}>
            <ListItemIcon>
              <PauseIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Durdur</ListItemText>
          </MenuItem>
        )}

        {task.status !== 'tamamlandı' && (
          <MenuItem onClick={() => handleStatusChange('tamamlandı')}>
            <ListItemIcon>
              <CompleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Tamamla</ListItemText>
          </MenuItem>
        )}

        <Divider />

        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Sil</ListItemText>
        </MenuItem>
      </Menu>

      {/* Edit Task Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Görevi Düzenle</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Görev Adı"
            fullWidth
            variant="outlined"
            value={editedTask?.name || ''}
            onChange={(e) => setEditedTask({ ...editedTask, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Süre (saat)"
            type="number"
            fullWidth
            variant="outlined"
            value={editedTask?.duration || 1}
            onChange={(e) => setEditedTask({ ...editedTask, duration: parseFloat(e.target.value) })}
            inputProps={{ min: 0.1, max: 168, step: 0.1 }}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>Öncelik</InputLabel>
            <Select
              value={editedTask?.priority || 'Normal'}
              label="Öncelik"
              onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value })}
            >
              <MenuItem value="dusuk">Düşük</MenuItem>
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="yuksek">Yüksek</MenuItem>
              <MenuItem value="acil">Acil</MenuItem>
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            label="Adet"
            type="number"
            fullWidth
            variant="outlined"
            value={editedTask?.quantity || 1}
            onChange={(e) => setEditedTask({ ...editedTask, quantity: parseInt(e.target.value) })}
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel}>İptal</Button>
          <Button onClick={handleEditSave} variant="contained">Kaydet</Button>
        </DialogActions>
      </Dialog>

      {/* Task Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Görev Detayları</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            {task.name}
          </Typography>
          
          <Typography variant="body2" color="textSecondary" paragraph>
            <strong>İş Emri No:</strong> {task.work_order_no}
          </Typography>
          
          <Typography variant="body2" color="textSecondary" paragraph>
            <strong>Tezgah:</strong> {workstation?.workstation_name}
          </Typography>
          
          <Typography variant="body2" color="textSecondary" paragraph>
            <strong>Süre:</strong> {task.duration} saat
          </Typography>
          
          <Typography variant="body2" color="textSecondary" paragraph>
            <strong>Öncelik:</strong> {task.priority}
          </Typography>
          
          <Typography variant="body2" color="textSecondary" paragraph>
            <strong>Durum:</strong> {task.status}
          </Typography>
          
          <Typography variant="body2" color="textSecondary" paragraph>
            <strong>Malzeme:</strong> {task.material}
          </Typography>
          
          <Typography variant="body2" color="textSecondary" paragraph>
            <strong>Adet:</strong> {task.quantity}
          </Typography>
          
          <Typography variant="body2" color="textSecondary" paragraph>
            <strong>Teslim Tarihi:</strong> {new Date(task.delivery_date).toLocaleDateString('tr-TR')}
          </Typography>
          
          <Typography variant="body2" color="textSecondary" paragraph>
            <strong>Başlangıç:</strong> {new Date(task.start).toLocaleString('tr-TR')}
          </Typography>
          
          <Typography variant="body2" color="textSecondary" paragraph>
            <strong>Bitiş:</strong> {new Date(task.end).toLocaleString('tr-TR')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Görevi Sil</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            <Typography variant="body2">
              <strong>{task.work_order_no}</strong> numaralı iş emrini silmek istediğinizden emin misiniz?
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Bu işlem geri alınamaz.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>İptal</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Sil
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TaskContextMenu;