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
  useTheme,
  alpha,
  Zoom,
  SvgIcon
} from '@mui/material';
import { 
  LocationOn, 
  Phone, 
  Email, 
  Language, 
  DirectionsCar,
  YouTube,
  Instagram,
  Facebook
} from '@mui/icons-material';
import { Builder } from '../types/builder';

// Custom TikTok icon component
const TikTokIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.04-.1z"/>
  </SvgIcon>
);

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
    vanTypes = [],
    location,
    distanceFromZip,
    socialMedia
  } = builder;

  // Calculate distance (placeholder for now)
  const calculatedDistance = distanceFromZip || { miles: Math.floor(Math.random() * 500) + 10 };

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
        {calculatedDistance && (
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
            {calculatedDistance.miles} mi
          </Box>
        )}

        {/* Card Media - Gradient Header with Builder Name */}
        <Box
          sx={{
            height: 160,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`,
            color: 'white',
            fontSize: '1.4rem',
            fontWeight: '600',
            transition: 'all 0.3s ease-in-out',
            textAlign: 'center',
            px: 2,
            borderRadius: '8px 8px 0 0',
            textShadow: '0 1px 3px rgba(0,0,0,0.3)',
            '&:hover': {
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.8)} 0%, ${alpha(theme.palette.primary.dark, 0.7)} 100%)`,
              transform: 'scale(1.02)'
            }
          }}
        >
          {name}
        </Box>

        <CardContent sx={{ flexGrow: 1, pt: 1.5, pb: 1, px: 2 }}>
          {/* Location */}
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
              <LocationOn color="action" fontSize="small" sx={{ mr: 1, mt: 0.3 }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: '500', fontSize: '0.85rem' }}>
                {builder.city}, {builder.state}
              </Typography>
            </Box>
          </Box>

          {/* Contact Information */}
          <Box sx={{ mb: 1.5 }}>
            {phone && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Phone color="action" fontSize="small" sx={{ mr: 1 }} />
                <Link 
                  href={`tel:${phone}`} 
                  color="inherit" 
                  underline="hover"
                  sx={{ 
                    fontSize: '0.85rem',
                    transition: 'color 0.2s ease-in-out',
                    '&:hover': { color: theme.palette.primary.main }
                  }}
                >
                  {phone}
                </Link>
              </Box>
            )}
            {email && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Email color="action" fontSize="small" sx={{ mr: 1 }} />
                <Link 
                  href={`mailto:${email}`} 
                  color="inherit" 
                  underline="hover"
                  sx={{ 
                    fontSize: '0.85rem',
                    wordBreak: 'break-word',
                    transition: 'color 0.2s ease-in-out',
                    '&:hover': { color: theme.palette.primary.main }
                  }}
                >
                  {email}
                </Link>
              </Box>
            )}
            {website && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Language color="action" fontSize="small" sx={{ mr: 1 }} />
                <Link 
                  href={website} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  color="inherit" 
                  underline="hover"
                  sx={{ 
                    fontSize: '0.85rem',
                    transition: 'color 0.2s ease-in-out',
                    '&:hover': { color: theme.palette.primary.main }
                  }}
                >
                  Visit Website
                </Link>
              </Box>
            )}
          </Box>

          {/* Van Types */}
          {vanTypes && vanTypes.length > 0 && (
            <Box sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <DirectionsCar color="action" fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: '500' }}>
                  Van Types:
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {vanTypes.map((type: string, index: number) => (
                  <Chip
                    key={index}
                    label={type}
                    size="small"
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      fontSize: '0.7rem',
                      height: '22px',
                      fontWeight: '500',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.2)
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Description */}
          {description && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 1.5,
                fontSize: '0.85rem',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {description}
            </Typography>
          )}

          {/* View Details Button */}
          <Button
            variant="contained"
            fullWidth
            onClick={() => onViewDetails(builder)}
            sx={{
              mb: 1.5,
              py: 1,
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: '600',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`
              }
            }}
          >
            View Details
          </Button>

          {/* Social Media Icons */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
            {socialMedia?.youtube && (
              <Tooltip title="YouTube Profile">
                <IconButton 
                  size="small" 
                  color="primary" 
                  aria-label="youtube"
                  component="a"
                  href={socialMedia.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    minWidth: 32,
                    minHeight: 32,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: theme.palette.primary.main,
                      color: 'white',
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  <YouTube fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {socialMedia?.instagram && (
              <Tooltip title="Instagram Profile">
                <IconButton 
                  size="small" 
                  color="primary" 
                  aria-label="instagram"
                  component="a"
                  href={socialMedia.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    minWidth: 32,
                    minHeight: 32,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: theme.palette.primary.main,
                      color: 'white',
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  <Instagram fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {socialMedia?.facebook && (
              <Tooltip title="Facebook Profile">
                <IconButton 
                  size="small" 
                  color="primary" 
                  aria-label="facebook"
                  component="a"
                  href={socialMedia.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    minWidth: 32,
                    minHeight: 32,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: theme.palette.primary.main,
                      color: 'white',
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  <Facebook fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {socialMedia?.tiktok && (
              <Tooltip title="TikTok Profile">
                <IconButton 
                  size="small" 
                  color="primary" 
                  aria-label="tiktok"
                  component="a"
                  href={socialMedia.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    minWidth: 32,
                    minHeight: 32,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: theme.palette.primary.main,
                      color: 'white',
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  <TikTokIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </CardContent>
      </Card>
    </Zoom>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(BuilderCard);
