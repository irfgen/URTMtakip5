import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Divider,
  Chip,
  Stack,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Close as CloseIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { tr } from 'date-fns/locale';

const IsEmriFiltreleMobile = ({ 
  open, 
  onClose, 
  filters, 
  onFiltersChange,
  onClearFilters,
  uretimPlanlari = [],
  durumOptions = []
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleDateFilterChange = (key, value) => {
    const newFilters = { 
      ...localFilters, 
      dateFilters: {
        ...localFilters.dateFilters,
        [key]: value
      }
    };
    setLocalFilters(newFilters);
  };

  const handleStatusFilterChange = (status, checked) => {
    const currentStatuses = localFilters.statusFilters || [];
    const newStatuses = checked 
      ? [...currentStatuses, status]
      : currentStatuses.filter(s => s !== status);
    
    handleFilterChange('statusFilters', newStatuses);
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      uretimPlaniId: '',
      statusFilters: [],
      dateFilters: {
        teslimTarihiStart: '',
        teslimTarihiEnd: '',
        siparisTarihiStart: '',
        siparisTarihiEnd: ''
      },
      showCompleted: false,
      hideAssigned: false
    };
    setLocalFilters(clearedFilters);
    onClearFilters();
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.search?.trim()) count++;
    if (localFilters.uretimPlaniId) count++;
    if (localFilters.statusFilters?.length > 0) count++;
    if (localFilters.dateFilters?.teslimTarihiStart || localFilters.dateFilters?.teslimTarihiEnd) count++;
    if (localFilters.dateFilters?.siparisTarihiStart || localFilters.dateFilters?.siparisTarihiEnd) count++;
    if (localFilters.showCompleted) count++;
    if (localFilters.hideAssigned) count++;
    return count;
  };

  return (
    <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '90vh',
            overflow: 'auto'
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Box display="flex" alignItems="center">
              <FilterIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                İş Emri Filtreleri
              </Typography>
              {getActiveFilterCount() > 0 && (
                <Chip 
                  label={getActiveFilterCount()} 
                  size="small" 
                  color="primary" 
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Basic Filters */}
          <Stack spacing={3}>
            {/* Arama */}
            <TextField
              fullWidth
              label="Arama"
              placeholder="İş no, iş adı, parça kodu..."
              value={localFilters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              variant="outlined"
            />

            {/* Üretim Planı */}
            <FormControl fullWidth>
              <InputLabel>Üretim Planı</InputLabel>
              <Select
                value={localFilters.uretimPlaniId || ''}
                onChange={(e) => handleFilterChange('uretimPlaniId', e.target.value)}
                label="Üretim Planı"
              >
                <MenuItem value="">
                  <em>Tümü</em>
                </MenuItem>
                {uretimPlanlari.map((plan) => (
                  <MenuItem key={plan.id} value={plan.id}>
                    {plan.ozel_liste_adi || `Plan #${plan.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Quick Toggles */}
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={localFilters.showCompleted || false}
                    onChange={(e) => handleFilterChange('showCompleted', e.target.checked)}
                  />
                }
                label="Tamamlananları Göster"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={localFilters.hideAssigned || false}
                    onChange={(e) => handleFilterChange('hideAssigned', e.target.checked)}
                  />
                }
                label="Aktif İşleri Gizle"
              />
            </FormGroup>
          </Stack>

          {/* Advanced Filters */}
          <Box sx={{ mt: 3 }}>
            {/* Status Filters */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Durum Filtreleri</Typography>
                {localFilters.statusFilters?.length > 0 && (
                  <Chip 
                    label={localFilters.statusFilters.length} 
                    size="small" 
                    sx={{ ml: 1 }}
                  />
                )}
              </AccordionSummary>
              <AccordionDetails>
                <FormGroup>
                  {durumOptions.map((durum) => (
                    <FormControlLabel
                      key={durum.durum_kodu}
                      control={
                        <Checkbox
                          checked={localFilters.statusFilters?.includes(durum.durum_kodu) || false}
                          onChange={(e) => handleStatusFilterChange(durum.durum_kodu, e.target.checked)}
                        />
                      }
                      label={durum.durum_adi}
                    />
                  ))}
                </FormGroup>
              </AccordionDetails>
            </Accordion>

            {/* Date Filters */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Tarih Filtreleri</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <Typography variant="subtitle2">Teslim Tarihi</Typography>
                  <Box display="flex" gap={1}>
                    <TextField
                      label="Başlangıç"
                      type="date"
                      value={localFilters.dateFilters?.teslimTarihiStart || ''}
                      onChange={(e) => handleDateFilterChange('teslimTarihiStart', e.target.value)}
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Bitiş"
                      type="date"
                      value={localFilters.dateFilters?.teslimTarihiEnd || ''}
                      onChange={(e) => handleDateFilterChange('teslimTarihiEnd', e.target.value)}
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>

                  <Typography variant="subtitle2" sx={{ mt: 2 }}>Sipariş Tarihi</Typography>
                  <Box display="flex" gap={1}>
                    <TextField
                      label="Başlangıç"
                      type="date"
                      value={localFilters.dateFilters?.siparisTarihiStart || ''}
                      onChange={(e) => handleDateFilterChange('siparisTarihiStart', e.target.value)}
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Bitiş"
                      type="date"
                      value={localFilters.dateFilters?.siparisTarihiEnd || ''}
                      onChange={(e) => handleDateFilterChange('siparisTarihiEnd', e.target.value)}
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              sx={{ flex: 1 }}
            >
              Temizle
            </Button>
            <Button
              variant="contained"
              onClick={handleApplyFilters}
              sx={{ flex: 2 }}
            >
              Filtreleri Uygula
            </Button>
          </Box>
        </Box>
      </Drawer>
  );
};

export default IsEmriFiltreleMobile;