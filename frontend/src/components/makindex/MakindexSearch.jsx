import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Popover,
  List,
  ListItem,
  ListItemText,
  Typography,
  Collapse,
  useTheme,
} from '@mui/material';
import {
  Search,
  Clear,
  FilterList,
  History,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  globalAra,
  setSearchQuery,
  setSearchType,
  setStokDurumuFilter,
  setMakinaSinifiFilter,
  addRecentSearch,
  clearRecentSearches,
} from '../../store/slices/makindexSlice';
import { debounce } from 'lodash';

const MakindexSearch = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const {
    searchQuery,
    searchType,
    recentSearches,
    filters,
    searchResults,
    loading: searchLoading,
    error: searchError,
    siniflar,
  } = useSelector((state) => state.makindex);

  const [showFilters, setShowFilters] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [historyAnchorEl, setHistoryAnchorEl] = useState(null);
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Debounced search function
  const debouncedSearch = debounce((query, type) => {
    if (query && query.trim().length >= 2) {
      dispatch(globalAra({ query: query.trim(), type }));
      dispatch(addRecentSearch(query.trim()));
    }
  }, 300);

  // Handle search input change
  const handleSearchChange = (event) => {
    const value = event.target.value;
    setLocalQuery(value);
    dispatch(setSearchQuery(value));
    debouncedSearch(value, searchType);
  };

  // Handle search type change
  const handleTypeChange = (event) => {
    const type = event.target.value;
    dispatch(setSearchType(type === 'all' ? null : type));
    if (localQuery) {
      debouncedSearch(localQuery, type);
    }
  };

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    switch (filterName) {
      case 'stokDurumu':
        dispatch(setStokDurumuFilter(value));
        break;
      case 'makinaSinifi':
        dispatch(setMakinaSinifiFilter(value));
        break;
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setLocalQuery('');
    dispatch(setSearchQuery(''));
    dispatch(setSearchType(null));
  };

  // Execute search with current parameters
  const handleSearch = () => {
    if (localQuery && localQuery.trim().length >= 2) {
      debouncedSearch(localQuery, searchType);
      dispatch(addRecentSearch(localQuery.trim()));
    }
  };

  // Recent search item click
  const handleRecentSearchClick = (search) => {
    setLocalQuery(search);
    dispatch(setSearchQuery(search));
    debouncedSearch(search, searchType);
    setShowRecentSearches(false);
  };

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      {/* Search Input */}
      <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Makindex'te ara..."
          value={localQuery}
          onChange={handleSearchChange}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconButton disabled>
                  <Search color="action" />
                </IconButton>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {localQuery && (
                  <IconButton onClick={handleClearSearch}>
                    <Clear />
                  </IconButton>
                )}
                <IconButton
                  onClick={(e) => setHistoryAnchorEl(e.currentTarget)}
                  disabled={recentSearches.length === 0}
                >
                  <History />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1 }}
        />

        {/* Type Filter */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Tür</InputLabel>
          <Select
            value={searchType || 'all'}
            label="Tür"
            onChange={handleTypeChange}
            size="small"
          >
            <MenuItem value="all">Hepsi</MenuItem>
            <MenuItem value="sinif">Sınıf</MenuItem>
            <MenuItem value="makina">Makina</MenuItem>
            <MenuItem value="bom">BOM</MenuItem>
            <MenuItem value="parca">Parça</MenuItem>
          </Select>
        </FormControl>

        {/* Filter Button */}
        <IconButton
          onClick={(e) => setFilterAnchorEl(e.currentTarget)}
          color={filters.stokDurumu !== 'hepsi' || filters.makinaSinifi !== 'hepsi' ? 'primary' : 'default'}
        >
          <FilterList />
        </IconButton>
      </Paper>

      {/* Recent Searches Popover */}
      <Popover
        open={showRecentSearches}
        anchorEl={historyAnchorEl}
        onClose={() => setShowRecentSearches(false)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, minWidth: 250 }}>
          <Typography variant="subtitle2" gutterBottom>
            Son Aramalar
          </Typography>
          <List dense>
            {recentSearches.slice(0, 5).map((search, index) => (
              <ListItem
                key={index}
                button
                onClick={() => handleRecentSearchClick(search)}
              >
                <ListItemText primary={search} />
              </ListItem>
            ))}
          </List>
          {recentSearches.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Button
                size="small"
                onClick={() => {
                  dispatch(clearRecentSearches());
                  setShowRecentSearches(false);
                }}
                fullWidth
              >
                Temizle
              </Button>
            </Box>
          )}
          {recentSearches.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              Henüz arama geçmişi yok
            </Typography>
          )}
        </Box>
      </Popover>

      {/* Filters Popover */}
      <Popover
        open={showFilters}
        anchorEl={filterAnchorEl}
        onClose={() => setShowFilters(false)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, minWidth: 200 }}>
          <Typography variant="subtitle2" gutterBottom>
            Filtreler
          </Typography>

          {/* Stock Status Filter */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Stok Durumu
            </Typography>
            <Select
              fullWidth
              size="small"
              value={filters.stokDurumu}
              onChange={(e) => handleFilterChange('stokDurumu', e.target.value)}
            >
              <MenuItem value="hepsi">Hepsi</MenuItem>
              <MenuItem value="stokta">Stokta Olanlar</MenuItem>
              <MenuItem value="kritik">Kritik Stoktaki</MenuItem>
            </Select>
          </Box>

          {/* Makina Sınıfı Filter */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Makina Sınıfı
            </Typography>
            <Select
              fullWidth
              size="small"
              value={filters.makinaSinifi}
              onChange={(e) => handleFilterChange('makinaSinifi', e.target.value)}
            >
              <MenuItem value="hepsi">Hepsi</MenuItem>
              {siniflar.map((sinif) => (
                <MenuItem key={sinif.id} value={sinif.ad}>
                  {sinif.ad}
                </MenuItem>
              ))}
            </Select>
          </Box>

          {/* Clear Filters */}
          <Button
            size="small"
            onClick={() => {
              dispatch(setStokDurumuFilter('hepsi'));
              dispatch(setMakinaSinifiFilter('hepsi'));
              setShowFilters(false);
            }}
            fullWidth
            color="secondary"
          >
            Filtreleri Temizle
          </Button>
        </Box>
      </Popover>

      {/* Search Results */}
      {searchQuery && (
        <Collapse in={true}>
          <Paper sx={{ p: 2, mt: 1 }}>
            {searchLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <Typography>Aranıyor...</Typography>
              </Box>
            ) : searchError ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <Typography color="error">
                  Hata: {searchError}
                </Typography>
              </Box>
            ) : Object.keys(searchResults).length > 0 ? (
              <Box>
                {Object.entries(searchResults).map(([type, results]) => (
                  <Box key={type} sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {type === 'sinif' && 'Makina Sınıfları'}
                      {type === 'makina' && 'Makinalar'}
                      {type === 'bom' && 'BOM Grupları'}
                      {type === 'parca' && 'Parçalar'}
                      ({results.length} sonuç)
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {results.map((result, index) => (
                        <Chip
                          key={index}
                          label={result.ad || result.name}
                          variant="outlined"
                          size="small"
                          color="primary"
                          clickable
                          onClick={() => {
                            // Navigate to the node
                            if (result.url) {
                              window.open(result.url, '_blank');
                            }
                          }}
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Box>
                  </Box>
                ))}
                <Typography variant="caption" color="text.secondary">
                  Toplam: {Object.values(searchResults).reduce((sum, arr) => sum + arr.length, 0)} sonuç
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <Typography color="text.secondary">
                  "{searchQuery}" için sonuç bulunamadı
                </Typography>
              </Box>
            )}
          </Paper>
        </Collapse>
      )}
    </Box>
  );
};

export default MakindexSearch;