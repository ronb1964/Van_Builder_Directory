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
  Facebook,
  X as XIcon,
  Description
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
    vanTypes = [],
    location,
    socialMedia
  } = builder;

  // Process van types - handle both string and array formats
  const processedVanTypes: string[] = Array.isArray(vanTypes) 
    ? vanTypes 
    : typeof vanTypes === 'string' && vanTypes.trim()
      ? vanTypes.split(',').map((type: string) => type.trim()).filter((type: string) => type.length > 0)
      : [];

  // Transform builder name to title case
  const formatBuilderName = (name: string): string => {
    // First, extract the core business name from descriptive text
    const extractBusinessName = (fullName: string): string => {
      // Handle specific cases first
      if (fullName.includes('Sequoia + Salt')) {
        return 'Sequoia + Salt';
      }
      
      // Remove common descriptive suffixes and prefixes
      let cleanName = fullName;
      
      // Handle pipe-separated names - take the part after the pipe if it exists
      if (cleanName.includes(' | ')) {
        const parts = cleanName.split(' | ');
        cleanName = parts[parts.length - 1]; // Take the last part (usually the business name)
      }
      
      // Handle dash-separated names - take the part before the dash
      if (cleanName.includes(' - ')) {
        cleanName = cleanName.split(' - ')[0];
      }
      
      // Remove LLC, Inc, etc.
      cleanName = cleanName.replace(/,?\s*(LLC|Inc|Corporation|Corp|Co\.?)(\s|$)/gi, '');
      
      // Remove common descriptive phrases
      cleanName = cleanName.replace(/\s*(Custom tailored camper vans|East Coast Van Conversions and Builds|Campervan Conversion and Rental)/gi, '');
      
      // Remove state names when they appear as descriptive text
      cleanName = cleanName.replace(/\s*(New Jersey|New York|California|Texas|Florida)(\s|$)/gi, '');
      
      // Clean up extra spaces and punctuation
      cleanName = cleanName.replace(/[,\s]+$/, '').trim();
      
      return cleanName;
    };

    const businessName = extractBusinessName(name);
    
    return businessName
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Zoom in={true} style={{ transitionDelay: '100ms' }}>
      <Card 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative',
          overflow: 'visible',
          minWidth: '280px'
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
          <Typography
            variant="h6"
            sx={{
              position: 'relative',
              zIndex: 1,
              fontSize: '1.4rem',
              fontWeight: '500',
              lineHeight: 1.2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
              wordBreak: 'break-word'
            }}
          >
            {formatBuilderName(name)}
          </Typography>
        </Box>

        <CardContent sx={{ flexGrow: 1, pt: 1.5, pb: 1, px: 2 }}>
          {/* Location */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <LocationOn color="action" fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body1" color="text.secondary">
                {location.city}, {location.state}
              </Typography>
            </Box>
          </Box>

          {/* Description */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Description color="action" fontSize="small" sx={{ mr: 1, mt: 0.25 }} />
            <Typography 
              variant="body1" 
              paragraph 
              sx={{ 
                mb: 0, 
                color: 'text.secondary',
                display: '-webkit-box',
                overflow: 'hidden',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 3,
                lineHeight: 1.5,
                height: '4.5em',
                flex: 1
              }}
            >
              {description}
            </Typography>
          </Box>

          {/* Van Types */}
          {processedVanTypes.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ 
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
                      fontSize: '0.9rem',
                      height: '28px',
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
              py: 1,
              px: 2,
              fontWeight: '600',
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '0.85rem',
              background: 'linear-gradient(135deg, #2c3e50 0%, #3f51b5 100%)',
              transition: 'all 0.2s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
            {socialMedia?.x && (
              <Tooltip title="X Profile">
                <IconButton 
                  size="small" 
                  color="primary" 
                  aria-label="x"
                  component="a"
                  href={socialMedia.x}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ 
                    bgcolor: theme.palette.mode === 'dark' 
                      ? alpha('#ffffff', 0.1) 
                      : alpha('#1DA1F2', 0.1),
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    minWidth: 32,
                    minHeight: 32,
                    color: theme.palette.mode === 'dark' 
                      ? 'white' 
                      : '#1DA1F2',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'white' 
                        : '#1DA1F2',
                      color: theme.palette.mode === 'dark' 
                        ? '#1DA1F2' 
                        : 'white',
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  <XIcon fontSize="small" />
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
