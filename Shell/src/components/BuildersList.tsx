import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import BuilderCard from './BuilderCard';
import { Builder } from '../types/builder';

// Create styled components for our grid layout
const GridContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(1, 1fr)',
  gap: theme.spacing(3),
  marginTop: theme.spacing(2),
  [theme.breakpoints.up('md')]: {
    gridTemplateColumns: 'repeat(2, 1fr)',
  },
  [theme.breakpoints.up('lg')]: {
    gridTemplateColumns: 'repeat(3, 1fr)',
  },
}));

// Props interface for the component
interface BuildersListProps {
  selectedState?: string;
  selectedZipCode?: string;
  searchType?: 'state' | 'zip' | 'builder';
  onBuilderSelect?: (builder: Builder) => void;
  onZoomToLocation?: (builder: Builder) => void;
  searchedBuilderName?: string;
  builders?: Builder[];
}

// Default message for states without builder data
const DEFAULT_MESSAGE = "We don't have builder data for this state yet. Please select a different state to see builder data.";

// Main component that displays builders based on selected state
const BuildersList: React.FC<BuildersListProps> = ({ 
  selectedState = "New Jersey", 
  selectedZipCode,
  searchType,
  onBuilderSelect,
  onZoomToLocation,
  searchedBuilderName,
  builders = []
}) => {
  console.log('🎯 BuildersList: Current builders for display:', builders.length, selectedState);

  return (
    <Box>
      {builders.length > 0 ? (
        <>
          <Typography variant="subtitle1" gutterBottom>
            {builders.length} builder{builders.length !== 1 ? 's' : ''} found
          </Typography>
          <GridContainer>
            {builders.map((builder) => (
              <BuilderCard 
                key={builder.id}
                builder={builder} 
                onViewDetails={onBuilderSelect || (() => {})} 
                onZoomToLocation={onZoomToLocation || (() => {})} 
                searchType={searchType}
              />
            ))}
          </GridContainer>
        </>
      ) : (
        <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            No Builders Found
          </Typography>
          <Typography variant="body1" paragraph>
            {selectedState ? `No builders found for ${selectedState}.` : DEFAULT_MESSAGE}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            We're constantly adding new builder data to our database.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default BuildersList;
