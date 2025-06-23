import React, { useEffect, useRef } from 'react';
import { Builder } from '../services/googleSheetsService';

interface CustomGoogleMapProps {
  builders: Builder[];
  center: { lat: number; lng: number };
  zoom?: number;
  onMarkerClick: (builder: Builder) => void;
  isLoaded?: boolean;
}

const CustomGoogleMap: React.FC<CustomGoogleMapProps> = ({
  builders,
  center,
  zoom,
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

      // Add offset for overlapping markers - use different pattern for better spread
      const offsetLat = builder.location.lat + (index * 0.008) * Math.cos(index * Math.PI / 3);
      const offsetLng = builder.location.lng + (index * 0.008) * Math.sin(index * Math.PI / 3);

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

    // Always fit bounds to show all markers optimally when there are multiple builders
    if (builders.length > 0 && mapInstanceRef.current) {
      if (builders.length === 1) {
        // For single builder, center on it with a good zoom level
        const builder = builders[0];
        if (builder.location?.lat && builder.location?.lng) {
          const offsetLat = builder.location.lat + (0 * 0.005);
          const offsetLng = builder.location.lng + (0 * 0.005);
          mapInstanceRef.current.setCenter({ lat: offsetLat, lng: offsetLng });
          mapInstanceRef.current.setZoom(12);
        }
      } else {
        // For multiple builders, use fitBounds with smart zoom limits
        const bounds = new google.maps.LatLngBounds();
        
                 builders.forEach((builder, index) => {
           if (!builder.location?.lat || !builder.location?.lng) return;
           // Use the same offset as markers
           const offsetLat = builder.location.lat + (index * 0.008) * Math.cos(index * Math.PI / 3);
           const offsetLng = builder.location.lng + (index * 0.008) * Math.sin(index * Math.PI / 3);
           bounds.extend({ lat: offsetLat, lng: offsetLng });
         });
        
        // Calculate initial geographic spread for padding adjustment
        const lats = builders.map(b => b.location?.lat).filter(lat => lat !== undefined) as number[];
        const lngs = builders.map(b => b.location?.lng).filter(lng => lng !== undefined) as number[];
        const latSpread = Math.max(...lats) - Math.min(...lats);
        const lngSpread = Math.max(...lngs) - Math.min(...lngs);
        const maxSpread = Math.max(latSpread, lngSpread);
        
        // Adjust padding based on geographic spread - more padding for small spreads
        let padding = { top: 80, right: 80, bottom: 80, left: 80 };
        if (maxSpread < 0.2) {
          // Small spread (like Alaska) - use larger padding to show more context
          padding = { top: 120, right: 120, bottom: 120, left: 120 };
        } else if (maxSpread < 0.5) {
          // Medium-small spread - moderate padding
          padding = { top: 100, right: 100, bottom: 100, left: 100 };
        }
        
        mapInstanceRef.current.fitBounds(bounds, padding);
        
        // Apply zoom limits after a short delay
        setTimeout(() => {
          if (mapInstanceRef.current) {
            const currentZoom = mapInstanceRef.current.getZoom();
            
            // Set zoom limits based on geographic spread
            let minZoom = 6;  // Allow wide zoom for large spreads
            let maxZoom = 16; // Maximum zoom for close-up view
            
            if (maxSpread > 2.5) {
              // Large spread (like Arizona with Flagstaff ~3°) - force wide zoom
              minZoom = 5;
              maxZoom = 8;
            } else if (maxSpread > 1.5) {
              // Medium-large spread - moderate zoom
              minZoom = 7;
              maxZoom = 10;
            } else if (maxSpread > 0.8) {
              // Medium spread - closer zoom
              minZoom = 9;
              maxZoom = 12;
            } else if (maxSpread > 0.3) {
              // Small spread - closer zoom
              minZoom = 11;
              maxZoom = 14;
            } else if (maxSpread > 0.05) {
              // Very close builders (like Alaska) - moderate zoom to show city context
              minZoom = 10;
              maxZoom = 13;
            } else {
              // Extremely close builders - still show some context
              minZoom = 11;
              maxZoom = 14;
            }
            
            console.log(`🗺️ Geographic spread: ${maxSpread.toFixed(2)}°, zoom limits: ${minZoom}-${maxZoom}, current: ${currentZoom}`);
            
            if (currentZoom) {
              if (currentZoom < minZoom) {
                mapInstanceRef.current!.setZoom(minZoom);
              } else if (currentZoom > maxZoom) {
                mapInstanceRef.current!.setZoom(maxZoom);
              }
            }
          }
        }, 200);
      }
    }
  }, [builders, onMarkerClick, center, isLoaded]);

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
