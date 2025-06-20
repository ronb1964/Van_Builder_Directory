import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { Builder } from '../services/googleSheetsService';
import { getGoogleMapsApiKey } from '../utils/apiUtils';

interface SimpleMapViewProps {
  builders: Builder[];
  selectedState?: string;
}

const SimpleMapView: React.FC<SimpleMapViewProps> = ({ builders, selectedState }) => {
  // Get the center point for the map
  const getMapCenter = () => {
    if (builders.length === 0) {
      return { lat: 39.8283, lng: -98.5795 }; // Center of US
    }
    
    const validBuilders = builders.filter(b => 
      b.location?.lat && b.location?.lng && 
      !isNaN(b.location.lat) && !isNaN(b.location.lng)
    );
    
    if (validBuilders.length === 0) {
      return { lat: 39.8283, lng: -98.5795 };
    }
    
    const avgLat = validBuilders.reduce((sum, b) => sum + b.location.lat, 0) / validBuilders.length;
    const avgLng = validBuilders.reduce((sum, b) => sum + b.location.lng, 0) / validBuilders.length;
    
    return { lat: avgLat, lng: avgLng };
  };

  const center = getMapCenter();
  const zoom = selectedState ? 8 : 6;
  
  // Create markers parameter for Google Maps Embed API
  const markersParam = builders
    .filter(b => b.location?.lat && b.location?.lng)
    .map((builder, index) => {
      // Add small offset for overlapping markers
      const offsetLat = builder.location.lat + (index * 0.005);
      const offsetLng = builder.location.lng + (index * 0.005);
      return `${offsetLat},${offsetLng}`;
    })
    .join('|');

  // Google Maps Embed API URL
  const apiKey = getGoogleMapsApiKey();
  const mapUrl = `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${center.lat},${center.lng}&zoom=${zoom}&maptype=roadmap`;

  return (
    <Box sx={{ height: '600px', position: 'relative' }}>
      {/* Google Maps Embed */}
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0, borderRadius: '8px' }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={mapUrl}
        title={`Map showing ${builders.length} builders${selectedState ? ` in ${selectedState}` : ''}`}
      />
      
      {/* Builder locations overlay */}
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          p: 2,
          maxWidth: 300,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(5px)'
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          📍 {builders.length} Builder{builders.length !== 1 ? 's' : ''} Found
          {selectedState && ` in ${selectedState}`}
        </Typography>
        
        <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
          {builders.map((builder, index) => (
            <Box key={builder.id} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={index + 1} 
                size="small" 
                color="primary" 
                sx={{ minWidth: 24, height: 20, fontSize: '0.7rem' }}
              />
              <Box>
                <Typography variant="body2" fontWeight="medium" sx={{ lineHeight: 1.2 }}>
                  {builder.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                  {builder.location.city}, {builder.location.state}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          💡 Markers are slightly offset to prevent overlap
        </Typography>
      </Paper>
    </Box>
  );
};

export default SimpleMapView;
