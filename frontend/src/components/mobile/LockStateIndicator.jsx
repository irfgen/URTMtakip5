import React from 'react';
import { Alert, Typography, Box, Chip, IconButton, Tooltip } from '@mui/material';
import {
    Lock as LockIcon,
    LockOpen as LockOpenIcon,
    Schedule as ScheduleIcon,
    Person as PersonIcon,
    AdminPanelSettings as AdminIcon
} from '@mui/icons-material';

/**
 * LockStateIndicator - Mobil Kilit Durumu Gösterge Component'i
 *
 * Fatura & İrsaliye eşleştirme sisteminde 4-state lock mekanizmasını görselleştirir.
 *
 * Lock States:
 * - UNLOCKED: Kilit yok, herkes düzenleyebilir
 * - LOCKED_BY_ME: Benim kilitlendi, sadece ben düzenleyebilirim
 * - LOCKED_BY_OTHER: Başka bir kullanıcı tarafından kilitli, düzenlenemez
 * - LOCK_EXPIRED: Kilit süresi doldu, yeniden edinilebilir
 *
 * @param {Object} props
 * @param {Object} props.lockState - Lock state bilgisi
 * @param {string} props.lockState.state - Lock state ('UNLOCKED', 'LOCKED_BY_ME', 'LOCKED_BY_OTHER', 'LOCK_EXPIRED')
 * @param {Date} props.lockState.lockedAt - Kilit alınma zamanı
 * @param {Date} props.lockState.expiresAt - Kilit bitiş zamanı
 * @param {Object} props.lockState.lockedBy - Kilidi alan kullanıcı bilgisi
 * @param {string} props.lockState.lockedBy.ad_soyad - Kullanıcı adı
 * @param {Function} props.onAcquireLock - Kilit al callback
 * @param {Function} props.onReleaseLock - Kilit bırak callback
 * @param {Function} props.onForceRelease - Zorla kilit bırak callback (admin)
 * @param {boolean} props.showActions - Action butonlarını göster (default: true)
 * @param {boolean} props.compact - Compact mod (detaysız, sadece icon)
 * @param {string} props.variant - Gösterim tipi: 'banner' | 'chip' | 'inline' (default: 'banner')
 */
const LockStateIndicator = ({
    lockState,
    onAcquireLock,
    onReleaseLock,
    onForceRelease,
    showActions = true,
    compact = false,
    variant = 'banner'
}) => {
    // Lock state yoksa gösterme
    if (!lockState) {
        return variant === 'chip' ? (
            <Chip
                icon={<LockOpenIcon />}
                label="Kilitsiz"
                size="small"
                color="default"
            />
        ) : null;
    }

    /**
     * Kalan süreyi hesapla
     */
    const getRemainingTime = () => {
        if (!lockState.expiresAt) return null;

        const now = new Date();
        const expires = new Date(lockState.expiresAt);
        const diff = expires - now;

        if (diff <= 0) return 'Süre doldu';

        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    /**
     * Lock state'e göre içerik oluştur
     */
    const renderContent = () => {
        switch (lockState.state) {
            case 'LOCKED_BY_ME':
                return {
                    severity: 'success',
                    icon: <LockIcon />,
                    title: 'Sizin kilidiniz',
                    message: compact
                        ? 'Düzenleyebilirsiniz'
                        : 'Bu belgeyi siz düzenliyorsunuz. Diğer kullanıcılar düzenleyemez.',
                    timeInfo: lockState.expiresAt && getRemainingTime(),
                    color: 'success'
                };

            case 'LOCKED_BY_OTHER':
                return {
                    severity: 'error',
                    icon: <LockIcon />,
                    title: 'Kilitli',
                    message: compact
                        ? 'Başka bir kullanıcı düzenliyor'
                        : `${lockState.lockedBy?.ad_soyad || 'Başka bir kullanıcı'} tarafından düzenleniyor.`,
                    timeInfo: lockState.expiresAt && getRemainingTime(),
                    color: 'error'
                };

            case 'LOCK_EXPIRED':
                return {
                    severity: 'warning',
                    icon: <LockOpenIcon />,
                    title: 'Kilit süresi doldu',
                    message: 'Kilit süresi doldu. Düzenleyebilirsiniz.',
                    timeInfo: null,
                    color: 'warning'
                };

            case 'UNLOCKED':
            default:
                return {
                    severity: 'info',
                    icon: <LockOpenIcon />,
                    title: 'Kilitsiz',
                    message: 'Herkes düzenleyebilir.',
                    timeInfo: null,
                    color: 'default'
                };
        }
    };

    const content = renderContent();

    /**
     * Banner variant - Alert bileşeni ile gösterim
     */
    if (variant === 'banner') {
        return (
            <Alert
                severity={content.severity}
                icon={content.icon}
                sx={{
                    borderRadius: 1,
                    mb: 2,
                    '& .MuiAlert-message': {
                        flex: 1
                    }
                }}
                action={
                    showActions && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {lockState.state === 'LOCKED_BY_ME' && onReleaseLock && (
                                <Chip
                                    label="Kilidi Bırak"
                                    size="small"
                                    onClick={onReleaseLock}
                                    clickable
                                    color={content.color}
                                />
                            )}
                            {lockState.state === 'LOCKED_BY_OTHER' && onForceRelease && (
                                <Tooltip title="Admin: Zorla kilidi bırak">
                                    <IconButton
                                        size="small"
                                        onClick={onForceRelease}
                                        color="error"
                                    >
                                        <AdminIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                            {(lockState.state === 'UNLOCKED' || lockState.state === 'LOCK_EXPIRED') && onAcquireLock && (
                                <Chip
                                    icon={<LockIcon fontSize="small" />}
                                    label="Kilitle"
                                    size="small"
                                    onClick={onAcquireLock}
                                    clickable
                                    color={content.color}
                                />
                            )}
                        </Box>
                    )
                }
            >
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                            {content.title}
                        </Typography>
                        {content.timeInfo && (
                            <Chip
                                icon={<ScheduleIcon fontSize="small" />}
                                label={content.timeInfo}
                                size="small"
                                variant="outlined"
                            />
                        )}
                    </Box>
                    {!compact && (
                        <Typography variant="body2" color="text.secondary">
                            {content.message}
                        </Typography>
                    )}
                    {lockState.lockedBy && lockState.state === 'LOCKED_BY_OTHER' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <PersonIcon fontSize="inherit" sx={{ fontSize: 14 }} />
                            <Typography variant="caption" color="text.secondary">
                                {lockState.lockedBy.ad_soyad || 'Bilinmeyen kullanıcı'}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Alert>
        );
    }

    /**
     * Chip variant - Chip bileşeni ile gösterim
     */
    if (variant === 'chip') {
        return (
            <Chip
                icon={content.icon}
                label={content.title}
                size="small"
                color={content.color}
                variant={lockState.state === 'UNLOCKED' ? 'outlined' : 'filled'}
            />
        );
    }

    /**
     * Inline variant - Sadece metin ve icon ile gösterim
     */
    if (variant === 'inline') {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {content.icon}
                <Box>
                    <Typography variant="body2" fontWeight="bold">
                        {content.title}
                    </Typography>
                    {!compact && (
                        <Typography variant="caption" color="text.secondary">
                            {content.message}
                        </Typography>
                    )}
                </Box>
                {content.timeInfo && (
                    <Chip
                        icon={<ScheduleIcon fontSize="small" />}
                        label={content.timeInfo}
                        size="small"
                    />
                )}
            </Box>
        );
    }

    return null;
};

export default LockStateIndicator;
