import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Box } from '@mui/material';
import UretimPlaniListesi from '../components/UretimPlani/UretimPlaniListesi';
import UretimPlaniForm from '../components/UretimPlani/UretimPlaniForm';
import UretimPlaniDetay from '../components/UretimPlani/UretimPlaniDetay';

const UretimPlani = () => {
    const location = useLocation();
    const { id } = useParams();
    
    // URL'ye göre gösterilecek bileşeni belirle
    const isListPage = location.pathname === '/uretim-plani';
    const isAddPage = location.pathname === '/uretim-plani/ekle';
    const isDetailPage = location.pathname.includes('/uretim-plani/detay/') && id;
    const isEditPage = location.pathname.includes('/uretim-plani/duzenle/') && id;

    return (
        <Box sx={{ width: '100%' }}>
            {isListPage && <UretimPlaniListesi />}
            {isAddPage && <UretimPlaniForm />}
            {isEditPage && <UretimPlaniForm id={id} />}
            {isDetailPage && <UretimPlaniDetay id={id} />}
        </Box>
    );
};

export default UretimPlani;