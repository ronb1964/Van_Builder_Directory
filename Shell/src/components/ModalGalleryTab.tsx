import React from 'react';
import {
  Box,
  Typography,
  styled,
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';

const GalleryImage = styled('img')(({ theme }) => ({
  width: '100%',
  height: 150,
  objectFit: 'cover',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

interface ModalGalleryTabProps {
  gallery: (string | { url: string; alt?: string; caption?: string })[];
  builderName: string;
  onImageClick: (index: number) => void;
}

const ModalGalleryTab: React.FC<ModalGalleryTabProps> = ({
  gallery,
  builderName,
  onImageClick
}) => {
  const formatBuilderName = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Filter out empty or invalid images
  const galleryArray = (gallery || []) as (string | { url: string; alt?: string; caption?: string })[];
  const validImages = galleryArray.filter((image: string | { url: string; alt?: string; caption?: string }) => {
    const imageUrl = typeof image === 'string' ? image : image.url;
    return imageUrl && imageUrl.trim() !== '';
  });

  return (
    <Box sx={{ minHeight: '400px' }}>
      <Typography variant="h6" gutterBottom sx={{ 
        fontSize: '1.125rem', 
        fontWeight: 'bold', 
        color: '#5b9bd5',
        mb: 2
      }}>
        Photo Gallery
      </Typography>
      
      {validImages.length > 0 ? (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
          gap: 1.5,
          maxHeight: '45vh',
          overflowY: 'auto',
          pr: 1,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#5b9bd5',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#4a8bc2',
            },
          },
        }}>
          {validImages.map((image, index) => {
            const imageUrl = typeof image === 'string' ? image : image.url;
            const imageAlt = typeof image === 'string' 
              ? `${formatBuilderName(builderName)} photo ${index + 1}` 
              : image.alt || `${formatBuilderName(builderName)} photo ${index + 1}`;

            return (
              <GalleryImage
                key={index}
                src={imageUrl}
                alt={imageAlt}
                onClick={() => onImageClick(index)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            );
          })}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px',
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper',
            color: 'text.secondary',
            textAlign: 'center',
            p: 4
          }}
        >
          <PhotoCameraIcon 
            sx={{ 
              fontSize: 64, 
              mb: 2, 
              opacity: 0.5 
            }} 
          />
          <Typography variant="h6" gutterBottom>
            No Photos Available
          </Typography>
          <Typography variant="body2">
            Check back later for gallery updates
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ModalGalleryTab;
