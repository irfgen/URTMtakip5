import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, Alert, Chip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import IrsaliyeKalemMatchCard from './IrsaliyeKalemMatchCard';

const OneriListesi = ({ faturaKalemId, oneriler = [], onSelect, seciliOneri = [], onSecimDegistir }) => {
  // Bu kalem için seçili öneri var mı kontrol et
  const seciliOneriIds = seciliOneri
    .filter(s => s.fatura_kalem_id === faturaKalemId)
    .map(s => s.irsaliye_kalem_id);

  if (!oneriler || oneriler.length === 0) {
    return (
      <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          🔍 Bu kalem için eşleşme önerisi bulunmuyor
        </Typography>
      </Box>
    );
  }

  const handleOneriSec = (irsaliyeKalemId) => {
    // Bu kalem zaten seçili mi kontrol et
    const zatenSecili = seciliOneri.some(
      s => s.fatura_kalem_id === faturaKalemId && s.irsaliye_kalem_id === irsaliyeKalemId
    );

    if (zatenSecili) {
      // Zaten seçiliyse, seçimi kaldır
      handleOneriSecimKaldir(irsaliyeKalemId);
    } else {
      // Değilse, bu kalem için önceki seçimi kaldır ve yenisini ekle
      const digerSecimler = seciliOneri.filter(s => s.fatura_kalem_id !== faturaKalemId);
      onSecimDegistir([...digerSecimler, {
        fatura_kalem_id: faturaKalemId,
        irsaliye_kalem_id: irsaliyeKalemId
      }]);
    }
  };

  const handleOneriSecimKaldir = (irsaliyeKalemId) => {
    onSecimDegistir(seciliOneri.filter(s =>
      !(s.fatura_kalem_id === faturaKalemId && s.irsaliye_kalem_id === irsaliyeKalemId)
    ));
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 'medium' }}>
        {oneriler.length} eşleşme önerisi bulundu
      </Typography>

      {oneriler.map((oneri, index) => {
        const isSelected = seciliOneriIds.includes(oneri.irsaliye_kalem?.id);
        const isBestMatch = index === 0 && oneri.eslesme_tipi === 'tam';

        return (
          <Accordion
            key={oneri.irsaliye_kalem?.id || index}
            defaultExpanded={isBestMatch}
            sx={{
              '&:before': { display: 'none' },
              boxShadow: 'none',
              border: '1px solid',
              borderColor: isSelected ? 'success.main' : 'divider',
              borderRadius: 1,
              mb: 1,
              bgcolor: isSelected ? 'success.dark' : 'background.paper',
              '&:hover': {
                borderColor: isSelected ? 'success.main' : 'primary.main'
              }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                '& .MuiAccordionSummary-content': {
                  margin: '12px 0'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {isBestMatch && (
                    <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 500, fontSize: '0.75rem' }}>
                      En İyi Eşleşme
                    </Typography>
                  )}
                  <Typography variant="body2" fontWeight="medium">
                    {oneri.irsaliye?.irsaliye_no || '-'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {isSelected && (
                    <Chip
                      label="Seçili"
                      size="small"
                      color="success"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                  <Typography variant="caption" color="text.secondary">
                    %{oneri.skor} eşleşme
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <IrsaliyeKalemMatchCard
                irsaliyeKalem={oneri.irsaliye_kalem}
                irsaliye={oneri.irsaliye}
                eslesmeTipi={oneri.eslesme_tipi}
                miktarFarki={oneri.miktar_farki}
                skor={oneri.skor}
                stokKoduEslesiyor={oneri.stok_kodu_eslesiyor}
                onSelect={() => handleOneriSec(oneri.irsaliye_kalem?.id)}
                isSelectable={true}
                isSelected={isSelected}
              />
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};

export default OneriListesi;
