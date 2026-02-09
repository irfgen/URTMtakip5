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
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import SettingsIcon from '@mui/icons-material/Settings';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import BarChartIcon from '@mui/icons-material/BarChart';

const OzelRaporlar = () => {
  const [reportType, setReportType] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  
  const handleReportTypeChange = (event) => {
    setReportType(event.target.value);
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <SettingsIcon sx={{ mr: 1 }} /> 
          Özel Raporlar
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
                <MenuItem value="kombine-analiz">Kombine Analiz Raporu</MenuItem>
                <MenuItem value="performans-ozet">Performans Özet Raporu</MenuItem>
                <MenuItem value="ozel-metrikler">Özel Metrikler Raporu</MenuItem>
                <MenuItem value="karsilastirmali">Karşılaştırmalı Analiz</MenuItem>
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
              startIcon={<PrintIcon />}
              sx={{ mr: 1 }}
            >
              Yazdır
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
          Özel rapor türünü seçip tarih aralığını belirledikten sonra raporu oluşturabilirsiniz.
        </Typography>
      </Box>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detaylı Analiz Raporu
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
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Özel Metrikler
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Metrik</TableCell>
                      <TableCell align="right">Değer</TableCell>
                      <TableCell align="right">Hedef</TableCell>
                      <TableCell align="right">Durum</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Toplam Verimlilik</TableCell>
                      <TableCell align="right">84.5%</TableCell>
                      <TableCell align="right">85%</TableCell>
                      <TableCell align="right">⚠️</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Ortalama İşlem Süresi</TableCell>
                      <TableCell align="right">15.2 dk</TableCell>
                      <TableCell align="right">17 dk</TableCell>
                      <TableCell align="right">✅</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Kayıp Oranı</TableCell>
                      <TableCell align="right">4.3%</TableCell>
                      <TableCell align="right">5%</TableCell>
                      <TableCell align="right">✅</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Planlanan/Gerçekleşen</TableCell>
                      <TableCell align="right">92.8%</TableCell>
                      <TableCell align="right">90%</TableCell>
                      <TableCell align="right">✅</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OzelRaporlar;
