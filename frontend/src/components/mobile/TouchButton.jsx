import React from 'react';
import { Button, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

/**
 * TouchButton - Mobil için dokunmatik optimize edilmiş buton
 *
 * Minimum 44px touch target (iOS/Android accessibility standard)
 * Tık hissi iyileştirmeleri ve görsel feedback
 *
 * @param {Object} props
 * @param {string} props.variant - 'contained' | 'outlined' | 'text' (default: 'contained')
 * @param {string} props.size - 'large' | 'medium' | 'small' (default: 'large' for mobile)
 * @param {boolean} props.fullWidth - Tam genişlik (default: true)
 * @param {string} props.position - Icon position: 'start' | 'end' | 'icon-only'
 */
const TouchButton = styled(Button)(({ theme }) => ({
    // Minimum touch target 44px
    minHeight: 44,
    paddingHorizontal: theme.spacing(2),

    // Better tap feedback
    transition: 'all 0.2s ease-in-out',
    '&:active': {
        transform: 'scale(0.98)',
    },

    // Prevent text selection on double tap
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTapHighlightColor: 'transparent',

    // Better spacing for touch
    [theme.breakpoints.down('sm')]: {
        fontSize: '1rem',
        letterSpacing: '0.5px',
    },
}));

/**
 * TouchButtonGroup - Grup halindeki touch button'lar için container
 */
export const TouchButtonGroup = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    width: '100%',
}));

/**
 * TouchButtonRow - Yatay buton grubu
 */
export const TouchButtonRow = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing(1),
    width: '100%',
    '& > *': {
        flex: 1,
    },
}));

/**
 * PrimaryTouchButton - Ana aksiyon için (save, submit, etc.)
 */
export const PrimaryTouchButton = (props) => (
    <TouchButton
        variant="contained"
        color="primary"
        fullWidth
        size="large"
        {...props}
    />
);

/**
 * SecondaryTouchButton - İkincil aksiyon için (cancel, back, etc.)
 */
export const SecondaryTouchButton = (props) => (
    <TouchButton
        variant="outlined"
        fullWidth
        size="large"
        {...props}
    />
);

/**
 * DestructiveTouchButton - Silme/danger işlemleri için
 */
export const DestructiveTouchButton = (props) => (
    <TouchButton
        variant="outlined"
        color="error"
        fullWidth
        size="large"
        {...props}
    />
);

/**
 * IconTouchButton - Sadece icon içeren buton (FAB vb.)
 */
export const IconTouchButton = styled(Button)(({ theme }) => ({
    minWidth: 44,
    minHeight: 44,
    width: 44,
    height: 44,
    borderRadius: '50%',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:active': {
        transform: 'scale(0.9)',
    },
}));

export { TouchButton };
export default TouchButton;
