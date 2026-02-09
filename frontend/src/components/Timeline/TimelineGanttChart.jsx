import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tooltip,
  Chip,
  alpha,
  Card,
  CardContent,
  Stack,
  IconButton,
  CardMedia
} from '@mui/material';
import {
  DragDropContext,
  Droppable,
  Draggable
} from 'react-beautiful-dnd';
import {
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Factory as FactoryIcon,
  Build as BuildIcon,
  Image as ImageIcon
} from '@mui/icons-material';

import TaskContextMenu from './TaskContextMenu';
import ImageWithFallback from '../ImageWithFallback';
import axios from 'axios';

const TimelineGanttChart = ({ 
  data, 
  viewMode = 'daily', 
  onTaskDrop,
  onTaskEdit,
  onTaskDelete, 
  onTaskDuplicate,
  onTaskStatusUpdate,
  showShifts = false,
  dateRange 
}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [draggedTask, setDraggedTask] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    open: false,
    anchorEl: null,
    task: null,
    workstation: null
  });
  const [parcaBilgileri, setParcaBilgileri] = useState({});
  const containerRef = useRef(null);

  // Container genişliğini dinamik olarak hesapla
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Tarih aralığını hesapla
  const dateRangeInfo = useMemo(() => {
    if (!dateRange) return null;
    
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    return {
      start,
      end,
      totalDays: daysDiff,
      totalHours: daysDiff * 24
    };
  }, [dateRange]);


  // Fotoğraf yolu için yardımcı fonksiyon
  const getFotoPath = (foto_path) => {
    if (!foto_path) return '';
    if (foto_path.includes('://')) return foto_path; 
    if (foto_path.startsWith('/uploads/')) return foto_path;
    if (foto_path.startsWith('/fotograflar/')) return '/uploads' + foto_path;
    if (foto_path.includes('/')) return '/uploads/fotograflar/' + foto_path.split('/').pop();
    return '/uploads/fotograflar/' + foto_path;
  };

  // Parça bilgilerini yükle (IsEmriKarti.jsx ile aynı sistem)
  useEffect(() => {
    const loadParcaBilgileri = async () => {
      const newParcaBilgileri = {};
      
      for (const workstation of data) {
        for (const task of workstation.tasks) {
          // İşEmriKarti.jsx'teki gibi parca_kodu veya material kullan
          const searchTerm = task.parca_kodu || task.material || task.work_order_no;
          const cacheKey = task.work_order_id; // Her iş emri için benzersiz key
          
          if (searchTerm && !parcaBilgileri[cacheKey]) {
            try {
              console.log(`Parça bilgileri yükleniyor: ${searchTerm} (İş Emri: ${task.work_order_no})`);
              const response = await axios.get(`/api/parcalar?aramaMetni=${searchTerm}`);
              
              let parcaData = [];
              // Handle different API response formats (paginated or direct array)
              if (response.data && response.data.parcalar && Array.isArray(response.data.parcalar)) {
                parcaData = response.data.parcalar;
              } else if (Array.isArray(response.data)) {
                parcaData = response.data;
              }
              
              if (parcaData.length > 0) {
                // Birebir eşleşen parçayı bul veya listedeki ilk parçayı al
                const matchedParca = task.parca_kodu 
                  ? parcaData.find(p => p.parcaKodu === task.parca_kodu)
                  : parcaData[0];
                
                if (matchedParca) {
                  newParcaBilgileri[cacheKey] = matchedParca;
                  console.log(`Parça bilgileri yüklendi: ${task.work_order_no}`, matchedParca);
                } else {
                  console.log(`Eşleşen parça bulunamadı: ${searchTerm}`);
                }
              } else {
                console.log(`Parça bulunamadı: ${searchTerm}`);
              }
            } catch (error) {
              console.error(`Parça bilgileri yüklenemedi: ${searchTerm}`, error);
            }
          }
        }
      }
      
      if (Object.keys(newParcaBilgileri).length > 0) {
        setParcaBilgileri(prev => ({ ...prev, ...newParcaBilgileri }));
      }
    };
    
    if (data && data.length > 0) {
      loadParcaBilgileri();
    }
  }, [data]);


  // Görevin öncelik rengi
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'acil':
        return '#f44336'; // Kırmızı
      case 'yuksek':
      case 'yüksek':
        return '#ff9800'; // Turuncu
      case 'normal':
        return '#2196f3'; // Mavi
      case 'dusuk':
      case 'düşük':
        return '#4caf50'; // Yeşil
      default:
        return '#9e9e9e'; // Gri
    }
  };

  // Görevin durum rengi
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'tamamlandı':
      case 'tamamlandi':
        return '#4caf50'; // Yeşil
      case 'devam ediyor':
        return '#2196f3'; // Mavi
      case 'beklemede':
        return '#ff9800'; // Turuncu
      case 'iptal':
        return '#f44336'; // Kırmızı
      default:
        return '#9e9e9e'; // Gri
    }
  };


  // Çakışma kontrolü
  const checkTaskConflict = (workstationId, newStart, newEnd, excludeTaskId = null) => {
    const workstation = data.find(ws => ws.workstation_id === workstationId);
    if (!workstation) return false;
    
    return workstation.tasks.some(task => {
      if (excludeTaskId && task.id === excludeTaskId) return false;
      
      const taskStart = new Date(task.start);
      const taskEnd = new Date(task.end);
      const proposedStart = new Date(newStart);
      const proposedEnd = new Date(newEnd);
      
      // Zaman aralığı çakışması kontrolü
      return (proposedStart < taskEnd && proposedEnd > taskStart);
    });
  };

  // Grid snap hesaplama (15 dakika aralıklarla)
  const snapToGrid = (date) => {
    const snapInterval = 15 * 60 * 1000; // 15 dakika milisaniye
    const time = date.getTime();
    const snappedTime = Math.round(time / snapInterval) * snapInterval;
    return new Date(snappedTime);
  };

  // Drag & Drop handlers
  const onDragEnd = (result) => {
    console.log('Drag ended:', result);
    const { destination, source, draggableId } = result;
    
    if (!destination) {
      console.log('No destination, canceling drag');
      setDraggedTask(null);
      return;
    }
    
    // Aynı pozisyonda bırakılırsa işlem yapma
    if (destination.droppableId === source.droppableId && 
        destination.index === source.index) {
      console.log('Same position, canceling drag');
      setDraggedTask(null);
      return;
    }

    // Task bilgilerini bul
    const task = draggedTask;
    if (!task) {
      console.log('No task found, canceling drag');
      return;
    }

    // Yeni tezgah ID'sini hesapla
    const newWorkstationId = parseInt(destination.droppableId.replace('workstation-', ''));
    const oldWorkstationId = task.currentWorkstationId;
    
    console.log('Moving task:', { 
      taskId: draggableId, 
      from: oldWorkstationId, 
      to: newWorkstationId,
      task: task
    });
    
    // Kartlar için basit bir sistem - sadece tezgah değişikliği
    const taskUpdateData = {
      taskId: draggableId,
      newStart: task.start || new Date().toISOString(), // Zamanları aynı tutuyoruz
      newEnd: task.end || new Date(Date.now() + 3600000).toISOString(),
      newWorkstationId: newWorkstationId
    };

    console.log('Sending task update:', taskUpdateData);

    if (onTaskDrop) {
      onTaskDrop(taskUpdateData);
    }

    setDraggedTask(null);
  };

  const onDragStart = (start) => {
    // Sürüklenen task'ı bul
    const taskId = start.draggableId;
    let foundTask = null;
    
    data.forEach(workstation => {
      const task = workstation.tasks.find(t => t.id === taskId);
      if (task) {
        foundTask = { ...task, currentWorkstationId: workstation.workstation_id };
      }
    });
    
    setDraggedTask(foundTask);
    console.log('Drag started:', { taskId, foundTask });
  };

  // Context menu handlers
  const handleTaskRightClick = (event, task, workstation) => {
    event.preventDefault();
    event.stopPropagation();
    
    setContextMenu({
      open: true,
      anchorEl: event.currentTarget,
      task,
      workstation
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu({
      open: false,
      anchorEl: null,
      task: null,
      workstation: null
    });
  };

  const handleTaskEdit = (editedTask) => {
    if (onTaskEdit) {
      onTaskEdit(editedTask);
    }
    handleContextMenuClose();
  };

  const handleTaskDelete = (taskId) => {
    if (onTaskDelete) {
      onTaskDelete(taskId);
    }
    handleContextMenuClose();
  };

  const handleTaskDuplicate = (task) => {
    if (onTaskDuplicate) {
      onTaskDuplicate(task);
    }
    handleContextMenuClose();
  };

  const handleTaskStatusUpdate = (taskId, newStatus) => {
    if (onTaskStatusUpdate) {
      onTaskStatusUpdate(taskId, newStatus);
    }
    handleContextMenuClose();
  };


  // Timeline grid genişliğini hesapla
  const timelineWidth = useMemo(() => {
    const workstationLabelWidth = 300;
    const availableWidth = containerWidth - workstationLabelWidth;
    return Math.max(availableWidth, 1200); // Minimum genişlik
  }, [containerWidth]);

  // Zaman çizelgesi başlığı oluştur
  const generateTimelineHeader = () => {
    if (!dateRangeInfo) return [];
    
    const headers = [];
    const { start, totalDays } = dateRangeInfo;
    
    if (showShifts) {
      // Vardiya modunda: Her gün için iki başlık (Gündüz/Gece)
      for (let i = 0; i < totalDays; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);

        const dayLabel = currentDate.toLocaleDateString('tr-TR', { 
          day: '2-digit', 
          month: '2-digit'
        });
        const weekday = currentDate.toLocaleDateString('tr-TR', { weekday: 'short' });
        
        headers.push({
          date: currentDate,
          label: `${dayLabel} ${weekday} (Gündüz)`,
          weekday,
          shift: 'day',
          isShiftMode: true
        });
        
        headers.push({
          date: currentDate,
          label: `${dayLabel} ${weekday} (Gece)`,
          weekday,
          shift: 'night',
          isShiftMode: true
        });
      }
    } else {
      // Normal mod: Saat bazlı başlıklar
      for (let i = 0; i < totalDays; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);
        
        headers.push({
          date: currentDate,
          label: currentDate.toLocaleDateString('tr-TR', { 
            day: '2-digit', 
            month: '2-digit'
          })
        });
      }
    }
    
    return headers;
  };

  const timelineHeaders = generateTimelineHeader();

  return (
    <Box ref={containerRef} sx={{ width: '100%', overflow: 'auto' }}>
      {/* Timeline Header */}
      <Box sx={{ display: 'flex', mb: 2, position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'background.paper' }}>
        {/* Workstation Label Space */}
        <Box sx={{ width: 300, flexShrink: 0, pr: 2 }}>
          <Paper elevation={1} sx={{ p: 2, textAlign: 'center', backgroundColor: alpha('#2196f3', 0.1) }}>
            <Typography variant="h6" fontWeight="bold" color="primary">
              {showShifts ? 'Vardiya Bazlı Planlama' : 'Tezgah Planlaması'}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {showShifts ? 'Vardiya modunda görev planlaması' : 'İş emirlerini tezgahlar arası sürükleyin'}
            </Typography>
          </Paper>
        </Box>
        
        {/* Time Headers */}
        <Box sx={{ 
          display: 'flex', 
          width: timelineWidth, 
          borderBottom: '2px solid #e0e0e0',
          boxShadow: 1
        }}>
          {timelineHeaders.map((header, index) => (
            <Box
              key={index}
              sx={{
                flex: 1,
                textAlign: 'center',
                py: 2,
                borderRight: '1px solid #e0e0e0',
                backgroundColor: header.isShiftMode ? 
                  alpha('#4caf50', 0.08) : 
                  alpha('#2196f3', 0.05),
                minWidth: showShifts ? 120 : 80
              }}
            >
              <Typography variant="subtitle2" fontWeight="bold" color={showShifts ? "success.main" : "primary"}>
                {header.label}
              </Typography>
              {!showShifts && (
                <Typography variant="caption" color="textSecondary">
                  {header.weekday || header.date.toLocaleDateString('tr-TR', { weekday: 'short' })}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Timeline Content */}
      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        {data.map((workstation, workstationIndex) => (
          <Box key={workstation.workstation_id} sx={{ display: 'flex', mb: 2 }}>
            {/* Workstation Label */}
            <Paper
              elevation={2}
              sx={{
                width: 300,
                flexShrink: 0,
                p: 2,
                mr: 2,
                display: 'flex',
                alignItems: 'center',
                backgroundColor: alpha('#1976d2', 0.08),
                borderLeft: '4px solid',
                borderColor: 'primary.main'
              }}
            >
              <FactoryIcon 
                sx={{ 
                  mr: 2, 
                  fontSize: 28,
                  color: 'primary.main'
                }} 
              />
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="h6" 
                  fontWeight="bold" 
                  sx={{ 
                    color: 'primary.dark',
                    fontSize: '1rem'
                  }}
                >
                  {workstation.workstation_name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {workstation.tasks.length} iş emri
                </Typography>
              </Box>
            </Paper>

            {/* Timeline Track */}
            <Droppable droppableId={`workstation-${workstation.workstation_id}`} direction="horizontal">
              {(provided, snapshot) => (
                <Box
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  sx={{
                    width: timelineWidth,
                    minHeight: 120,
                    position: 'relative',
                    backgroundColor: snapshot.isDraggingOver ? 
                      alpha('#4caf50', 0.1) : 
                      'background.paper',
                    border: snapshot.isDraggingOver ? 
                      '2px dashed #4caf50' : 
                      '1px solid #e0e0e0',
                    borderRadius: 1,
                    p: 1,
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 2,
                    flexWrap: 'wrap',
                    alignContent: 'flex-start',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Time Grid Lines */}
                  {timelineHeaders.map((_, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: 'absolute',
                        left: `${(index / timelineHeaders.length) * 100}%`,
                        top: 0,
                        bottom: 0,
                        width: 1,
                        backgroundColor: alpha('#f0f0f0', 0.5),
                        zIndex: 1
                      }}
                    />
                  ))}

                  {workstation.tasks.length === 0 ? (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: 100,
                        color: 'text.secondary',
                        zIndex: 2
                      }}
                    >
                      <BuildIcon sx={{ fontSize: 32, mb: 1, opacity: 0.3 }} />
                      <Typography variant="caption">
                        Bu tezgaha iş emri sürükleyin
                      </Typography>
                    </Box>
                  ) : (
                    workstation.tasks.map((task, taskIndex) => {
                      const priorityColor = getPriorityColor(task.priority);
                      const statusColor = getStatusColor(task.status);
                      const parcaBilgisi = parcaBilgileri[task.work_order_id];
                      
                      return (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={taskIndex}
                        >
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onContextMenu={(e) => handleTaskRightClick(e, task, workstation)}
                              sx={{
                                width: 320,
                                flexShrink: 0,
                                cursor: 'grab',
                                boxShadow: snapshot.isDragging ? 
                                  '0 8px 20px rgba(0,0,0,0.3)' : 
                                  '0 2px 8px rgba(0,0,0,0.15)',
                                transform: snapshot.isDragging ? 
                                  'rotate(3deg) scale(1.05)' : 'none',
                                opacity: snapshot.isDragging ? 0.9 : 1,
                                transition: 'all 0.2s ease',
                                borderLeft: `4px solid ${priorityColor}`,
                                zIndex: snapshot.isDragging ? 10 : 2,
                                '&:hover': {
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                  transform: 'translateY(-2px)'
                                }
                              }}
                            >
                              {/* Parça görseli */}
                              {parcaBilgisi && parcaBilgisi.foto_path && (
                                <CardMedia sx={{ position: 'relative' }}>
                                  <Tooltip
                                    title={
                                      <Box sx={{ p: 0 }}>
                                        <ImageWithFallback
                                          src={getFotoPath(parcaBilgisi.foto_path)}
                                          alt={task.name}
                                          imgStyle={{ 
                                            maxWidth: '400px', 
                                            maxHeight: '400px', 
                                            objectFit: 'contain'
                                          }}
                                          fallbackText="Parça görseli yüklenemedi"
                                        />
                                      </Box>
                                    }
                                    componentsProps={{
                                      tooltip: {
                                        sx: {
                                          bgcolor: 'white',
                                          '& .MuiTooltip-arrow': {
                                            color: 'white',
                                          },
                                          maxWidth: 'none !important',
                                          boxShadow: 5,
                                          p: 1
                                        }
                                      }
                                    }}
                                    arrow
                                    placement="top"
                                    enterDelay={500}
                                  >
                                    <Box 
                                      sx={{ 
                                        width: '100%', 
                                        height: 120, 
                                        cursor: 'pointer',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&:hover': { opacity: 0.8 }
                                      }}
                                      onClick={() => window.open(getFotoPath(parcaBilgisi.foto_path), '_blank')}
                                    >
                                      <img
                                        src={getFotoPath(parcaBilgisi.foto_path)}
                                        alt={task.name}
                                        style={{
                                          width: '100%',
                                          height: '100%',
                                          objectFit: 'cover'
                                        }}
                                      />
                                    </Box>
                                  </Tooltip>
                                </CardMedia>
                              )}

                              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Stack spacing={1}>
                                  {/* Header */}
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box>
                                      <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, color: 'primary.main' }}>
                                        #{task.work_order_no}
                                      </Typography>
                                    </Box>
                                    <Chip
                                      label={task.priority?.toUpperCase() || 'NORMAL'}
                                      size="small"
                                      sx={{
                                        backgroundColor: priorityColor,
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '0.7rem',
                                        height: 20
                                      }}
                                    />
                                  </Box>

                                  {/* Task Name */}
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      fontWeight: 500,
                                      lineHeight: 1.2,
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      minHeight: '2.4em'
                                    }}
                                  >
                                    {task.name}
                                  </Typography>

                                  {/* Status and Details Row */}
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Chip
                                      label={task.status}
                                      size="small"
                                      sx={{
                                        backgroundColor: statusColor,
                                        color: 'white',
                                        fontSize: '0.65rem',
                                        height: 18
                                      }}
                                    />
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                        <Typography variant="caption" color="text.secondary">
                                          {task.duration}h
                                        </Typography>
                                      </Box>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                        <Typography variant="caption" color="text.secondary">
                                          {task.quantity}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </Box>

                                  {/* Material Info */}
                                  {(task.material || task.parca_kodu) && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      {parcaBilgisi && parcaBilgisi.foto_path && (
                                        <ImageIcon sx={{ fontSize: 14, color: 'success.main' }} />
                                      )}
                                      <Typography 
                                        variant="caption" 
                                        color="text.secondary"
                                        sx={{ 
                                          backgroundColor: alpha('#f5f5f5', 0.8),
                                          p: 0.5,
                                          borderRadius: 0.5,
                                          fontSize: '0.65rem',
                                          flex: 1
                                        }}
                                      >
                                        {task.parca_kodu || task.material}
                                      </Typography>
                                    </Box>
                                  )}

                                  {/* Delivery Date */}
                                  {task.delivery_date && (
                                    <Typography variant="caption" color="warning.main" sx={{ fontSize: '0.65rem' }}>
                                      📅 {new Date(task.delivery_date).toLocaleDateString('tr-TR')}
                                    </Typography>
                                  )}
                                </Stack>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      );
                    })
                  )}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </Box>
        ))}
      </DragDropContext>

      {/* Legend */}
      <Box sx={{ mt: 3, p: 2, backgroundColor: alpha('#f5f5f5', 0.5) }}>
        <Typography variant="subtitle2" gutterBottom>
          Renk Açıklamaları:
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, backgroundColor: '#4caf50', borderRadius: 0.5 }} />
            <Typography variant="caption">Tamamlandı</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, backgroundColor: '#2196f3', borderRadius: 0.5 }} />
            <Typography variant="caption">Devam Ediyor</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, backgroundColor: '#ff9800', borderRadius: 0.5 }} />
            <Typography variant="caption">Beklemede</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, backgroundColor: '#f44336', borderRadius: 0.5 }} />
            <Typography variant="caption">Acil Öncelik</Typography>
          </Box>
        </Box>
      </Box>

      {/* Task Context Menu */}
      <TaskContextMenu
        anchorEl={contextMenu.anchorEl}
        open={contextMenu.open}
        onClose={handleContextMenuClose}
        task={contextMenu.task}
        workstation={contextMenu.workstation}
        onEditTask={handleTaskEdit}
        onDeleteTask={handleTaskDelete}
        onDuplicateTask={handleTaskDuplicate}
        onUpdateTaskStatus={handleTaskStatusUpdate}
      />
    </Box>
  );
};

export default TimelineGanttChart;