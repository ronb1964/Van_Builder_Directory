import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  ThemeProvider, 
  CssBaseline, 
  Container, 
  Box, 
  Typography, 
  Tabs,
  Tab,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  useMediaQuery,
  Snackbar,
  Alert,
  createTheme,
  PaletteMode,
  Paper
} from '@mui/material';
import { getGoogleMapsApiKey } from './utils/apiUtils';
import { centerElementOnScreen } from './utils/scrollUtils';
import SimpleMapView from './components/SimpleMapView';
import ViewListIcon from '@mui/icons-material/ViewList';
import MapIcon from '@mui/icons-material/Map';
import ClearIcon from '@mui/icons-material/Clear';
import { 
  StateSelector, 
  BuilderCard, 
  BuilderModal,
  ThemeToggle,
  BackToTop,
  RecentlyViewedSection,
  SkeletonLoader,
} from './components';
import GoogleSheetBuildersList from './components/GoogleSheetBuildersList';
import CustomGoogleMap from './components/CustomGoogleMap';
import SecureImage from './components/SecureImage';
import { Location } from './types';
import { 
  useThemeMode, 
  useRecentlyViewed,
  useScrollToResults
} from './hooks';
import { jsonDataService, apiDataService } from './services/jsonDataService';
import { Builder } from './services/googleSheetsService';
import { useJsApiLoader } from '@react-google-maps/api';

const createHumbleRoadBuilder = (): Builder => ({
  id: 'nj-1',
  name: 'Humble Road',
  address: 'Brick, NJ 08723',
  phone: '(732) 555-1234',
  email: 'georgemauro@humbleroad.tv',
  website: 'https://www.humbleroad.tv',
  location: { lat: 40.0583, lng: -74.1371, city: 'Brick', state: 'NJ', zip: '08723' },
  description: 'Custom tailored camper vans built by George Mauro. Specializing in luxury conversions for full-timers and extended living in comfort. From micro-campers to full-size luxury vans.',
  rating: 4.9,
  reviewCount: 87,
  reviews: [],
  vanTypes: ['Sprinter', 'Transit', 'Promaster', 'Promaster City'],
  priceRange: { min: 38000, max: 215000 },
  pricingTiers: [],
  amenities: ['Solar Power', 'Kitchen', 'Shower', 'Toilet', 'Heating', 'Air Conditioning', 'Custom Storage'],
  services: ['Custom Builds', 'Electrical', 'Plumbing', 'Design Consultation'],
  certifications: [],
  yearsInBusiness: 5,
  leadTime: '4-8 months',
  socialMedia: {
    youtube: 'HumbleRoad',
    facebook: 'HumbleRoadLLC',
  },
  gallery: [
    {
      url: 'https://images.squarespace-cdn.com/content/v1/5d7f95ea7d3be50012ad8e2d/1626285444291-DSCF9146.jpg',
      alt: 'Humble Road van conversion interior',
      caption: 'Interior view of Humble Road van conversion'
    },
    {
      url: 'https://images.squarespace-cdn.com/content/v1/5d7f95ea7d3be50012ad8e2d/1626285444291-DSCF9147.jpg',
      alt: 'Humble Road van conversion exterior',
      caption: 'Exterior view of Humble Road van conversion'
    },
    {
      url: 'https://images.squarespace-cdn.com/content/v1/5d7f95ea7d3be50012ad8e2d/1626285444291-DSCF9148.jpg',
      alt: 'Humble Road van conversion kitchen',
      caption: 'Kitchen area of Humble Road van conversion'
    },
  ],
});

