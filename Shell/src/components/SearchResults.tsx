import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, useTheme, Paper, Tabs, Tab, Fab, Zoom } from '@mui/material';
import { ViewList, Map as MapIcon, KeyboardArrowUp } from '@mui/icons-material';
import BuildersList from './BuildersList';
import MapView from './MapView';
import { Builder } from '../types/builder';

interface SearchResultsProps {
  builders: Builder[];
  searchType: 'state' | 'zip' | 'builder';
  searchValue: string;
  onBuilderSelect?: (builder: Builder) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  builders,
  searchType,
  searchValue,
  onBuilderSelect
}) => {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedMapBuilder, setSelectedMapBuilder] = useState<Builder | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll to top when component mounts to show Back to Home button and full context
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 300); // Show button after scrolling 300px
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getSearchTitle = () => {
    switch (searchType) {
      case 'state':
        return `Van Builders in ${searchValue}`;
      case 'zip':
        return `Van Builders near ${searchValue}`;
      case 'builder':
        return `Search results for "${searchValue}"`;
      default:
        return 'Search Results';
    }
  };

  // Get coordinates for searched zip code (simplified - in production use geocoding API)
  const getZipCoordinates = (zipCode: string) => {
    const zipCoords: { [key: string]: { lat: number; lng: number } } = {
      '08620': { lat: 40.2206, lng: -74.7563 }, // Yardville/Hamilton (user's zip)
      '08609': { lat: 40.2347, lng: -74.7313 }, // Hamilton Twp (Ready Set Van)
      '08736': { lat: 40.1179, lng: -74.0370 }, // Manasquan (Sequoia + Salt)
      '08701': { lat: 40.0834, lng: -74.2179 }, // Lakewood
      '08753': { lat: 39.9537, lng: -74.1979 }, // Toms River
      '08540': { lat: 40.3573, lng: -74.6672 }, // Princeton
      '08901': { lat: 40.4862, lng: -74.4518 }, // New Brunswick
      '07001': { lat: 40.7362, lng: -74.1724 }, // Avenel
      '07302': { lat: 40.7178, lng: -74.0431 }, // Jersey City
    };
    return zipCoords[zipCode] || null;
  };

  const handleZoomToLocation = (builder: Builder) => {
    console.log('handleZoomToLocation called with builder:', builder);
    setViewMode('map');
    setSelectedMapBuilder(builder);
    console.log('Set selectedMapBuilder to:', builder);
    // Small delay to ensure map view is rendered before selecting builder
    setTimeout(() => {
      setSelectedMapBuilder(builder);
      console.log('Set selectedMapBuilder again after timeout:', builder);
    }, 100);
  };

  const handleViewModeChange = (event: React.SyntheticEvent, newValue: 'list' | 'map') => {
    setViewMode(newValue);
    if (newValue === 'list') {
      setSelectedMapBuilder(null);
    }
  };

  const searchedZipCoords = searchType === 'zip' ? getZipCoordinates(searchValue) : undefined;

  const validBuilders = builders.filter(builder => 
    builder.location && 
    builder.location.lat && 
    builder.location.lng && 
    builder.location.lat !== 0 && 
    builder.location.lng !== 0
  );

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: 'background.default',
      pt: 4,
      pb: 6
    }}>
      <Container maxWidth="lg">
        {/* Sticky Header Section */}
        <Box sx={{ 
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          bgcolor: 'background.default',
          pt: 2,
          pb: 2,
          mb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                color: 'text.secondary',
                mb: 2
              }}
            >
              {getSearchTitle()}
            </Typography>

            {/* View Mode Tabs */}
            <Paper elevation={1} sx={{ display: 'inline-block', p: 1, borderRadius: 2 }}>
              <Tabs 
                value={viewMode} 
                onChange={handleViewModeChange} 
                centered
                sx={{
                  minHeight: 'auto',
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                    minHeight: 'auto',
                    py: 1,
                    px: 2,
                  },
                  '& .MuiTab-root.Mui-selected': {
                    color: '#5b9bd5',
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#5b9bd5',
                    height: 3,
                    borderRadius: '2px 2px 0 0',
                  },
                }}
              >
                <Tab 
                  value="list"
                  icon={<ViewList sx={{ color: 'inherit' }} />} 
                  label="List View" 
                  iconPosition="start"
                />
                <Tab 
                  value="map"
                  icon={<MapIcon sx={{ color: 'inherit' }} />} 
                  label="Map View" 
                  iconPosition="start"
                />
              </Tabs>
            </Paper>
          </Box>
        </Box>

        {/* Results Section */}
        {viewMode === 'list' ? (
          <BuildersList
            builders={builders}
            searchType={searchType}
            selectedState={searchType === 'state' ? searchValue : undefined}
            selectedZipCode={searchType === 'zip' ? searchValue : undefined}
            searchedBuilderName={searchType === 'builder' ? searchValue : undefined}
            onBuilderSelect={onBuilderSelect}
            onZoomToLocation={handleZoomToLocation}
          />
        ) : (
          <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
              {validBuilders.length} builder{validBuilders.length !== 1 ? 's' : ''} found with valid coordinates
              {searchType === 'zip' && ` within 100 miles of ${searchValue}`}
            </Typography>
            <MapView
              builders={validBuilders}
              searchedZip={searchType === 'zip' ? searchValue : undefined}
              searchedZipCoords={searchedZipCoords}
              selectedBuilder={selectedMapBuilder}
              onBuilderSelect={setSelectedMapBuilder}
              onViewDetails={onBuilderSelect}
            />
          </Paper>
        )}
      </Container>
      <Zoom in={showScrollTop}>
        <Fab
          color="primary"
          size="small"
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
        >
          <KeyboardArrowUp />
        </Fab>
      </Zoom>
    </Box>
  );
};

export default SearchResults;
