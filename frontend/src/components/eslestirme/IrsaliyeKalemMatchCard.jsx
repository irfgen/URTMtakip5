import { Card, CardContent, Box, Typography, Button, Stack, Chip, Divider, IconButton } from '@mui/material';
import { Check, Close, CheckCircle, Cancel } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const MatchCard = styled(Card, { shouldForwardProp: prop => prop !== 'eslesmeTipi' })(
  ({ theme, eslesmeTipi }) => ({
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderLeft: `3px solid ${eslesmeTipi === 'tam' ? theme.palette.success.main : theme.palette.warning.main}`,
    marginTop: theme.spacing(1),
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: theme.shadows[2],
      borderColor: eslesmeTipi === 'tam' ? theme.palette.success.main : theme.palette.warning.main
    }
  })
);

const IrsaliyeKalemMatchCard = ({
  irsaliyeKalem,
  irsaliye,
  eslesmeTipi = 'tam',
  miktarFarki = 0,
  skor = 95,
  stokKoduEslesiyor = false,
  onRemove,
  onSelect,
  isSelectable = false,
  isSelected = false
}) => {
  const formatNumber = (value) => {
    if (value == null) return '-';
    return parseFloat(value).toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  const getMatchTypeIcon = () => {
    return eslesmeTipi === 'tam' ? <CheckCircle color="success" /> : <Cancel color="warning" />;
  };

  return (
    <MatchCard eslesmeTipi={eslesmeTipi}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getMatchTypeIcon()}
            <Typography variant="subtitle1" color="primary" fontWeight="medium">
              🔗 {irsaliye?.irsaliye_no || '-'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={eslesmeTipi === 'tam' ? 'Tam Eşleşme' : 'Kısmi Eşleşme'}
              color={eslesmeTipi === 'tam' ? 'success' : 'warning'}
              size="small"
            />
            {skor && (
              <Chip
                label={`Skor: ${skor}/100`}
                size="small"
                variant="outlined"
                color={skor >= 90 ? 'success' : skor >= 75 ? 'info' : 'default'}
              />
            )}
          </Stack>
        </Box>

        {/* İrsaliye Tarihi */}
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Tarih: {formatDate(irsaliye?.belge_tarih)}
        </Typography>

        <Divider sx={{ my: 1.5 }} />

        {/* Kalem Detayları */}
        <Stack spacing={1.5}>
          {/* Mal/Hizmet Adı */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">Mal/Hizmet:</Typography>
            <Typography variant="body2" fontWeight="medium">
              {irsaliyeKalem?.mal_hizmet_adi || '-'}
            </Typography>
          </Box>

          {/* Stok Kodu */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">Stok Kodu:</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body2">{irsaliyeKalem?.stok_kodu || '-'}</Typography>
              {stokKoduEslesiyor && (
                <Chip label="✓ Eşleşiyor" size="small" color="success" sx={{ height: 20, fontSize: '0.7rem' }} />
              )}
            </Box>
          </Box>

          {/* Miktar */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">Miktar:</Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatNumber(irsaliyeKalem?.miktar)} {irsaliyeKalem?.birim || 'Adet'}
            </Typography>
          </Box>

          {/* Miktar Farkı */}
          {miktarFarki !== undefined && miktarFarki !== null && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">Miktar Farkı:</Typography>
              <Typography
                variant="body2"
                fontWeight="medium"
                color={miktarFarki > 0.01 ? 'warning.main' : 'success.main'}
              >
                {formatNumber(Math.abs(miktarFarki))}
                {miktarFarki > 0.01 && ' ⚠️'}
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
          {isSelectable && onSelect && (
            <Button
              variant={isSelected ? "contained" : "outlined"}
              color={isSelected ? "success" : "primary"}
              startIcon={isSelected ? <Check /> : null}
              onClick={onSelect}
              size="small"
            >
              {isSelected ? 'Seçildi' : 'Seç'}
            </Button>
          )}

          {onRemove && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Close />}
              onClick={onRemove}
              size="small"
            >
              Eşleşmeyi Kaldır
            </Button>
          )}
        </Box>
      </CardContent>
    </MatchCard>
  );
};

export default IrsaliyeKalemMatchCard;
