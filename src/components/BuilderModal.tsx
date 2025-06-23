import React, { useState, useEffect } from 'react';
import {
  Modal,
  Fade,
  Box,
  Typography,
  Button,
  Rating,
  Divider,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  styled,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as WebsiteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  YouTube as YouTubeIcon,
  Pinterest as PinterestIcon,
  Twitter as TwitterIcon,
  ArrowBackIos,
  ArrowForwardIos,
  Phone,
  Email,
  Language,
  YouTube,
  Instagram,
  CalendarToday as CalendarIcon,
  Check as CheckIcon,
  PhotoCamera as GalleryIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  LocationOn
} from '@mui/icons-material';
import { SvgIcon } from '@mui/material';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { Builder, PricingTier, type GalleryImage } from '../types';

// Custom TikTok icon component
const TikTokIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.04-.1z"/>
  </SvgIcon>
);

// Styled Components
const ModalContent = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 1000,
  maxHeight: '90vh',
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[5],
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  [theme.breakpoints.down('md')]: {
    width: '95%',
    maxHeight: '95vh',
  },
}));

const ModalHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const ModalBody = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  overflowY: 'auto',
  flexGrow: 1,
}));

const StyledGalleryImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.05)',
  },
});

interface BuilderModalProps {
  builder: Builder | null;
  open: boolean;
  onClose: () => void;
}

