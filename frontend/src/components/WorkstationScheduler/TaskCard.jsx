import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  alpha,
  useTheme
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Flag as PriorityIcon
} from '@mui/icons-material';
import { Draggable } from 'react-beautiful-dnd';

const TaskCard = ({ 
  task, 
  index, 
  onEdit, 
  onDelete, 
  onStatusChange,
  isDragging = false 
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit(task);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete(task.id);
  };

  const handleStatusChange = (newStatus) => {
    handleMenuClose();
    onStatusChange(task.id, newStatus);
  };

  // Durum renkleri
  const getStatusColor = (status) => {
    switch (status) {
      case 'planli':
        return theme.palette.info.main;
      case 'devam_ediyor':
        return theme.palette.warning.main;
      case 'tamamlandi':
        return theme.palette.success.main;
      case 'iptal':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Öncelik renkleri
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1:
        return theme.palette.error.main; // Yüksek
      case 2:
        return theme.palette.warning.main; // Orta
      case 3:
        return theme.palette.info.main; // Normal
      case 4:
        return theme.palette.success.main; // Düşük
      default:
        return theme.palette.grey[500];
    }
  };

  // Zamanları formatla
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}dk`;
    if (mins === 0) return `${hours}sa`;
    return `${hours}sa ${mins}dk`;
  };

  return (
    <Draggable draggableId={`task-${task.id}`} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            mb: 1,
            minHeight: 120,
            cursor: 'grab',
            transition: 'all 0.2s ease',
            transform: snapshot.isDragging ? 'rotate(5deg)' : 'none',
            boxShadow: snapshot.isDragging 
              ? theme.shadows[8] 
              : theme.shadows[1],
            borderLeft: `4px solid ${getStatusColor(task.status)}`,
            '&:hover': {
              boxShadow: theme.shadows[4],
              transform: 'translateY(-2px)'
            },
            '&:active': {
              cursor: 'grabbing'
            },
            backgroundColor: snapshot.isDragging 
              ? alpha(theme.palette.primary.main, 0.05) 
              : theme.palette.background.paper
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
              <Box flex={1}>
                <Typography 
                  variant="subtitle2" 
                  fontWeight="bold" 
                  color="primary"
                  noWrap
                  title={task.work_order?.number}
                >
                  {task.work_order?.number}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    fontSize: '0.75rem',
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}
                  title={task.work_order?.name}
                >
                  {task.work_order?.name}
                </Typography>
              </Box>
              
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                sx={{ ml: 1, p: 0.5 }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Zaman bilgileri */}
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <ScheduleIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {formatTime(task.start_time)} - {formatTime(task.end_time)}
              </Typography>
              <Typography variant="caption" color="primary" fontWeight="medium">
                ({formatDuration(task.planned_duration_minutes)})
              </Typography>
            </Box>

            {/* Durum ve öncelik */}
            <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
              <Chip
                label={task.status === 'planli' ? 'Planlı' :
                      task.status === 'devam_ediyor' ? 'Devam Ediyor' :
                      task.status === 'tamamlandi' ? 'Tamamlandı' :
                      task.status === 'iptal' ? 'İptal' : task.status}
                size="small"
                sx={{
                  bgcolor: alpha(getStatusColor(task.status), 0.1),
                  color: getStatusColor(task.status),
                  fontWeight: 'medium',
                  fontSize: '0.7rem'
                }}
              />
              
              <Box display="flex" alignItems="center" gap={0.5}>
                <PriorityIcon 
                  fontSize="small" 
                  sx={{ color: getPriorityColor(task.priority) }}
                />
                <Typography 
                  variant="caption" 
                  sx={{ color: getPriorityColor(task.priority), fontWeight: 'medium' }}
                >
                  P{task.priority}
                </Typography>
              </Box>
            </Box>

            {/* Notlar (varsa) */}
            {task.notes && (
              <Box mt={1}>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{
                    fontSize: '0.7rem',
                    fontStyle: 'italic',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical'
                  }}
                  title={task.notes}
                >
                  "{task.notes}"
                </Typography>
              </Box>
            )}

            {/* Context Menu */}
            <Menu
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={handleMenuClose}
              PaperProps={{
                sx: { minWidth: 180 }
              }}
            >
              <MenuItem onClick={handleEdit}>
                <ListItemIcon>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Düzenle" />
              </MenuItem>

              {task.status === 'planli' && (
                <MenuItem onClick={() => handleStatusChange('devam_ediyor')}>
                  <ListItemIcon>
                    <PlayArrowIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Başlat" />
                </MenuItem>
              )}

              {task.status === 'devam_ediyor' && (
                <>
                  <MenuItem onClick={() => handleStatusChange('planli')}>
                    <ListItemIcon>
                      <PauseIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Duraklat" />
                  </MenuItem>
                  <MenuItem onClick={() => handleStatusChange('tamamlandi')}>
                    <ListItemIcon>
                      <CheckCircleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Tamamla" />
                  </MenuItem>
                </>
              )}

              <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                <ListItemIcon>
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText primary="Sil" />
              </MenuItem>
            </Menu>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};

export default TaskCard;