import React, { useState, Fragment } from 'react';
import {
  Modal,
  Fade,
  Box,
  Typography,
  Button,
  IconButton,
  Tabs,
  Tab,
  Chip,
  styled,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as WebsiteIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  YouTube as YouTubeIcon,
  X as XIcon,
  LocationOn as LocationOnIcon,
  Description as DescriptionIcon,
  PhotoCamera as PhotoCameraIcon,
  ArrowBackIos as ArrowBackIcon,
  ArrowForwardIos as ArrowForwardIcon,
} from '@mui/icons-material';
import { Builder } from '../types/builder';

// Styled Components
const ModalContent = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 900,
  maxHeight: '85vh',
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[24],
  borderRadius: 12,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  [theme.breakpoints.down('md')]: {
    width: '95%',
    maxHeight: '90vh',
  },
}));

const ModalHeader = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'dark' 
    ? 'linear-gradient(135deg, #2c3e50 0%, #3f51b5 100%)'
    : 'linear-gradient(135deg, #2c3e50 0%, #3f51b5 100%)',
  color: 'white',
  padding: theme.spacing(3),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  position: 'relative'
}));

const ModalBody = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  overflowY: 'auto',
  maxHeight: 'calc(85vh - 180px)', // Account for header (~80px) + tabs (~50px) + footer (~50px)
  backgroundColor: theme.palette.background.paper
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  '& .MuiTab-root': {
    textTransform: 'uppercase',
    fontWeight: 600,
    fontSize: '0.875rem',
    letterSpacing: '0.5px',
    color: theme.palette.text.secondary,
    '&.Mui-selected': {
      color: '#5b9bd5',
    }
  },
  '& .MuiTabs-indicator': {
    backgroundColor: '#5b9bd5',
    height: 3
  }
}));

const GalleryGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: theme.spacing(2),
  marginTop: theme.spacing(2)
}));

const GalleryImage = styled('img')(({ theme }) => ({
  width: '100%',
  height: 200,
  objectFit: 'cover',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

const ContactButtonsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1.5),
  flexWrap: 'wrap',
  alignItems: 'center'
}));

const SocialMediaContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  alignItems: 'center'
}));

const ModalFooter = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(3),
  borderTop: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    gap: theme.spacing(2),
    alignItems: 'flex-start'
  }
}));

interface BuilderModalProps {
  builder: Builder | null;
  open: boolean;
  onClose: () => void;
}

