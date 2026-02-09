import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  LinearProgress,
  alpha,
  useTheme
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import { Droppable } from 'react-beautiful-dnd';
import TaskCard from './TaskCard';

const WorkstationRow = ({ 
  workstation, 
  onTaskEdit, 
  onTaskDelete, 
  onTaskStatusChange,
  onAddTask,
  isExpanded = true,
  onToggleExpand 
}) => {
  const theme = useTheme();

  // Tezgah durumu renkleri
  const getStatusColor = (status) => {
    switch (status) {
      case 'musait':
        return theme.palette.success.main;
      case 'calisiyor':
        return theme.palette.warning.main;
      case 'bakim':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Tezgah durumu metinleri
  const getStatusText = (status) => {
    switch (status) {
      case 'musait':
        return 'Müsait';
      case 'calisiyor':
        return 'Çalışıyor';
      case 'bakim':
        return 'Bakım';
      default:
        return status;
    }
  };

  // Task istatistikleri hesapla
  const calculateStats = (tasks) => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'tamamlandi').length;
    const inProgress = tasks.filter(t => t.status === 'devam_ediyor').length;
    const planned = tasks.filter(t => t.status === 'planli').length;
    
    const totalMinutes = tasks.reduce((sum, task) => 
      sum + (task.planned_duration_minutes || 0), 0
    );
    const completedMinutes = tasks
      .filter(t => t.status === 'tamamlandi')
      .reduce((sum, task) => sum + (task.planned_duration_minutes || 0), 0);
    
    const utilizationPercent = totalMinutes > 0 ? 
      Math.round((totalMinutes / (8 * 60)) * 100) : 0; // 8 saatlik iş gününe göre
    const completionPercent = totalMinutes > 0 ?
      Math.round((completedMinutes / totalMinutes) * 100) : 0;
    
    return {
      total,
      completed,
      inProgress,
      planned,
      totalMinutes,
      utilizationPercent: Math.min(100, utilizationPercent),
      completionPercent
    };
  };

  const stats = calculateStats(workstation.tasks || []);

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}dk`;
    if (mins === 0) return `${hours}sa`;
    return `${hours}sa ${mins}dk`;
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        mb: 2, 
        overflow: 'hidden',
        border: `1px solid ${alpha(getStatusColor(workstation.workstation_status), 0.3)}`
      }}
    >
      {/* Header */}
      <Box 
        sx={{ 
          p: 2, 
          bgcolor: alpha(getStatusColor(workstation.workstation_status), 0.1),
          borderBottom: `1px solid ${theme.palette.divider}`,
          cursor: 'pointer'
        }}
        onClick={onToggleExpand}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          {/* Sol taraf - Tezgah bilgileri */}
          <Box display="flex" alignItems="center" gap={2} flex={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <BuildIcon color="primary" />
              <Typography variant="h6" color="primary" fontWeight="bold">
                {workstation.workstation_name}
              </Typography>
            </Box>

            <Chip
              label={getStatusText(workstation.workstation_status)}
              size="small"
              sx={{
                bgcolor: alpha(getStatusColor(workstation.workstation_status), 0.2),
                color: getStatusColor(workstation.workstation_status),
                fontWeight: 'medium'
              }}
            />

            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" color="text.secondary">
                {stats.total} görev
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDuration(stats.totalMinutes)}
              </Typography>
              <Typography variant="body2" color="primary" fontWeight="medium">
                %{stats.utilizationPercent} kapasite
              </Typography>
            </Box>
          </Box>

          {/* Sağ taraf - Kontroller ve istatistikler */}
          <Box display="flex" alignItems="center" gap={1}>
            {/* Tamamlanma oranı */}
            <Box display="flex" alignItems="center" gap={1} minWidth={100}>
              <Box flex={1}>
                <LinearProgress
                  variant="determinate"
                  value={stats.completionPercent}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.grey[500], 0.2),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: theme.palette.success.main
                    }
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" minWidth={35}>
                %{stats.completionPercent}
              </Typography>
            </Box>

            {/* Görev sayıları */}
            <Box display="flex" alignItems="center" gap={1}>
              <Tooltip title="Tamamlanan">
                <Chip
                  icon={<CheckCircleIcon />}
                  label={stats.completed}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    minWidth: 50,
                    '& .MuiChip-icon': { color: theme.palette.success.main }
                  }}
                />
              </Tooltip>
              <Tooltip title="Devam eden">
                <Chip
                  icon={<RadioButtonUncheckedIcon />}
                  label={stats.inProgress}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    minWidth: 50,
                    '& .MuiChip-icon': { color: theme.palette.warning.main }
                  }}
                />
              </Tooltip>
              <Tooltip title="Planlanan">
                <Chip
                  icon={<RadioButtonUncheckedIcon />}
                  label={stats.planned}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    minWidth: 50,
                    '& .MuiChip-icon': { color: theme.palette.info.main }
                  }}
                />
              </Tooltip>
            </Box>

            {/* Action buttons */}
            <Tooltip title="Yeni görev ekle">
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddTask(workstation.workstation_id);
                }}
                sx={{ ml: 1 }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>

            <IconButton size="small" color="default">
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Görevler */}
      <Collapse in={isExpanded}>
        <Droppable droppableId={`workstation-${workstation.workstation_id}`}>
          {(provided, snapshot) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              sx={{
                p: 2,
                minHeight: 120,
                bgcolor: snapshot.isDraggingOver 
                  ? alpha(theme.palette.primary.main, 0.05)
                  : 'transparent',
                transition: 'background-color 0.2s ease',
                border: snapshot.isDraggingOver 
                  ? `2px dashed ${theme.palette.primary.main}`
                  : 'none',
                borderRadius: 1
              }}
            >
              {/* Görevler listesi */}
              {workstation.tasks && workstation.tasks.length > 0 ? (
                workstation.tasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    onEdit={onTaskEdit}
                    onDelete={onTaskDelete}
                    onStatusChange={onTaskStatusChange}
                  />
                ))
              ) : (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  minHeight={80}
                  sx={{
                    border: `2px dashed ${theme.palette.divider}`,
                    borderRadius: 2,
                    color: 'text.secondary'
                  }}
                >
                  <Typography variant="body2">
                    Bu tezgahta henüz görev bulunmuyor
                  </Typography>
                </Box>
              )}
              
              {provided.placeholder}
              
              {/* Drop zone mesajı */}
              {snapshot.isDraggingOver && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    bgcolor: alpha(theme.palette.primary.main, 0.9),
                    color: 'white',
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    zIndex: 10,
                    pointerEvents: 'none'
                  }}
                >
                  <Typography variant="body2" fontWeight="bold">
                    Görevi buraya bırakın
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Droppable>
      </Collapse>
    </Paper>
  );
};

export default WorkstationRow;