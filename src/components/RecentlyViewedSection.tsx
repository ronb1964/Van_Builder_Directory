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
  alpha,
  Stack
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
                  {builder.vanTypes && Array.isArray(builder.vanTypes) && builder.vanTypes.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                      {builder.vanTypes.slice(0, 2).map((vanType: string) => (
                        <Chip 
                          key={vanType} 
                          label={vanType} 
                          size="small" 
                          variant="outlined" 
                          color="primary"
                          sx={{ fontSize: '0.65rem', height: '20px' }}
                        />
                      ))}
                    </Box>
                  )}
                  
                  {/* Services */}
                  {builder.services && Array.isArray(builder.services) && builder.services.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {builder.services.slice(0, 2).map((service: string) => (
                        <Chip 
                          key={service} 
                          label={service} 
                          size="small" 
                          variant="outlined" 
                          color="secondary"
                          sx={{ fontSize: '0.65rem', height: '20px' }}
                        />
                      ))}
                    </Box>
                  )}
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
