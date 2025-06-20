import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  ThemeProvider, 
  CssBaseline, 
  Container, 
  Box, 
  Typography, 
  CircularProgress,
  Tabs,
  Tab,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Tooltip,
  Fab,
  useMediaQuery,
  Snackbar,
  Alert,
  createTheme,
  PaletteMode
} from '@mui/material';
import { getGoogleMapsApiKey, sanitizeInput, isValidExternalUrl } from './utils/apiUtils';
import { scrollToElement } from './utils/scrollUtils';
import { loadBuildersFromCsv } from './utils/csvLoader';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import ViewListIcon from '@mui/icons-material/ViewList';
import MapIcon from '@mui/icons-material/Map';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { 
  StateSelector, 
  SearchAndFilter, 
  BuilderCard, 
  BuilderModal,
  ThemeToggle,
  BackToTop,
  FavoritesDrawer,
  BuilderCompare,
  RecentlyViewedSection,
  SkeletonLoader
} from './components';
import SecureImage from './components/SecureImage';
import SecureMarker from './components/SecureMarker';
import { Builder, Location, Review, PricingTier } from './types';
import { 
  useThemeMode, 
  useBuilders, 
  useFavorites, 
  useRecentlyViewed,
  useScrollToResults
} from './hooks';


// Helper functions for mock data
// Using Review and PricingTier interfaces from types.ts

const generateReviews = (count: number, averageRating: number): Review[] => {
  const reviews: Review[] = [];
  for (let i = 0; i < count; i++) {
    reviews.push({
      id: i + 1,
      author: `User${i + 1}`,
      rating: parseFloat((Math.random() * 1 + (averageRating - 0.5)).toFixed(1)),
      comment: 'Great service and quality work!',
      date: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    });
  }
  return reviews;
};

const generatePricingTiers = (basePrice: number): PricingTier[] => {
  return [
    {
      name: 'Basic',
      price: Math.round(basePrice * 0.8),
      description: 'Essential features for your van conversion',
      features: [
        'Basic insulation',
        'Standard bed platform',
        'Basic electrical system',
        'Minimal storage',
      ],
    },
    {
      name: 'Standard',
      price: basePrice,
      description: 'Most popular choice for van life',
      features: [
        'Premium insulation',
        'Custom cabinetry',
        'Solar power system',
        'Kitchenette',
        'Water system',
      ],
    },
    {
      name: 'Premium',
      price: Math.round(basePrice * 1.3),
      description: 'Luxury conversion with all the amenities',
      features: [
        'High-end finishes',
        'Full kitchen with appliances',
        'Bathroom with shower',
        'Advanced electrical system',
        'Custom storage solutions',
      ],
    },
  ];
};

// Mock data for builders
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
      reviews: generateReviews(10, 4.8) as Review[],
      vanTypes: ['Sprinter', 'Transit', 'Promaster'],
      priceRange: { min: 35000, max: 120000 },
      pricingTiers: generatePricingTiers(75000),
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
        'https://example.com/van1.jpg',
        'https://example.com/van2.jpg',
        'https://example.com/van3.jpg',
      ],
    },
    // Add more builders as needed
  ],
  // We'll handle New Jersey directly in the state selection handler
  // Add more states as needed
};

// Create Humble Road builder data
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
  reviews: generateReviews(8, 4.9) as Review[],
  vanTypes: ['Sprinter', 'Transit', 'Promaster', 'Promaster City'],
  priceRange: { min: 38000, max: 215000 },
  pricingTiers: generatePricingTiers(85000),
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
    'https://images.squarespace-cdn.com/content/v1/5d7f95ea7d3be50012ad8e2d/1626285444291-DSCF9146.jpg',
    'https://images.squarespace-cdn.com/content/v1/5d7f95ea7d3be50012ad8e2d/1626285444291-DSCF9147.jpg',
    'https://images.squarespace-cdn.com/content/v1/5d7f95ea7d3be50012ad8e2d/1626285444291-DSCF9148.jpg',
  ],
});