const BuilderModal: React.FC<BuilderModalProps> = ({ builder, open, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [mainImage, setMainImage] = useState('');
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const theme = useTheme();

  useEffect(() => {
    if (builder?.gallery?.[0]) {
      // Handle both string arrays and object arrays
      const firstImage = typeof builder.gallery[0] === 'string' 
        ? builder.gallery[0] 
        : builder.gallery[0].url;
      setMainImage(firstImage);
    }
  }, [builder]);

  useEffect(() => {
    if (builder?.gallery) {
      console.log('🖼️ Gallery Debug:', { 
        builderName: builder.name, 
        galleryLength: (builder.gallery || []).length, 
        galleryItems: builder.gallery 
      });
    }
  }, [builder?.gallery, builder?.name]);

  if (!builder) return null;

  const {
    name,
    location,
    description,
    phone,
    email,
    website,
    socialMedia,
    vanTypes,
    amenities,
    gallery
  } = builder;

  // Gallery navigation functions
  const validGalleryImages = ((gallery || []) as (string | GalleryImage)[])
    .filter((item: string | GalleryImage) => {
      if (typeof item === 'string') {
        return item && item.startsWith('http');
      }
      return item && item.url && item.url.startsWith('http');
    })
    .map((item: string | GalleryImage) => typeof item === 'string' ? item : item.url);
  
  const handleImageClick = (imageUrl: string) => {
    const index = validGalleryImages.indexOf(imageUrl);
    setCurrentImageIndex(index);
    setEnlargedImage(imageUrl);
  };

  const handlePrevImage = () => {
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : validGalleryImages.length - 1;
    setCurrentImageIndex(newIndex);
    setEnlargedImage(validGalleryImages[newIndex]);
  };

  const handleNextImage = () => {
    const newIndex = currentImageIndex < validGalleryImages.length - 1 ? currentImageIndex + 1 : 0;
    setCurrentImageIndex(newIndex);
    setEnlargedImage(validGalleryImages[newIndex]);
  };

  const handleCloseEnlarged = () => {
    setEnlargedImage(null);
    setCurrentImageIndex(0);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Overview
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '32px' }}>
            <div style={{ paddingRight: '16px', borderRight: '1px solid #e0e0e0' }}>
              <Typography variant="body1" paragraph sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn color="primary" />
                <span>
                  {builder.address ? `${builder.address}, ${location.city}, ${location.state} ${location.zip}` : `${location.city}, ${location.state} ${location.zip}`}
                </span>
              </Typography>
              
              <Typography variant="body1" paragraph>{description}</Typography>
            </div>
            
            <div style={{ paddingLeft: '16px' }}>
              <Typography variant="h6" gutterBottom>Van Types</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {(() => {
                  // Parse van types to ensure each type gets its own pill (same logic as BuilderCard)
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
                  
                  const types = parseVanTypes(typeof vanTypes === 'string' ? vanTypes : (vanTypes || []).join(', '));
                  
                  return types.map((type, index) => (
                    <Chip 
                      key={`${type}-${index}`} 
                      label={type} 
                      color="primary" 
                      variant="outlined"
                    />
                  ));
                })()}
              </Box>

              <Typography variant="h6" gutterBottom>Amenities</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {(amenities || []).slice(0, 12).map((amenity, index) => (
                  <Chip 
                    key={index} 
                    label={amenity} 
                    variant="outlined"
                    icon={<CheckIcon fontSize="small" />}
                  />
                ))}
                {(amenities || []).length > 12 && (
                  <Chip 
                    label={`+${(amenities || []).length - 12} more`}
                    variant="outlined"
                    sx={{ 
                      fontStyle: 'italic',
                      color: 'text.secondary',
                      borderColor: 'text.secondary'
                    }}
                  />
                )}
              </Box>
            </div>
          </div>
        );

      case 1: // Gallery
        return (
          <Box>
            {(gallery || []).length > 0 ? (
              <Box>
                {/* Scrolling Grid Gallery */}
                <Box 
                  sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                    gap: 2,
                    maxHeight: '60vh',
                    overflowY: 'auto',
                    pr: 1,
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: '#f1f1f1',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#c1c1c1',
                      borderRadius: '4px',
                      '&:hover': {
                        background: '#a8a8a8',
                      },
                    },
                  }}
                >
                  {((gallery || []) as (string | GalleryImage)[])
                    .filter((item: string | GalleryImage) => {
                      if (typeof item === 'string') {
                        return item && item.startsWith('http');
                      }
                      return item && item.url && item.url.startsWith('http');
                    })
                    .map((item: string | GalleryImage, index: number) => {
                      const imageUrl = typeof item === 'string' ? item : item.url;
                      const imageAlt = typeof item === 'string' ? `${name} van ${index + 1}` : item.alt;
                      
                      return (
                        <Box
                          key={index}
                          onClick={() => handleImageClick(imageUrl)}
                          sx={{
                            cursor: 'pointer',
                            borderRadius: 2,
                            overflow: 'hidden',
                            aspectRatio: '4/3',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'scale(1.05)',
                              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                            },
                          }}
                        >
                          <StyledGalleryImage
                            src={imageUrl}
                            alt={imageAlt}
                          />
                        </Box>
                      );
                    })}
                </Box>

                {/* Enlarged Image Modal */}
                {enlargedImage && (
                  <Modal
                    open={!!enlargedImage}
                    onClose={handleCloseEnlarged}
                    closeAfterTransition
                    BackdropProps={{
                      style: {
                        backdropFilter: 'blur(8px)',
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      },
                    }}
                  >
                    <Fade in={!!enlargedImage}>
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          maxWidth: '90vw',
                          maxHeight: '90vh',
                          outline: 'none',
                          borderRadius: 2,
                          overflow: 'hidden',
                          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        }}
                      >
                        <Box sx={{ position: 'relative' }}>
                          <StyledGalleryImage
                            src={enlargedImage}
                            alt={`${name} - Enlarged`}
                            style={{
                              width: '100%',
                              height: 'auto',
                              maxHeight: '90vh',
                              objectFit: 'contain',
                              display: 'block',
                            }}
                          />
                          <IconButton
                            onClick={handlePrevImage}
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              left: 16,
                              transform: 'translateY(-50%)',
                              backgroundColor: 'rgba(0, 0, 0, 0.6)',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              },
                            }}
                          >
                            <ArrowBackIcon />
                          </IconButton>
                          <IconButton
                            onClick={handleNextImage}
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              right: 16,
                              transform: 'translateY(-50%)',
                              backgroundColor: 'rgba(0, 0, 0, 0.6)',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              },
                            }}
                          >
                            <ArrowForwardIcon />
                          </IconButton>
                          <IconButton
                            onClick={handleCloseEnlarged}
                            sx={{
                              position: 'absolute',
                              top: 16,
                              right: 80,
                              backgroundColor: 'rgba(0, 0, 0, 0.6)',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              },
                            }}
                          >
                            <CloseIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </Fade>
                  </Modal>
                )}
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 300,
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                  p: 4,
                }}
              >
                <GalleryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No gallery images available
                </Typography>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropProps={{
        style: {
          backdropFilter: 'blur(4px)',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      <Fade in={open}>
        <ModalContent>
          <ModalHeader>
            <Typography variant="h5" component="h2">
              {name}
            </Typography>
            <IconButton onClick={onClose} size="large">
              <CloseIcon />
            </IconButton>
          </ModalHeader>

          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Overview" />
            <Tab label="Gallery" />
          </Tabs>

          <ModalBody>
            {renderTabContent()}
          </ModalBody>

          <Box
            sx={{
              p: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {/* Always show phone icon */}
              <Tooltip title={phone ? `Call ${phone}` : "Contact via email"}>
                <Button
                  variant="outlined"
                  startIcon={<PhoneIcon sx={{ fontSize: 18, mr: 1 }} />}
                  component="a"
                  href={phone ? `tel:${phone}` : `mailto:${email}`}
                >
                  {phone ? phone : 'Contact'}
                </Button>
              </Tooltip>
              {email && (
                <Button
                  variant="outlined"
                  startIcon={<EmailIcon sx={{ fontSize: 18, mr: 1 }} />}
                  component="a"
                  href={`mailto:${email}`}
                >
                  Email
                </Button>
              )}
              {website && (
                <Button
                  variant="outlined"
                  startIcon={<WebsiteIcon sx={{ fontSize: 18, mr: 1 }} />}
                  component="a"
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Website
                </Button>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {socialMedia?.youtube && (
                <Tooltip title="YouTube Channel">
                  <IconButton
                    component="a"
                    href={socialMedia.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      bgcolor: theme.palette.primary.main,
                      color: 'white',
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        bgcolor: theme.palette.primary.dark,
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <YouTube />
                  </IconButton>
                </Tooltip>
              )}
              {socialMedia?.instagram && (
                <Tooltip title="Instagram Profile">
                  <IconButton
                    component="a"
                    href={socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      bgcolor: theme.palette.primary.main,
                      color: 'white',
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        bgcolor: theme.palette.primary.dark,
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <Instagram />
                  </IconButton>
                </Tooltip>
              )}
              {socialMedia?.facebook && (
                <Tooltip title="Facebook Page">
                  <IconButton
                    component="a"
                    href={socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      bgcolor: theme.palette.primary.main,
                      color: 'white',
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        bgcolor: theme.palette.primary.dark,
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <FacebookIcon />
                  </IconButton>
                </Tooltip>
              )}
              {socialMedia?.tiktok && (
                <Tooltip title="TikTok Profile">
                  <IconButton
                    component="a"
                    href={socialMedia.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      bgcolor: theme.palette.primary.main,
                      color: 'white',
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        bgcolor: theme.palette.primary.dark,
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <TikTokIcon />
                  </IconButton>
                </Tooltip>
              )}
              {socialMedia?.twitter && (
                <Tooltip title="Twitter Profile">
                  <IconButton
                    component="a"
                    href={socialMedia.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      bgcolor: theme.palette.primary.main,
                      color: 'white',
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        bgcolor: theme.palette.primary.dark,
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <TwitterIcon />
                  </IconButton>
                </Tooltip>
              )}
              {socialMedia?.pinterest && (
                <Tooltip title="Pinterest Profile">
                  <IconButton
                    component="a"
                    href={socialMedia.pinterest}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      bgcolor: theme.palette.primary.main,
                      color: 'white',
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        bgcolor: theme.palette.primary.dark,
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <PinterestIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </ModalContent>
      </Fade>
    </Modal>
  );
};

export default BuilderModal;
