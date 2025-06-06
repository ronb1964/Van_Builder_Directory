import React from 'react';
import { Box, Container, Typography, useTheme } from '@mui/material';
import BuildersList from './BuildersList';
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

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: 'background.default',
      pt: 4,
      pb: 6
    }}>
      <Container maxWidth="lg">
        {/* Header Section */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #2c3e50 0%, #3f51b5 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2
            }}
          >
            {getSearchTitle()}
          </Typography>
        </Box>

        {/* Results Section */}
        <BuildersList
          builders={builders}
          searchType={searchType}
          selectedState={searchType === 'state' ? searchValue : undefined}
          selectedZipCode={searchType === 'zip' ? searchValue : undefined}
          searchedBuilderName={searchType === 'builder' ? searchValue : undefined}
          onBuilderSelect={onBuilderSelect}
        />
      </Container>
    </Box>
  );
};

export default SearchResults;
