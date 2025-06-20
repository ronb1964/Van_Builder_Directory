import React, { useEffect, useRef } from 'react';
import { getGoogleMapsApiKey } from '../utils/apiUtils';
import { Builder } from '../services/googleSheetsService';

interface CustomGoogleMapProps {
  builders: Builder[];
  center: { lat: number; lng: number };
  zoom?: number;
  fitBounds?: boolean;
  onMarkerClick: (builder: Builder) => void;
  isLoaded?: boolean;
}

const CustomGoogleMap: React.FC<CustomGoogleMapProps> = ({
  builders,
  center,
  zoom,
  fitBounds,
  onMarkerClick,
  isLoaded
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      zoom: zoom || 8,
      center: center,
      mapTypeId: 'roadmap',
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_RIGHT,
      },
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_CENTER,
      },
      scaleControl: true,
      streetViewControl: true,
      streetViewControlOptions: {
        position: google.maps.ControlPosition.RIGHT_CENTER,
      },
      fullscreenControl: true,
      fullscreenControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT,
      },
    });
  }, [center, zoom, isLoaded]);

  // Create markers
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    if (builders.length === 0) return;

    builders.forEach((builder, index) => {
      if (!builder.location?.lat || !builder.location?.lng) return;

      // Add offset for overlapping markers
      const offsetLat = builder.location.lat + (index * 0.005);
      const offsetLng = builder.location.lng + (index * 0.005);

      const marker = new google.maps.Marker({
        position: { lat: offsetLat, lng: offsetLng },
        map: mapInstanceRef.current,
        title: `${builder.name} - ${builder.location.city}, ${builder.location.state}`,
        icon: {
          path: 'M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13C19,5.13 15.87,2 12,2z',
          fillColor: '#d32f2f',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 1.5,
          anchor: new google.maps.Point(12, 24)
        }
      });

      marker.addListener('click', () => {
        onMarkerClick(builder);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers if fitBounds is enabled
    if (fitBounds && builders.length > 0 && mapInstanceRef.current) {
      const bounds = new google.maps.LatLngBounds();
      
      builders.forEach((builder, index) => {
        if (!builder.location?.lat || !builder.location?.lng) return;
        // Use the same offset as markers
        const offsetLat = builder.location.lat + (index * 0.005);
        const offsetLng = builder.location.lng + (index * 0.005);
        bounds.extend({ lat: offsetLat, lng: offsetLng });
      });
      
      mapInstanceRef.current.fitBounds(bounds);
      
      // Limit zoom level for better overview
      setTimeout(() => {
        if (mapInstanceRef.current) {
          const currentZoom = mapInstanceRef.current.getZoom();
          if (currentZoom && currentZoom > 12) {
            mapInstanceRef.current.setZoom(12);
          }
        }
      }, 100);
    }
  }, [builders, onMarkerClick, center, fitBounds, isLoaded]);

  if (!isLoaded) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <div>Loading Google Maps...</div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        minHeight: '400px',
        borderRadius: '8px',
        overflow: 'hidden'
      }} 
    />
  );
};

export default CustomGoogleMap;
