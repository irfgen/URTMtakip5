import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import ParcaImport from './ParcaImport';
import ExceldenBomUret from './ExceldenBomUret';
import VardiyaYonetimiAna from '../../components/VardiyaYonetimi/VardiyaYonetimiAna';
import ParcaBirlesikYonetimi from '../../components/ParcaBirlesikYonetimi';
import IsEmriDurumYonetimi from '../../components/IsEmriDurumYonetimi';

function Yonetimsel() {
  const [tab, setTab] = React.useState(0);

  const handleChange = (event, newValue) => {
    setTab(newValue);
  };

  return (
    <Box p={2}>
      <Tabs value={tab} onChange={handleChange}>
        <Tab label="Parça Import" />
        <Tab label="Excelden BOM Üret" />
        <Tab label="Vardiya Yönetimi" />
        <Tab label="Parça Birleştirme" />
        <Tab label="İş Emri Durum Yönetimi" />
        {/* Diğer yönetimsel işlemler için tablar eklenebilir */}
      </Tabs>
      <Box mt={2}>
        {tab === 0 && <ParcaImport />}
        {tab === 1 && <ExceldenBomUret />}
        {tab === 2 && <VardiyaYonetimiAna />}
        {tab === 3 && <ParcaBirlesikYonetimi />}
        {tab === 4 && <IsEmriDurumYonetimi />}
        {/* Diğer tablar için içerik buraya eklenebilir */}
      </Box>
    </Box>
  );
}

export default Yonetimsel;
