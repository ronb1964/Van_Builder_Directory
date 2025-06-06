import React from 'react';
import {
  Box,
  Typography,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  LocationOn as LocationOnIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';

interface ModalOverviewTabProps {
  location?: string;
  address?: string;
  description?: string;
  vanTypes: string[];
  amenities: string[];
}

const ModalOverviewTab: React.FC<ModalOverviewTabProps> = ({
  location,
  address,
  description,
  vanTypes,
  amenities
}) => {
  const theme = useTheme();

  const processedVanTypes = vanTypes
    .join(', ')
    .split(/[,;]/)
    .map(type => type.trim())
    .filter(type => type.length > 0);

  return (
    <Box>
      {(address || location) && (
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ 
            fontSize: '1rem', 
            mb: 0.5,
            fontWeight: 'bold', 
            color: '#5b9bd5'
          }}>
            <LocationOnIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle', color: '#5b9bd5' }} />
            Location
          </Typography>
          <Typography variant="body1" sx={{ mb: 0 }}>
            {(() => {
              // Check if address is a complete address (contains street info, not just state)
              const isCompleteAddress = address && 
                address !== location && 
                !['New Jersey', 'New York', 'California', 'Texas', 'Florida'].includes(address.trim()) &&
                (address.includes(',') || /\d/.test(address));
              
              return isCompleteAddress ? address : location;
            })()}
          </Typography>
        </Box>
      )}

      {description && (
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ 
            fontSize: '1rem', 
            mb: 0.5,
            fontWeight: 'bold', 
            color: '#5b9bd5'
          }}>
            <DescriptionIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
            Description
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
            {description}
          </Typography>
        </Box>
      )}

      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 2,
        '@media (max-width: 600px)': {
          flexDirection: 'column',
          gap: 1.5
        }
      }}>
        {processedVanTypes.length > 0 && (
          <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ 
              fontSize: '1rem', 
              mb: 1,
              fontWeight: 'bold', 
              color: '#5b9bd5'
            }}>
              Van Types
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {processedVanTypes.map((type) => (
                <Chip
                  key={type}
                  label={type}
                  size="medium"
                  sx={{ 
                    borderRadius: 1.5,
                    bgcolor: theme.palette.mode === 'dark' 
                      ? alpha('#ffffff', 0.15) 
                      : alpha('#2c3e50', 0.08),
                    color: theme.palette.mode === 'dark' 
                      ? 'white' 
                      : '#2c3e50',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                    height: '32px',
                    border: theme.palette.mode === 'dark' 
                      ? '1px solid rgba(255, 255, 255, 0.3)' 
                      : '1px solid rgba(44, 62, 80, 0.2)',
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
        {amenities.length > 0 && (
          <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ 
              fontSize: '1rem', 
              mb: 1,
              fontWeight: 'bold', 
              color: '#5b9bd5'
            }}>
              Amenities
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {amenities.map((amenity) => (
                <Chip
                  key={amenity}
                  label={amenity}
                  size="medium"
                  sx={{ 
                    borderRadius: 1.5,
                    bgcolor: theme.palette.mode === 'dark' 
                      ? alpha('#81c784', 0.15) 
                      : alpha('#4caf50', 0.08),
                    color: 'white',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                    height: '32px',
                    border: theme.palette.mode === 'dark' 
                      ? '1px solid rgba(129, 199, 132, 0.3)' 
                      : '1px solid rgba(76, 175, 80, 0.2)',
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ModalOverviewTab;
