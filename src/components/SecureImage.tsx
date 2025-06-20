import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { isValidExternalUrl } from '../utils/apiUtils';

interface SecureImageProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * A secure image component that validates URLs, handles errors, and provides fallbacks
 */
const SecureImage: React.FC<SecureImageProps> = ({
  src,
  alt,
  fallbackSrc = '/images/image-placeholder.jpg',
  width,
  height,
  style,
  className
}) => {
  const [error, setError] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);
  
  // Validate the image URL
  const validatedSrc = isValidExternalUrl(src) ? src : fallbackSrc;
  
  const handleError = () => {
    console.error(`Failed to load image: ${src}`);
    setError(true);
  };
  
  const handleLoad = () => {
    setLoaded(true);
  };
  
  return (
    <Box position="relative" width={width} height={height} className={className}>
      {!loaded && !error && (
        <Box 
          position="absolute" 
          top={0} 
          left={0} 
          width="100%" 
          height="100%" 
          display="flex" 
          alignItems="center" 
          justifyContent="center"
          bgcolor="background.paper"
          borderRadius={1}
        >
          <Typography variant="caption" color="text.secondary">
            Loading...
          </Typography>
        </Box>
      )}
      
      {error ? (
        <Box 
          display="flex" 
          alignItems="center" 
          justifyContent="center" 
          width="100%" 
          height="100%" 
          bgcolor="background.paper"
          borderRadius={1}
          border="1px solid"
          borderColor="divider"
        >
          <Typography variant="body2" color="text.secondary">
            Image not available
          </Typography>
        </Box>
      ) : (
        <img
          src={validatedSrc}
          alt={alt}
          onError={handleError}
          onLoad={handleLoad}
          style={{
            display: loaded ? 'block' : 'none',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            ...style
          }}
        />
      )}
    </Box>
  );
};

export default SecureImage;
