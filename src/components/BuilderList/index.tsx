import React from 'react';
import { Card, CardContent, Typography, CardActionArea, Box } from '@mui/material';
import { Builder } from '../../types';

interface BuilderListProps {
  builders: Builder[];
  selectedBuilder: Builder | null;
  onSelectBuilder: (builder: Builder) => void;
}

const BuilderList: React.FC<BuilderListProps> = ({ builders, selectedBuilder, onSelectBuilder }) => {
  if (builders.length === 0) {
    return (
      <Box mt={4} textAlign="center">
        <Typography variant="h6">No builders found in this state.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
      {builders.map((builder) => (
        <Card 
          key={builder.id}
          elevation={selectedBuilder?.id === builder.id ? 3 : 1}
          sx={{
            borderLeft: selectedBuilder?.id === builder.id ? `4px solid #1976d2` : 'none',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <CardActionArea 
            onClick={() => onSelectBuilder(builder)}
            sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
          >
            <CardContent sx={{ width: '100%' }}>
              <Typography variant="h6" component="div" gutterBottom>
                {builder.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {builder.description}
              </Typography>
              <Box mt={1}>
                <Typography variant="body2" color="text.secondary">
                  📍 {builder.address}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  📞 {builder.phone}
                </Typography>
                <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                  {builder.website}
                </Typography>
              </Box>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}
    </Box>
  );
};

export default BuilderList;
