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
              color: theme.palette.primary.main,
              mb: 2
            }}
          >
            {getSearchTitle()}
          </Typography>
          
          {builders.length > 0 && (
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              Found {builders.length} professional van builder{builders.length !== 1 ? 's' : ''} 
              {searchType === 'state' && ` in ${searchValue}`}
              {searchType === 'zip' && ` near ${searchValue}`}
            </Typography>
          )}
        </Box>

        {/* Results Section */}
        <BuildersList
          builders={builders}
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
