import React, { useState } from 'react';
import {
  Modal,
  Fade,
  Box,
  Typography,
  Tabs,
  Tab,
  IconButton,
  styled,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
} from '@mui/icons-material';
import PhotoLightbox from './PhotoLightbox';
import ModalOverviewTab from './ModalOverviewTab';
import ModalGalleryTab from './ModalGalleryTab';
import ModalContactSection from './ModalContactSection';
import { Builder } from '../types/builder';

interface BuilderModalProps {
  open: boolean;
  onClose: () => void;
  builder: Builder | null;
}

const ModalContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90vw',
  maxWidth: '800px',
  maxHeight: '90vh',
  backgroundColor: theme.palette.background.paper,
  borderRadius: 12,
  boxShadow: theme.shadows[24],
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}));

const ModalHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.5, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  minHeight: '70px',
}));

const ModalContent = styled(Box)(({ theme }) => ({
  flex: 1,
  overflow: 'auto',
  padding: theme.spacing(2.5, 3),
  backgroundColor: theme.palette.background.default,
}));

const BuilderModal: React.FC<BuilderModalProps> = ({ open, onClose, builder }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!builder) return null;

  const { name, location, address, phone, email, website, description, vanTypes, amenities, gallery, socialMedia } = builder;

  // Process location - Builder has Location object with city/state
  const locationString = location ? `${location.city}, ${location.state}` : undefined;
  
  // Process vanTypes - can be string, string[], or undefined
  const processedVanTypes: string[] = Array.isArray(vanTypes) 
    ? vanTypes 
    : typeof vanTypes === 'string' && vanTypes.trim()
      ? vanTypes.split(',').map((type: string) => type.trim()).filter((type: string) => type.length > 0)
      : [];

  // Process amenities - can be undefined
  const processedAmenities: string[] = amenities || [];

  const formatBuilderName = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleClose = (event?: {}, reason?: string) => {
    if (reason === 'backdropClick') {
      return;
    }
    setActiveTab(0);
    onClose();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
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
    setCurrentImageIndex((prev) => (prev + 1) % validImages.length);
  };

  const handleLightboxPrev = (validImages: any[]) => {
    setCurrentImageIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const handleContactClick = (type: string, value: string) => {
    switch (type) {
      case 'phone':
        window.open(`tel:${value}`, '_self');
        break;
      case 'email':
        window.open(`mailto:${value}`, '_self');
        break;
      case 'website':
        window.open(value.startsWith('http') ? value : `https://${value}`, '_blank');
        break;
      default:
        break;
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        closeAfterTransition
      >
        <Fade in={open}>
          <ModalContainer>
            <ModalHeader>
              <Typography 
                variant="h5" 
                component="h2" 
                sx={{ 
                  fontWeight: 'bold',
                  color: theme.palette.mode === 'dark' ? 'white' : '#2c3e50',
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                {formatBuilderName(name)}
              </Typography>
              <IconButton 
                onClick={handleClose}
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.text.secondary, 0.1)
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
            </ModalHeader>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                sx={{
                  '& .MuiTab-root': {
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    textTransform: 'none',
                    minHeight: '48px',
                    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                    '&.Mui-selected': {
                      color: '#5b9bd5',
                      fontWeight: 700
                    }
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#5b9bd5',
                    height: 3
                  }
                }}
              >
                <Tab label="Overview" />
                <Tab label="Gallery" />
              </Tabs>
            </Box>

            <ModalContent>
              {activeTab === 0 && (
                <ModalOverviewTab
                  location={locationString}
                  address={address}
                  description={description}
                  vanTypes={processedVanTypes}
                  amenities={processedAmenities}
                />
              )}
              {activeTab === 1 && (
                <ModalGalleryTab
                  gallery={gallery || []}
                  builderName={name}
                  onImageClick={handleImageClick}
                />
              )}
            </ModalContent>

            <ModalContactSection
              phone={phone}
              email={email}
              website={website}
              socialMedia={socialMedia}
              onContactClick={handleContactClick}
            />
          </ModalContainer>
        </Fade>
      </Modal>

      <PhotoLightbox
        open={lightboxOpen}
        onClose={handleLightboxClose}
        gallery={gallery || []}
        currentImageIndex={currentImageIndex}
        onNext={handleLightboxNext}
        onPrev={handleLightboxPrev}
        builderName={name}
      />
    </>
  );
};

export default BuilderModal;
