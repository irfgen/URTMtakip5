import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
  Autocomplete,
  Paper,
  Divider,
  Alert,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import ListAltIcon from '@mui/icons-material/ListAlt';
import NoteIcon from '@mui/icons-material/Note';

dayjs.locale('tr');

const ExcelIsEmriParametreleriForm = ({
  parcaListesi = [],
  onParametersChange,
  initialParameters = {}
}) => {
  const [parameters, setParameters] = useState({
    teslimTarihi: dayjs().add(7, 'day'), // Varsayılan 1 hafta sonra
    oncelik: 'normal',
    planListeAdi: '',
    aciklama: '',
    uretimPlaniSecimi: 'yeni', // 'mevcut' veya 'yeni'
    mevcutPlanId: null,
    yeniPlanAdi: '',
    yeniPlanAciklama: '',
    ...initialParameters
  });

  const [uretimPlanlari, setUretimPlanlari] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mevcut üretim planlarını yükle
  useEffect(() => {
    const fetchUretimPlanlari = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/uretim-plani');
        if (response.ok) {
          const data = await response.json();
          setUretimPlanlari(data);
        }
      } catch (error) {
        console.error('Üretim planları yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUretimPlanlari();
  }, []);

  // Parametreler değiştiğinde parent'a bildir
  useEffect(() => {
    onParametersChange && onParametersChange(parameters);
  }, [parameters, onParametersChange]);

  const handleParameterChange = (field, value) => {
    setParameters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Öncelik seçenekleri
  const oncelikSecenekleri = [
    { value: 'dusuk', label: 'Düşük', color: '#4caf50' },
    { value: 'normal', label: 'Normal', color: '#2196f3' },
    { value: 'yuksek', label: 'Yüksek', color: '#ff9800' },
    { value: 'acil', label: 'Acil', color: '#f44336' }
  ];

  // Toplam parça ve adet hesaplama
  const toplamParca = parcaListesi.length;
  const toplamAdet = parcaListesi.reduce((sum, parca) => sum + (parca.adet || 0), 0);
  const mevcutParcalar = parcaListesi.filter(p => p.mevcutMu).length;
  const eksikParcalar = toplamParca - mevcutParcalar;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        {/* Özet Bilgiler */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ListAltIcon color="primary" />
            İş Emri Özeti
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <Typography variant="body2" color="textSecondary">Toplam Parça</Typography>
              <Chip label={toplamParca} color="info" size="small" />
            </Grid>
            <Grid item xs={3}>
              <Typography variant="body2" color="textSecondary">Toplam Adet</Typography>
              <Chip label={toplamAdet} color="primary" size="small" />
            </Grid>
            <Grid item xs={3}>
              <Typography variant="body2" color="textSecondary">Mevcut Parça</Typography>
              <Chip label={mevcutParcalar} color="success" size="small" />
            </Grid>
            <Grid item xs={3}>
              <Typography variant="body2" color="textSecondary">Eksik Parça</Typography>
              <Chip label={eksikParcalar} color="error" size="small" />
            </Grid>
          </Grid>
        </Paper>

        {eksikParcalar > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {eksikParcalar} adet eksik parça bulunuyor. Bu parçalar için önce parça oluşturma işlemini tamamlamanız gerekmektedir.
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Sol Kolon - İş Emri Parametreleri */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarTodayIcon color="primary" />
              İş Emri Parametreleri
            </Typography>

            <Grid container spacing={2}>
              {/* Teslim Tarihi */}
              <Grid item xs={12}>
                <DatePicker
                  label="Teslim Tarihi"
                  value={parameters.teslimTarihi}
                  onChange={(newValue) => handleParameterChange('teslimTarihi', newValue)}
                  minDate={dayjs()}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: 'İş emirlerinin teslim edilmesi gereken tarih'
                    }
                  }}
                />
              </Grid>

              {/* Öncelik */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Öncelik</InputLabel>
                  <Select
                    value={parameters.oncelik}
                    onChange={(e) => handleParameterChange('oncelik', e.target.value)}
                    label="Öncelik"
                  >
                    {oncelikSecenekleri.map((oncelik) => (
                      <MenuItem key={oncelik.value} value={oncelik.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PriorityHighIcon sx={{ color: oncelik.color, fontSize: 16 }} />
                          {oncelik.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Plan Liste Adı */}
              <Grid item xs={12}>
                <TextField
                  label="Plan Liste Adı"
                  value={parameters.planListeAdi}
                  onChange={(e) => handleParameterChange('planListeAdi', e.target.value)}
                  fullWidth
                  placeholder="Excel'den alınan iş emirleri"
                  helperText="İş emirleri grubunu tanımlayıcı ad"
                />
              </Grid>

              {/* Açıklama */}
              <Grid item xs={12}>
                <TextField
                  label="Açıklama"
                  value={parameters.aciklama}
                  onChange={(e) => handleParameterChange('aciklama', e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="İş emirleri hakkında ek bilgiler..."
                  InputProps={{
                    startAdornment: <NoteIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Sağ Kolon - Üretim Planı Seçimi */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ListAltIcon color="primary" />
              Üretim Planı Seçimi
            </Typography>

            <RadioGroup
              value={parameters.uretimPlaniSecimi}
              onChange={(e) => handleParameterChange('uretimPlaniSecimi', e.target.value)}
            >
              {/* Mevcut Plana Ekle */}
              <FormControlLabel
                value="mevcut"
                control={<Radio />}
                label="Mevcut plana ekle"
              />
              
              {parameters.uretimPlaniSecimi === 'mevcut' && (
                <Box sx={{ ml: 4, mb: 2 }}>
                  <Autocomplete
                    options={uretimPlanlari}
                    getOptionLabel={(option) => `${option.plan_adi} (${option.makina_grubu})`}
                    value={uretimPlanlari.find(plan => plan.uretim_plani_id === parameters.mevcutPlanId) || null}
                    onChange={(event, newValue) => {
                      handleParameterChange('mevcutPlanId', newValue?.uretim_plani_id || null);
                    }}
                    loading={loading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Üretim Planı Seç"
                        fullWidth
                        helperText="İş emirlerinin ekleneceği mevcut plan"
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {option.plan_adi}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {option.makina_grubu} • {option.durum}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  />
                </Box>
              )}

              <Divider sx={{ my: 1 }} />

              {/* Yeni Plan Oluştur */}
              <FormControlLabel
                value="yeni"
                control={<Radio />}
                label="Yeni plan oluştur"
              />

              {parameters.uretimPlaniSecimi === 'yeni' && (
                <Box sx={{ ml: 4, mt: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Yeni Plan Adı"
                        value={parameters.yeniPlanAdi}
                        onChange={(e) => handleParameterChange('yeniPlanAdi', e.target.value)}
                        fullWidth
                        placeholder="Excel İş Emirleri - {tarih}"
                        helperText="Oluşturulacak yeni planın adı"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Plan Açıklaması"
                        value={parameters.yeniPlanAciklama}
                        onChange={(e) => handleParameterChange('yeniPlanAciklama', e.target.value)}
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Plan hakkında açıklama..."
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </RadioGroup>
          </Grid>
        </Grid>

        {/* Validasyon Uyarıları */}
        <Box sx={{ mt: 3 }}>
          {parameters.uretimPlaniSecimi === 'mevcut' && !parameters.mevcutPlanId && (
            <Alert severity="warning">
              Lütfen iş emirlerinin ekleneceği üretim planını seçin.
            </Alert>
          )}
          
          {parameters.uretimPlaniSecimi === 'yeni' && !parameters.yeniPlanAdi.trim() && (
            <Alert severity="warning">
              Lütfen yeni üretim planı için bir ad girin.
            </Alert>
          )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default ExcelIsEmriParametreleriForm;
