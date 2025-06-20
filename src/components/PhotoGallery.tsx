import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Box,
  ImageList,
  ImageListItem,
  Dialog,
  DialogContent,
  IconButton,
  useTheme,
  useMediaQuery,
  Typography
} from '@mui/material';
import { Close, ArrowBack, ArrowForward } from '@mui/icons-material';

interface PhotoGalleryProps {
  photos: string[];
  builderName: string;
  maxPhotos?: number;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ 
  photos, 
  builderName, 
  maxPhotos = 8 
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handlePhotoClick = (index: number) => {
    handleOpenDialog(index);
  };

  const handleOpenDialog = (index: number) => {
    console.log('🎯 PhotoGallery: Opening dialog with new arrow positioning');
    setSelectedPhoto(index);
  };

  const handleCloseDialog = () => {
    setSelectedPhoto(null);
  };

  const handlePrevPhoto = () => {
    if (selectedPhoto !== null) {
      setSelectedPhoto(selectedPhoto > 0 ? selectedPhoto - 1 : photos.length - 1);
    }
  };

  const handleNextPhoto = () => {
    if (selectedPhoto !== null) {
      setSelectedPhoto(selectedPhoto < photos.length - 1 ? selectedPhoto + 1 : 0);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (selectedPhoto === null) return;
      
      switch (event.key) {
        case 'Escape':
          handleCloseDialog();
          break;
        case 'ArrowLeft':
          handlePrevPhoto();
          break;
        case 'ArrowRight':
          handleNextPhoto();
          break;
      }
    };

    if (selectedPhoto !== null) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [selectedPhoto, photos.length]);

  // Early return after all hooks
  if (!photos || photos.length === 0) {
    return null;
  }

  const displayPhotos = photos.slice(0, maxPhotos);
  const hasMorePhotos = photos.length > maxPhotos;

  return (
    <React.Fragment>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Gallery
        </Typography>
        <ImageList 
          cols={isMobile ? 2 : 3} 
          gap={8}
          rowHeight={isMobile ? 140 : 180}
          sx={{ 
            height: isMobile ? 300 : 400,
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: theme.palette.grey[200],
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.grey[400],
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: theme.palette.grey[500],
              },
            },
          }}
        >
          {displayPhotos.map((photo, index) => (
            <ImageListItem 
              key={index}
              sx={{ 
                cursor: 'pointer',
                position: 'relative',
                '&:hover': {
                  opacity: 0.8,
                  transform: 'scale(1.02)',
                  transition: 'all 0.2s ease'
                }
              }}
              onClick={() => handlePhotoClick(index)}
            >
              <img
                src={photo}
                alt={`${builderName} van ${index + 1}`}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 4
                }}
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.src = `data:image/svg+xml;base64,${btoa(`
                    <svg width="150" height="100" xmlns="http://www.w3.org/2000/svg">
                      <rect width="100%" height="100%" fill="${theme.palette.grey[300]}"/>
                      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="12" 
                            fill="${theme.palette.grey[600]}" text-anchor="middle" dy=".3em">Photo ${index + 1}</text>
                    </svg>
                  `)}`;
                }}
              />
              {hasMorePhotos && index === maxPhotos - 1 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1
                  }}
                >
                  <Typography variant="h6" color="white" fontWeight="bold">
                    +{photos.length - maxPhotos + 1}
                  </Typography>
                </Box>
              )}
            </ImageListItem>
          ))}
        </ImageList>
      </Box>

      {/* Full-screen photo dialog */}
      <Dialog
        open={selectedPhoto !== null}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            margin: isMobile ? 1 : 2,
            height: '90vh'
          }
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative', height: '100%' }}>
          {/* Close button */}
          <IconButton
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 3,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)'
              }
            }}
          >
            <Close />
          </IconButton>

          {/* Image container */}
          {selectedPhoto !== null && (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src={photos[selectedPhoto]}
                alt={`${builderName} van ${selectedPhoto + 1}`}
                style={{
                  maxWidth: '90%',
                  maxHeight: '90%',
                  objectFit: 'contain'
                }}
              />
            </Box>
          )}

          {/* Photo counter */}
          {selectedPhoto !== null && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                px: 2,
                py: 1,
                borderRadius: 1
              }}
            >
              <Typography variant="body2">
                {selectedPhoto + 1} of {photos.length}
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Arrows rendered outside the dialog using React Portal */}
      {selectedPhoto !== null && photos.length > 1 && createPortal(
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 9999
        }}>
          <button
            onClick={handlePrevPhoto}
            style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              marginTop: '-24px',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ←
          </button>
          <button
            onClick={handleNextPhoto}
            style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              marginTop: '-24px',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            →
          </button>
        </div>,
        document.body
      )}
    </React.Fragment>
  );
};

export default PhotoGallery;