// Create theme based on mode
const getTheme = (mode: PaletteMode) => createTheme({
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
      default: mode === 'light' ? '#f8f9fa' : '#121212',
      paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
    },
    text: {
      primary: mode === 'light' ? '#212121' : '#ffffff',
      secondary: mode === 'light' ? '#757575' : '#b0b0b0',
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
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      marginBottom: '1rem',
      color: mode === 'light' ? '#1a237e' : '#a5aeff',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      margin: '2.5rem 0 1.5rem',
      color: mode === 'light' ? '#283593' : '#9fa8da',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      margin: '2rem 0 1rem',
      color: mode === 'light' ? '#303f9f' : '#7986cb',
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
            : '0 2px 10px rgba(0,0,0,0.2)',
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
  },
});

const App = () => {
  // Load Google Maps API with secure key handling
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: getGoogleMapsApiKey(),
    // You can add additional libraries if needed
    // libraries: ['places'],
  });
  // Use custom hooks
  const { mode, toggleThemeMode } = useThemeMode();
  const { 
    builders: allBuilders, 
    loading: buildersLoading, 
    filteredBuilders: hookFilteredBuilders,
    error,
    allVanTypes: hookVanTypes,
    allAmenities: hookAmenities
  } = useBuilders({
    // Use Google Sheets data source
    useGoogleSheet: true,
    googleSheetId: '1gfw9r6opnyf6CFaQQJA_s0bBjHsphnImwaOuEdWpLYU'
  });
  const scrollToResults = useScrollToResults();
  const { 
    favorites, 
    addFavorite, 
    removeFavorite, 
    isFavorite 
  } = useFavorites();
  const { 
    recentlyViewed, 
    addToRecentlyViewed 
  } = useRecentlyViewed();

  // Create theme based on current mode
  const theme = useMemo(() => getTheme(mode), [mode]);

  // Local state
  const [selectedState, setSelectedState] = useState('');
  const [selectedZipCode, setSelectedZipCode] = useState('');
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [filteredBuilders, setFilteredBuilders] = useState<Builder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedBuilder, setSelectedBuilder] = useState<Builder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [buildersToCompare, setBuildersToCompare] = useState<Builder[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const [searchByZipCode, setSearchByZipCode] = useState(false);
  const [csvData, setCsvData] = useState<Record<string, Builder[]>>({});

  const [mapCenter, setMapCenter] = useState<Location>({
    lat: 39.8283, 
    lng: -98.5795,
    city: '',
    state: '',
    zip: ''
  });

  // Add Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Set document title
  useEffect(() => {
    document.title = 'Camper Van Builders Directory | Find Your Perfect Van Builder';
  }, []);

  // Load CSV data on mount
  useEffect(() => {
    const loadCsvData = async () => {
      try {
        const data = await loadBuildersFromCsv();
        setCsvData(data);
        console.log('CSV data loaded:', data);
      } catch (error) {
        console.error('Failed to load CSV data:', error);
      }
    };
    loadCsvData();
  }, []);

  // Handle state selection
  const handleStateSelect = useCallback((state: string) => {
    console.log('State selected:', state);
    
    if (!state) {
      // If state is empty, just clear the selection
      setSelectedState('');
      setBuilders([]);
      setFilteredBuilders([]);
      return;
    }
    
    // Important: Set loading to true before making any changes
    setLoading(true);
    setSelectedState(state);
    setSelectedZipCode(''); // Clear zip code when selecting by state
    setSearchByZipCode(false);
    
    // Clear any existing filters that might hide results
    setSearchTerm('');
    setPriceRange([0, 250000]);
    setSelectedTypes([]);
    setSelectedAmenities([]);
    setMinRating(0);
    
    // Check if we have CSV data for this state first
    if (csvData[state] && csvData[state].length > 0) {
      console.log(`${state} selected - using CSV data`);
      const stateBuilders = csvData[state];
      
      // Set the builders from CSV data
      setBuilders(stateBuilders);
      setFilteredBuilders(stateBuilders);
      setLoading(false);
      
      // Set map center to first builder location
      if (stateBuilders.length > 0) {
        setMapCenter({
          lat: stateBuilders[0].location.lat,
          lng: stateBuilders[0].location.lng,
          city: stateBuilders[0].location.city,
          state: stateBuilders[0].location.state,
          zip: stateBuilders[0].location.zip,
        });
      }
      
      console.log(`Found ${stateBuilders.length} builders for ${state}`);
      return;
    }
    
    // For all other states, use the normal approach
    setTimeout(() => {
      console.log('Processing state selection for:', state);
      
      // For other states, use the normal lookup
      const stateBuilders = MOCK_BUILDERS[state] || [];
      
      console.log(`Found ${stateBuilders.length} builders for ${state}:`, stateBuilders);
      
      // Set the builders and filtered builders
      setBuilders(stateBuilders);
      setFilteredBuilders(stateBuilders);
      
      // Set loading to false
      setLoading(false);
      
      // Scroll to results
      scrollToResults();
      
      if (stateBuilders.length > 0) {
        setMapCenter(stateBuilders[0].location);
      }
      
      setLoading(false);
    }, 500);
    
    // Reset filters when state changes
    setSearchTerm('');
    setPriceRange([0, 200000]);
    setSelectedTypes([]);
    setSelectedAmenities([]);
    setMinRating(0);
  }, []);
  
  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3958.8; // Radius of the Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in miles
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }, []);
  
  // Handle zip code selection
  const handleZipCodeSelect = useCallback((zipCode: string) => {
    console.log('Zip code selected:', zipCode);
    
    if (!zipCode) {
      setSelectedZipCode('');
      setBuilders([]);
      setFilteredBuilders([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setSelectedZipCode(zipCode);
    setSelectedState(''); // Clear state when selecting by zip code
    setSearchByZipCode(true);
    
    // Clear any existing filters that might hide results
    setSearchTerm('');
    setPriceRange([0, 250000]);
    setSelectedTypes([]);
    setSelectedAmenities([]);
    setMinRating(0);
    
    // Check if it's a New Jersey zip code (starts with 07, 08, or 09)
    // This is a simplified check - in a real app you would use a more accurate method
    const isNJZipCode = /^(07|08|09)\d{3}$/.test(zipCode);
    
    if (isNJZipCode) {
      console.log('New Jersey zip code detected:', zipCode);
      
      // Create Humble Road builder with distance information
      const humbleRoad = {
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
        reviews: generateReviews(8, 4.9) as Review[],
        vanTypes: ['Sprinter', 'Transit', 'Promaster', 'Promaster City'],
        priceRange: { min: 38000, max: 215000 },
        pricingTiers: generatePricingTiers(85000),
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
          'https://images.squarespace-cdn.com/content/v1/5d7f95ea7d3be50012ad8e2d/1626285444291-DSCF9146.jpg',
          'https://images.squarespace-cdn.com/content/v1/5d7f95ea7d3be50012ad8e2d/1626285444291-DSCF9147.jpg',
          'https://images.squarespace-cdn.com/content/v1/5d7f95ea7d3be50012ad8e2d/1626285444291-DSCF9148.jpg',
        ],
        // Add distance information
        distanceFromZip: {
          miles: zipCode === '08723' ? 0 : Math.floor(Math.random() * 30) + 1, // 0 miles if exact match, otherwise random distance
          zipCode: zipCode
        }
      };
      
      // Set builders and filtered builders with just Humble Road
      setBuilders([humbleRoad]);
      setFilteredBuilders([humbleRoad]);
      setLoading(false);
      
      // Scroll to results
      scrollToResults();
      
      // Set map center to Humble Road location
      setMapCenter(humbleRoad.location);
      
      console.log('Humble Road builder set for NJ zip code:', humbleRoad);
      return;
    }
    
    // For non-NJ zip codes, use the default approach
    setTimeout(() => {
      console.log('Processing zip code search for:', zipCode);
      
      // For demo purposes, show California builders for non-NJ zip codes
      const nearbyBuilders = MOCK_BUILDERS['California'] || [];
      
      // Simulate a zip code location (for demo purposes)
      const zipLocation = {
        lat: 34.0522, // Los Angeles coordinates as a placeholder
        lng: -118.2437
      };
      
      // Add distance information to each builder
      const buildersWithDistance = nearbyBuilders.map(builder => {
        // Calculate distance from zip code to builder location
        const distance = calculateDistance(
          zipLocation.lat, 
          zipLocation.lng, 
          builder.location.lat, 
          builder.location.lng
        );
        
        // Create a new builder object with distance information
        return {
          ...builder,
          distanceFromZip: {
            miles: distance,
            zipCode: zipCode
          }
        };
      });
      
      // Sort builders by distance (closest first)
      buildersWithDistance.sort((a, b) => 
        (a.distanceFromZip?.miles || 0) - (b.distanceFromZip?.miles || 0)
      );
      
      setBuilders(buildersWithDistance);
      setFilteredBuilders(buildersWithDistance);
      setLoading(false);
      
      // Scroll to results
      scrollToResults();
      
      // Set map center to the zip code location
      setMapCenter({
        lat: zipLocation.lat,
        lng: zipLocation.lng,
        city: 'Near ' + zipCode,
        state: '',
        zip: zipCode
      });
      
      setLoading(false);
      
      // Show a message about the zip code search
      setSnackbarMessage(`Showing builders near zip code ${zipCode}`);
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
    }, 800);
    
    // Reset filters when zip code changes
    setSearchTerm('');
    setPriceRange([0, 200000]);
    setSelectedTypes([]);
    setSelectedAmenities([]);
    setMinRating(0);
  }, [calculateDistance]);

  // Handle search term change with sanitization
  const handleSearch = useCallback((term: string) => {
    // Sanitize the input to prevent XSS attacks
    const sanitizedTerm = sanitizeInput(term);
    setSearchTerm(sanitizedTerm);
  }, []);
  
  // Apply filters to builders
  useEffect(() => {
    console.log('Filter effect running with builders:', builders);
    
    if (builders.length === 0) {
      console.log('No builders to filter');
      setFilteredBuilders([]);
      return;
    }

    // Start with all builders
    let filtered = [...builders];
    console.log('Starting filtering with', filtered.length, 'builders');
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(builder => 
        builder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (builder.description && builder.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      console.log('After search term filter:', filtered.length, 'builders remain');
    }
    
    // Apply price range filter
    filtered = filtered.filter(builder => 
      builder.priceRange && 
      builder.priceRange.min <= priceRange[1] && 
      builder.priceRange.max >= priceRange[0]
    );
    console.log('After price range filter:', filtered.length, 'builders remain');
    
    // Apply van type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(builder => 
        builder.vanTypes?.some(type => selectedTypes.includes(type))
      );
      console.log('After van type filter:', filtered.length, 'builders remain');
    }
    
    // Apply amenities filter
    if (selectedAmenities.length > 0) {
      filtered = filtered.filter(builder => 
        builder.amenities?.some(amenity => selectedAmenities.includes(amenity))
      );
      console.log('After amenities filter:', filtered.length, 'builders remain');
    }
    
    // Apply rating filter
    filtered = filtered.filter(builder => builder.rating >= minRating);
    console.log('After rating filter:', filtered.length, 'builders remain');
    
    console.log('Final filtered builders:', filtered);
    setFilteredBuilders(filtered);
    
    // Only scroll to results when filters are actively changed (not on initial load)
    if (builders.length > 0 && filtered.length > 0) {
      scrollToResults();
    }
  }, [builders, searchTerm, priceRange, selectedTypes, selectedAmenities, minRating]);

  // Handle filter changes
  const handlePriceChange = useCallback((newRange: [number, number]) => {
    setPriceRange(newRange);
  }, []);

  const handleRatingChange = useCallback((newRating: number) => {
    setMinRating(newRating);
  }, []);

  const handleTypeToggle = useCallback((type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  }, []);

  const handleAmenityToggle = useCallback((amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  }, []);

  // Handle builder selection
  const handleViewDetails = useCallback((builder: Builder) => {
    setSelectedBuilder(builder);
    setIsModalOpen(true);
    addToRecentlyViewed(builder);
  }, [addToRecentlyViewed]);

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Update filtered builders when filters change
  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm, priceRange, minRating, selectedTypes, selectedAmenities, handleSearch]);

  // Use hook values or fallback to computed values for van types and amenities
  const allVanTypes = useMemo(() => {
    if (hookVanTypes && hookVanTypes.length > 0) {
      return hookVanTypes;
    }
    
    const types = new Set<string>();
    Object.values(MOCK_BUILDERS).flat().forEach(builder => {
      if (builder.vanTypes) {
        builder.vanTypes.forEach(type => types.add(type));
      }
    });
    return Array.from(types);
  }, [hookVanTypes]);

  const allAmenities = useMemo(() => {
    if (hookAmenities && hookAmenities.length > 0) {
      return hookAmenities;
    }
    
    const amenities = new Set<string>();
    Object.values(MOCK_BUILDERS).flat().forEach(builder => {
      if (builder.amenities) {
        builder.amenities.forEach(amenity => amenities.add(amenity));
      }
    });
    return Array.from(amenities);
  }, [hookAmenities]);

  // Handle marker click on map
  const handleMarkerClick = useCallback((builder: Builder) => {
    setSelectedBuilder(builder);
    setMapCenter(builder.location);
  }, []);

  // Handle favorite toggle
  const handleToggleFavorite = useCallback((builder: Builder) => {
    if (isFavorite(builder.id)) {
      removeFavorite(builder.id);
      setSnackbarMessage(`${builder.name} removed from favorites`);
    } else {
      addFavorite(builder);
      setSnackbarMessage(`${builder.name} added to favorites`);
    }
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  }, [isFavorite, removeFavorite, addFavorite]);

  // Handle compare toggle
  const handleToggleCompare = useCallback((builder: Builder) => {
    setBuildersToCompare(prev => {
      const isAlreadyInCompare = prev.some(b => b.id === builder.id);
      if (isAlreadyInCompare) {
        return prev.filter(b => b.id !== builder.id);
      } else {
        if (prev.length >= 3) {
          setSnackbarMessage('You can compare up to 3 builders at a time');
          setSnackbarSeverity('warning');
          setSnackbarOpen(true);
          return prev;
        }
        return [...prev, builder];
      }
    });
  }, []);

  // Check if builder is in compare list
  const isInCompare = useCallback((builderId: string | number) => {
    return buildersToCompare.some(builder => builder.id === builderId);
  }, [buildersToCompare]);

  // Open compare dialog
  const handleOpenCompare = useCallback(() => {
    if (buildersToCompare.length > 0) {
      setIsCompareOpen(true);
    } else {
      setSnackbarMessage('Select at least one builder to compare');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
    }
  }, [buildersToCompare]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* App Bar */}
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
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ThemeToggle toggleTheme={toggleThemeMode} />
            <Tooltip title="Compare builders">
              <IconButton 
                color="inherit" 
                onClick={handleOpenCompare}
                disabled={buildersToCompare.length === 0}
              >
                <Badge badgeContent={buildersToCompare.length} color="secondary">
                  <CompareArrowsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Favorites">
              <IconButton 
                color="inherit" 
                onClick={() => setIsFavoritesOpen(true)}
                disabled={favorites.length === 0}
              >
                <Badge badgeContent={favorites.length} color="secondary">
                  <FavoriteIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box 
        sx={{
          background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)',
          color: 'white',
          py: 8,
          mb: 6,
          boxShadow: 3,
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

      <Container maxWidth="xl" sx={{ py: 2, mb: 6 }}>
        {/* State/Zip Selector */}
        <StateSelector 
          onSelectState={handleStateSelect}
          onSelectZipCode={handleZipCodeSelect}
        />
        {(selectedState || selectedZipCode) && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 2 }}>
              <Typography variant="h4" component="h3">
                {searchByZipCode 
                  ? `Builders near ${selectedZipCode}` 
                  : `Builders in ${selectedState}`
                }
                {filteredBuilders.length > 0 && (
                  <Typography component="span" color="text.secondary" sx={{ ml: 2, fontSize: '1rem' }}>
                    ({filteredBuilders.length} {filteredBuilders.length === 1 ? 'builder' : 'builders'} found)
                  </Typography>
                )}
              </Typography>
              
              <Tabs 
                value={activeTab} 
                onChange={(_, newValue) => setActiveTab(newValue)}
                sx={{ 
                  mb: 4,
                  '& .MuiTabs-indicator': {
                    height: 4,
                    borderRadius: '4px 4px 0 0',
                  },
                }}
                indicatorColor="primary"
                textColor="primary"
                variant="fullWidth"
              >
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ViewListIcon />
                      <span>List View</span>
                    </Box>
                  } 
                  sx={{ py: 2, fontSize: '1rem' }}
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MapIcon />
                      <span>Map View</span>
                    </Box>
                  } 
                  sx={{ py: 2, fontSize: '1rem' }}
                />
              </Tabs>
            </Box>
            
            <SearchAndFilter
              searchTerm={searchTerm}
              onSearchChange={handleSearch}
              priceRange={priceRange}
              onPriceChange={handlePriceChange}
              selectedTypes={selectedTypes}
              onTypeToggle={handleTypeToggle}
              selectedAmenities={selectedAmenities}
              onAmenityToggle={handleAmenityToggle}
              minRating={minRating}
              onRatingChange={handleRatingChange}
              allVanTypes={allVanTypes}
              allAmenities={allAmenities}
            />
            
            {loading ? (
              <Box display="flex" justifyContent="center" my={12}>
                <CircularProgress size={60} thickness={4} />
              </Box>
            ) : (
              <Box>
                {activeTab === 0 ? (
                  <Box id="search-results">
                    {/* Results Count */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6" component="h2">
                        {filteredBuilders.length} {filteredBuilders.length === 1 ? 'Builder' : 'Builders'} Found
                      </Typography>
                      {filteredBuilders.length > 0 && (
                        <Button 
                          variant="outlined" 
                          color="primary"
                          onClick={() => setActiveTab(1)}
                          startIcon={<MapIcon />}
                        >
                          View on Map
                        </Button>
                      )}
                    </Box>

                    {/* Builders Grid */}
                    <Box 
                      display="grid" 
                      gridTemplateColumns={{ 
                        xs: '1fr', 
                        sm: 'repeat(2, 1fr)', 
                        lg: 'repeat(3, 1fr)' 
                      }} 
                      gap={3}
                    >
                      {filteredBuilders.map((builder) => (
                        <div key={builder.id}>
                          <BuilderCard 
                            builder={builder} 
                            onViewDetails={() => handleViewDetails(builder)}
                            isFavorite={isFavorite(builder.id)}
                            onToggleFavorite={() => handleToggleFavorite(builder)}
                            isInCompare={isInCompare(builder.id)}
                            onAddToCompare={() => handleToggleCompare(builder)}
                            compareCount={buildersToCompare.length}
                          />
                        </div>
                      ))}
                    </Box>

                    {/* No Results */}
                    {filteredBuilders.length === 0 && !loading && (
                      <Box 
                        textAlign="center" 
                        py={8}
                        sx={{
                          backgroundColor: 'background.paper',
                          borderRadius: 2,
                          boxShadow: 1,
                          p: 4,
                        }}
                      >
                        <Box 
                          sx={{ 
                            width: 120,
                            height: 120,
                            mx: 'auto',
                            mb: 3,
                            opacity: 0.7,
                          }}
                        >
                          <SecureImage
                            src="/van-illustration.svg"
                            alt="No results"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            fallbackSrc="/images/image-placeholder.svg"
                          />
                        </Box>
                        <Typography variant="h5" component="h3" gutterBottom>
                          No builders found
                        </Typography>
                        <Typography variant="body1" color="text.secondary" paragraph>
                          We couldn't find any builders matching your search criteria.
                        </Typography>
                        <Button 
                          variant="contained" 
                          color="primary" 
                          size="large"
                          sx={{ mt: 2, px: 4, py: 1.5 }}
                          onClick={() => {
                            setSearchTerm('');
                            setPriceRange([0, 200000]);
                            setSelectedTypes([]);
                            setSelectedAmenities([]);
                            setMinRating(0);
                          }}
                        >
                          Clear All Filters
                        </Button>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box 
                    height="70vh" 
                    borderRadius={2} 
                    overflow="hidden" 
                    boxShadow={3}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      position: 'relative',
                    }}
                  >
                    {loadError && (
                      <Box 
                        display="flex" 
                        justifyContent="center" 
                        alignItems="center" 
                        height="100%"
                        flexDirection="column"
                        p={3}
                      >
                        <Typography variant="h6" color="error" gutterBottom>
                          Error loading Google Maps
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Please check your API key and internet connection.
                        </Typography>
                      </Box>
                    )}
                    
                    {!isLoaded && !loadError && (
                      <Box 
                        display="flex" 
                        justifyContent="center" 
                        alignItems="center" 
                        height="100%"
                      >
                        <CircularProgress size={60} thickness={4} />
                      </Box>
                    )}
                    
                    {isLoaded && !loadError && (
                      <GoogleMap
                        mapContainerStyle={{
                          width: '100%',
                          height: '100%',
                        }}
                        center={mapCenter}
                        zoom={selectedState || selectedZipCode ? 9 : 4}
                        options={{
                          styles: [
                            {
                              featureType: 'poi',
                              elementType: 'labels',
                              stylers: [{ visibility: 'off' }]
                            },
                            {
                              featureType: 'transit',
                              elementType: 'labels',
                              stylers: [{ visibility: 'off' }]
                            }
                          ]
                        }}
                      >
                        {filteredBuilders.map((builder) => (
                          <SecureMarker
                            key={builder.id}
                            position={{
                              lat: builder.location.lat,
                              lng: builder.location.lng,
                            }}
                            iconUrl="https://maps.google.com/mapfiles/ms/icons/red-dot.png"
                            iconSize={30}
                            onClick={() => handleViewDetails(builder)}
                          />
                        ))}
                      </GoogleMap>
                    )}
                    <Box 
                      sx={{
                        position: 'absolute',
                        bottom: 16,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1
                      }}
                    >
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setActiveTab(0)}
                        startIcon={<ViewListIcon />}
                        sx={{
                          backgroundColor: 'white',
                          color: 'primary.main',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          },
                          boxShadow: 3,
                        }}
                      >
                        List View
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
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
            onClearAll={() => {
              // Clear recently viewed items
              localStorage.removeItem('recentlyViewed');
              window.location.reload();
            }} 
          />
        </Container>
      )}

      {/* Back to Top Button */}
      <BackToTop />

      {/* Builder Modal */}
      {selectedBuilder && (
        <BuilderModal
          builder={selectedBuilder}
          open={isModalOpen}
          onClose={handleCloseModal}
        />
      )}

      {/* Favorites Drawer */}
      <FavoritesDrawer
        open={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favorites={favorites}
        onViewDetails={handleViewDetails}
        onRemoveFavorite={removeFavorite}
      />

      {/* Builder Compare Dialog */}
      <BuilderCompare
        open={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        builders={buildersToCompare}
        onRemoveBuilder={(builderId) => {
          setBuildersToCompare(prev => prev.filter(b => b.id !== builderId));
        }}
        onViewDetails={handleViewDetails}
      />

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
