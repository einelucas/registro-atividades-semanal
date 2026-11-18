import { createTheme, ThemeOptions } from '@mui/material/styles';

const themeOptions: ThemeOptions = {
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  palette: {
    mode: 'light',
    primary: {
      main: 'rgb(48, 79, 126)',
      dark: 'rgb(33, 55, 88)',
      light: 'rgb(66, 105, 165)',
      contrastText: '#ffffff',
    },
    secondary: {
      main: 'rgb(107, 114, 128)',
      dark: 'rgb(75, 85, 99)',
      light: 'rgb(135, 141, 153)',
      contrastText: '#ffffff',
    },
    error: {
      main: 'rgb(192, 57, 43)',
      dark: 'rgb(154, 46, 34)',
      light: 'rgb(214, 90, 78)',
      contrastText: '#ffffff',
    },
    warning: {
      main: 'rgb(234, 162, 57)',
      dark: 'rgb(187, 130, 45)',
      light: 'rgb(241, 185, 107)',
      contrastText: '#ffffff',
    },
    info: {
      main: 'rgb(0, 124, 197)',
      dark: 'rgb(0, 99, 158)',
      light: 'rgb(51, 158, 220)',
      contrastText: '#ffffff',
    },
    success: {
      main: 'rgb(96, 147, 70)',
      dark: 'rgb(77, 118, 56)',
      light: 'rgb(124, 170, 99)',
      contrastText: '#ffffff',
    },
    background: {
      default: 'rgb(245, 247, 251)',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgb(31, 41, 55)',
      secondary: 'rgb(100, 116, 139)',
      disabled: 'rgba(31, 41, 55, 0.4)',
    },
    divider: 'rgba(148, 163, 184, 0.18)',
    action: {
      active: 'rgba(31, 41, 55, 0.9)',
      hover: 'rgba(31, 41, 55, 0.04)',
      selected: 'rgba(31, 41, 55, 0.08)',
      disabled: 'rgba(31, 41, 55, 0.4)',
      disabledBackground: 'rgba(31, 41, 55, 0.04)',
      focus: 'rgba(31, 41, 55, 0.1)',
    },
    grey: {
      50: 'rgb(248, 250, 252)',
      100: 'rgb(241, 245, 249)',
      200: 'rgb(226, 232, 240)',
      300: 'rgb(203, 213, 225)',
      400: 'rgb(148, 163, 184)',
      500: 'rgb(100, 116, 139)',
      600: 'rgb(71, 85, 105)',
      700: 'rgb(51, 65, 85)',
      800: 'rgb(31, 41, 55)',
      900: 'rgb(15, 23, 42)',
    },
  },
  typography: {
    fontFamily: '"Manrope", system-ui, sans-serif',
    h1: {
      fontSize: 'clamp(38px, 5vw, 70px)',
      fontWeight: 700,
      letterSpacing: '-0.06em',
      lineHeight: 1.05,
    },
    h2: {
      fontSize: 'clamp(27px, 3vw, 38px)',
      fontWeight: 780,
      letterSpacing: '-0.04em',
    },
    h3: {
      fontSize: 'clamp(22px, 2.5vw, 30px)',
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    h4: {
      fontSize: 'clamp(18px, 2vw, 24px)',
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontSize: '16px',
      fontWeight: 600,
    },
    h6: {
      fontSize: '14px',
      fontWeight: 600,
    },
    body1: {
      fontSize: '15px',
      letterSpacing: '0.009375em',
    },
    body2: {
      fontSize: '14px',
      letterSpacing: '0.009375em',
    },
    button: {
      fontSize: '0.9375rem',
      fontWeight: 500,
      letterSpacing: 'normal',
      textTransform: 'none',
    },
    caption: {
      fontSize: '12px',
    },
    overline: {
      fontSize: '10px',
      fontWeight: 800,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 7,
  },
  shadows: [
    'none',
    '0 2px 4px rgba(15, 23, 42, 0.12)',
    '0 4px 8px rgba(15, 23, 42, 0.14)',
    '0 6px 16px rgba(15, 23, 42, 0.16)',
    '0 8px 24px rgba(15, 23, 42, 0.18)',
    '0 10px 28px rgba(15, 23, 42, 0.2)',
    '0 10px 28px rgba(15, 23, 42, 0.2)',
    '0 10px 28px rgba(15, 23, 42, 0.2)',
    '0 10px 28px rgba(15, 23, 42, 0.2)',
    '0 10px 28px rgba(15, 23, 42, 0.2)',
    '0 10px 28px rgba(15, 23, 42, 0.2)',
    '0 10px 28px rgba(15, 23, 42, 0.2)',
    '0 10px 28px rgba(15, 23, 42, 0.2)',
    '0 10px 28px rgba(15, 23, 42, 0.2)',
    '0 10px 28px rgba(15, 23, 42, 0.2)',
    '0 10px 28px rgba(15, 23, 42, 0.2)',
    '0 10px 28px rgba(15, 23, 42, 0.2)',
    '0 10px 28px rgba(15, 23, 42, 0.2)',
    '0 10px 28px rgba(15, 23, 42, 0.2)',
    '0 10px 28px rgba(15, 23, 42, 0.2)',
    '0 10px 28px rgba(15, 23, 42, 0.2)',
    '0 10px 28px rgba(15, 23, 42, 0.2)',
    '0 10px 28px rgba(15, 23, 42, 0.2)',
    '0 10px 28px rgba(15, 23, 42, 0.2)',
    '0 10px 28px rgba(15, 23, 42, 0.2)',
  ],
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        size: 'medium',
      },
      styleOverrides: {
        root: {
          borderRadius: 7,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: 'rgba(148, 163, 184, 0.18)',
          minWidth: 68,
          paddingInline: 18,
          height: 40,
          transitionDuration: '0.28s',
          transitionProperty: 'box-shadow, transform, opacity, background',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(15, 23, 42, 0.12)',
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        contained: {
          borderColor: 'transparent',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(15, 23, 42, 0.14)',
          },
        },
        outlined: {
          background: 'transparent',
          '&:hover': {
            background: 'rgba(31, 41, 55, 0.04)',
            borderColor: 'rgba(31, 41, 55, 0.9)',
          },
        },
        text: {
          background: 'transparent',
          borderColor: 'transparent',
          '&:hover': {
            background: 'rgba(31, 41, 55, 0.04)',
          },
        },
        sizeSmall: {
          height: 32,
          paddingInline: 12,
        },
        sizeLarge: {
          height: 48,
          paddingInline: 24,
        },
        disabled: {
          opacity: 0.45,
          pointerEvents: 'none',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'medium',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            backgroundColor: 'rgb(255, 255, 255)',
            transitionDuration: '0.25s',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(31, 41, 55, 0.9)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: 2,
              borderColor: 'rgb(48, 79, 126)',
            },
            '&.Mui-error .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgb(192, 57, 43)',
            },
            '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(31, 41, 55, 0.18)',
            },
          },
          '& .MuiInputLabel-root': {
            transformOrigin: 'left center',
            transitionDuration: '0.15s',
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
            '&.Mui-focused': {
              color: 'rgb(48, 79, 126)',
            },
            '&.Mui-error': {
              color: 'rgb(192, 57, 43)',
            },
          },
          '& .MuiFormHelperText-root': {
            marginTop: 4,
            marginInline: 16,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(31, 41, 55, 0.9)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
            borderColor: 'rgb(48, 79, 126)',
          },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgb(192, 57, 43)',
          },
        },
        notchedOutline: {
          borderWidth: 1,
          borderColor: 'rgba(148, 163, 184, 0.22)',
          transitionDuration: '0.25s',
        },
        input: {
          padding: '8px 16px',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          transformOrigin: 'left center',
          transitionDuration: '0.15s',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        },
        shrink: {
          transform: 'translate(14px, -9px) scale(0.8125)',
        },
        outlined: {
          transform: 'translate(14px, 14px) scale(1)',
          '&.MuiInputLabel-shrink': {
            transform: 'translate(14px, -9px) scale(0.8125)',
          },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          marginTop: 4,
          marginInline: 16,
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            cursor: 'text',
          },
        },
        popper: {
          '& .MuiPaper-root': {
            borderRadius: 4,
            boxShadow: '0 6px 16px rgba(15, 23, 42, 0.16)',
          },
        },
        listbox: {
          '& .MuiListItem-root': {
            maxWidth: '100%',
            minWidth: 0,
          },
          '& .MuiTypography-root': {
            overflowWrap: 'anywhere',
            whiteSpace: 'normal',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 24,
          fontSize: 13,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 2px 4px rgba(15, 23, 42, 0.12)',
        },
        elevation2: {
          boxShadow: '0 4px 8px rgba(15, 23, 42, 0.14)',
        },
        elevation3: {
          boxShadow: '0 6px 16px rgba(15, 23, 42, 0.16)',
        },
        elevation4: {
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.18)',
        },
        elevation5: {
          boxShadow: '0 10px 28px rgba(15, 23, 42, 0.2)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 22,
          border: '1px solid rgba(148, 163, 184, 0.18)',
          boxShadow: '0 12px 42px rgba(26, 61, 115, 0.06)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgb(241, 245, 249)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgb(17, 24, 39)',
          fontSize: 13,
          borderRadius: 4,
          padding: '8px 12px',
        },
        arrow: {
          color: 'rgb(17, 24, 39)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 10px 28px rgba(33, 55, 88, 0.18)',
        },
        standardSuccess: {
          backgroundColor: 'rgba(96, 147, 70, 0.1)',
          color: 'rgb(77, 118, 56)',
        },
        standardError: {
          backgroundColor: 'rgba(192, 57, 43, 0.1)',
          color: 'rgb(154, 46, 34)',
        },
        standardWarning: {
          backgroundColor: 'rgba(234, 162, 57, 0.1)',
          color: 'rgb(187, 130, 45)',
        },
        standardInfo: {
          backgroundColor: 'rgba(0, 124, 197, 0.1)',
          color: 'rgb(0, 99, 158)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(148, 163, 184, 0.18)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderBottom: '1px solid rgba(148, 163, 184, 0.18)',
          boxShadow: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(148, 163, 184, 0.18)',
          boxShadow: '0 12px 42px rgba(26, 61, 115, 0.06)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          marginInline: 8,
          '&:hover': {
            backgroundColor: 'rgba(31, 41, 55, 0.04)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(48, 79, 126, 0.08)',
            color: 'rgb(48, 79, 126)',
            '&:hover': {
              backgroundColor: 'rgba(48, 79, 126, 0.12)',
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover': {
            backgroundColor: 'rgba(31, 41, 55, 0.04)',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.9375rem',
          minHeight: 48,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          boxShadow: '0 6px 16px rgba(15, 23, 42, 0.16)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 10px 28px rgba(33, 55, 88, 0.18)',
        },
      },
    },
    MuiModal: {
      styleOverrides: {
        root: {
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
          },
        },
      },
    },
    MuiSelect: {
      defaultProps: {
        MenuProps: {
          autoFocus: false,
        },
      },
      styleOverrides: {
        select: {
          paddingInline: 12,
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          marginInline: 0,
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          padding: 8,
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          padding: 8,
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          padding: 8,
        },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          borderRadius: 7,
          border: '1px solid rgba(148, 163, 184, 0.18)',
          '&:hover': {
            backgroundColor: 'rgba(31, 41, 55, 0.04)',
          },
        },
      },
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        separator: {
          color: 'rgba(31, 41, 55, 0.7)',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontWeight: 500,
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(148, 163, 184, 0.2)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: 'rgba(148, 163, 184, 0.2)',
        },
        colorPrimary: {
          backgroundColor: 'rgba(48, 79, 126, 0.2)',
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: 'rgb(48, 79, 126)',
        },
      },
    },
  },
};

export const theme = createTheme(themeOptions);

export default theme;