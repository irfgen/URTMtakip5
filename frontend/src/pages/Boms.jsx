import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import BomListesi from '../components/BomListesi';
import BomForm from '../components/BomForm';
import { Box, Typography } from '@mui/material'; // Typography import edildi

const Boms = () => {
    const location = useLocation();
    const { id } = useParams(); // Düzenleme rotası için ID'yi al

    // URL'ye göre hangi bileşenin gösterileceğini belirle
    const isListPage = location.pathname === '/boms';
    const isAddPage = location.pathname === '/boms/ekle';
    const isEditPage = location.pathname.startsWith('/boms/duzenle/') && id;

    return (
        <Box sx={{ width: '100%' }}>
            {isListPage && <BomListesi />}
            {(isAddPage || isEditPage) && <BomForm />}
            {/* Eğer eşleşen route yoksa veya beklenmedik bir durum varsa bir mesaj gösterilebilir */}
            {!isListPage && !isAddPage && !isEditPage && (
                <Typography>Geçersiz BOM sayfası.</Typography>
            )}
        </Box>
    );
};

export default Boms;