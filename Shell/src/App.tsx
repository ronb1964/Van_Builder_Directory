import React, { useState, useMemo, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Button } from '@mui/material';
import { LoadScript } from '@react-google-maps/api';
import HomePage from './components/HomePage';
import SearchResults from './components/SearchResults';
import Header from './components/Header';
import { Builder } from './types/builder';

const API_BASE_URL = 'http://localhost:3002/api';

const libraries = ["places"] as any[];

const App: React.FC = () => {
  const [allBuilders, setAllBuilders] = useState<Builder[]>([]); // All available builders
  const [filteredBuilders, setFilteredBuilders] = useState<Builder[]>([]); // Filtered results
  const [searchType, setSearchType] = useState<'state' | 'zip' | 'builder'>('state');
  const [searchValue, setSearchValue] = useState<string>('');
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const [currentView, setCurrentView] = useState<'home' | 'results'>('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all builders from API
  const loadAllBuilders = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Loading all builders from API...');
      
      const response = await fetch(`${API_BASE_URL}/builders`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Loaded ${data.count} builders from database`);
        setAllBuilders(data.data);
      } else {
        throw new Error(data.error || 'Failed to load builders');
      }
    } catch (error) {
      console.error('❌ Error loading builders:', error);
      setError('Failed to load builders. Please try again.');
      setAllBuilders([]);
    } finally {
      setLoading(false);
    }
  };

  // Search builders by state
  const searchBuildersByState = async (state: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`🔍 Searching builders in state: ${state}`);
      
      const response = await fetch(`${API_BASE_URL}/builders/state/${encodeURIComponent(state)}`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Found ${data.count} builders in ${state}`);
        setFilteredBuilders(data.data);
      } else {
        throw new Error(data.error || 'Failed to search builders');
      }
    } catch (error) {
      console.error('❌ Error searching builders:', error);
      setError('Failed to search builders. Please try again.');
      setFilteredBuilders([]);
    } finally {
      setLoading(false);
    }
  };

  // Search builders by name
  const searchBuildersByName = async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`🔍 Searching builders by name: ${query}`);
      
      const response = await fetch(`${API_BASE_URL}/builders/search/${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Found ${data.count} builders matching "${query}"`);
        setFilteredBuilders(data.data);
      } else {
        throw new Error(data.error || 'Failed to search builders');
      }
    } catch (error) {
      console.error('❌ Error searching builders:', error);
      setError('Failed to search builders. Please try again.');
      setFilteredBuilders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (searchValue: string, searchType: 'state' | 'zip' | 'builder') => {
    console.log(`🔍 Search initiated: ${searchType} = "${searchValue}"`);
    
    if (!searchValue.trim()) {
      console.log('❌ Empty search value');
      return;
    }

    // Save search parameters to state
    setSearchType(searchType);
    setSearchValue(searchValue);

    try {
      if (searchType === 'state') {
        await searchBuildersByState(searchValue);
      } else if (searchType === 'builder') {
        await searchBuildersByName(searchValue);
      } else if (searchType === 'zip') {
        // For now, load all builders and filter by zip on frontend
        // TODO: Add zip search endpoint to API
        await loadAllBuilders();
        const filteredBuilders = allBuilders.filter(builder => 
          builder.zip && builder.zip.includes(searchValue)
        );
        setFilteredBuilders(filteredBuilders);
        console.log(`✅ Found ${filteredBuilders.length} builders near zip ${searchValue}`);
      }
      
      setCurrentView('results');
    } catch (error) {
      console.error('❌ Search failed:', error);
    }
  };

  // Load all available builders data on component mount
  useEffect(() => {
    loadAllBuilders();
  }, []);

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
              onSearch={(searchType: 'state' | 'zip' | 'builder', searchValue: string) => handleSearch(searchValue, searchType)}
              builderCount={allBuilders.length}
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
                variant="contained" 
                onClick={() => setCurrentView('home')}
                sx={{
                  background: 'linear-gradient(135deg, #2c3e50 0%, #3f51b5 100%)',
                  color: 'white',
                  fontWeight: '600',
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #34495e 0%, #5c6bc0 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
                  }
                }}
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
