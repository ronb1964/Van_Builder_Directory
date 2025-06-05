import React from 'react';
import { 
  Paper, 
  Typography, 
  Box 
} from '@mui/material';

interface WelcomeSectionProps {
  builderCount: number;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ builderCount }) => {
  return (
    <Paper 
      elevation={3}
      sx={{
        p: 4,
        background: 'linear-gradient(135deg, #2c3e50 0%, #3f51b5 100%)',
        borderRadius: 2,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
        }
      }}
    >
      <Typography 
        variant="h4" 
        component="h2" 
        sx={{ 
          mb: 2, 
          fontWeight: 700,
          color: 'white',
          position: 'relative',
          zIndex: 1
        }}
      >
        Welcome to the Camper Van Builders Directory
      </Typography>
      <Typography 
        variant="body1" 
        sx={{ 
          mb: 3,
          color: 'rgba(255, 255, 255, 0.9)',
          maxWidth: '800px',
          mx: 'auto',
          fontSize: '1.1rem',
          lineHeight: 1.6,
          position: 'relative',
          zIndex: 1
        }}
      >
        We're here to help you find the perfect partner for your van conversion journey. 
        Whether you're dreaming of weekend adventures or full-time van life, our directory 
        connects you with experienced builders who can bring your vision to life.
      </Typography>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center',
        gap: 3,
        flexWrap: 'wrap',
        mt: 4,
        position: 'relative',
        zIndex: 1
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" sx={{ color: '#64b5f6', fontWeight: 'bold' }}>
            {builderCount}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Builders Listed
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" sx={{ color: '#64b5f6', fontWeight: 'bold' }}>
            50
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            States Covered
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" sx={{ color: '#64b5f6', fontWeight: 'bold' }}>
            100%
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Free to Use
          </Typography>
        </Box>
      </Box>
      <Typography 
        variant="body2" 
        sx={{ 
          mt: 4,
          color: 'rgba(255, 255, 255, 0.8)',
          fontStyle: 'italic'
        }}
      >
        🚐 Start your journey today - Select a state, zip code, or builder name above to explore builders in your area
      </Typography>
    </Paper>
  );
};

export default WelcomeSection;
