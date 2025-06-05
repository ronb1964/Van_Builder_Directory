import React from 'react';
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
        <DarkModeToggle onClick={toggleDarkMode}>
          {darkMode ? <LightMode /> : <DarkMode />}
        </DarkModeToggle>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
