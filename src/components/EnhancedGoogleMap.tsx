import React, { useEffect, useRef } from 'react';
import { Builder } from '../services/googleSheetsService';

interface EnhancedGoogleMapProps {
  builders: Builder[];
  center: { lat: number; lng: number };
  zoom?: number;
  onMarkerClick: (builder: Builder) => void;
  isLoaded?: boolean;
  selectedState?: string;
  searchContext?: 'state' | 'zipcode' | 'builder' | 'all';
}

/**
 * Enhanced Google Map Component with Intelligent Bounds Calculation
 * 
 * Features:
 * - Smart bounds calculation that prevents extreme outliers from affecting zoom
 * - State-aware bounds optimization
 * - Automatic outlier detection and handling
 * - Consistent marker positioning with offset patterns
 * - Dynamic zoom limits based on geographic spread
 */
const EnhancedGoogleMap: React.FC<EnhancedGoogleMapProps> = ({
  builders,
  center,
  zoom,
  onMarkerClick,
  isLoaded,
  selectedState,
  searchContext = 'all'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Enhanced bounds calculation with outlier detection
  const calculateOptimalBounds = (builders: Builder[]) => {
    if (builders.length === 0) return null;

    const validBuilders = builders.filter(b => 
      b.location?.lat && b.location?.lng && 
      !isNaN(b.location.lat) && !isNaN(b.location.lng)
    );

    if (validBuilders.length === 0) return null;

    // For single builder, return centered bounds
    if (validBuilders.length === 1) {
      const builder = validBuilders[0];
      return {
        bounds: null,
        center: { lat: builder.location.lat, lng: builder.location.lng },
        zoom: 12,
        outliers: [],
        strategy: 'single-builder'
      };
    }

    // Calculate basic bounds
    const lats = validBuilders.map(b => b.location.lat);
    const lngs = validBuilders.map(b => b.location.lng);
    
    const basicBounds = {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs)
    };

    const latSpread = basicBounds.north - basicBounds.south;
    const lngSpread = basicBounds.east - basicBounds.west;
    const maxSpread = Math.max(latSpread, lngSpread);

    // Detect outliers based on context
    let outlierThreshold = 0.6; // Default threshold
    
    if (searchContext === 'state') {
      // For state searches, be more strict about outliers
      outlierThreshold = 0.4;
    } else if (searchContext === 'zipcode') {
      // For zip code searches, be very strict
      outlierThreshold = 0.3;
    }

    const centerLat = (basicBounds.north + basicBounds.south) / 2;
    const centerLng = (basicBounds.east + basicBounds.west) / 2;

    const outliers = validBuilders.filter(builder => {
      const distanceFromCenter = Math.sqrt(
        Math.pow(builder.location.lat - centerLat, 2) + 
        Math.pow(builder.location.lng - centerLng, 2)
      );
      return distanceFromCenter > maxSpread * outlierThreshold;
    });

    // If we have outliers and they're more than 50% of builders, don't exclude them
    // This prevents over-aggressive outlier detection
    const shouldExcludeOutliers = outliers.length > 0 && 
                                  outliers.length < validBuilders.length * 0.5 &&
                                  maxSpread > 2.0; // Only exclude for large spreads

    let finalBuilders = validBuilders;
    let strategy = 'include-all';

    if (shouldExcludeOutliers) {
      finalBuilders = validBuilders.filter(b => !outliers.includes(b));
      strategy = 'exclude-outliers';
      
      console.log(`🗺️ Enhanced Map: Excluding ${outliers.length} outliers for better bounds`);
      outliers.forEach(outlier => {
        console.log(`   • ${outlier.name} (${outlier.location.city}, ${outlier.location.state})`);
      });
    }

    // Recalculate bounds with final builder set
    const finalLats = finalBuilders.map(b => b.location.lat);
    const finalLngs = finalBuilders.map(b => b.location.lng);
    
    const finalBounds = new google.maps.LatLngBounds();
    finalBuilders.forEach((builder, index) => {
      // Apply same offset as markers
      const offsetLat = builder.location.lat + (index * 0.008) * Math.cos(index * Math.PI / 3);
      const offsetLng = builder.location.lng + (index * 0.008) * Math.sin(index * Math.PI / 3);
      finalBounds.extend({ lat: offsetLat, lng: offsetLng });
    });

    // Calculate zoom limits
    const finalLatSpread = Math.max(...finalLats) - Math.min(...finalLats);
    const finalLngSpread = Math.max(...finalLngs) - Math.min(...finalLngs);
    const finalMaxSpread = Math.max(finalLatSpread, finalLngSpread);

    let minZoom = 6;
    let maxZoom = 16;

    if (finalMaxSpread > 2.5) {
      minZoom = 5; maxZoom = 8;
    } else if (finalMaxSpread > 1.5) {
      minZoom = 7; maxZoom = 10;
    } else if (finalMaxSpread > 0.8) {
      minZoom = 9; maxZoom = 12;
    } else if (finalMaxSpread > 0.3) {
      minZoom = 11; maxZoom = 14;
    } else {
      minZoom = 12; maxZoom = 16;
    }

    return {
      bounds: finalBounds,
      center: null,
      minZoom,
      maxZoom,
      outliers,
      strategy,
      spread: finalMaxSpread,
      excludedCount: outliers.length
    };
  };

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

  // Create markers and set bounds
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    if (builders.length === 0) return;

    // Calculate optimal bounds
    const boundsResult = calculateOptimalBounds(builders);
    
    if (!boundsResult) {
      console.warn('🗺️ Enhanced Map: No valid coordinates found');
      return;
    }

    console.log(`🗺️ Enhanced Map Strategy: ${boundsResult.strategy}`);
    if (boundsResult.excludedCount && boundsResult.excludedCount > 0) {
      console.log(`   📊 Excluded ${boundsResult.excludedCount} outliers for optimal view`);
      console.log(`   📏 Geographic spread: ${boundsResult.spread?.toFixed(2)}°`);
    }

    // Create markers for ALL builders (including outliers)
    builders.forEach((builder, index) => {
      if (!builder.location?.lat || !builder.location?.lng) return;

      // Add offset for overlapping markers
      const offsetLat = builder.location.lat + (index * 0.008) * Math.cos(index * Math.PI / 3);
      const offsetLng = builder.location.lng + (index * 0.008) * Math.sin(index * Math.PI / 3);

      // Check if this builder is an outlier
      const isOutlier = boundsResult.outliers.some(outlier => 
        outlier.name === builder.name && 
        outlier.location.lat === builder.location.lat
      );

      const marker = new google.maps.Marker({
        position: { lat: offsetLat, lng: offsetLng },
        map: mapInstanceRef.current,
        title: `${builder.name} - ${builder.location.city}, ${builder.location.state}`,
        icon: {
          path: 'M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13C19,5.13 15.87,2 12,2z',
          fillColor: isOutlier ? '#ff9800' : '#d32f2f', // Orange for outliers, red for normal
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: isOutlier ? 1.8 : 1.5, // Slightly larger for outliers
          anchor: new google.maps.Point(12, 24)
        }
      });

      marker.addListener('click', () => {
        onMarkerClick(builder);
      });

      markersRef.current.push(marker);
    });

    // Set map bounds/center
    if (boundsResult.strategy === 'single-builder') {
      mapInstanceRef.current.setCenter(boundsResult.center!);
      mapInstanceRef.current.setZoom(boundsResult.zoom!);
    } else {
      // Use calculated bounds with padding
      const padding = { top: 80, right: 80, bottom: 80, left: 80 };
      mapInstanceRef.current.fitBounds(boundsResult.bounds!, padding);

      // Apply zoom limits after a short delay
      setTimeout(() => {
        if (mapInstanceRef.current && boundsResult.minZoom && boundsResult.maxZoom) {
          const currentZoom = mapInstanceRef.current.getZoom();
          
          if (currentZoom && currentZoom < boundsResult.minZoom) {
            mapInstanceRef.current.setZoom(boundsResult.minZoom);
          } else if (currentZoom && currentZoom > boundsResult.maxZoom) {
            mapInstanceRef.current.setZoom(boundsResult.maxZoom);
          }
        }
      }, 300);
    }

  }, [builders, onMarkerClick, center, isLoaded, selectedState, searchContext]);

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
        <div>Loading Enhanced Google Maps...</div>
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

export default EnhancedGoogleMap; 