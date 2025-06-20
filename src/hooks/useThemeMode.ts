import { useState, useEffect, useMemo } from 'react';
import { createTheme, PaletteMode } from '@mui/material';

export const useThemeMode = () => {
  // Check if user has a preference stored in localStorage
  const storedMode = localStorage.getItem('themeMode') as PaletteMode | null;
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Use stored preference or system preference
  const [mode, setMode] = useState<PaletteMode>(
    storedMode || (prefersDarkMode ? 'dark' : 'light')
  );

  // Update localStorage when mode changes
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  // Toggle theme mode
  const toggleThemeMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Create theme based on mode
  const theme = useMemo(() => 
    createTheme({
      palette: {
        mode,
        primary: {
          main: '#3f51b5',
          light: '#757de8',
          dark: '#002984',
          contrastText: '#fff',
        },
        secondary: {
          main: '#f50057',
          light: '#ff4081',
          dark: '#c51162',
          contrastText: '#fff',
        },
        background: {
          default: mode === 'light' ? '#e8eaed' : '#121212',
          paper: mode === 'light' ? '#f0f2f5' : '#1e1e1e',
        },
        text: {
          primary: mode === 'light' ? '#212121' : '#e0e0e0',
          secondary: mode === 'light' ? '#757575' : '#a0a0a0',
        },
      },
      typography: {
        fontFamily: [
          '"Inter"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif"',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
        ].join(','),
        h1: {
          fontSize: '2.5rem',
          fontWeight: 700,
          marginBottom: '1rem',
          color: mode === 'light' ? '#1a237e' : '#9fa8da',
        },
        h2: {
          fontSize: '2rem',
          fontWeight: 600,
          margin: '2.5rem 0 1.5rem',
          color: mode === 'light' ? '#283593' : '#7986cb',
        },
        h3: {
          fontSize: '1.5rem',
          fontWeight: 600,
          margin: '2rem 0 1rem',
          color: mode === 'light' ? '#303f9f' : '#5c6bc0',
        },
        h4: {
          fontSize: '1.25rem',
          fontWeight: 600,
          margin: '1.5rem 0 0.75rem',
        },
        body1: {
          lineHeight: 1.7,
          color: mode === 'light' ? '#424242' : '#e0e0e0',
        },
        button: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
      shape: {
        borderRadius: 8,
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 8,
              padding: '8px 20px',
              textTransform: 'none',
              fontWeight: 500,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: '0 2px 4px -1px rgba(0,0,0,0.2), 0 4px 5px 0 rgba(0,0,0,0.14), 0 1px 10px 0 rgba(0,0,0,0.12)',
              },
            },
            contained: {
              '&:hover': {
                boxShadow: '0 3px 5px -1px rgba(0,0,0,0.2), 0 6px 10px 0 rgba(0,0,0,0.14), 0 1px 18px 0 rgba(0,0,0,0.12)',
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              boxShadow: mode === 'light' 
                ? '0 2px 8px rgba(0,0,0,0.08)' 
                : '0 2px 8px rgba(0,0,0,0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: mode === 'light'
                  ? '0 8px 25px 0 rgba(0,0,0,0.1)'
                  : '0 8px 25px 0 rgba(0,0,0,0.4)',
              },
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              boxShadow: mode === 'light'
                ? '0 2px 10px rgba(0,0,0,0.08)'
                : '0 2px 10px rgba(0,0,0,0.3)',
            },
          },
        },
        MuiTab: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              fontWeight: 500,
              minWidth: '120px',
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
            },
          },
        },
      },
    }),
  [mode]);

  return { theme, mode, toggleThemeMode };
};
