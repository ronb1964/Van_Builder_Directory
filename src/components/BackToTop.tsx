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
          color="primary"
          size="medium"
          aria-label="scroll back to top"
          sx={{
            boxShadow: 3,
            '&:hover': {
              transform: 'scale(1.05)',
            },
            transition: 'transform 0.2s ease-in-out',
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Box>
    </Zoom>
  );
};

export default BackToTop;
