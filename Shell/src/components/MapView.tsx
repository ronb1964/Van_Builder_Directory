import React, { useState, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { Builder } from '../types/builder';

interface MapViewProps {
  builders: Builder[];
  searchedZip?: string;
  searchedZipCoords?: { lat: number; lng: number };
  selectedBuilder: Builder | null;
  onBuilderSelect?: (builder: Builder | null) => void;
  onViewDetails?: (builder: Builder) => void;
}

const MapView: React.FC<MapViewProps> = ({
  builders,
  searchedZip,
  searchedZipCoords,
  selectedBuilder,
  onBuilderSelect,
  onViewDetails
}) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
  });

  // State to track map center and zoom independently
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(6);
  const [showInfoWindow, setShowInfoWindow] = useState<boolean>(false);

  // Debug logging
  console.log('MapView - selectedBuilder:', selectedBuilder);
  console.log('MapView - selectedBuilder.location:', selectedBuilder?.location);
  console.log('MapView - builders:', builders);
  console.log('MapView - builders with valid coordinates:', builders.filter(b => b.location?.lat && b.location?.lng));

  // Filter builders with valid coordinates
  const validBuilders = builders.filter(builder => 
    builder.location && 
    builder.location.lat && 
    builder.location.lng && 
    builder.location.lat !== 0 && 
    builder.location.lng !== 0
  );
  
  console.log('MapView - validBuilders count:', validBuilders.length);

  // Effect to handle selected builder changes
  useEffect(() => {
    if (selectedBuilder && selectedBuilder.location) {
      // Zoom to selected builder
      setMapCenter({ lat: selectedBuilder.location.lat, lng: selectedBuilder.location.lng });
      setMapZoom(12);
      setShowInfoWindow(true);
    } else {
      setShowInfoWindow(false);
    }
  }, [selectedBuilder]);

  if (!isLoaded) return <div>Loading map...</div>;

  // Calculate initial map center and zoom based on builders and searched location
  const getInitialMapCenter = () => {
    if (mapCenter) {
      return mapCenter;
    }
    
    if (searchedZipCoords) {
      return searchedZipCoords;
    }
    
    if (validBuilders.length === 0) {
      return { lat: 39.8283, lng: -98.5795 }; // Center of USA
    }
    
    // Calculate center of all valid builders
    const avgLat = validBuilders.reduce((sum, builder) => sum + (builder.location.lat || 0), 0) / validBuilders.length;
    const avgLng = validBuilders.reduce((sum, builder) => sum + (builder.location.lng || 0), 0) / validBuilders.length;
    
    return { lat: avgLat, lng: avgLng };
  };

  const getInitialMapZoom = () => {
    if (mapCenter) {
      return mapZoom;
    }
    
    if (validBuilders.length === 0) return 6;
    if (validBuilders.length === 1) return 10;
    
    // Check if we have Alaska builders (special case for US map)
    const hasAlaska = validBuilders.some(b => 
      b.location.state === 'Alaska' || 
      (b.location.lat > 60 && b.location.lng < -140)
    );
    
    // If Alaska is included, use a much wider zoom to show entire North America
    if (hasAlaska) {
      return 3; // Very wide zoom to include Alaska and lower 48
    }
    
    // Calculate bounds to determine appropriate zoom level
    const lats = validBuilders.map(b => b.location.lat);
    const lngs = validBuilders.map(b => b.location.lng);
    const latRange = Math.max(...lats) - Math.min(...lats);
    const lngRange = Math.max(...lngs) - Math.min(...lngs);
    const maxRange = Math.max(latRange, lngRange);
    
    // Adjust zoom based on coordinate range
    if (maxRange > 20) return 4;  // Very spread out (multiple states)
    if (maxRange > 10) return 5;  // Spread across large state
    if (maxRange > 5) return 6;   // Across state
    if (maxRange > 2) return 7;   // Large region
    if (maxRange > 1) return 8;   // Medium region
    if (maxRange > 0.5) return 9; // Small region
    return 10; // Very close together
  };

  const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '8px'
  };

  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
  };

  const handleMarkerClick = (builder: Builder) => {
    onBuilderSelect?.(builder);
  };

  const handleInfoWindowClose = () => {
    // Don't clear the selected builder, just hide the InfoWindow
    setShowInfoWindow(false);
  };

  return (
    <div style={{ width: '100%', height: '400px', borderRadius: '8px', overflow: 'hidden' }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={getInitialMapCenter()}
        zoom={getInitialMapZoom()}
        options={mapOptions}
      >
        {/* Searched zip code marker */}
        {searchedZipCoords && (
          <Marker
            position={searchedZipCoords}
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="8" fill="#007bff" stroke="white" stroke-width="2"/>
                  <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">📍</text>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(24, 24),
            }}
            title={`Your location: ${searchedZip}`}
          />
        )}

        {/* Builder markers with clustering for stacked locations */}
        {validBuilders.map((builder, index) => {
          const lat = builder.location?.lat;
          const lng = builder.location?.lng;
          
          // Skip builders without valid coordinates
          if (!lat || !lng || lat === 0 || lng === 0) {
            console.warn('Skipping builder with invalid coordinates:', builder.name, { lat, lng });
            return null;
          }
          
          // Add small offset for stacked markers (same city)
          const stackedBuilders = validBuilders.filter(b => 
            Math.abs(b.location.lat - lat) < 0.01 && 
            Math.abs(b.location.lng - lng) < 0.01
          );
          
          let adjustedLat = lat;
          let adjustedLng = lng;
          
          // If multiple builders in same location, offset them slightly
          if (stackedBuilders.length > 1) {
            const builderIndex = stackedBuilders.findIndex(b => b.id === builder.id);
            const offsetDistance = 0.003; // Small offset in degrees
            const angle = (builderIndex * 360 / stackedBuilders.length) * (Math.PI / 180);
            adjustedLat = lat + (Math.cos(angle) * offsetDistance);
            adjustedLng = lng + (Math.sin(angle) * offsetDistance);
          }
          
          return (
            <Marker
              key={builder.id}
              position={{ lat: adjustedLat, lng: adjustedLng }}
              onClick={() => handleMarkerClick(builder)}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#dc3545" stroke="white" stroke-width="1"/>
                    <circle cx="12" cy="9" r="2.5" fill="white"/>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(32, 32),
              }}
              title={builder.name}
            />
          );
        })}
        
        {/* Info window for selected builder */}
        {selectedBuilder && showInfoWindow && (
          <InfoWindow
            position={{ lat: selectedBuilder.location.lat, lng: selectedBuilder.location.lng }}
            onCloseClick={handleInfoWindowClose}
          >
            <div style={{ 
              padding: '1px 8px 8px 8px', 
              maxWidth: '220px', 
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
              lineHeight: '1.3'
            }}>
              <h3 style={{ 
                fontSize: '0.95rem', 
                fontWeight: '600', 
                margin: '0 0 6px 0',
                color: '#1a1a1a',
                lineHeight: '1.2'
              }}>
                {selectedBuilder.name || 'Unknown Builder'}
              </h3>
              
              <p style={{ 
                fontSize: '0.8rem', 
                margin: '0 0 6px 0', 
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ fontSize: '0.85rem' }}>📍</span>
                {selectedBuilder.location?.city || 'Unknown'}, {selectedBuilder.location?.state || 'Unknown'}
              </p>

              {selectedBuilder.distanceFromZip && (
                <div style={{ marginBottom: '6px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 8px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: '500'
                  }}>
                    {selectedBuilder.distanceFromZip.miles} mi away
                  </span>
                </div>
              )}

              <p style={{ 
                fontSize: '0.75rem', 
                margin: '0 0 8px 0', 
                lineHeight: '1.3',
                color: '#555'
              }}>
                {selectedBuilder.description ? 
                  (selectedBuilder.description.length > 90 ? 
                    selectedBuilder.description.substring(0, 90) + '...' : 
                    selectedBuilder.description
                  ) : 
                  'No description available'
                }
              </p>

              <button
                onClick={() => onViewDetails?.(selectedBuilder)}
                style={{
                  backgroundColor: '#5b9bd5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 10px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
                onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#4a8bc2'}
                onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#5b9bd5'}
              >
                View Details
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default MapView;
