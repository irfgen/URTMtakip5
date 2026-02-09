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
import FactoryIcon from '@mui/icons-material/Factory';
import BarChartIcon from '@mui/icons-material/BarChart';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import InsightsIcon from '@mui/icons-material/Insights';
import TimelineIcon from '@mui/icons-material/Timeline';

const UretimRaporlari = () => {
  const [reportType, setReportType] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const [tezgahTipi, setTezgahTipi] = useState('');
  
  const handleReportTypeChange = (event) => {
    setReportType(event.target.value);
  };

  const handleTezgahTipiChange = (event) => {
    setTezgahTipi(event.target.value);
  };

  // Örnek veri
  const mockData = [
    { tezgah: 'Tezgah 1', toplamSaat: 168, calisma: 120, duruslar: 24, bakim: 16, ariza: 8, oee: 71.4 },
    { tezgah: 'Tezgah 2', toplamSaat: 168, calisma: 140, duruslar: 15, bakim: 8, ariza: 5, oee: 83.3 },
    { tezgah: 'Tezgah 3', toplamSaat: 168, calisma: 110, duruslar: 30, bakim: 20, ariza: 8, oee: 65.5 },
    { tezgah: 'Tezgah 4', toplamSaat: 168, calisma: 150, duruslar: 10, bakim: 5, ariza: 3, oee: 89.3 },
  ];

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <FactoryIcon sx={{ mr: 1 }} /> 
          Üretim Raporları
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Rapor Türü</InputLabel>
              <Select
                value={reportType}
                label="Rapor Türü"
                onChange={handleReportTypeChange}
              >
                <MenuItem value="oee">OEE (Ekipman Etkinliği)</MenuItem>
                <MenuItem value="uretim-performans">Üretim Performans Analizi</MenuItem>
                <MenuItem value="kapasite-kullanim">Kapasite Kullanım Oranları</MenuItem>
                <MenuItem value="uretim-plan-gerceklesme">Üretim Plan Gerçekleşme</MenuItem>
                <MenuItem value="siparis-termin">Sipariş Termin Analizi</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Tezgah Tipi</InputLabel>
              <Select
                value={tezgahTipi}
                label="Tezgah Tipi"
                onChange={handleTezgahTipiChange}
              >
                <MenuItem value="tumu">Tümü</MenuItem>
                <MenuItem value="cnc">CNC</MenuItem>
                <MenuItem value="torna">Torna</MenuItem>
                <MenuItem value="freze">Freze</MenuItem>
                <MenuItem value="taslama">Taşlama</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
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
          
          <Grid item xs={12} md={3}>
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
      
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tezgah</TableCell>
                    <TableCell align="right">Toplam Saat</TableCell>
                    <TableCell align="right">Çalışma (s)</TableCell>
                    <TableCell align="right">Duruşlar (s)</TableCell>
                    <TableCell align="right">Bakım (s)</TableCell>
                    <TableCell align="right">Arıza (s)</TableCell>
                    <TableCell align="right">OEE (%)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockData.map((row) => (
                    <TableRow
                      key={row.tezgah}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {row.tezgah}
                      </TableCell>
                      <TableCell align="right">{row.toplamSaat}</TableCell>
                      <TableCell align="right">{row.calisma}</TableCell>
                      <TableCell align="right">{row.duruslar}</TableCell>
                      <TableCell align="right">{row.bakim}</TableCell>
                      <TableCell align="right">{row.ariza}</TableCell>
                      <TableCell align="right">{row.oee}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        
        <Grid item xs={12} lg={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                OEE (Ekipman Etkinliği)
              </Typography>
              <Box 
                sx={{ 
                  height: 220, 
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                  borderRadius: 1
                }}
              >
                <InsightsIcon sx={{ fontSize: 80, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Verimlilik Trendi
              </Typography>
              <Box 
                sx={{ 
                  height: 220, 
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                  borderRadius: 1
                }}
              >
                <TimelineIcon sx={{ fontSize: 80, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UretimRaporlari;