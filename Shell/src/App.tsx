import React, { useState, useMemo, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Button } from '@mui/material';
import { LoadScript } from '@react-google-maps/api';
import HomePage from './components/HomePage';
import SearchResults from './components/SearchResults';
import Header from './components/Header';
import { Builder } from './types/builder';

// Define libraries for Google Maps
const libraries = ["places"] as any[];

const App: React.FC = () => {
  const [allBuilders, setAllBuilders] = useState<Builder[]>([]); // All available builders
  const [filteredBuilders, setFilteredBuilders] = useState<Builder[]>([]); // Filtered results
  const [searchType, setSearchType] = useState<'state' | 'zip' | 'builder'>('state');
  const [searchValue, setSearchValue] = useState<string>('');
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const [currentView, setCurrentView] = useState<'home' | 'results'>('home');

  // Load all available builders data on component mount
  useEffect(() => {
    const loadBuilders = async () => {
      try {
        // Try to load new database format first
        let response = await fetch('/new_alabama_builders.json');
        let data = await response.json();
        
        let buildersData = [];
        
        // Check if it's the new database format
        if (data.builders && Array.isArray(data.builders)) {
          console.log('Using new database format:', data.total_builders, 'builders found');
          buildersData = data.builders;
        } else {
          console.log('New database empty, falling back to old format');
          // Fall back to old format
          response = await fetch('/alabama_builders.json');
          buildersData = await response.json();
        }
        
        // Transform data to match our Builder interface
        const transformedData = buildersData.map((builder: any, index: number) => ({
          ...builder,
          id: builder.id || `builder-${index}`,
          location: {
            city: builder.city,
            state: builder.state,
            lat: builder.latitude || builder.lat,
            lng: builder.longitude || builder.lng
          },
          vanTypes: builder.vanTypes || ['Custom Builds', 'Sprinter Conversions'],
          description: builder.description || 'Professional van builder specializing in custom conversions and adventure-ready vehicles.',
          distanceFromZip: { miles: Math.floor(Math.random() * 500) + 10 },
          socialMedia: {
            facebook: builder.socialMedia?.facebook || '',
            instagram: builder.socialMedia?.instagram || '',
            youtube: builder.socialMedia?.youtube || '',
            tiktok: builder.socialMedia?.tiktok || ''
          }
        }));
        
        console.log('Loaded builders:', transformedData.length);
        setAllBuilders(transformedData);
      } catch (error) {
        console.error('Error loading builders:', error);
      }
    };
    
    loadBuilders();
  }, []);

  // Handle search functionality
  const handleSearch = (searchType: 'state' | 'zip' | 'builder', searchValue: string) => {
    let results: Builder[] = [];
    
    if (searchType === 'state') {
      // Filter builders by state (case insensitive)
      // Handle both full state names and abbreviations
      const searchLower = searchValue.toLowerCase();
      results = allBuilders.filter(builder => {
        const builderState = builder.state.toLowerCase();
        // Direct match
        if (builderState === searchLower) return true;
        // Check if searching for "Alabama" and builder has "AL"
        if (searchLower === 'alabama' && builderState === 'al') return true;
        // Check if searching for "AL" and builder has "Alabama"
        if (searchLower === 'al' && builderState === 'alabama') return true;
        return false;
      });
    } else if (searchType === 'zip') {
      // Filter builders by zip code
      results = allBuilders.filter(builder => 
        builder.zip.startsWith(searchValue)
      );
    } else if (searchType === 'builder') {
      // Filter builders by name (case insensitive partial match)
      results = allBuilders.filter(builder => 
        builder.name.toLowerCase().includes(searchValue.toLowerCase())
      );
    }
    
    setFilteredBuilders(results);
    setSearchType(searchType);
    setSearchValue(searchValue);
    setCurrentView('results'); // Switch to results view
  };

  // Toggle between light and dark mode
  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Handle builder selection (for future detail view)
  const handleBuilderSelect = (builder: Builder) => {
    console.log('Selected builder:', builder);
    // TODO: Implement builder detail view
  };

  // Handle navigation to home
  const handleNavigateHome = () => {
    setCurrentView('home');
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
        <Header 
          darkMode={mode === 'dark'} 
          toggleDarkMode={toggleColorMode}
          onNavigateHome={handleNavigateHome}
        />
        {currentView === 'home' ? (
          <>
            <HomePage 
              darkMode={mode === 'dark'} 
              toggleDarkMode={toggleColorMode}
              onSearch={handleSearch}
            />
            <Box sx={{ textAlign: 'center', mt: 2, mb: 4 }}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => {
                  setFilteredBuilders(allBuilders); // Show all builders
                  setSearchType('state');
                  setSearchValue('All States');
                  setCurrentView('results');
                }}
              >
                View All Builders
              </Button>
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-start', bgcolor: 'background.paper', boxShadow: 1 }}>
              <Button 
                variant="outlined" 
                onClick={() => setCurrentView('home')}
              >
                Back to Home
              </Button>
            </Box>
            <SearchResults
              builders={filteredBuilders}
              searchType={searchType}
              searchValue={searchValue}
              onBuilderSelect={handleBuilderSelect}
            />
          </>
        )}
      </LoadScript>
    </ThemeProvider>
  );
};

export default App;
