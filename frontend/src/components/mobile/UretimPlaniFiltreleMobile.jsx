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
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
  Autocomplete
} from '@mui/material';
import {
  Close as CloseIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';
import axios from 'axios';

const UretimPlaniFiltreleMobile = ({ 
  open, 
  onClose, 
  filters, 
  onFiltersChange,
  onClearFilters 
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  
  // Dropdown data
  const [makinalar, setMakinalar] = useState([]);
  const [olusturanlar, setOlusturanlar] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Extended filters
  const [extendedFilters, setExtendedFilters] = useState({
    baslangic_tarihi: null,
    bitis_tarihi: null,
    makina_id: '',
    olustu_kisi: '',
    kritik_stok: false,
    sadece_aktif: false
  });

  // Load dropdown data when modal opens
  useEffect(() => {
    if (open) {
      loadDropdownData();
    }
  }, [open]);

  const loadDropdownData = async () => {
    try {
      setLoadingData(true);
      const [makinalearRes, olusturanlarRes] = await Promise.all([
        axios.get('/api/tezgahlar?mobile=true'),
        axios.get('/api/uretim-plani/olusturanlar')
      ]);
      
      setMakinalar(makinalearRes.data.data || makinalearRes.data);
      setOlusturanlar(olusturanlarRes.data.data || olusturanlarRes.data);
    } catch (error) {
      console.error('Dropdown data yüklenirken hata:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleExtendedFilterChange = (key, value) => {
    const newExtendedFilters = { ...extendedFilters, [key]: value };
    setExtendedFilters(newExtendedFilters);
  };

  const handleApplyFilters = () => {
    // Combine basic and extended filters
    const allFilters = {
      ...localFilters,
      ...extendedFilters,
      baslangic_tarihi: extendedFilters.baslangic_tarihi ? 
        extendedFilters.baslangic_tarihi.toISOString().split('T')[0] : '',
      bitis_tarihi: extendedFilters.bitis_tarihi ? 
        extendedFilters.bitis_tarihi.toISOString().split('T')[0] : ''
    };
    
    onFiltersChange(allFilters);
    onClose();
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      durum: '',
      ozelListeAdi: ''
    };
    const clearedExtendedFilters = {
      baslangic_tarihi: null,
      bitis_tarihi: null,
      makina_id: '',
      olustu_kisi: '',
      kritik_stok: false,
      sadece_aktif: false
    };
    
    setLocalFilters(clearedFilters);
    setExtendedFilters(clearedExtendedFilters);
    onClearFilters();
  };

  const durumOptions = [
    'Aktif',
    'Tamamlandı',
    'Beklemede',
    'İptal',
    'Devam Ediyor'
  ];

  const getActiveFilterCount = () => {
    const basicCount = Object.values(localFilters).filter(value => 
      value && value.toString().trim() !== ''
    ).length;
    
    const extendedCount = Object.entries(extendedFilters).filter(([key, value]) => {
      if (key === 'kritik_stok' || key === 'sadece_aktif') {
        return value === true;
      }
      return value && value.toString().trim() !== '';
    }).length;
    
    return basicCount + extendedCount;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '90vh'
          }
        }}
      >
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center">
            <FilterIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              Filtreler
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

        {/* Loading Indicator */}
        {loadingData && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Box display="flex" alignItems="center">
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Filtre seçenekleri yükleniyor...
            </Box>
          </Alert>
        )}

        {/* Filters */}
        <Stack spacing={3}>
          {/* Temel Filtreler */}
          <Typography variant="h6" color="primary">
            Temel Filtreler
          </Typography>

          {/* Arama */}
          <TextField
            fullWidth
            label="Arama"
            placeholder="Plan adı, makina adı veya duruma göre ara..."
            value={localFilters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            variant="outlined"
          />

          {/* Özel Liste Adı */}
          <TextField
            fullWidth
            label="Özel Liste Adı"
            placeholder="Özel liste adına göre filtrele..."
            value={localFilters.ozelListeAdi || ''}
            onChange={(e) => handleFilterChange('ozelListeAdi', e.target.value)}
            variant="outlined"
          />

          {/* Durum */}
          <FormControl fullWidth>
            <InputLabel>Durum</InputLabel>
            <Select
              value={localFilters.durum || ''}
              onChange={(e) => handleFilterChange('durum', e.target.value)}
              label="Durum"
            >
              <MenuItem value="">
                <em>Tümü</em>
              </MenuItem>
              {durumOptions.map((durum) => (
                <MenuItem key={durum} value={durum}>
                  {durum}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider />

          {/* Gelişmiş Filtreler */}
          <Typography variant="h6" color="secondary">
            Gelişmiş Filtreler
          </Typography>

          {/* Tarih Aralığı */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Oluşturma Tarihi Aralığı
            </Typography>
            <Stack spacing={2}>
              <DatePicker
                label="Başlangıç Tarihi"
                value={extendedFilters.baslangic_tarihi}
                onChange={(newValue) => handleExtendedFilterChange('baslangic_tarihi', newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: "outlined",
                    size: "small"
                  }
                }}
              />
              <DatePicker
                label="Bitiş Tarihi"
                value={extendedFilters.bitis_tarihi}
                onChange={(newValue) => handleExtendedFilterChange('bitis_tarihi', newValue)}
                minDate={extendedFilters.baslangic_tarihi}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: "outlined",
                    size: "small"
                  }
                }}
              />
            </Stack>
          </Box>

          {/* Makina Filtresi */}
          <FormControl fullWidth>
            <InputLabel>Makina</InputLabel>
            <Select
              value={extendedFilters.makina_id || ''}
              onChange={(e) => handleExtendedFilterChange('makina_id', e.target.value)}
              label="Makina"
              disabled={loadingData}
            >
              <MenuItem value="">
                <em>Tüm Makinalar</em>
              </MenuItem>
              {makinalar.map((makina) => (
                <MenuItem key={makina.id} value={makina.id}>
                  {makina.name} {makina.model && `(${makina.model})`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Oluşturan Kişi */}
          <Autocomplete
            options={olusturanlar}
            getOptionLabel={(option) => option.olustu_kisi || option}
            value={extendedFilters.olustu_kisi || null}
            onChange={(event, newValue) => {
              handleExtendedFilterChange('olustu_kisi', newValue?.olustu_kisi || newValue || '');
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Oluşturan Kişi"
                placeholder="Planı oluşturan kişiye göre filtrele"
                variant="outlined"
                fullWidth
              />
            )}
            disabled={loadingData}
          />

          {/* Switch Filtreler */}
          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={extendedFilters.kritik_stok}
                  onChange={(e) => handleExtendedFilterChange('kritik_stok', e.target.checked)}
                />
              }
              label="Sadece Kritik Stok Planları"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={extendedFilters.sadece_aktif}
                  onChange={(e) => handleExtendedFilterChange('sadece_aktif', e.target.checked)}
                />
              }
              label="Sadece Aktif Planlar"
            />
          </Stack>
        </Stack>

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
  </LocalizationProvider>
);
};

export default UretimPlaniFiltreleMobile;