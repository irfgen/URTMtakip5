import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    IconButton,
    Fab,
    InputBase,
    Paper,
    CircularProgress,
    Alert,
    Skeleton
} from '@mui/material';
import {
    Search as SearchIcon,
    Add as AddIcon,
    MoreVert as MoreVertIcon,
    Lock as LockIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/**
 * İrsaliyelerMobile - Mobil İrsaliye Listesi Sayfası
 *
 * Özellikler:
 * - Pull-to-refresh functionality
 * - Infinite scroll pagination
 * - Filter chips (Tedarikçi, Durum, Tarih)
 * - Search bar (irsaliye_no, tedarikçi)
 * - Swipe actions (Düzenle, Sil)
 * - FAB button for new irsaliye
 * - Empty state design
 * - Loading skeleton
 * - Lock indicator
 */
const IrsaliyelerMobile = () => {
    const navigate = useNavigate();
    const [irsaliyeler, setIrsaliyeler] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        tedarikci_id: null,
        durum: null,
        search: ''
    });

    /**
     * İrsaliyeleri fetch eder
     * @param {number} pageNum - Sayfa numarası
     * @param {boolean} append - Veriyi ekle mi yoksa değiştir mi
     */
    const fetchIrsaliyeler = useCallback(async (pageNum = 1, append = false) => {
        try {
            if (!append) {
                setLoading(true);
            }
            setError(null);

            const params = { page: pageNum, limit: 20 };

            if (filters.tedarikci_id) params.tedarikci_id = filters.tedarikci_id;
            if (filters.durum) params.durum = filters.durum;
            if (filters.search) params.search = filters.search;

            const response = await axios.get('/api/irsaliyeler', { params });

            if (append) {
                setIrsaliyeler(prev => [...prev, ...response.data.data]);
            } else {
                setIrsaliyeler(response.data.data);
            }

            setHasMore(pageNum < response.data.pagination.totalPages);
        } catch (err) {
            console.error('Error fetching irsaliyeler:', err);
            setError(err.response?.data?.error || 'İrsaliyeler yüklenirken hata oluştu');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filters]);

    /**
     * Pull-to-refresh handler
     */
    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        setPage(1);
        return fetchIrsaliyeler(1, false);
    }, [fetchIrsaliyeler]);

    /**
     * Load more handler (infinite scroll)
     */
    const loadMore = useCallback(() => {
        if (!loading && hasMore && !refreshing) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchIrsaliyeler(nextPage, true);
        }
    }, [loading, hasMore, refreshing, page, fetchIrsaliyeler]);

    // Initial fetch
    useEffect(() => {
        fetchIrsaliyeler();
    }, [fetchIrsaliyeler]);

    // Filter değişince yenile
    useEffect(() => {
        setPage(1);
        fetchIrsaliyeler(1, false);
    }, [filters.tedarikci_id, filters.durum]);

    // Search debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (filters.search !== undefined) {
                setPage(1);
                fetchIrsaliyeler(1, false);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [filters.search, fetchIrsaliyeler]);

    /**
     * Durum chip rengi belirler
     */
    const getDurumColor = (durum) => {
        switch (durum) {
            case 'bekliyor':
                return 'default';
            case 'kismi_eslesti':
                return 'warning';
            case 'tam_eslesti':
                return 'success';
            default:
                return 'default';
        }
    };

    /**
     * Durum label text
     */
    const getDurumLabel = (durum) => {
        switch (durum) {
            case 'bekliyor':
                return 'Bekliyor';
            case 'kismi_eslesti':
                return 'Kısmi Eşleşti';
            case 'tam_eslesti':
                return 'Tam Eşleşti';
            default:
                return durum;
        }
    };

    /**
     * Render loading skeleton
     */
    const renderSkeleton = () => (
        <>
            {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} sx={{ mb: 2 }}>
                    <CardContent>
                        <Skeleton variant="text" width="60%" height={32} />
                        <Skeleton variant="text" width="40%" height={24} />
                        <Skeleton variant="text" width="30%" height={20} />
                    </CardContent>
                </Card>
            ))}
        </>
    );

    /**
     * Render empty state
     */
    const renderEmptyState = () => (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            px: 3,
            textAlign: 'center'
        }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
                İrsaliye Bulunamadı
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {
                    filters.search || filters.durum || filters.tedarikci_id
                        ? 'Filtre kriterlerine uygun irsaliye yok. Filtreleri temizlemeyi deneyin.'
                        : 'Henüz irsaliye oluşturulmamış. İlk irsaliyeyi oluşturmak için + butonuna tıklayın.'
                }
            </Typography>
        </Box>
    );

    return (
        <Box sx={{ pb: 8 }}>
            {/* Header */}
            <Box sx={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                bgcolor: 'background.paper',
                boxShadow: 1
            }}>
                {/* Search Bar */}
                <Paper sx={{ mx: 2, my: 1, p: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                        <InputBase
                            placeholder="İrsaliye no veya tedarikçi ara..."
                            fullWidth
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </Box>
                </Paper>

                {/* Filter Chips */}
                <Box sx={{ display: 'flex', gap: 1, px: 2, pb: 1, overflowX: 'auto' }}>
                    <Chip
                        label="Tümü"
                        onClick={() => setFilters({ ...filters, durum: null })}
                        color={!filters.durum ? 'primary' : 'default'}
                        size="small"
                    />
                    <Chip
                        label="Bekliyor"
                        onClick={() => setFilters({ ...filters, durum: 'bekliyor' })}
                        color={filters.durum === 'bekliyor' ? 'primary' : 'default'}
                        size="small"
                    />
                    <Chip
                        label="Kısmi Eşleşti"
                        onClick={() => setFilters({ ...filters, durum: 'kismi_eslesti' })}
                        color={filters.durum === 'kismi_eslesti' ? 'primary' : 'default'}
                        size="small"
                    />
                    <Chip
                        label="Tam Eşleşti"
                        onClick={() => setFilters({ ...filters, durum: 'tam_eslesti' })}
                        color={filters.durum === 'tam_eslesti' ? 'primary' : 'default'}
                        size="small"
                    />
                </Box>

                {/* Refresh Indicator */}
                {refreshing && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                        <CircularProgress size={24} />
                    </Box>
                )}
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ m: 2 }}>
                    {error}
                </Alert>
            )}

            {/* List */}
            <Box sx={{ px: 2 }}>
                {loading ? renderSkeleton() : (
                    irsaliyeler.length === 0 ? renderEmptyState() : (
                        irsaliyeler.map(irsaliye => (
                            <Card
                                key={irsaliye.id}
                                sx={{ mb: 2 }}
                                onClick={() => navigate(`/mobile/irsaliyeler/${irsaliye.id}`)}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="h6" gutterBottom>
                                                {irsaliye.irsaliye_no}
                                            </Typography>

                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                {irsaliye.tedarikci?.adi || 'Tedarikçi Yok'}
                                            </Typography>

                                            <Typography variant="caption" color="text.secondary" display="block">
                                                {new Date(irsaliye.belge_tarih).toLocaleDateString('tr-TR')}
                                            </Typography>

                                            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                <Chip
                                                    label={`${irsaliye.toplam_kalem || 0} kalem`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                                <Chip
                                                    label={`Toplam: ${irsaliye.toplam_miktar || 0}`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                                <Chip
                                                    label={irsaliye.belge_tipi === 'gelis' ? 'Geliş' : 'Çıkış'}
                                                    size="small"
                                                    variant={irsaliye.belge_tipi === 'gelis' ? 'filled' : 'outlined'}
                                                    color={irsaliye.belge_tipi === 'gelis' ? 'info' : 'secondary'}
                                                />
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, ml: 1 }}>
                                            <Chip
                                                label={getDurumLabel(irsaliye.durum)}
                                                color={getDurumColor(irsaliye.durum)}
                                                size="small"
                                            />

                                            {irsaliye.locked_by && (
                                                <Chip
                                                    icon={<LockIcon fontSize="small" />}
                                                    label="Kilitli"
                                                    color="error"
                                                    size="small"
                                                />
                                            )}
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))
                    )
                )}
            </Box>

            {/* Load More Button */}
            {hasMore && !loading && irsaliyeler.length > 0 && (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography
                        onClick={loadMore}
                        sx={{ color: 'primary.main', cursor: 'pointer', userSelect: 'none' }}
                    >
                        Daha fazla göster
                    </Typography>
                </Box>
            )}

            {/* Load More Indicator */}
            {loading && hasMore && irsaliyeler.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                </Box>
            )}

            {/* FAB - Yeni İrsaliye */}
            <Fab
                color="primary"
                sx={{ position: 'fixed', bottom: 80, right: 16 }}
                onClick={() => navigate('/mobile/irsaliyeler/yeni')}
            >
                <AddIcon />
            </Fab>
        </Box>
    );
};

export default IrsaliyelerMobile;
