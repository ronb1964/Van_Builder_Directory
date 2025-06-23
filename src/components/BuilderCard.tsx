import React, { memo } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Box, 
  Chip, 
  IconButton,
  Link,
  Tooltip,
  Badge,
  useTheme,
  alpha,
  Grow,
  Zoom
} from '@mui/material';
import { 
  LocationOn, 
  Phone, 
  Email, 
  Language
} from '@mui/icons-material';
import { Builder } from '../types';



interface BuilderCardProps {
  builder: Builder;
  onViewDetails: (builder: Builder) => void;
  onZoomToLocation?: (builder: Builder) => void;
}

const BuilderCard: React.FC<BuilderCardProps> = ({ 
  builder, 
  onViewDetails,
  onZoomToLocation
}) => {
  const theme = useTheme();
  const {
    name,
    address,
    phone,
    email,
    website,
    description,
    vanTypes = 'Custom Van',
    location,
    distanceFromZip,
    socialMedia
  } = builder;

  return (
    <Zoom in={true} style={{ transitionDelay: '100ms' }}>
      <Card 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative',
          overflow: 'visible',
          borderRadius: 2,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
          }
        }}
      >
        {/* Distance Badge - Upper Left Corner */}
        {distanceFromZip && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 10,
              bgcolor: '#d32f2f',
              color: 'white',
              borderRadius: '20px',
              px: 1.5,
              py: 0.5,
              fontSize: '0.75rem',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(211, 47, 47, 0.4)',
              border: '2px solid white',
              minWidth: '60px',
              textAlign: 'center',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 4px 12px rgba(211, 47, 47, 0.6)'
              },
              cursor: 'pointer'
            }}
            onClick={() => onZoomToLocation?.(builder)}
          >
            {distanceFromZip.miles} mi
          </Box>
        )}

        {/* Card Media */}
        <Box
          onClick={() => onViewDetails(builder)}
          sx={{
            height: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`,
            color: 'white',
            fontSize: '1.2rem',
            fontWeight: '600',
            transition: 'all 0.3s ease-in-out',
            textAlign: 'center',
            px: 2,
            py: 1.5,
            borderRadius: '8px 8px 0 0',
            textShadow: '0 1px 3px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            '&:hover': {
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.8)} 0%, ${alpha(theme.palette.primary.dark, 0.7)} 100%)`,
              transform: 'scale(1.02)'
            }
          }}
        >
          {name}
        </Box>

        <CardContent sx={{ flexGrow: 1, pt: 1.5, pb: 1, px: 2 }}>
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
              <LocationOn color="action" fontSize="small" sx={{ mr: 1, mt: 0.3 }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: '500', fontSize: '0.85rem' }}>
                {location.city}, {location.state}
              </Typography>
            </Box>
          </Box>

          <Typography 
            variant="body2" 
            paragraph 
            sx={{ 
              mb: 1, 
              color: 'text.secondary',
              display: '-webkit-box',
              overflow: 'hidden',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              lineHeight: 1.4,
              height: '2.8em',
              fontSize: '0.85rem'
            }}
          >
            {description}
          </Typography>

          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: '600', color: 'text.primary', mb: 0.5, fontSize: '0.85rem' }}>
              Van Types
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {(() => {
                // Parse the van types string into separate pills
                const parseVanTypes = (vanTypesStr: string): string[] => {
                  if (!vanTypesStr) return ['Custom Van'];
                  
                  // Split by comma and handle parentheses content
                  // Example: "Mercedes Sprinter, Ford Transit (Luxury)" 
                  // becomes ["Mercedes Sprinter", "Ford Transit", "Luxury"]
                  
                  // First, extract content in parentheses
                  const parenthesesMatch = vanTypesStr.match(/\(([^)]+)\)/);
                  const specialties = parenthesesMatch ? parenthesesMatch[1].split(',').map(s => s.trim()) : [];
                  
                  // Remove parentheses content and split main types
                  const mainTypes = vanTypesStr.replace(/\s*\([^)]*\)/, '').split(',').map(s => s.trim()).filter(s => s);
                  
                  return [...mainTypes, ...specialties];
                };
                
                const types = parseVanTypes(typeof vanTypes === 'string' ? vanTypes : vanTypes.join(', '));
                
                return types.map((type, index) => (
                  <Chip
                    key={`${type}-${index}`}
                    label={type}
                    size="small"
                    sx={{ 
                      borderRadius: 1.5,
                      bgcolor: theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.primary.main, 0.2)
                        : alpha(theme.palette.primary.main, 0.12),
                      color: theme.palette.mode === 'dark'
                        ? theme.palette.primary.light
                        : theme.palette.primary.dark,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                      fontWeight: '600',
                      fontSize: '0.7rem',
                      height: '24px',
                      boxShadow: theme.palette.mode === 'dark' 
                        ? '0 1px 3px rgba(0,0,0,0.3)'
                        : '0 1px 2px rgba(0,0,0,0.1)',
                      cursor: 'default'
                    }}
                  />
                ));
              })()}
            </Box>
          </Box>
        </CardContent>

        <Box sx={{ p: 1.5, pt: 0, mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant="contained"
            onClick={() => onViewDetails(builder)}
            sx={{
              py: 0.6,
              px: 2,
              fontWeight: '600',
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '0.85rem',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: 4
              }
            }}
          >
            View Details
          </Button>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {/* Always show phone icon */}
            <Tooltip title={phone ? `Call ${phone}` : "Contact via email"}>
              <IconButton 
                size="small" 
                color="primary" 
                aria-label="contact"
                component="a"
                href={phone ? `tel:${phone}` : `mailto:${email}`}
                sx={{ 
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  minHeight: 32,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <Phone fontSize="small" />
              </IconButton>
            </Tooltip>
            {email && (
              <Tooltip title={`Email ${email}`}>
                <IconButton 
                  size="small" 
                  color="primary" 
                  aria-label="email"
                  component="a"
                  href={`mailto:${email}`}
                  sx={{ 
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    minWidth: 32,
                    minHeight: 32,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: theme.palette.primary.dark,
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  <Email fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {website && (
              <Tooltip title="Visit Website">
                <IconButton 
                  size="small" 
                  color="primary" 
                  aria-label="website"
                  component="a"
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ 
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    minWidth: 32,
                    minHeight: 32,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: theme.palette.primary.dark,
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  <Language fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

          </Box>
        </Box>
      </Card>
    </Zoom>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(BuilderCard);
