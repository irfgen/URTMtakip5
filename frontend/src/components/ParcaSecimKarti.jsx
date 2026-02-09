import React from 'react';
import {
    Card, CardContent, Typography, Checkbox, Box
} from '@mui/material';
import ImageWithFallback from './ImageWithFallback';

const ParcaSecimKarti = ({ parca, selected, onSelectionChange, disabled = false }) => {
    const handleCardClick = () => {
        if (!disabled) {
            onSelectionChange(parca.parcaKodu, !selected);
        }
    };

    const handleCheckboxClick = (e) => {
        e.stopPropagation(); // Card click'ini engelle
        if (!disabled) {
            onSelectionChange(parca.parcaKodu, e.target.checked);
        }
    };

    // Resim URL'sini oluştur - proxy kullanıldığından relative path yeterli
    const getImageUrl = (fotoPath) => {
        if (!fotoPath) return null;
        // foto_path zaten /uploads/ ile başlıyor, proxy kullanıldığından doğrudan kullan
        return fotoPath;
    };

    return (
        <Card
            sx={{
                height: 300,
                cursor: disabled ? 'default' : 'pointer',
                transition: 'all 0.2s ease-in-out',
                border: selected ? 2 : 1,
                borderColor: selected ? 'primary.main' : 'divider',
                '&:hover': disabled ? {} : {
                    elevation: 6,
                    borderColor: selected ? 'primary.dark' : 'primary.light',
                    transform: 'translateY(-2px)'
                },
                opacity: disabled ? 0.6 : 1
            }}
            onClick={handleCardClick}
        >
            {/* Checkbox */}
            <CardContent sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" noWrap>
                        {parca.parcaKodu}
                    </Typography>
                    <Checkbox
                        checked={selected}
                        onChange={handleCheckboxClick}
                        disabled={disabled}
                        sx={{ p: 0 }}
                        color="primary"
                    />
                </Box>
            </CardContent>

            {/* Resim Alanı */}
            <Box sx={{ height: 180, position: 'relative' }}>
                <ImageWithFallback
                    src={getImageUrl(parca.foto_path)}
                    alt={parca.parcaAdi || parca.parcaKodu}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        background: '#f5f5f5'
                    }}
                    fallbackStyle={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                        color: '#999'
                    }}
                />
            </Box>

            {/* Parça Bilgileri */}
            <CardContent sx={{ pt: 1 }}>
                <Typography variant="body1" fontWeight="medium" noWrap title={parca.parcaAdi}>
                    {parca.parcaAdi || 'Parça Adı Belirtilmemiş'}
                </Typography>
                {parca.kategori && (
                    <Typography variant="caption" color="text.secondary" noWrap>
                        {parca.kategori}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
};

export default React.memo(ParcaSecimKarti);
