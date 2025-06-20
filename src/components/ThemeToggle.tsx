import React from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

interface ThemeToggleProps {
  toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ toggleTheme }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Tooltip title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}>
      <IconButton
        onClick={toggleTheme}
        color="inherit"
        aria-label="toggle theme"
        sx={{
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'rotate(30deg)',
          },
        }}
      >
        {isDarkMode ? 
          <LightModeIcon sx={{ display: 'block' }} /> : 
          <DarkModeIcon sx={{ display: 'block' }} />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