const MOCK_BUILDERS: Record<string, Builder[]> = {
  "California": [
    {
      id: 'ca-1',
      name: 'Vanlife Customs',
      address: '123 Van Street, Los Angeles, CA 90001',
      phone: '(555) 123-4567',
      email: 'info@vanlifecustoms.com',
      website: 'https://vanlifecustoms.com',
      location: { lat: 34.0522, lng: -118.2437, city: 'Los Angeles', state: 'CA', zip: '90001' },
      description: 'Custom van conversions with luxury finishes. Specializing in high-end Mercedes Sprinter builds.',
      rating: 4.8,
      reviewCount: 124,
      reviews: [],
      vanTypes: ['Sprinter', 'Transit', 'Promaster'],
      priceRange: { min: 35000, max: 120000 },
      pricingTiers: [],
      amenities: ['Solar Power', 'Kitchen', 'Bathroom', 'Heating', 'Air Conditioning'],
      services: ['Custom Builds', 'Mechanical Work', 'Electrical', 'Plumbing'],
      certifications: ['RVIA Certified', 'EPA Certified'],
      yearsInBusiness: 8,
      leadTime: '3-6 months',
      socialMedia: {
        instagram: 'vanlifecustoms',
        facebook: 'vanlifecustoms',
        youtube: 'vanlifecustoms',
      },
      gallery: [
        {
          url: 'https://example.com/van1.jpg',
          alt: 'Vanlife Customs van conversion interior',
          caption: 'Interior view of Vanlife Customs van conversion'
        },
        {
          url: 'https://example.com/van2.jpg',
          alt: 'Vanlife Customs van conversion exterior',
          caption: 'Exterior view of Vanlife Customs van conversion'
        },
        {
          url: 'https://example.com/van3.jpg',
          alt: 'Vanlife Customs van conversion kitchen',
          caption: 'Kitchen area of Vanlife Customs van conversion'
        },
      ],
    },
  ],
};

