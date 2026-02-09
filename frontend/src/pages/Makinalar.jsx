import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import MakinaListesi from '../components/MakinaListesi';
import MakinaForm from '../components/MakinaForm';
import { Box } from '@mui/material';

const Makinalar = () => {
    const location = useLocation();
    const { id } = useParams();

    // URL'ye göre hangi bileşenin gösterileceğini belirle
    const isListPage = location.pathname === '/makinalar';
    const isAddPage = location.pathname === '/makinalar/ekle';
    const isEditPage = location.pathname.startsWith('/makinalar/duzenle/') && id;

    return (
        <Box sx={{ width: '100%' }}>
            {isListPage && <MakinaListesi />}
            {(isAddPage || isEditPage) && <MakinaForm />}
        </Box>
    );
};

export default Makinalar;