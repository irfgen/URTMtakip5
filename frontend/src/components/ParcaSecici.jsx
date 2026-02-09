import React, { useState } from 'react';
import { Button, Box } from '@mui/material';
import ParcaSecimFormu from './ParcaSecimFormu';
import ParcaKarti from './ParcaKarti';

/**
 * Parça seçimi ve gösterimi için bağımsız component
 * @param {function} onSec - Parça seçildiğinde çağrılır
 * @param {object} selectedParca - Seçili parça objesi
 */
function ParcaSecici({ onSec, selectedParca }) {
  const [open, setOpen] = useState(false);

  const handleSec = (parca) => {
    setOpen(false);
    if (onSec) onSec(parca);
  };

  // Parça kartı için güvenli değerler ve fallback'ler
  const imageUrl = selectedParca?.resimUrl || selectedParca?.foto_path || selectedParca?.imageUrl || '/no-image.png';
  const parcaKodu = selectedParca?.parcaKodu || selectedParca?.parca_kodu || '';
  const stock = selectedParca?.stokAdeti ?? selectedParca?.stok_adeti ?? '';
  const criticalStock = selectedParca?.kritikStokAdeti ?? selectedParca?.kritik_stok_adeti ?? '';
  const teknikResimUrl = selectedParca?.teknikResimUrl || selectedParca?.teknik_resim_path || selectedParca?.teknikResimPath || '';

  return (
    <Box>
      <Button
        variant="outlined"
        onClick={() => setOpen(true)}
        sx={{ mb: 2 }}
      >
        {selectedParca ? 'Parçayı Değiştir' : 'Parça Seç'}
      </Button>
      <ParcaSecimFormu
        open={open}
        onClose={() => setOpen(false)}
        onSec={handleSec}
      />
      {selectedParca && (
        <Box sx={{ mt: 2 }}>
          <ParcaKarti
            imageUrl={imageUrl}
            name={parcaKodu}
            stock={stock}
            criticalStock={criticalStock}
            teknikResimUrl={teknikResimUrl}
          />
        </Box>
      )}
    </Box>
  );
}

export default ParcaSecici;
