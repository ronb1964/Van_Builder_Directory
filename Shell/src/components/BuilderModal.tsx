import React, { useState, useEffect } from 'react';
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
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as WebsiteIcon,
  YouTube as YouTubeIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon
} from '@mui/icons-material';
import { Builder } from '../types/builder';

// Custom TikTok icon component
const TikTokIcon = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43V7.56a8.16 8.16 0 0 0 4.77 1.52v-3.39z"/>
  </svg>
);

// Styled Components
const ModalContent = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 900,
  maxHeight: '90vh',
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[24],
  borderRadius: 12,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  [theme.breakpoints.down('md')]: {
    width: '95%',
    maxHeight: '95vh',
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
  flexGrow: 1,
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
  marginTop: theme.spacing(4),
  paddingTop: theme.spacing(3),
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
  const theme = useTheme();

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
    amenities = [],
    gallery = []
  } = builder;

  // Process van types - handle both string and array formats
  const processedVanTypes: string[] = Array.isArray(vanTypes) 
    ? vanTypes 
    : typeof vanTypes === 'string' && vanTypes.trim()
      ? vanTypes.split(',').map((type: string) => type.trim()).filter((type: string) => type.length > 0)
      : [];

  const handleClose = (event: {}, reason: string) => {
    if (reason === 'backdropClick') {
      return; // Prevent closing on backdrop click
    }
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

  const renderOverviewTab = () => (
    <Box>
      {location && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, fontSize: '1rem', mb: 0.5 }}>
            Location
          </Typography>
          <Typography variant="body1" sx={{ mb: 0 }}>
            {location.city}, {location.state} {location.zip}
          </Typography>
        </Box>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, fontSize: '1rem', mb: 0.5 }}>
          About {name}
        </Typography>
        <Typography variant="body1" sx={{ lineHeight: 1.6, mb: 0 }}>
          {description}
        </Typography>
      </Box>

      {(processedVanTypes.length > 0 || amenities.length > 0) && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {processedVanTypes.length > 0 && (
              <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                <Typography variant="subtitle2" gutterBottom sx={{ 
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
            {amenities.length > 0 && (
              <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                <Typography variant="subtitle2" gutterBottom sx={{ 
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
                      size="small"
                      sx={{ 
                        borderRadius: 1.5,
                        bgcolor: theme.palette.mode === 'dark' 
                          ? alpha('#ff8a65', 0.15) 
                          : alpha('#ff5722', 0.08),
                        color: theme.palette.mode === 'dark' 
                          ? '#ff8a65' 
                          : '#d84315',
                        fontWeight: '500',
                        fontSize: '0.7rem',
                        height: '22px',
                        border: theme.palette.mode === 'dark' 
                          ? '1px solid rgba(255, 138, 101, 0.3)' 
                          : '1px solid rgba(255, 87, 34, 0.2)',
                        '&:hover': { 
                          bgcolor: theme.palette.mode === 'dark' 
                            ? alpha('#ff8a65', 0.25) 
                            : alpha('#ff5722', 0.15),
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
          </Box>
        </Box>
      )}
    </Box>
  );

  const renderGalleryTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Photo Gallery
      </Typography>
      {gallery.length > 0 ? (
        <GalleryGrid>
          {gallery.map((image, index) => {
            const imageUrl = typeof image === 'string' ? image : image.url;
            const imageAlt = typeof image === 'string' ? `${name} conversion ${index + 1}` : image.alt || `${name} conversion ${index + 1}`;
            
            return (
              <GalleryImage
                key={index}
                src={imageUrl}
                alt={imageAlt}
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
            py: 4,
            color: theme.palette.text.secondary 
          }}
        >
          <Typography variant="body1">
            No photos available for this builder yet.
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Modal
      open={open}
      onClose={handleClose}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Fade in={open}>
        <ModalContent>
          {/* Header */}
          <ModalHeader>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 600 }}>
              {name}
            </Typography>
            <IconButton
              onClick={onClose}
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
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    padding: '8px 16px',
                    minHeight: '40px',
                    '&:hover': {
                      borderColor: theme.palette.primary.dark,
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
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
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    padding: '8px 16px',
                    minHeight: '40px',
                    '&:hover': {
                      borderColor: theme.palette.primary.dark,
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
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
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    padding: '8px 16px',
                    minHeight: '40px',
                    '&:hover': {
                      borderColor: theme.palette.primary.dark,
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
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
                        '&:hover': { 
                          bgcolor: alpha('#FF0000', 0.1),
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
                        '&:hover': { 
                          bgcolor: alpha('#E4405F', 0.1),
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
                        '&:hover': { 
                          bgcolor: alpha('#1877F2', 0.1),
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      <FacebookIcon />
                    </IconButton>
                  )}
                  {socialMedia.tiktok && (
                    <IconButton
                      onClick={() => window.open(socialMedia.tiktok, '_blank')}
                      sx={{ 
                        color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                        '&:hover': { 
                          bgcolor: alpha('#000000', 0.1),
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      <TikTokIcon />
                    </IconButton>
                  )}
                </>
              )}
            </SocialMediaContainer>
          </ModalFooter>
        </ModalContent>
      </Fade>
    </Modal>
  );
};

export default BuilderModal;
