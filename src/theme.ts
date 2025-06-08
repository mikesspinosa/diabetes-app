import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { esES } from '@mui/material/locale';
import { deviceBreakpoints } from './utils/responsive';

// Crear tema base
let theme = createTheme({
  breakpoints: {
    values: {
      xs: deviceBreakpoints.xs,
      sm: deviceBreakpoints.sm,
      md: deviceBreakpoints.tablet.sm,
      lg: deviceBreakpoints.laptop.sm,
      xl: deviceBreakpoints.desktop.sm,
    },
  },
  palette: {
    primary: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
    },
    secondary: {
      main: '#f50057',
      light: '#ff4081',
      dark: '#c51162',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      '@media (min-width:600px)': {
        fontSize: '3rem',
      },
      '@media (min-width:960px)': {
        fontSize: '3.5rem',
      },
    },
    h2: {
      fontSize: '2rem',
      '@media (min-width:600px)': {
        fontSize: '2.5rem',
      },
      '@media (min-width:960px)': {
        fontSize: '3rem',
      },
    },
    h3: {
      fontSize: '1.75rem',
      '@media (min-width:600px)': {
        fontSize: '2rem',
      },
      '@media (min-width:960px)': {
        fontSize: '2.25rem',
      },
    },
    body1: {
      fontSize: '1rem',
      '@media (min-width:600px)': {
        fontSize: '1.1rem',
      },
    },
    body2: {
      fontSize: '0.875rem',
      '@media (min-width:600px)': {
        fontSize: '0.95rem',
      },
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          '@media (max-width:600px)': {
            borderRadius: 12,
            margin: '0 -8px',
            width: 'calc(100% + 16px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          '@media (max-width:600px)': {
            borderRadius: 12,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            padding: '0 16px',
          },
          '@media (min-width:600px)': {
            padding: '0 24px',
          },
          '@media (min-width:960px)': {
            padding: '0 32px',
          },
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          borderRadius: '16px 16px 0 0',
          '@media (max-width:600px)': {
            borderRadius: '12px 12px 0 0',
          },
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            padding: '6px 0',
            minWidth: 'auto',
          },
        },
        label: {
          '@media (max-width:600px)': {
            fontSize: '0.7rem',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            padding: 12,
            '&:last-child': {
              paddingBottom: 12,
            },
          },
        },
      },
    },
    MuiGrid: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            margin: 0,
            padding: 0,
          },
        },
        item: {
          '@media (max-width:600px)': {
            paddingLeft: '8px !important',
            paddingRight: '8px !important',
          },
        },
      },
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 8,
  },
}, esES);

// Aplicar tipografía responsiva
theme = responsiveFontSizes(theme, {
  breakpoints: ['xs', 'sm', 'md', 'lg', 'xl'],
  factor: 0.5,
});

export default theme; 