const getTheme = (mode: PaletteMode) => createTheme({
  palette: {
    mode,
    primary: {
      main: '#4A90E2',
      dark: '#357ABD',
      light: '#7BB2F0',
    },
    secondary: {
      main: '#E8F4FD',
      dark: '#B8DCF2',
      light: '#F5F9FE',
    },
    background: {
      default: mode === 'dark' ? '#121212' : '#F8FAFC',
      paper: mode === 'dark' ? '#1E1E1E' : '#FFFFFF',
    },
    text: {
      primary: mode === 'dark' ? '#FFFFFF' : '#1A202C',
      secondary: mode === 'dark' ? '#B0B0B0' : '#4A5568',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    body1: {
      lineHeight: 1.6,
    },
    body2: {
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: '0 2px 8px rgba(74, 144, 226, 0.2)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
  },
});

const App = () => {
  // Load Google Maps API with secure key handling
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: getGoogleMapsApiKey(),
    libraries: ['places'], // Add places library for better functionality
    version: "weekly", // Use weekly version like the working test
    region: "US", // Set region for better performance
    language: "en", // Set language
  });

  // Debug API key and loading status
  useEffect(() => {
    const apiKey = getGoogleMapsApiKey();
    console.log('🗝️ Google Maps API Debug:', {
      hasKey: !!apiKey && apiKey !== 'MISSING_API_KEY',
      keyLength: apiKey ? apiKey.length : 0,
      keyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'NONE',
      isLoaded,
      loadError: loadError?.message || 'None',
      windowGoogle: typeof window !== 'undefined' && !!window.google,
      googleMaps: typeof window !== 'undefined' && !!window.google?.maps
    });
    
    if (loadError) {
      console.error('🚨 Google Maps Load Error:', loadError);
    }
    
    if (isLoaded) {
      console.log('✅ Google Maps API loaded successfully');
    }
  }, [isLoaded, loadError]);

  // Use custom hooks
  const { mode, toggleThemeMode } = useThemeMode();
  const theme = getTheme(mode);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { recentlyViewed, addToRecentlyViewed, clearRecentlyViewed } = useRecentlyViewed();
  const scrollToResults = useScrollToResults();

  // State management
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedZipCode, setSelectedZipCode] = useState<string>('');
  const [searchedBuilderName, setSearchedBuilderName] = useState<string>('');
  const [isZoomedToBuilder, setIsZoomedToBuilder] = useState<boolean>(false);
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [buildersByState, setBuildersByState] = useState<Record<string, Builder[]>>({});
  const [mapCenter, setMapCenter] = useState({ lat: 39.8283, lng: -98.5795 }); // Center of US
  const [showMap, setShowMap] = useState(false);
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [selectedBuilder, setSelectedBuilder] = useState<Builder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const [activeTab, setActiveTab] = useState(0);

  // Add Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);
  
  // Fetch builders by state
  useEffect(() => {
    const fetchBuilders = async () => {
      try {
        const allBuilders = await apiDataService.getBuilders();
        console.log('🏗️ App: Total builders fetched:', allBuilders.length);
        
        // Organize builders by state
        const buildersByStateData: Record<string, Builder[]> = {};
        allBuilders.forEach((builder: any) => {
          const state = builder.state || builder.location?.state;
          console.log(`🏗️ Processing builder: ${builder.name} in ${state}`);
          if (!buildersByStateData[state]) {
            buildersByStateData[state] = [];
          }
          buildersByStateData[state].push(builder);
        });
        
        console.log('🗺️ App: Builders organized by state:', Object.keys(buildersByStateData).map(state => 
          `${state}: ${buildersByStateData[state].length}`
        ).join(', '));
        
        const totalBuilders = Object.values(buildersByStateData).reduce((acc, builders) => acc + builders.length, 0);
        console.log('📊 App: Total builder count for homepage:', totalBuilders);
        
        setBuildersByState(buildersByStateData);
        setBuilders(allBuilders);
      } catch (err) {
        console.error('🚨 Error fetching builders:', err);
      }
    };
    
    fetchBuilders();
  }, []);  

  // Handle state selection
  const handleStateSelect = useCallback(async (state: string) => {
    console.log('🏛️ State selected:', state);
    setSelectedState(state);
    setSelectedZipCode(''); // Clear zip code when selecting state
    setSearchedBuilderName(''); // Clear builder name when selecting state
    setIsZoomedToBuilder(false); // Reset zoom state
    
    if (!state) {
      return;
    }

    // Update map center based on the new selected state
    if (buildersByState[state] && buildersByState[state].length > 0) {
      const builders = buildersByState[state];
      const validBuilders = builders.filter(b => 
        b.location?.lat && b.location?.lng && 
        !isNaN(b.location.lat) && !isNaN(b.location.lng)
      );
      
      if (validBuilders.length > 0) {
        const totalLat = validBuilders.reduce((sum, b) => sum + b.location.lat, 0);
        const totalLng = validBuilders.reduce((sum, b) => sum + b.location.lng, 0);
        
        setMapCenter({
          lat: totalLat / validBuilders.length,
          lng: totalLng / validBuilders.length
        });
        
        console.log(`🗺️ Map center updated for ${state}: ${totalLat / validBuilders.length}, ${totalLng / validBuilders.length}`);
      } else {
        // Fallback to state default center if no valid coordinates
        setMapCenter(getStateDefaultCenter(state));
      }
    } else {
      // No builders found, use state default center
      setMapCenter(getStateDefaultCenter(state));
    }
    
    scrollToResults();
  }, [buildersByState, scrollToResults]);

  // Handle builder name search
  const handleBuilderNameSearch = useCallback((builderName: string) => {
    console.log('🔍 Builder name search:', builderName);
    setSearchedBuilderName(builderName);
    setSelectedState(''); // Clear state when searching by builder name
    setSelectedZipCode(''); // Clear zip code when searching by builder name
    setIsZoomedToBuilder(false); // Reset zoom state
    scrollToResults();
  }, [scrollToResults]);

  // Handle zip code search
  const handleZipCodeSelect = useCallback(async (zipCode: string) => {
    console.log('📍 Zip code search:', zipCode);
    console.log('🏗️ Available builders for search:', builders.length);
    setSelectedZipCode(zipCode);
    setSelectedState(''); // Clear state when searching by zip code
    setSearchedBuilderName(''); // Clear builder name when searching by zip code
    setIsZoomedToBuilder(false); // Reset zoom state
    
    if (!zipCode) {
      return;
    }

    try {
      // Use Google Maps Geocoding API to get coordinates for the zip code
      if (window.google && window.google.maps) {
        const geocoder = new window.google.maps.Geocoder();
        
        geocoder.geocode({ address: zipCode + ', USA' }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location;
            const zipLat = location.lat();
            const zipLng = location.lng();
            
            console.log(`📍 Zip code ${zipCode} coordinates:`, zipLat, zipLng);
            
            // Set map center to zip code location
            setMapCenter({ lat: zipLat, lng: zipLng });
            
            // Find builders within 100 miles of the zip code
            const nearbyBuildersWithDistance = builders
              .map(builder => {
                if (!builder.location?.lat || !builder.location?.lng) return null;
                
                const distance = calculateDistance(
                  zipLat, zipLng,
                  builder.location.lat, builder.location.lng
                );
                
                // Add distance information to the builder
                const builderWithDistance: Builder = {
                  ...builder,
                  distanceFromZip: {
                    miles: Math.round(distance * 10) / 10, // Round to 1 decimal place
                    zipCode: zipCode
                  }
                };
                
                return { builder: builderWithDistance, distance };
              })
              .filter((item): item is { builder: Builder; distance: number } => 
                item !== null && item.distance <= 100
              )
              .sort((a, b) => a.distance - b.distance)
              .map(item => item.builder);
            
            console.log(`🏗️ Found ${nearbyBuildersWithDistance.length} builders within 100 miles of ${zipCode}`);
            
            // Update builders list with nearby builders
            setBuildersByState({ [zipCode]: nearbyBuildersWithDistance });
            
            setSnackbarMessage(`Found ${nearbyBuildersWithDistance.length} builders within 100 miles of ${zipCode}`);
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
          } else {
            console.error('❌ Geocoding failed:', status);
            setSnackbarMessage(`Could not find location for zip code ${zipCode}`);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
          }
        });
      } else {
        console.error('❌ Google Maps API not available');
        setSnackbarMessage('Location services not available');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('❌ Error in zip code search:', error);
      setSnackbarMessage('Error searching by zip code');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
    
    scrollToResults();
  }, [builders, scrollToResults]);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3959; // Radius of Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Helper function to get default center for states
  const getStateDefaultCenter = (state: string): { lat: number; lng: number } => {
    const stateDefaults: Record<string, { lat: number; lng: number }> = {
      'Alabama': { lat: 32.3617, lng: -86.2792 },
      'Alaska': { lat: 64.0685, lng: -152.2782 },
      'Arizona': { lat: 34.2744, lng: -111.2847 },
      'Arkansas': { lat: 34.7519, lng: -92.1313 },
      'California': { lat: 36.7783, lng: -119.4179 },
      'Colorado': { lat: 39.5501, lng: -105.7821 },
      'Connecticut': { lat: 41.6032, lng: -73.0877 },
      'Florida': { lat: 27.7663, lng: -82.6404 },
      'Georgia': { lat: 32.1656, lng: -82.9001 },
      'Hawaii': { lat: 19.8968, lng: -155.5828 },
      'New Jersey': { lat: 40.0583, lng: -74.4057 },
      'New York': { lat: 42.1657, lng: -74.9481 },
      'Texas': { lat: 31.9686, lng: -99.9018 },
      'Washington': { lat: 47.7511, lng: -120.7401 },
      // Add more as needed
    };
    
    return stateDefaults[state] || { lat: 39.8283, lng: -98.5795 }; // Default to US center
  };

  // Handle clearing all search results
  const handleClearResults = useCallback(() => {
    setSelectedState('');
    setSearchedBuilderName('');
    setSelectedZipCode('');
    setBuildersByState({});
    setMapCenter({ lat: 39.8283, lng: -98.5795 }); // Reset to US center
    setIsZoomedToBuilder(false); // Reset zoom state
  }, []);

  // Handle zooming to a specific builder location
  const handleZoomToBuilder = useCallback((builder: Builder) => {
    if (builder.location?.lat && builder.location?.lng) {
      // Switch to map view
      setActiveTab(1);
      
      // Set zoom to builder flag
      setIsZoomedToBuilder(true);
      
      // Add a small delay to ensure map view is rendered before centering
      setTimeout(() => {
        // Find the builder's index in the current displayed list to calculate offset
        let builderIndex = 0;
        let currentBuilders: Builder[] = [];
        
        if (selectedZipCode && buildersByState[selectedZipCode]) {
          // For zip code searches, results are stored under the zip code key
          currentBuilders = buildersByState[selectedZipCode];
        } else if (selectedState && buildersByState[selectedState]) {
          // For state searches, results are stored under the state key
          currentBuilders = buildersByState[selectedState];
        } else if (searchedBuilderName) {
          // For builder name searches, filter all builders
          currentBuilders = builders.filter(builder => 
            builder.name.toLowerCase().includes(searchedBuilderName.toLowerCase())
          );
        } else {
          // Default to all builders
          currentBuilders = builders;
        }
        
        // Find the index of this specific builder in the current list
        builderIndex = currentBuilders.findIndex(b => 
          b.name === builder.name && 
          b.location?.lat === builder.location?.lat && 
          b.location?.lng === builder.location?.lng
        );
        
        // If not found, default to 0
        if (builderIndex === -1) builderIndex = 0;
        
        // Apply the same offset used in CustomGoogleMap
        const offsetLat = builder.location.lat + (builderIndex * 0.005);
        const offsetLng = builder.location.lng + (builderIndex * 0.005);
        
        // Center map on builder location with offset to match marker position
        setMapCenter({
          lat: offsetLat,
          lng: offsetLng
        });
        
        // Center the map container on the mobile screen for better UX
        centerElementOnScreen('map-container');
      }, 100);
      
      // Optional: Show success message
      setSnackbarMessage(`Zoomed to ${builder.name} in ${builder.location.city}, ${builder.location.state}`);
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
    }
  }, [selectedZipCode, buildersByState, selectedState, searchedBuilderName, builders]);

  // Handle builder modal
  const handleViewDetails = useCallback((builder: Builder) => {
    setSelectedBuilder(builder);
    setIsModalOpen(true);
    addToRecentlyViewed(builder);
  }, [addToRecentlyViewed]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedBuilder(null);
  }, []);

  // Handle tab changes
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <img 
              src="./images/camper-van-original.jpg" 
              alt="Camper Van" 
              style={{ 
                height: 40, 
                marginRight: 10,
                borderRadius: 8,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }} 
            />
          </Box>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Camper Van Builders
          </Typography>
          <ThemeToggle toggleTheme={toggleThemeMode} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 2, mb: 6 }}>
        {/* Hero Section with Main Graphic */}
        <Box 
          sx={{
            background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)',
            color: 'white',
            py: 8,
            mb: 6,
            boxShadow: 3,
            borderRadius: 2,
          }}
        >
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ maxWidth: { xs: '100%', md: '55%' }, textAlign: { xs: 'center', md: 'left' }, mb: { xs: 4, md: 0 } }}>
                <Typography 
                  variant="h1" 
                  component="h1" 
                  sx={{ 
                    color: 'white',
                    mb: 2,
                    fontWeight: 800,
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                    lineHeight: 1.2,
                  }}
                >
                  Find Your Perfect Camper Van Builder
                </Typography>
                <Typography 
                  variant="h5" 
                  component="p" 
                  sx={{ 
                    mb: 4,
                    opacity: 0.9,
                    fontWeight: 400,
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                  }}
                >
                  Discover top-rated van conversion specialists across the United States
                </Typography>
              </Box>
              <Box 
                sx={{ 
                  maxWidth: { xs: '80%', md: '40%' }, 
                  display: 'flex', 
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative'
                }}
              >
                <img 
                  src="./images/camper-van-original.jpg" 
                  alt="Camper Van Illustration" 
                  style={{ 
                    maxWidth: '100%', 
                    height: 'auto',
                    borderRadius: 16,
                    boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                    overflow: 'hidden'
                  }} 
                />
              </Box>
            </Box>
          </Container>
        </Box>
        
        {/* State Selector */}
        <StateSelector 
          onSelectState={handleStateSelect}
          onSelectBuilderName={handleBuilderNameSearch}
          onSelectZipCode={handleZipCodeSelect}
          selectedState={selectedState}
          selectedBuilderName={searchedBuilderName}
          selectedZipCode={selectedZipCode}
        />
        
        {(selectedState || searchedBuilderName || selectedZipCode) && (
          <Box id="search-results">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 2 }}>
              <Typography variant="h4" component="h3">
                {selectedState ? `Builders in ${selectedState}` : searchedBuilderName ? `Search Results for "${searchedBuilderName}"` : `Search Results for "${selectedZipCode}"`}
              </Typography>
              
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<ClearIcon />}
                onClick={handleClearResults}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 3,
                  py: 1
                }}
              >
                Clear Results
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' }, mb: 4 }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                variant={isMobile ? "fullWidth" : "standard"}
                sx={{ 
                  '& .MuiTabs-indicator': {
                    height: 4,
                    borderRadius: '4px 4px 0 0',
                  },
                  minWidth: isMobile ? '100%' : 'auto',
                }}
                indicatorColor="primary"
                textColor="primary"
              >
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ViewListIcon />
                      <span style={{ display: isMobile ? 'none' : 'inline' }}>List View</span>
                      {isMobile && <span>List</span>}
                    </Box>
                  } 
                  sx={{ py: 2, fontSize: '1rem', minWidth: isMobile ? 'auto' : 120 }}
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MapIcon />
                      <span style={{ display: isMobile ? 'none' : 'inline' }}>Map View</span>
                      {isMobile && <span>Map</span>}
                    </Box>
                  } 
                  sx={{ py: 2, fontSize: '1rem', minWidth: isMobile ? 'auto' : 120 }}
                />
              </Tabs>
            </Box>
            
            {/* Tab Content */}
            {activeTab === 0 ? (
              // List View
              <GoogleSheetBuildersList 
                selectedState={selectedState}
                selectedZipCode={selectedZipCode}
                onBuilderSelect={handleViewDetails}
                onZoomToLocation={handleZoomToBuilder}
                searchedBuilderName={searchedBuilderName}
                builders={(() => {
                  if (selectedState && buildersByState[selectedState]) {
                    return buildersByState[selectedState];
                  } else if (selectedZipCode && buildersByState[selectedZipCode]) {
                    return buildersByState[selectedZipCode];
                  } else if (searchedBuilderName) {
                    // Search for builders by name across all states
                    return builders.filter(builder => 
                      builder.name.toLowerCase().includes(searchedBuilderName.toLowerCase())
                    );
                  }
                  return [];
                })()}
              />
            ) : (
              // Map View
              <>
                {(() => {
                  // Get builders for the selected state, zip code, or searched builder name
                  let currentBuilders: Builder[] = [];
                  
                  if (selectedState && buildersByState[selectedState]) {
                    currentBuilders = buildersByState[selectedState];
                  } else if (selectedZipCode && buildersByState[selectedZipCode]) {
                    currentBuilders = buildersByState[selectedZipCode];
                  } else if (searchedBuilderName) {
                    currentBuilders = builders.filter(builder => 
                      builder.name.toLowerCase().includes(searchedBuilderName.toLowerCase())
                    );
                  }
                  
                  const validBuilders = currentBuilders.filter(builder => {
                    return builder.location && 
                           typeof builder.location.lat === 'number' && 
                           typeof builder.location.lng === 'number' &&
                           !isNaN(builder.location.lat) && 
                           !isNaN(builder.location.lng);
                  });

                  return (
                    <>
                      {validBuilders.length > 0 && (
                        <Typography variant="subtitle1" gutterBottom>
                          {validBuilders.length} builder{validBuilders.length !== 1 ? 's' : ''} found
                        </Typography>
                      )}
                      <Box 
                        id="map-container" 
                        sx={{ 
                          height: { xs: '400px', sm: '500px', md: '600px' }, 
                          borderRadius: 2, 
                          overflow: 'hidden', 
                          position: 'relative' 
                        }}
                      >
                        {(() => {
                          // Debug
                          console.log('🗺️ Map Render Debug:', {
                            selectedState,
                            selectedZipCode,
                            searchedBuilderName,
                            currentBuildersCount: currentBuilders.length,
                            validBuildersCount: validBuilders.length,
                            mapCenter,
                            isLoaded,
                            loadError: loadError?.message || 'None',
                            validBuilders: validBuilders.map(b => ({
                              name: b.name,
                              lat: b.location.lat,
                              lng: b.location.lng,
                              city: b.location.city,
                              state: b.location.state
                            }))
                          });
                          
                          if (loadError) {
                            console.error('🚨 Map Load Error Details:', loadError);
                            return (
                              <Box sx={{ p: 4, textAlign: 'center' }}>
                                <Typography variant="h6" color="error" gutterBottom>
                                  Map Loading Error
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                  {loadError.message}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Please check browser console for more details.
                                </Typography>
                              </Box>
                            );
                          }
                          
                          if (!isLoaded) {
                            return (
                              <Box sx={{ p: 4, textAlign: 'center' }}>
                                <Typography variant="body1">Loading Google Maps API...</Typography>
                              </Box>
                            );
                          }
                          
                          return (
                            <CustomGoogleMap
                              builders={validBuilders}
                              center={{ lat: mapCenter.lat, lng: mapCenter.lng }}
                              zoom={isZoomedToBuilder ? 14 : selectedState ? 8 : selectedZipCode && !isZoomedToBuilder ? undefined : 6}
                              fitBounds={Boolean(selectedZipCode && !isZoomedToBuilder)}
                              onMarkerClick={handleViewDetails}
                              isLoaded={isLoaded}
                            />
                          );
                        })()}
                      </Box>
                    </>
                  );
                })()}
              </>
            )}
          </Box>
        )}
      </Container>
      
      {/* Recently Viewed Section */}
      {recentlyViewed.length > 0 && (
        <Container maxWidth="xl" sx={{ mt: 6, mb: 8 }}>
          <RecentlyViewedSection 
            recentlyViewed={recentlyViewed} 
            onViewDetails={handleViewDetails} 
            onClearAll={clearRecentlyViewed} 
          />
        </Container>
      )}

      {/* Back to Top Button */}
      <BackToTop />

      {/* Welcome Card */}
      <Container maxWidth="xl" sx={{ mt: 6, mb: 8 }}>
        <Paper 
          elevation={3}
          sx={{
            p: 4,
            background: 'linear-gradient(135deg, #2c3e50 0%, #3f51b5 100%)',
            borderRadius: 2,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
              pointerEvents: 'none',
            }
          }}
        >
          <Typography 
            variant="h4" 
            component="h2" 
            sx={{ 
              mb: 2, 
              fontWeight: 700,
              color: 'white',
              position: 'relative',
              zIndex: 1
            }}
          >
            Welcome to the Camper Van Builders Directory
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              mb: 3,
              color: 'rgba(255, 255, 255, 0.9)',
              maxWidth: '800px',
              mx: 'auto',
              fontSize: '1.1rem',
              lineHeight: 1.6,
              position: 'relative',
              zIndex: 1
            }}
          >
            We're here to help you find the perfect partner for your van conversion journey. 
            Whether you're dreaming of weekend adventures or full-time van life, our directory 
            connects you with experienced builders who can bring your vision to life.
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            gap: 3,
            flexWrap: 'wrap',
            mt: 4,
            position: 'relative',
            zIndex: 1
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ color: '#64b5f6', fontWeight: 'bold' }}>
                {builders.length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Builders Listed
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ color: '#64b5f6', fontWeight: 'bold' }}>
                50
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                States Covered
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ color: '#64b5f6', fontWeight: 'bold' }}>
                100%
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Free to Use
              </Typography>
            </Box>
          </Box>
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 4,
              color: 'rgba(255, 255, 255, 0.8)',
              fontStyle: 'italic'
            }}
          >
            🚐 Start your journey today - Select a state, zip code, or builder name above to explore builders in your area
          </Typography>
        </Paper>
      </Container>

      {/* Builder Modal */}
      {selectedBuilder && (
        <BuilderModal
          builder={selectedBuilder}
          open={isModalOpen}
          onClose={handleCloseModal}
        />
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default App;
