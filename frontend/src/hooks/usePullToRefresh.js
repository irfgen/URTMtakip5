import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * usePullToRefresh - Pull-to-refresh functionality hook
 *
 * Mobil uygulamalarda aşağı çekerek yenileme işlevselliği sağlar.
 *
 * @param {Function} onRefresh - Yenileme fonksiyonu (Promise dönmeli)
 * @param {Object} options - Ayarlar
 * @param {number} options.threshold - Yenileme için gerekli minimum çekme mesafesi (px)
 * @param {number} options.refreshHeight - Yenileme göstergesi yüksekliği (px)
 * @returns {Object} { refreshing, pullStatus, containerProps }
 *
 * @example
 * const { refreshing, pullStatus, containerProps } = usePullToRefresh(async () => {
 *   await fetchData();
 * });
 *
 * <Box {...containerProps} sx={{ height: '100vh', overflow: 'auto' }}>
 *   {content}
 * </Box>
 */
const usePullToRefresh = (onRefresh, options = {}) => {
    const {
        threshold = 80,
        refreshHeight = 60
    } = options;

    const [refreshing, setRefreshing] = useState(false);
    const [pullStatus, setPullStatus] = useState('idle'); // idle, pulling, refreshing, completed
    const [pullDistance, setPullDistance] = useState(0);

    const startY = useRef(0);
    const currentY = useRef(0);
    const isDragging = useRef(false);
    const containerRef = useRef(null);

    // Touch event handlers
    const handleTouchStart = useCallback((e) => {
        // Sadece en üstteyken ve yatay scroll yokken başlat
        const container = containerRef.current;
        if (!container) return;

        if (container.scrollTop === 0) {
            startY.current = e.touches[0].clientY;
            isDragging.current = true;
            setPullStatus('pulling');
        }
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (!isDragging.current) return;

        currentY.current = e.touches[0].clientY;
        const distance = currentY.current - startY.current;

        // Sadece aşağı çekme (pozitif distance)
        if (distance > 0) {
            // Rubber banding effect - threshold sonrası daha zor çekme
            const rubberBand = distance > threshold
                ? threshold + (distance - threshold) * 0.3
                : distance;

            setPullDistance(Math.min(rubberBand, refreshHeight * 1.5));
        } else {
            setPullDistance(0);
        }
    }, [threshold, refreshHeight]);

    const handleTouchEnd = useCallback(async () => {
        if (!isDragging.current) return;

        isDragging.current = false;

        // Threshold aşıldıysa yenile
        if (pullDistance >= threshold) {
            setPullStatus('refreshing');
            setPullDistance(refreshHeight);
            setRefreshing(true);

            try {
                await onRefresh();
                setPullStatus('completed');
            } catch (error) {
                console.error('Refresh error:', error);
                setPullStatus('idle');
            } finally {
                // Reset after delay
                setTimeout(() => {
                    setPullDistance(0);
                    setPullStatus('idle');
                    setRefreshing(false);
                }, 500);
            }
        } else {
            // Threshold aşılmadı - geri dön
            setPullDistance(0);
            setPullStatus('idle');
        }
    }, [pullDistance, threshold, refreshHeight, onRefresh]);

    // Container event props
    const containerProps = {
        ref: containerRef,
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
        style: {
            position: 'relative',
            overflow: 'auto',
            height: '100%',
            WebkitOverflowScrolling: 'touch'
        }
    };

    // Refresh indicator component için props
    const refreshIndicatorProps = {
        pullDistance,
        pullStatus,
        threshold,
        refreshing
    };

    return {
        refreshing,
        pullStatus,
        pullDistance,
        containerProps,
        refreshIndicatorProps
    };
};

export default usePullToRefresh;
