import React from 'react';
import {
  Modal,
  Box,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  ArrowBackIos as ArrowBackIcon,
  ArrowForwardIos as ArrowForwardIcon,
} from '@mui/icons-material';

interface PhotoLightboxProps {
  open: boolean;
  onClose: () => void;
  gallery: (string | { url: string; alt?: string; caption?: string })[];
  currentImageIndex: number;
  onNext: (validImages: any[]) => void;
  onPrev: (validImages: any[]) => void;
  builderName: string;
}

const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  open,
  onClose,
  gallery,
  currentImageIndex,
  onNext,
  onPrev,
  builderName
}) => {
  const formatBuilderName = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
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
            ? `${formatBuilderName(builderName)} photo ${safeIndex + 1}` 
            : (currentImage as { url: string; alt?: string; caption?: string }).alt || `${formatBuilderName(builderName)} photo ${safeIndex + 1}`;

          return (
            <>
              {/* Close Button */}
              <IconButton
                onClick={onClose}
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
                  onClick={() => onPrev(validImages)}
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
                  onClick={() => onNext(validImages)}
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
  );
};

export default PhotoLightbox;
