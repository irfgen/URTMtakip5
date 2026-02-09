import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, IconButton, Button, useMediaQuery, TextField, Stack, Chip, CircularProgress, Tabs, Tab } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BarChartIcon from '@mui/icons-material/BarChart';
import ViewListIcon from '@mui/icons-material/ViewList';
import { useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import tezgahRaporAPI from '../api/tezgahRaporAPI';
import TezgahZamanCizelgesi from './TezgahZamanCizelgesi';

const renkler = {
  run: '#e8f5e9', // yeşil ton
  stop: '#ffebee' // kırmızı ton
};

const kenarRenkler = {
  run: '#43a047',
  stop: '#e53935'
};

const TezgahRaporuModal = ({ open, onClose, tezgah, defaultDate }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [tarih, setTarih] = useState(defaultDate || dayjs().format('YYYY-MM-DD'));
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (!open || !tezgah?.tezgah_id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await tezgahRaporAPI.getTimeline(tezgah.tezgah_id, tarih);
        const items = Array.isArray(res.data?.timeline) ? res.data.timeline : [];
        setTimeline(items);
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Veri alınamadı');
        setTimeline([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [open, tezgah?.tezgah_id, tarih]);

  const toplamRun = useMemo(() => timeline.filter(t => t.type === 'run').reduce((a, b) => a + (b.minutes || 0), 0), [timeline]);
  const toplamStop = useMemo(() => timeline.filter(t => t.type === 'stop').reduce((a, b) => a + (b.minutes || 0), 0), [timeline]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" fullScreen={fullScreen}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6">Tezgah Raporu</Typography>
          <Chip label={tezgah?.tezgah_tanimi || `Tezgah #${tezgah?.tezgah_id || ''}`} size="small" color="primary" variant="outlined" />
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* Üst Bilgi Alanı */}
        <Box display="flex" flexDirection={fullScreen ? 'column' : 'row'} gap={2} alignItems={fullScreen ? 'stretch' : 'center'} justifyContent="space-between" sx={{ mb: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <CalendarTodayIcon fontSize="small" />
            <TextField
              type="date"
              size="small"
              value={tarih}
              onChange={(e) => setTarih(e.target.value)}
              inputProps={{ max: dayjs().format('YYYY-MM-DD') }}
            />
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip icon={<AccessTimeIcon />} label={`Run: ${toplamRun} dk`} color="success" variant="outlined" />
            <Chip icon={<AccessTimeIcon />} label={`Stop: ${toplamStop} dk`} color="error" variant="outlined" />
          </Stack>
        </Box>

        {/* Tab Menü */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons
            allowScrollButtonsMobile
            sx={{
              '& .MuiTab-root': {
                minHeight: 48,
                fontSize: '0.875rem'
              },
              '& .MuiTabs-scrollButtons': {
                '&.Mui-disabled': {
                  opacity: 0.3,
                },
              },
            }}
          >
            <Tab
              icon={<ViewListIcon />}
              label="Liste Görünümü"
              iconPosition="start"
            />
            <Tab
              icon={<BarChartIcon />}
              label="Grafiksel Zaman Çizelgesi"
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* İçerik */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <>
            {/* Liste Görünümü */}
            {activeTab === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: fullScreen ? 'calc(100vh - 280px)' : 520, overflow: 'auto' }}>
                {timeline.length === 0 ? (
                  <Typography color="text.secondary">Gün için kayıt bulunamadı.</Typography>
                ) : (
                  timeline.map((item, idx) => (
                    <Box key={idx} sx={{
                      borderLeft: `4px solid ${kenarRenkler[item.type] || '#90a4ae'}`,
                      backgroundColor: renkler[item.type] || '#eceff1',
                      p: 1.5,
                      borderRadius: 1,
                      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'
                    }}>
                      <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent="space-between">
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {item.type === 'run' ? 'Çalışma' : 'Durma'} ({item.minutes} dk)
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {dayjs(item.start).format('HH:mm')} – {dayjs(item.end).format('HH:mm')}
                          </Typography>
                          {item.type === 'run' && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {`#${item.is_emri_no || item.is_emri_id || '-'} • Parça: ${item.parca_kodu || '-'} • Süre: ${item.minutes} dk`}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </Box>
                  ))
                )}
              </Box>
            )}

            {/* Grafiksel Zaman Çizelgesi */}
            {activeTab === 1 && (
              <Box sx={{
                maxHeight: fullScreen ? 'calc(100vh - 280px)' : 520,
                overflow: 'auto',
                px: 1
              }}>
                <TezgahZamanCizelgesi
                  timeline={timeline}
                  height={Math.min(400, fullScreen ? window.innerHeight - 350 : 400)}
                />
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Kapat</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TezgahRaporuModal;


