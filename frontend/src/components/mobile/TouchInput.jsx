import React from 'react';
import { TextField, textFieldClasses } from '@mui/material';
import { styled } from '@mui/material/styles';

/**
 * TouchInput - Mobil için dokunmatik optimize edilmiş input
 *
 * Minimum 44px touch target
 * Better tap handling
 * Improved focus states for touch
 */
const TouchInput = styled(TextField)(({ theme }) => ({
    // Larger input height for better touch
    '& .MuiInputBase-root': {
        minHeight: 48,
        fontSize: '1rem',

        // Better touch feedback
        transition: 'all 0.2s ease-in-out',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
    },

    // Larger input for multiline
    '& .MuiInputBase-multiline': {
        minHeight: 80,
        paddingTop: theme.spacing(1.5),
        paddingBottom: theme.spacing(1.5),
    },

    // Better label size
    '& .MuiInputLabel-root': {
        fontSize: '0.95rem',
        transform: 'translate(14px, 16px) scale(1)',
    },

    '& .MuiInputLabel-shrink': {
        fontSize: '1rem',
    },

    // Larger select icon
    '& .MuiSelect-select': {
        paddingTop: theme.spacing(1.5),
        paddingBottom: theme.spacing(1.5),
        minHeight: 48,
    },

    // Better focus indicator
    '& .Mui-focused': {
        '& .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
        },
    },
}));

/**
 * TouchSearchInput - Arama input'u için optimize edilmiş versiyon
 */
export const TouchSearchInput = styled(TouchInput)(({ theme }) => ({
    '& .MuiInputBase-root': {
        borderRadius: 24,
        paddingLeft: theme.spacing(2),
        backgroundColor: theme.palette.action.hover,
    },

    '& .MuiInputBase-input': {
        paddingLeft: 0,
    },
}));

/**
 * TouchNumericInput - Sayısal input için
 */
export const TouchNumericInput = (props) => (
    <TouchInput
        type="number"
        inputProps={{
            inputMode: 'numeric',
            pattern: '[0-9]*',
            ...props.inputProps
        }}
        {...props}
    />
);

/**
 * TouchPhoneInput - Telefon input'u için
 */
export const TouchPhoneInput = (props) => (
    <TouchInput
        type="tel"
        inputProps={{
            inputMode: 'tel',
            pattern: '[+0-9]*',
            ...props.inputProps
        }}
        {...props}
    />
);

/**
 * TouchEmailInput - Email input'u için
 */
export const TouchEmailInput = (props) => (
    <TouchInput
        type="email"
        inputProps={{
            inputMode: 'email',
            autoCapitalize: 'off',
            autoCorrect: 'off',
            spellCheck: 'false',
            ...props.inputProps
        }}
        {...props}
    />
);

export { TouchInput };
export default TouchInput;
