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
  SvgIcon,
  Badge
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
  searchType?: 'state' | 'zip' | 'builder';
}

const BuilderCard: React.FC<BuilderCardProps> = ({ 
  builder, 
  onViewDetails,
  onZoomToLocation,
  searchType
}) => {
  const theme = useTheme();
  const {
    name,
    phone,
    email,
    website,
    description,
    vanTypes,
    location,
    socialMedia
  } = builder;

  // Process van types - handle both string and array formats
  const processedVanTypes: string[] = Array.isArray(vanTypes) 
    ? vanTypes 
    : typeof vanTypes === 'string' && vanTypes.trim()
      ? vanTypes.split(',').map((type: string) => type.trim()).filter((type: string) => type.length > 0)
      : [];

  return (
    <Zoom in={true} style={{ transitionDelay: '100ms' }}>
      <Card 
        sx={{ 
          height: 'auto', 
          minHeight: '280px',
          maxHeight: '320px',
          width: '100%',
          maxWidth: '400px',
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
        {searchType === 'zip' && builder.distanceFromZip && (
          <Box
            onClick={() => onZoomToLocation?.(builder)}
            sx={{
              position: 'absolute',
              top: -8,
              left: -8,
              zIndex: 10,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.1)',
                boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)'
              }
            }}
          >
            <Chip
              label={`${builder.distanceFromZip.miles} mi`}
              size="small"
              sx={{
                bgcolor: '#dc3545',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.75rem',
                height: '24px',
                '& .MuiChip-label': {
                  px: 1.5
                },
                '&:hover': {
                  bgcolor: '#c82333'
                }
              }}
            />
          </Box>
        )}

        {/* Card Header with Builder Name - Using theme colors */}
        <Box
          sx={{
            height: 120,
            minHeight: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #2c3e50 0%, #3f51b5 100%)',
            color: 'white',
            fontSize: '1.3rem',
            fontWeight: '600',
            transition: 'all 0.3s ease-in-out',
            textAlign: 'center',
            px: 2,
            borderRadius: '8px 8px 0 0',
            textShadow: '0 1px 3px rgba(0,0,0,0.3)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 30% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
              pointerEvents: 'none',
            },
            '&:hover': {
              background: 'linear-gradient(135deg, #34495e 0%, #5c6bc0 100%)',
              transform: 'scale(1.02)'
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            {name}
          </Box>
        </Box>

        <CardContent sx={{ flexGrow: 1, pt: 1.5, pb: 1, px: 2 }}>
          {/* Location */}
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <LocationOn color="action" fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: '500', fontSize: '0.85rem', textAlign: 'left' }}>
                {location.city}, {location.state}
              </Typography>
            </Box>
          </Box>

          {/* Description */}
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

          {/* Van Types */}
          {processedVanTypes.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: '600', color: 'text.primary', mb: 0.5, fontSize: '0.85rem' }}>
                Van Types
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {processedVanTypes.map((type) => (
                  <Chip
                    key={type}
                    label={type}
                    size="small"
                    sx={{ 
                      borderRadius: 1.5,
                      bgcolor: theme.palette.mode === 'dark' 
                        ? alpha('#ffffff', 0.15) 
                        : alpha('#2c3e50', 0.08),
                      color: theme.palette.mode === 'dark' 
                        ? 'white' 
                        : '#2c3e50',
                      fontWeight: '500',
                      fontSize: '0.7rem',
                      height: '22px',
                      border: theme.palette.mode === 'dark' 
                        ? '1px solid rgba(255, 255, 255, 0.3)' 
                        : '1px solid rgba(44, 62, 80, 0.2)',
                      '&:hover': { 
                        bgcolor: theme.palette.mode === 'dark' 
                          ? alpha('#ffffff', 0.25) 
                          : alpha('#2c3e50', 0.15),
                        transform: 'translateY(-1px)',
                        boxShadow: 1 
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </CardContent>

        <Box sx={{ p: 1.5, pt: 0, mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant="contained"
            onClick={() => onViewDetails && onViewDetails(builder)}
            sx={{
              py: 0.6,
              px: 2,
              fontWeight: '600',
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '0.85rem',
              background: 'linear-gradient(135deg, #2c3e50 0%, #3f51b5 100%)',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                background: 'linear-gradient(135deg, #34495e 0%, #5c6bc0 100%)',
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
                href={phone ? `tel:${phone}` : `mailto:${email || ''}`}
                sx={{ 
                  bgcolor: theme.palette.mode === 'dark' 
                    ? alpha('#ffffff', 0.1) 
                    : alpha('#2c3e50', 0.1),
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  minHeight: 32,
                  color: theme.palette.mode === 'dark' 
                    ? 'white' 
                    : '#2c3e50',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'white' 
                      : '#2c3e50',
                    color: theme.palette.mode === 'dark' 
                      ? '#2c3e50' 
                      : 'white',
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <Phone fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {/* Always show email icon */}
            <Tooltip title={email ? `Email ${email}` : "No email"}>
              <IconButton 
                size="small" 
                color="primary" 
                aria-label="email"
                component={email ? "a" : "div"}
                href={email ? `mailto:${email}` : undefined}
                sx={{ 
                  bgcolor: theme.palette.mode === 'dark' 
                    ? alpha('#ffffff', 0.1) 
                    : alpha('#2c3e50', 0.1),
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  minHeight: 32,
                  color: theme.palette.mode === 'dark' 
                    ? 'white' 
                    : '#2c3e50',
                  opacity: email ? 1 : 0.5,
                  cursor: email ? 'pointer' : 'default',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': email ? {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'white' 
                      : '#2c3e50',
                    color: theme.palette.mode === 'dark' 
                      ? '#2c3e50' 
                      : 'white',
                    transform: 'scale(1.1)'
                  } : {}
                }}
              >
                <Email fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {/* Always show website icon */}
            <Tooltip title="Go to site">
              <IconButton 
                size="small" 
                color="primary" 
                aria-label="website"
                component="a"
                href={website || '#'}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ 
                  bgcolor: theme.palette.mode === 'dark' 
                    ? alpha('#ffffff', 0.1) 
                    : alpha('#2c3e50', 0.1),
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  minHeight: 32,
                  color: theme.palette.mode === 'dark' 
                    ? 'white' 
                    : '#2c3e50',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'white' 
                      : '#2c3e50',
                    color: theme.palette.mode === 'dark' 
                      ? '#2c3e50' 
                      : 'white',
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <Language fontSize="small" />
              </IconButton>
            </Tooltip>
            {socialMedia?.youtube && (
              <Tooltip title="YouTube Channel">
                <IconButton 
                  size="small" 
                  color="primary" 
                  aria-label="youtube"
                  component="a"
                  href={socialMedia.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ 
                    bgcolor: theme.palette.mode === 'dark' 
                      ? alpha('#ffffff', 0.1) 
                      : alpha('#2c3e50', 0.1),
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    minWidth: 32,
                    minHeight: 32,
                    color: theme.palette.mode === 'dark' 
                      ? 'white' 
                      : '#2c3e50',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'white' 
                        : '#2c3e50',
                      color: theme.palette.mode === 'dark' 
                        ? '#2c3e50' 
                        : 'white',
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
                    bgcolor: theme.palette.mode === 'dark' 
                      ? alpha('#ffffff', 0.1) 
                      : alpha('#2c3e50', 0.1),
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    minWidth: 32,
                    minHeight: 32,
                    color: theme.palette.mode === 'dark' 
                      ? 'white' 
                      : '#2c3e50',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'white' 
                        : '#2c3e50',
                      color: theme.palette.mode === 'dark' 
                        ? '#2c3e50' 
                        : 'white',
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  <Instagram fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {socialMedia?.facebook && (
              <Tooltip title="Facebook Page">
                <IconButton 
                  size="small" 
                  color="primary" 
                  aria-label="facebook"
                  component="a"
                  href={socialMedia.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ 
                    bgcolor: theme.palette.mode === 'dark' 
                      ? alpha('#ffffff', 0.1) 
                      : alpha('#2c3e50', 0.1),
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    minWidth: 32,
                    minHeight: 32,
                    color: theme.palette.mode === 'dark' 
                      ? 'white' 
                      : '#2c3e50',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'white' 
                        : '#2c3e50',
                      color: theme.palette.mode === 'dark' 
                        ? '#2c3e50' 
                        : 'white',
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
                    bgcolor: theme.palette.mode === 'dark' 
                      ? alpha('#ffffff', 0.1) 
                      : alpha('#2c3e50', 0.1),
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    minWidth: 32,
                    minHeight: 32,
                    color: theme.palette.mode === 'dark' 
                      ? 'white' 
                      : '#2c3e50',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'white' 
                        : '#2c3e50',
                      color: theme.palette.mode === 'dark' 
                        ? '#2c3e50' 
                        : 'white',
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  <TikTokIcon fontSize="small" />
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
