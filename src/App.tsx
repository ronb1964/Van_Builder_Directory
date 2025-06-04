import React, { useState, useMemo } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Button } from '@mui/material';
import { LoadScript } from '@react-google-maps/api';
import BuilderList from './components/BuilderList';
import CustomGoogleMap from './components/CustomGoogleMap';
import HomePage from './components/HomePage';
import { Builder } from './types/builder';

// Define libraries for Google Maps
const libraries = ["places"] as any[];

const App: React.FC = () => {
  const [selectedBuilder, setSelectedBuilder] = useState<Builder | null>(null);
  const [builders] = useState<Builder[]>([]); // Start with empty array, add data fetching later
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const [currentView, setCurrentView] = useState<'home' | 'directory'>('home');

  // Toggle between light and dark mode
  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Create theme based on current mode
  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: {
        main: '#4a5de8',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#f5f5f5',
        paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
    },
  }), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LoadScript
        googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''}
        libraries={libraries}
      >
        {currentView === 'home' ? (
          <>
            <HomePage darkMode={mode === 'dark'} toggleDarkMode={toggleColorMode} />
            <Box sx={{ textAlign: 'center', mt: 2, mb: 4 }}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => setCurrentView('directory')}
              >
                View Builder Directory
              </Button>
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                variant="outlined" 
                onClick={() => setCurrentView('home')}
              >
                Back to Home
              </Button>
              <Button 
                variant="outlined" 
                onClick={toggleColorMode}
              >
                Toggle {mode === 'dark' ? 'Light' : 'Dark'} Mode
              </Button>
            </Box>
            <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <BuilderList
                  builders={builders}
                  onBuilderSelect={setSelectedBuilder}
                  selectedBuilder={selectedBuilder}
                />
              </div>
              <div style={{ flex: 1 }}>
                <CustomGoogleMap
                  builders={builders}
                  selectedBuilder={selectedBuilder}
                  onBuilderSelect={setSelectedBuilder}
                />
              </div>
            </div>
          </>
        )}
      </LoadScript>
    </ThemeProvider>
  );
};

export default App;