const BuilderModal: React.FC<BuilderModalProps> = ({ builder, open, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const theme = useTheme();

  if (!builder) return null;

  const {
    name,
    address,
    location,
    description,
    phone,
    email,
    website,
    socialMedia,
    vanTypes,
    amenities = [],
    gallery = []
  } = builder;

  // Process van types - handle both string and array formats
  const processedVanTypes: string[] = Array.isArray(vanTypes) 
    ? vanTypes 
    : typeof vanTypes === 'string' && vanTypes.trim()
      ? vanTypes.split(',').map((type: string) => type.trim()).filter((type: string) => type.length > 0)
      : [];

  // Transform builder name to title case
  const formatBuilderName = (name: string): string => {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleClose = (event?: {}, reason?: string) => {
    if (reason === 'backdropClick') {
      return; // Prevent closing on backdrop click
    }
    setActiveTab(0); // Reset to Overview tab when closing
    onClose();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleContactClick = (type: string, value: string) => {
    switch (type) {
      case 'phone':
        window.open(`tel:${value}`);
        break;
      case 'email':
        window.open(`mailto:${value}`);
        break;
      case 'website':
        window.open(value, '_blank');
        break;
    }
  };

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const handleLightboxClose = () => {
    setLightboxOpen(false);
    setCurrentImageIndex(0); // Reset to first image for next time
  };

  const handleLightboxNext = (validImages: any[]) => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % validImages.length);
  };

  const handleLightboxPrev = (validImages: any[]) => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + validImages.length) % validImages.length);
  };

  const renderOverviewTab = () => (
    <Box>
      {location && (
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ 
            fontSize: '1rem', 
            mb: 0.5,
            fontWeight: 'bold', 
            color: '#5b9bd5'
          }}>
            Location
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LocationOnIcon sx={{ fontSize: 18, mr: 1 }} />
            <Typography variant="body1" sx={{ mb: 0 }}>
              {address ? `${address}, ${location.city}, ${location.state}` : `${location.city}, ${location.state}`}
            </Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ 
          fontWeight: 'bold', 
          fontSize: '1rem', 
          mb: 0.5,
          color: '#5b9bd5'
        }}>
          About {formatBuilderName(name)}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <DescriptionIcon color="action" fontSize="small" sx={{ mr: 1, mt: 0.25 }} />
          <Typography variant="body1" sx={{ lineHeight: 1.6, mb: 0, flex: 1 }}>
            {description}
          </Typography>
        </Box>
      </Box>

      {(processedVanTypes.length > 0 || amenities.length > 0) && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {processedVanTypes.length > 0 && (
              <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
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
      )}
    </Box>
  );

  const renderGalleryTab = () => (
    <Box sx={{ minHeight: '400px' }}>
      {/* Enhanced Gallery Tab with improved empty state */}
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Photo Gallery
      </Typography>
      {(() => {
        // Filter out images with empty or invalid URLs
        const galleryArray = (gallery || []) as (string | { url: string; alt?: string; caption?: string })[];
        const validImages = galleryArray.filter((image: string | { url: string; alt?: string; caption?: string }) => {
          const imageUrl = typeof image === 'string' ? image : image.url;
          return imageUrl && imageUrl.trim() !== '';
        });
        
        return validImages.length > 0 ? (
          <GalleryGrid>
            {validImages.map((image: string | { url: string; alt?: string; caption?: string }, index: number) => {
              const imageUrl = typeof image === 'string' ? image : image.url;
              const imageAlt = typeof image === 'string' ? `${formatBuilderName(name)} conversion ${index + 1}` : image.alt || `${formatBuilderName(name)} conversion ${index + 1}`;
              
              return (
                <GalleryImage
                  key={index}
                  src={imageUrl}
                  alt={imageAlt}
                  onClick={() => handleImageClick(index)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              );
            })}
          </GalleryGrid>
        ) : (
          <Box 
            sx={{ 
              textAlign: 'center', 
              py: 6,
              px: 4,
              backgroundColor: alpha(theme.palette.primary.main, 0.02),
              borderRadius: 2,
              border: `2px dashed ${alpha(theme.palette.primary.main, 0.1)}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              minHeight: '200px',
              justifyContent: 'center'
            }}
          >
            <PhotoCameraIcon 
              sx={{ 
                fontSize: 48, 
                color: alpha(theme.palette.primary.main, 0.3),
                mb: 1
              }} 
            />
            <Typography variant="h6" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
              No Photos Available
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, maxWidth: 300 }}>
              This builder hasn't uploaded any photos yet. Check back later for gallery updates.
            </Typography>
          </Box>
        );
      })()}
    </Box>
  );

  return (
    <Fragment>
      <Modal
        open={open}
        onClose={handleClose}
        closeAfterTransition
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Fade in={open}>
          <ModalContent>
            {/* Header */}
            <ModalHeader>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
                {formatBuilderName(name)}
              </Typography>
              <IconButton
                onClick={handleClose}
                sx={{ 
                  color: 'white',
                  '&:hover': {
                    bgcolor: alpha('#ffffff', 0.1)
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
            </ModalHeader>

            {/* Tabs */}
            <StyledTabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{ bgcolor: theme.palette.background.paper }}
            >
              <Tab label="Overview" />
              <Tab label="Gallery" />
            </StyledTabs>

            {/* Body */}
            <ModalBody>
              {activeTab === 0 ? renderOverviewTab() : renderGalleryTab()}
            </ModalBody>

            {/* Footer */}
            <ModalFooter>
              <ContactButtonsContainer>
                {phone && (
                  <Button
                    variant="outlined"
                    startIcon={<PhoneIcon />}
                    onClick={() => handleContactClick('phone', phone)}
                    sx={{
                      borderColor: '#5b9bd5',
                      color: '#5b9bd5',
                      fontWeight: 600,
                      padding: '8px 16px',
                      minHeight: '40px',
                      borderRadius: 2,
                      '&:hover': {
                        borderColor: '#4a8bc2',
                        bgcolor: alpha('#5b9bd5', 0.08),
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 12px ${alpha('#5b9bd5', 0.2)}`
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    {phone}
                  </Button>
                )}
                {email && (
                  <Button
                    variant="outlined"
                    startIcon={<EmailIcon />}
                    onClick={() => handleContactClick('email', email)}
                    sx={{
                      borderColor: '#5b9bd5',
                      color: '#5b9bd5',
                      fontWeight: 600,
                      padding: '8px 16px',
                      minHeight: '40px',
                      borderRadius: 2,
                      '&:hover': {
                        borderColor: '#4a8bc2',
                        bgcolor: alpha('#5b9bd5', 0.08),
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 12px ${alpha('#5b9bd5', 0.2)}`
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    Email
                  </Button>
                )}
                {website && (
                  <Button
                    variant="outlined"
                    startIcon={<WebsiteIcon />}
                    onClick={() => handleContactClick('website', website)}
                    sx={{
                      borderColor: '#5b9bd5',
                      color: '#5b9bd5',
                      fontWeight: 600,
                      padding: '8px 16px',
                      minHeight: '40px',
                      borderRadius: 2,
                      '&:hover': {
                        borderColor: '#4a8bc2',
                        bgcolor: alpha('#5b9bd5', 0.08),
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 12px ${alpha('#5b9bd5', 0.2)}`
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    Website
                  </Button>
                )}
              </ContactButtonsContainer>

              <SocialMediaContainer>
                {socialMedia && Object.values(socialMedia).some(url => url) && (
                  <>
                    {socialMedia.youtube && (
                      <IconButton
                        onClick={() => window.open(socialMedia.youtube, '_blank')}
                        sx={{ 
                          color: theme.palette.mode === 'dark' ? '#ffffff' : '#FF0000',
                          bgcolor: theme.palette.mode === 'dark' 
                            ? alpha('#ffffff', 0.1) 
                            : alpha('#FF0000', 0.1),
                          '&:hover': { 
                            bgcolor: theme.palette.mode === 'dark' 
                              ? alpha('#ffffff', 0.2) 
                              : alpha('#FF0000', 0.2),
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        <YouTubeIcon />
                      </IconButton>
                    )}
                    {socialMedia.instagram && (
                      <IconButton
                        onClick={() => window.open(socialMedia.instagram, '_blank')}
                        sx={{ 
                          color: theme.palette.mode === 'dark' ? '#ffffff' : '#E4405F',
                          bgcolor: theme.palette.mode === 'dark' 
                            ? alpha('#ffffff', 0.1) 
                            : alpha('#E4405F', 0.1),
                          '&:hover': { 
                            bgcolor: theme.palette.mode === 'dark' 
                              ? alpha('#ffffff', 0.2) 
                              : alpha('#E4405F', 0.2),
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        <InstagramIcon />
                      </IconButton>
                    )}
                    {socialMedia.facebook && (
                      <IconButton
                        onClick={() => window.open(socialMedia.facebook, '_blank')}
                        sx={{ 
                          color: theme.palette.mode === 'dark' ? '#ffffff' : '#1877F2',
                          bgcolor: theme.palette.mode === 'dark' 
                            ? alpha('#ffffff', 0.1) 
                            : alpha('#1877F2', 0.1),
                          '&:hover': { 
                            bgcolor: theme.palette.mode === 'dark' 
                              ? alpha('#ffffff', 0.2) 
                              : alpha('#1877F2', 0.2),
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        <FacebookIcon />
                      </IconButton>
                    )}
                    {socialMedia.x && (
                      <IconButton
                        onClick={() => window.open(socialMedia.x, '_blank')}
                        sx={{ 
                          color: theme.palette.mode === 'dark' ? '#ffffff' : '#1DA1F2',
                          bgcolor: theme.palette.mode === 'dark' 
                            ? alpha('#ffffff', 0.1) 
                            : alpha('#1DA1F2', 0.1),
                          '&:hover': { 
                            bgcolor: theme.palette.mode === 'dark' 
                              ? alpha('#ffffff', 0.2) 
                              : alpha('#1DA1F2', 0.2),
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        <XIcon />
                      </IconButton>
                    )}
                  </>
                )}
              </SocialMediaContainer>
            </ModalFooter>
          </ModalContent>
        </Fade>
      </Modal>

      {/* Photo Lightbox Modal */}
      <Modal
        open={lightboxOpen}
        onClose={handleLightboxClose}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(0, 0, 0, 0.9)'
        }}
      >
        <Box
          sx={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {(() => {
            // Get valid images for lightbox
            const galleryArray = (gallery || []) as (string | { url: string; alt?: string; caption?: string })[];
            const validImages = galleryArray.filter((image: string | { url: string; alt?: string; caption?: string }) => {
              const imageUrl = typeof image === 'string' ? image : image.url;
              return imageUrl && imageUrl.trim() !== '';
            });

            if (validImages.length === 0) return null;

            // Ensure currentImageIndex is within bounds
            const safeIndex = Math.max(0, Math.min(currentImageIndex, validImages.length - 1));
            const currentImage = validImages[safeIndex];
            
            if (!currentImage) return null;

            const imageUrl = typeof currentImage === 'string' ? currentImage : (currentImage as { url: string; alt?: string; caption?: string }).url;
            const imageAlt = typeof currentImage === 'string' 
              ? `${formatBuilderName(name)} photo ${safeIndex + 1}` 
              : (currentImage as { url: string; alt?: string; caption?: string }).alt || `${formatBuilderName(name)} photo ${safeIndex + 1}`;

            return (
              <>
                {/* Close Button */}
                <IconButton
                  onClick={handleLightboxClose}
                  sx={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    color: 'white',
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.7)'
                    },
                    zIndex: 1
                  }}
                >
                  <CloseIcon />
                </IconButton>

                {/* Previous Arrow */}
                {validImages.length > 1 && (
                  <IconButton
                    onClick={() => handleLightboxPrev(validImages)}
                    sx={{
                      position: 'absolute',
                      left: 20,
                      color: 'white',
                      bgcolor: 'rgba(0, 0, 0, 0.5)',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.7)'
                      },
                      zIndex: 1
                    }}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                )}

                {/* Main Image */}
                <Box
                  component="img"
                  src={imageUrl}
                  alt={imageAlt}
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: 1
                  }}
                />

                {/* Next Arrow */}
                {validImages.length > 1 && (
                  <IconButton
                    onClick={() => handleLightboxNext(validImages)}
                    sx={{
                      position: 'absolute',
                      right: 20,
                      color: 'white',
                      bgcolor: 'rgba(0, 0, 0, 0.5)',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.7)'
                      },
                      zIndex: 1
                    }}
                  >
                    <ArrowForwardIcon />
                  </IconButton>
                )}

                {/* Image Counter */}
                {validImages.length > 1 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 20,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      color: 'white',
                      bgcolor: 'rgba(0, 0, 0, 0.5)',
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                      fontSize: '0.875rem'
                    }}
                  >
                    {safeIndex + 1} / {validImages.length}
                  </Box>
                )}
              </>
            );
          })()}
        </Box>
      </Modal>
    </Fragment>
  );
};

export default BuilderModal;
