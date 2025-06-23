import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Button,
  useTheme,
  alpha
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import ClearIcon from '@mui/icons-material/Clear';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Builder } from '../types';

interface RecentlyViewedSectionProps {
  recentlyViewed: Builder[];
  onViewDetails: (builder: Builder) => void;
  onClearAll: () => void;
}

const RecentlyViewedSection: React.FC<RecentlyViewedSectionProps> = ({
  recentlyViewed,
  onViewDetails,
  onClearAll
}) => {
  const theme = useTheme();

  if (recentlyViewed.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 6, mb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <Typography 
          variant="h5" 
          component="h2" 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            color: 'primary.main',
            fontWeight: 600
          }}
        >
          <HistoryIcon sx={{ mr: 1 }} /> Recently Viewed
        </Typography>
        {recentlyViewed.length > 0 && (
          <Button 
            variant="outlined"
            color="secondary"
            startIcon={<ClearIcon />} 
            onClick={onClearAll}
            size="small"
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 2,
              py: 0.5
            }}
          >
            Clear Recents
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {recentlyViewed.map((builder) => (
          <Box key={builder.id} sx={{ width: { xs: '100%', sm: '47%', md: '31%', lg: '19%' } }}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardActionArea onClick={() => onViewDetails(builder)}>
                <Box
                  sx={{
                    height: 80,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`,
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    transition: 'all 0.3s ease-in-out',
                    textAlign: 'center',
                    px: 1.5,
                    borderRadius: '8px 8px 0 0',
                    textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.8)} 0%, ${alpha(theme.palette.primary.dark, 0.7)} 100%)`,
                      transform: 'scale(1.02)'
                    }
                  }}
                >
                  {builder.name}
                </Box>
                <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOnIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                      {builder.location.city}, {builder.location.state}
                    </Typography>
                  </Box>
                  
                  {/* Van Types */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    {(() => {
                      // Parse van types string into separate pills
                      const parseVanTypes = (vanTypesStr: string | string[] | undefined): string[] => {
                        if (!vanTypesStr) return [];
                        
                        // Handle array format
                        if (Array.isArray(vanTypesStr)) {
                          // If it's an array, check if first element contains comma-separated values
                          if (vanTypesStr.length === 1 && typeof vanTypesStr[0] === 'string' && vanTypesStr[0].includes(',')) {
                            // Single array element with comma-separated values - split it
                            const firstElement = vanTypesStr[0];
                            const parenthesesMatch = firstElement.match(/\(([^)]+)\)/);
                            const specialties = parenthesesMatch ? parenthesesMatch[1].split(',').map(s => s.trim()) : [];
                            const mainTypes = firstElement.replace(/\s*\([^)]*\)/, '').split(',').map(s => s.trim()).filter(s => s);
                            return [...mainTypes, ...specialties].slice(0, 3);
                          } else {
                            // Regular array with separate elements
                            return vanTypesStr.slice(0, 3);
                          }
                        }
                        
                        // If it's a string, split by comma and clean up
                        if (typeof vanTypesStr === 'string') {
                          const parenthesesMatch = vanTypesStr.match(/\(([^)]+)\)/);
                          const specialties = parenthesesMatch ? parenthesesMatch[1].split(',').map(s => s.trim()) : [];
                          const mainTypes = vanTypesStr.replace(/\s*\([^)]*\)/, '').split(',').map(s => s.trim()).filter(s => s);
                          return [...mainTypes, ...specialties].slice(0, 3);
                        }
                        
                        return [];
                      };
                      
                      const vanTypes = parseVanTypes(builder.vanTypes);
                      
                      return vanTypes.map((type, index) => (
                        <Chip 
                          key={`${type}-${index}`} 
                          label={type} 
                          size="small" 
                          sx={{ 
                            fontSize: '0.65rem', 
                            height: '20px',
                            borderRadius: 1.5,
                            bgcolor: theme.palette.mode === 'dark' 
                              ? alpha(theme.palette.primary.main, 0.2)
                              : alpha(theme.palette.primary.main, 0.15),
                            color: theme.palette.mode === 'dark'
                              ? theme.palette.primary.light
                              : theme.palette.primary.dark,
                            border: `1px solid ${theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.4) : theme.palette.primary.main}`,
                            fontWeight: '600',
                            boxShadow: theme.palette.mode === 'dark' 
                              ? '0 1px 3px rgba(0,0,0,0.3)'
                              : '0 1px 2px rgba(0,0,0,0.1)',
                            cursor: 'default'
                          }}
                        />
                      ));
                    })()}
                  </Box>
                  
                  {/* Amenities */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(() => {
                      // Parse amenities (can be array or string)
                      const parseAmenities = (amenitiesData: any): string[] => {
                        if (!amenitiesData) return [];
                        
                        if (Array.isArray(amenitiesData)) {
                          return amenitiesData.slice(0, 2);
                        }
                        
                        if (typeof amenitiesData === 'string') {
                          try {
                            const parsed = JSON.parse(amenitiesData);
                            return Array.isArray(parsed) ? parsed.slice(0, 2) : [];
                          } catch {
                            // If not JSON, treat as comma-separated string
                            return amenitiesData.split(',').map(s => s.trim()).filter(s => s).slice(0, 2);
                          }
                        }
                        
                        return [];
                      };
                      
                      const amenities = parseAmenities(builder.amenities);
                      
                      return amenities.map((amenity, index) => (
                        <Chip 
                          key={`${amenity}-${index}`} 
                          label={amenity} 
                          size="small" 
                          sx={{ 
                            fontSize: '0.65rem', 
                            height: '20px',
                            borderRadius: 1.5,
                            bgcolor: theme.palette.mode === 'dark' 
                              ? alpha(theme.palette.secondary.main, 0.2)
                              : alpha('#757575', 0.15),
                            color: theme.palette.mode === 'dark'
                              ? theme.palette.secondary.light
                              : '#424242',
                            border: `1px solid ${theme.palette.mode === 'dark' ? alpha(theme.palette.secondary.main, 0.4) : '#757575'}`,
                            fontWeight: '600',
                            boxShadow: theme.palette.mode === 'dark' 
                              ? '0 1px 3px rgba(0,0,0,0.3)'
                              : '0 1px 2px rgba(0,0,0,0.1)',
                            cursor: 'default'
                          }}
                        />
                      ));
                    })()}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default RecentlyViewedSection;
