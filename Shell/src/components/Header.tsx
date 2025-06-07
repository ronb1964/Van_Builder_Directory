import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box 
} from '@mui/material';
import { 
  DarkMode, 
  LightMode 
} from '@mui/icons-material';

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  onNavigateHome?: () => void;
}

const DarkModeToggle = styled(IconButton)`
  color: inherit;
  transition: transform 0.5s ease;
  
  &:hover {
    transform: scale(1.1);
  }
  
  .icon-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    animation: verticalFlip 5s linear infinite;
    transform-style: preserve-3d;
  }
  
  .theme-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transition: opacity 0.8s ease;
  }
  
  .sun-icon {
    opacity: var(--sun-opacity, 1);
  }
  
  .moon-icon {
    opacity: var(--moon-opacity, 0);
  }
  
  &.rotating .icon-container {
    animation: verticalFlip 5s linear infinite, quickSpin 0.6s ease;
  }
  
  @keyframes verticalFlip {
    0% { 
      transform: rotateY(0deg); 
      --sun-opacity: 1;
      --moon-opacity: 0;
    }
    12.5% { 
      --sun-opacity: 1;
      --moon-opacity: 0;
    }
    25% { 
      transform: rotateY(90deg); 
      --sun-opacity: 0;
      --moon-opacity: 1;
    }
    37.5% { 
      --sun-opacity: 0;
      --moon-opacity: 1;
    }
    50% { 
      transform: rotateY(180deg); 
      --sun-opacity: 0;
      --moon-opacity: 1;
    }
    62.5% { 
      --sun-opacity: 0;
      --moon-opacity: 1;
    }
    75% { 
      transform: rotateY(270deg); 
      --sun-opacity: 1;
      --moon-opacity: 0;
    }
    87.5% { 
      --sun-opacity: 1;
      --moon-opacity: 0;
    }
    100% { 
      transform: rotateY(360deg); 
      --sun-opacity: 1;
      --moon-opacity: 0;
    }
  }
  
  @keyframes quickSpin {
    0% { transform: rotateY(0deg) rotateZ(0deg); }
    100% { transform: rotateY(0deg) rotateZ(180deg); }
  }
`;

const LogoContainer = styled(Box)`
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 0.8;
  }
`;

const Header: React.FC<HeaderProps> = ({ darkMode, toggleDarkMode, onNavigateHome }) => {
  const [isRotating, setIsRotating] = useState(false);

  const handleToggleDarkMode = () => {
    setIsRotating(true);
    toggleDarkMode();
    setTimeout(() => {
      setIsRotating(false);
    }, 600);
  };

  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Toolbar>
        <LogoContainer sx={{ mr: 2 }} onClick={onNavigateHome}>
          <img 
            src="./images/camper-van-original.jpg" 
            alt="Camper Van" 
            style={{ 
              height: 40, 
              marginRight: 10,
              borderRadius: 8,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }} 
          />
          <Typography variant="h6" component="div" sx={{ cursor: 'pointer' }}>
            Camper Van Builders
          </Typography>
        </LogoContainer>
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box 
            onClick={handleToggleDarkMode}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 1,
              transition: 'background-color 0.2s ease',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            <Typography variant="body2" sx={{ fontSize: '0.875rem', opacity: 0.8 }}>
              {darkMode ? 'Dark' : 'Light'} Mode
            </Typography>
            <DarkModeToggle className={isRotating ? 'rotating' : ''}>
              <div className="icon-container">
                <LightMode className="theme-icon sun-icon" />
                <DarkMode className="theme-icon moon-icon" />
              </div>
            </DarkModeToggle>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
