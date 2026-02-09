import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import {
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import VardiyaYonetimi from './VardiyaYonetimi';
import PersonelYonetimi from './PersonelYonetimi';

function VardiyaYonetimiAna() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );

  return (
    <Box>
      <Typography variant="h4" component="h1" mb={3}>
        <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Vardiya Yönetimi
      </Typography>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons
        allowScrollButtonsMobile
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          mb: 3,
          '& .MuiTabs-scrollButtons': {
            '&.Mui-disabled': {
              opacity: 0.3,
            },
          },
        }}
      >
        <Tab
          icon={<ScheduleIcon />}
          iconPosition="start"
          label="Vardiyalar"
        />
        <Tab
          icon={<PeopleIcon />}
          iconPosition="start"
          label="Personel"
        />
        <Tab
          icon={<AssignmentIcon />}
          iconPosition="start"
          label="Atamalar"
          disabled
        />
        <Tab
          icon={<CalendarIcon />}
          iconPosition="start"
          label="Takvim"
          disabled
        />
        <Tab
          icon={<AssessmentIcon />}
          iconPosition="start"
          label="Raporlar"
          disabled
        />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        <VardiyaYonetimi />
      </TabPanel>
      
      <TabPanel value={activeTab} index={1}>
        <PersonelYonetimi />
      </TabPanel>
      
      <TabPanel value={activeTab} index={2}>
        <Box p={3} textAlign="center">
          <Typography variant="h6" color="text.secondary">
            Vardiya Atamaları
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bu özellik yakında eklenecektir
          </Typography>
        </Box>
      </TabPanel>
      
      <TabPanel value={activeTab} index={3}>
        <Box p={3} textAlign="center">
          <Typography variant="h6" color="text.secondary">
            Vardiya Takvimi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bu özellik yakında eklenecektir
          </Typography>
        </Box>
      </TabPanel>
      
      <TabPanel value={activeTab} index={4}>
        <Box p={3} textAlign="center">
          <Typography variant="h6" color="text.secondary">
            Vardiya Raporları
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bu özellik yakında eklenecektir
          </Typography>
        </Box>
      </TabPanel>
    </Box>
  );
}

export default VardiyaYonetimiAna;
