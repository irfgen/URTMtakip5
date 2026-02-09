import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TextField,
  Divider
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

const MaliyetRaporlari = () => {
  const [reportType, setReportType] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  
  const handleReportTypeChange = (event) => {
    setReportType(event.target.value);
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <AttachMoneyIcon sx={{ mr: 1 }} /> 
          Maliyet Raporları
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Rapor Türü</InputLabel>
              <Select
                value={reportType}
                label="Rapor Türü"
                onChange={handleReportTypeChange}
              >
                <MenuItem value="urun-maliyeti">Ürün Maliyeti Analizi</MenuItem>
                <MenuItem value="iscilik-maliyeti">İşçilik Maliyeti Analizi</MenuItem>
                <MenuItem value="hammadde">Hammadde Maliyet Analizi</MenuItem>
                <MenuItem value="genel-gider">Genel Gider Analizi</MenuItem>
                <MenuItem value="karlilik">Karlılık Raporu</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Başlangıç Tarihi"
                value={dateRange[0]}
                onChange={(newValue) => {
                  setDateRange([newValue, dateRange[1]]);
                }}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Bitiş Tarihi"
                value={dateRange[1]}
                onChange={(newValue) => {
                  setDateRange([dateRange[0], newValue]);
                }}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<BarChartIcon />}
              sx={{ mr: 1 }}
            >
              Raporu Oluştur
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<FileDownloadIcon />}
            >
              Excel İndir
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <Typography variant="body1" color="text.secondary">
          Rapor türü seçip tarih aralığını belirledikten sonra raporu oluşturabilirsiniz.
        </Typography>
      </Box>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Maliyet Dağılımı
              </Typography>
              <Box 
                sx={{ 
                  height: 300, 
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                  borderRadius: 1
                }}
              >
                <PieChartIcon sx={{ fontSize: 80, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Maliyet Trendi
              </Typography>
              <Box 
                sx={{ 
                  height: 300, 
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                  borderRadius: 1
                }}
              >
                <BarChartIcon sx={{ fontSize: 80, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MaliyetRaporlari;