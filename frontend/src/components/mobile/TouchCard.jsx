import React from 'react';
import { Card, CardContent, CardActions } from '@mui/material';
import { styled } from '@mui/material/styles';
import { TouchButtonRow } from './TouchButton';

/**
 * TouchCard - Mobil için dokunmatik optimize edilmiş kart
 *
 * Better tap feedback
 * Accessible touch targets
 * Clean visual hierarchy
 */
const TouchCardRoot = styled(Card)(({ theme }) => ({
    // Subtle elevation for mobile
    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    transition: 'box-shadow 0.3s ease-in-out',

    // Hover/tap feedback
    '&:active': {
        boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
    },

    // Remove tap highlight
    WebkitTapHighlightColor: 'transparent',
}));

const TouchCardContent = styled(CardContent)(({ theme }) => ({
    // Better padding for touch
    padding: theme.spacing(2),

    // Prevent text selection on tap
    userSelect: 'none',
    WebkitUserSelect: 'none',

    // Better touch feedback for interactive elements
    '&:active': {
        backgroundColor: theme.palette.action.selected,
    },
}));

const TouchCardActions = styled(CardActions)(({ theme }) => ({
    // Better spacing for touch buttons
    padding: theme.spacing(1, 2, 2),
    gap: theme.spacing(1),

    // Ensure buttons are full width
    '& > *': {
        flex: 1,
        minWidth: 0, // Allow buttons to shrink
    },
}));

/**
 * TouchCard - Ana component
 */
const TouchCard = React.forwardRef(({ children, actions, onClick, ...props }, ref) => {
    return (
        <TouchCardRoot
            ref={ref}
            onClick={onClick}
            {...props}
        >
            <TouchCardContent>
                {children}
            </TouchCardContent>
            {actions && (
                <TouchCardActions>
                    {actions}
                </TouchCardActions>
            )}
        </TouchCardRoot>
    );
});

TouchCard.displayName = 'TouchCard';

/**
 * TouchListItem - Liste item'ı için optimize edilmiş kart
 */
export const TouchListItem = styled(TouchCard)(({ theme }) => ({
    marginBottom: theme.spacing(1),
    cursor: 'pointer',

    // Visual feedback on tap
    '&:active': {
        transform: 'scale(0.99)',
    },
}));

/**
 * TouchDetailCard - Detay gösterimi için kart (daha az padding)
 */
export const TouchDetailCard = styled(Card)(({ theme }) => ({
    marginBottom: theme.spacing(2),
    overflow: 'hidden',

    // Subtle border instead of shadow
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: 'none',
}));

export const TouchDetailContent = styled(CardContent)(({ theme }) => ({
    padding: theme.spacing(2),

    // Better spacing for content
    '&:last-child': {
        paddingBottom: theme.spacing(2),
    },
}));

export default TouchCard;
