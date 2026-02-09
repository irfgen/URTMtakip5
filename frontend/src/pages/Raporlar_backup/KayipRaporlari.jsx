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
  TableRow,
  Chip
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PieChartIcon from '@mui/icons-material/PieChart';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';

const KayipRaporlari = () => {
  const [reportType, setReportType] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const [tezgahId, setTezgahId] = useState('');

  const handleReportTypeChange = (event) => {
    setReportType(event.target.value);
  };

  const handleTezgahChange = (event) => {
    setTezgahId(event.target.value);
  };

  // Örnek Kayıp/Fire verileri
  const mockData = [
    { 
      id: 1, 
      tezgahAdi: 'CNC 1', 
      tarih: '2025-04-01', 
      sure: '3.5 saat', 
      nedeni: 'Arıza - Motor Sorunu', 
      etki: 'Üretimde 15% Kayıp', 
      maliyetEtkisi: '4200 TL' 
    },
    { 
      id: 2, 
      tezgahAdi: 'Torna 2', 
      tarih: '2025-04-02', 
      sure: '2 saat', 
      nedeni: 'Plansız Bakım', 
      etki: 'Üretimde 8% Kayıp', 
      maliyetEtkisi: '1800 TL' 
    },
    { 
      id: 3, 
      tezgahAdi: 'Freze 1', 
      tarih: '2025-04-02', 
      sure: '4 saat', 
      nedeni: 'Operatör Hatası', 
      etki: 'Üretimde 20% Kayıp', 
      maliyetEtkisi: '5500 TL' 
    },
    { 
      id: 4, 
      tezgahAdi: 'CNC 3', 
      tarih: '2025-04-03', 
      sure: '1.5 saat', 
      nedeni: 'Setup Süresi', 
      etki: 'Üretimde 5% Kayıp', 
      maliyetEtkisi: '1100 TL' 
    },
  ];

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <ErrorOutlineIcon sx={{ mr: 1 }} color="error" /> 
          Kayıp Raporları
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
                <MenuItem value="durus-analizi">Duruş Analizi</MenuItem>
                <MenuItem value="fire-analizi">Fire Analizi</MenuItem>
                <MenuItem value="ariza-raporu">Arıza Raporu</MenuItem>
                <MenuItem value="bakim-raporu">Bakım Raporu</MenuItem>
                <MenuItem value="kalite-ret">Kalite Ret Raporu</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Tezgah</InputLabel>
              <Select
                value={tezgahId}
                label="Tezgah"
                onChange={handleTezgahChange}
              >
                <MenuItem value="">Tüm Tezgahlar</MenuItem>
                <MenuItem value="cnc1">CNC 1</MenuItem>
                <MenuItem value="cnc2">CNC 2</MenuItem>
                <MenuItem value="cnc3">CNC 3</MenuItem>
                <MenuItem value="torna1">Torna 1</MenuItem>
                <MenuItem value="torna2">Torna 2</MenuItem>
                <MenuItem value="freze1">Freze 1</MenuItem>
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
              startIcon={<PieChartIcon />}
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

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper>
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Tezgah</TableCell>
                    <TableCell>Tarih</TableCell>
                    <TableCell>Süre</TableCell>
                    <TableCell>Nedeni</TableCell>
                    <TableCell>Etki</TableCell>
                    <TableCell>Maliyet Etkisi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockData.map((row) => (
                    <TableRow
                      key={row.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.tezgahAdi}</TableCell>
                      <TableCell>{row.tarih}</TableCell>
                      <TableCell>{row.sure}</TableCell>
                      <TableCell>
                        <Chip 
                          label={row.nedeni} 
                          color={row.nedeni.includes('Arıza') ? 'error' : 
                                row.nedeni.includes('Bakım') ? 'info' : 
                                row.nedeni.includes('Operatör') ? 'warning' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{row.etki}</TableCell>
                      <TableCell>{row.maliyetEtkisi}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Kayıp Nedenleri Dağılımı
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
                Tezgah Bazında Kayıp Oranları
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
                <DonutLargeIcon sx={{ fontSize: 80, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default KayipRaporlari;