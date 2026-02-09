import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Folder,
  FolderOpen,
  Business,
  ChevronRight,
  Edit,
  Delete,
  MoreVert,
} from '@mui/icons-material';

const MakinaSinifiNode = ({
  sinif,
  isExpanded,
  hasChildren,
  isSelected,
  onToggle,
  onEdit,
  onDelete,
  showActions = false,
  mobile = false,
  height = 48,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    if (onEdit) onEdit(sinif);
  };

  const handleDelete = () => {
    handleMenuClose();
    if (onDelete) onDelete(sinif);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        py: 1,
        px: 1.5,
        borderRadius: 1,
        cursor: 'pointer',
        backgroundColor: isSelected
          ? theme.palette.primary.light
          : 'transparent',
        border: isSelected
          ? `2px solid ${theme.palette.primary.main}`
          : '2px solid transparent',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
          transform: 'translateX(2px)',
        },
      }}
      onClick={onToggle}
    >
      {/* Expand/Collapse Icon */}
      {hasChildren && (
        <IconButton
          size="small"
          sx={{
            mr: 1,
            transition: 'transform 0.2s ease-in-out',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          <ChevronRight fontSize="small" />
        </IconButton>
      )}

      {/* Folder Icon */}
      <Box sx={{ mr: 1.5, color: theme.palette.primary.main }}>
        {isExpanded ? (
          <FolderOpen fontSize="medium" />
        ) : (
          <Folder fontSize="medium" />
        )}
      </Box>

      {/* Node Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="subtitle1"
          component="div"
          sx={{
            fontWeight: isSelected ? 600 : 500,
            color: isSelected ? 'primary.main' : 'text.primary',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {sinif.ad}
        </Typography>

        {/* Description */}
        {sinif.aciklama && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              mt: 0.25,
            }}
          >
            {sinif.aciklama}
          </Typography>
        )}
      </Box>

      {/* Status and Metadata */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Status Badge */}
        <Tooltip title={sinif.aktif ? 'Aktif' : 'Pasif'}>
          <Chip
            size="small"
            label={sinif.aktif ? 'Aktif' : 'Pasif'}
            color={sinif.aktif ? 'success' : 'default'}
            sx={{
              fontSize: '0.7rem',
              height: 20,
            }}
          />
        </Tooltip>

        {/* Machine Count */}
        <Tooltip title={`${sinif.makina_sayisi || 0} makina`}>
          <Chip
            size="small"
            icon={<Business fontSize="small" />}
            label={`${sinif.makina_sayisi || 0}`}
            variant="outlined"
            sx={{
              fontSize: '0.7rem',
              height: 20,
            }}
          />
        </Tooltip>

        {/* Actions Menu */}
        {showActions && (
          <>
            <Tooltip title="İşlemler">
              <IconButton
                size="small"
                onClick={handleMenuClick}
                sx={{
                  ml: 0.5,
                  opacity: 0.7,
                  '&:hover': {
                    opacity: 1,
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <MoreVert fontSize="small" />
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              onClick={(e) => e.stopPropagation()}
              PaperProps={{
                sx: {
                  minWidth: 180,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }
              }}
            >
              <MenuItem onClick={handleEdit}>
                <ListItemIcon>
                  <Edit fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText primary="Düzenle" />
              </MenuItem>

              <Divider />

              <MenuItem
                onClick={handleDelete}
                disabled={(sinif.makina_sayisi || 0) > 0}
                sx={{
                  '&.Mui-disabled': {
                    opacity: 0.5,
                  }
                }}
              >
                <ListItemIcon>
                  <Delete
                    fontSize="small"
                    color={(sinif.makina_sayisi || 0) > 0 ? 'disabled' : 'error'}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Sil"
                  secondary={(sinif.makina_sayisi || 0) > 0 ? 'Makina içeriyor' : ''}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    color: 'text.secondary'
                  }}
                />
              </MenuItem>
            </Menu>
          </>
        )}
      </Box>
    </Box>
  );
};

export default MakinaSinifiNode;