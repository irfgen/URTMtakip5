import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
  Button,
  ButtonGroup,
  Slider,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  IconButton,
  Collapse,
  Stack
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Today as TodayIcon,
  DateRange as DateRangeIcon,
  CalendarMonth as CalendarMonthIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { setSelectedWorkstations, setSelectedStatuses, setDateRange } from '../../store/slices/schedulerSlice';

const AdvancedFilters = ({ onFilterChange, showAdvanced = false }) => {
  const dispatch = useDispatch();
  const { 
    workstations, 
    selectedWorkstations, 
    selectedStatuses, 
    selectedDateRange 
  } = useSelector(state => state.scheduler);

  // Local state
  const [workOrderSearch, setWorkOrderSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState([1, 4]);
  const [durationRange, setDurationRange] = useState([0, 480]); // 0-8 saat
  const [showOnlyConflicts, setShowOnlyConflicts] = useState(false);
  const [quickDateFilter, setQuickDateFilter] = useState('week');
  const [expanded, setExpanded] = useState(showAdvanced);

  // Quick date filters
  const quickDateOptions = [
    { value: 'today', label: 'Bugün', icon: <TodayIcon /> },
    { value: 'week', label: 'Bu Hafta', icon: <DateRangeIcon /> },
    { value: 'month', label: 'Bu Ay', icon: <CalendarMonthIcon /> }
  ];

  // Status options with colors
  const statusOptions = [
    { value: 'planli', label: 'Planlı', color: 'info' },
    { value: 'devam_ediyor', label: 'Devam Ediyor', color: 'warning' },
    { value: 'tamamlandi', label: 'Tamamlandı', color: 'success' },
    { value: 'iptal', label: 'İptal', color: 'error' }
  ];

  // Priority options
  const priorityOptions = [
    { value: 1, label: 'Yüksek', color: 'error' },
    { value: 2, label: 'Orta', color: 'warning' },
    { value: 3, label: 'Normal', color: 'info' },
    { value: 4, label: 'Düşük', color: 'success' }
  ];

  // Quick date range calculator
  const calculateDateRange = (option) => {
    const today = new Date();
    let start, end;

    switch (option) {
      case 'today':
        start = new Date(today);
        end = new Date(today);
        break;
      case 'week':
        start = new Date(today);
        start.setDate(today.getDate() - today.getDay()); // Haftanın başı
        end = new Date(start);
        end.setDate(start.getDate() + 6); // Haftanın sonu
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      default:
        return;
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  // Handle quick date filter
  const handleQuickDateFilter = (option) => {
    setQuickDateFilter(option);
    const dateRange = calculateDateRange(option);
    if (dateRange) {
      dispatch(setDateRange(dateRange));
    }
  };

  // Handle workstation filter
  const handleWorkstationChange = (event) => {
    dispatch(setSelectedWorkstations(event.target.value));
  };

  // Handle status filter
  const handleStatusChange = (event) => {
    dispatch(setSelectedStatuses(event.target.value));
  };

  // Handle date range change
  const handleDateRangeChange = (field, value) => {
    const newDateRange = {
      ...selectedDateRange,
      [field]: value.toISOString().split('T')[0]
    };
    dispatch(setDateRange(newDateRange));
    setQuickDateFilter(''); // Clear quick filter when manual date is set
  };

  // Clear all filters
  const clearAllFilters = () => {
    dispatch(setSelectedWorkstations([]));
    dispatch(setSelectedStatuses(['planli', 'devam_ediyor']));
    setWorkOrderSearch('');
    setPriorityFilter([1, 4]);
    setDurationRange([0, 480]);
    setShowOnlyConflicts(false);
    handleQuickDateFilter('week'); // Reset to default
  };

  // Apply additional filters (will be passed to parent)
  useEffect(() => {
    const additionalFilters = {
      workOrderSearch,
      priorityRange: priorityFilter,
      durationRange,
      showOnlyConflicts
    };

    if (onFilterChange) {
      onFilterChange(additionalFilters);
    }
  }, [workOrderSearch, priorityFilter, durationRange, showOnlyConflicts, onFilterChange]);

  // Format duration for display
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}dk`;
    if (mins === 0) return `${hours}sa`;
    return `${hours}sa ${mins}dk`;
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      {/* Basic Filters Row */}
      <Grid container spacing={2} alignItems="center">
        {/* Quick Date Filters */}
        <Grid item xs={12} sm={6} md={3}>
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            Hızlı Tarih
          </Typography>
          <ButtonGroup size="small" fullWidth>
            {quickDateOptions.map((option) => (
              <Button
                key={option.value}
                variant={quickDateFilter === option.value ? 'contained' : 'outlined'}
                startIcon={option.icon}
                onClick={() => handleQuickDateFilter(option.value)}
                sx={{ fontSize: '0.75rem' }}
              >
                {option.label}
              </Button>
            ))}
          </ButtonGroup>
        </Grid>

        {/* Custom Date Range */}
        <Grid item xs={12} sm={3} md={2}>
          <DatePicker
            label="Başlangıç"
            value={new Date(selectedDateRange.start)}
            onChange={(date) => handleDateRangeChange('start', date)}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />
        </Grid>
        <Grid item xs={12} sm={3} md={2}>
          <DatePicker
            label="Bitiş"
            value={new Date(selectedDateRange.end)}
            onChange={(date) => handleDateRangeChange('end', date)}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />
        </Grid>

        {/* Workstation Multi-Select */}
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Tezgahlar</InputLabel>
            <Select
              multiple
              value={selectedWorkstations}
              onChange={handleWorkstationChange}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.slice(0, 2).map((value) => {
                    const workstation = workstations.find(w => w.id === value);
                    return (
                      <Chip key={value} label={workstation?.name} size="small" />
                    );
                  })}
                  {selected.length > 2 && (
                    <Chip label={`+${selected.length - 2}`} size="small" />
                  )}
                </Box>
              )}
            >
              {workstations.map((ws) => (
                <MenuItem key={ws.id} value={ws.id}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography>{ws.name}</Typography>
                    <Chip
                      label={ws.status === 'musait' ? 'Müsait' :
                            ws.status === 'calisiyor' ? 'Çalışıyor' : 'Bakım'}
                      size="small"
                      color={ws.status === 'musait' ? 'success' :
                            ws.status === 'calisiyor' ? 'warning' : 'error'}
                    />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Status Filter */}
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Durumlar</InputLabel>
            <Select
              multiple
              value={selectedStatuses}
              onChange={handleStatusChange}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const option = statusOptions.find(o => o.value === value);
                    return (
                      <Chip 
                        key={value} 
                        label={option?.label} 
                        size="small" 
                        color={option?.color}
                      />
                    );
                  })}
                </Box>
              )}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Chip 
                    label={option.label} 
                    size="small" 
                    color={option.color}
                    variant="outlined"
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Expand/Collapse Advanced Filters */}
        <Grid item xs={12} sm={12} md={1}>
          <Box display="flex" justifyContent="center">
            <IconButton
              onClick={() => setExpanded(!expanded)}
              color="primary"
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Grid>
      </Grid>

      {/* Advanced Filters */}
      <Collapse in={expanded}>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" color="primary" mb={2}>
          <FilterListIcon fontSize="small" sx={{ mr: 1 }} />
          Gelişmiş Filtreler
        </Typography>

        <Grid container spacing={3}>
          {/* Work Order Search */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="İş Emri Arama"
              value={workOrderSearch}
              onChange={(e) => setWorkOrderSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                endAdornment: workOrderSearch && (
                  <IconButton 
                    size="small" 
                    onClick={() => setWorkOrderSearch('')}
                  >
                    <ClearIcon />
                  </IconButton>
                )
              }}
              placeholder="IE25030001"
            />
          </Grid>

          {/* Priority Range */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary" display="block">
              Öncelik Aralığı
            </Typography>
            <Box sx={{ px: 2, pt: 1 }}>
              <Slider
                value={priorityFilter}
                onChange={(event, newValue) => setPriorityFilter(newValue)}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => priorityOptions.find(o => o.value === value)?.label}
                min={1}
                max={4}
                step={1}
                marks={priorityOptions.map(option => ({
                  value: option.value,
                  label: option.label
                }))}
              />
            </Box>
          </Grid>

          {/* Duration Range */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary" display="block">
              Süre Aralığı
            </Typography>
            <Box sx={{ px: 2, pt: 1 }}>
              <Slider
                value={durationRange}
                onChange={(event, newValue) => setDurationRange(newValue)}
                valueLabelDisplay="auto"
                valueLabelFormat={formatDuration}
                min={0}
                max={480}
                step={30}
                marks={[
                  { value: 0, label: '0' },
                  { value: 240, label: '4sa' },
                  { value: 480, label: '8sa' }
                ]}
              />
            </Box>
          </Grid>

          {/* Special Filters */}
          <Grid item xs={12} sm={6} md={3}>
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showOnlyConflicts}
                    onChange={(e) => setShowOnlyConflicts(e.target.checked)}
                    size="small"
                  />
                }
                label="Sadece Çakışanları Göster"
              />
            </Stack>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {workstations.filter(w => selectedWorkstations.length === 0 || selectedWorkstations.includes(w.id)).length} tezgah,{' '}
                {selectedStatuses.length} durum seçili
              </Typography>
              
              <Button
                startIcon={<ClearIcon />}
                onClick={clearAllFilters}
                size="small"
                color="secondary"
              >
                Tüm Filtreleri Temizle
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Collapse>
    </Paper>
  );
};

export default AdvancedFilters;