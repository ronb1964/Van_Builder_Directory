import React, { useState, useEffect } from 'react';
import { Fab, Zoom, useScrollTrigger, Box } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

interface BackToTopProps {
  threshold?: number;
}

const BackToTop: React.FC<BackToTopProps> = ({ threshold = 100 }) => {
  const [showButton, setShowButton] = useState(false);
  
  // Use MUI's useScrollTrigger for better performance
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: threshold,
  });

  useEffect(() => {
    setShowButton(trigger);
  }, [trigger]);

  const handleClick = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <Zoom in={showButton}>
      <Box
        onClick={handleClick}
        role="presentation"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <Fab
          size="medium"
          aria-label="scroll back to top"
          sx={{
            backgroundColor: '#ff4444', // Bright red background
            color: 'white',
            boxShadow: '0 4px 16px rgba(255, 68, 68, 0.4)', // Red shadow for visibility
            border: '2px solid white', // White border for extra contrast
            '&:hover': {
              backgroundColor: '#ff2222', // Darker red on hover
              transform: 'scale(1.1)',
              boxShadow: '0 6px 20px rgba(255, 68, 68, 0.6)', // Stronger shadow on hover
            },
            transition: 'all 0.3s ease-in-out',
          }}
        >
          <KeyboardArrowUpIcon sx={{ fontSize: '1.5rem', fontWeight: 'bold' }} />
        </Fab>
      </Box>
    </Zoom>
  );
};

export default BackToTop;
