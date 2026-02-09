import React from 'react';
import ParcaBazliIsEmirleriRaporu from '../components/ParcaBazliIsEmirleriRaporu';
import VardiyaTezgahRaporu from '../components/Raporlar/VardiyaTezgahRaporu';
import UretimZamanCizelgesi from '../components/UretimZamanCizelgesi'; // Yeni component (placeholder)
import UretimIstatistikleri from '../components/Raporlar/UretimIstatistikleri'; // Üretim İstatistikleri component
import GunlukVardiyaRaporu from './GunlukVardiyaRaporu'; // Günlük Vardiya Raporu
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Breadcrumbs,
  Link,
  Tabs,
  Tab
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

/**
 * Basitleştirilmiş Raporlar Modülü
 * Bu modül şu an için temel yapıda hazırlanmıştır ve gerektiğinde genişletilebilir.
 */
const Raporlar = () => {
  const [selectedTab, setSelectedTab] = React.useState(0);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link color="inherit" href="/">
          Ana Sayfa
        </Link>
        <Typography color="text.primary">Raporlar</Typography>
      </Breadcrumbs>
      
      <Box display="flex" alignItems="center" mb={3}>
        <AssessmentIcon fontSize="large" sx={{ mr: 1 }} />
        <Typography variant="h4">
          Raporlar
        </Typography>
      </Box>
      
      {/* Sekmeler */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Vardiya Bazlı Tezgah Raporu" />
          <Tab label="Parça Bazlı İş Emirleri" />
          <Tab label="Tezgah Bazlı Üretim Zaman Çizelgesi" />
          <Tab label="Üretim İstatistikleri" />
          <Tab label="Günlük Vardiya Raporu" icon={<CalendarTodayIcon />} />
        </Tabs>
      </Paper>

      {/* Sekme İçerikleri */}
      {selectedTab === 0 && (
        <VardiyaTezgahRaporu />
      )}

      {selectedTab === 1 && (
        <Paper sx={{ p: 3, mb: 2 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Parça Bazlı İş Emirleri Raporu
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Parça seçimine göre iş emirlerini listeleme, durum takibi ve rapor oluşturma.
              </Typography>
              <ParcaBazliIsEmirleriRaporu />
            </CardContent>
          </Card>
        </Paper>
      )}

      {selectedTab === 2 && (
        <Box sx={{ p: 3 }}>
          <UretimZamanCizelgesi />
        </Box>
      )}

      {selectedTab === 3 && (
        <Box sx={{ p: 3 }}>
          <UretimIstatistikleri />
        </Box>
      )}

      {selectedTab === 4 && (
        <GunlukVardiyaRaporu />
      )}
    </Box>
  );
};

export default Raporlar;