import React from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { Builder } from '../types/builder';

interface CustomGoogleMapProps {
  builders: Builder[];
  selectedBuilder: Builder | null;
  onBuilderSelect: (builder: Builder) => void;
}

const CustomGoogleMap: React.FC<CustomGoogleMapProps> = ({
  builders,
  selectedBuilder,
  onBuilderSelect,
}) => {
  const mapRef = React.useRef<google.maps.Map | null>(null);
  const center = React.useMemo(() => ({ lat: 39.8283, lng: -98.5795 }), []); // Center of USA

  const onLoad = React.useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = React.useCallback(() => {
    mapRef.current = null;
  }, []);

  React.useEffect(() => {
    if (selectedBuilder && mapRef.current) {
      mapRef.current.panTo({ lat: selectedBuilder.latitude, lng: selectedBuilder.longitude });
      mapRef.current.setZoom(12);
    }
  }, [selectedBuilder]);

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={center}
      zoom={4}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      {builders.map((builder) => (
        <Marker
          key={builder.id}
          position={{ lat: builder.latitude, lng: builder.longitude }}
          onClick={() => onBuilderSelect(builder)}
          animation={selectedBuilder?.id === builder.id ? google.maps.Animation.BOUNCE : undefined}
        />
      ))}
    </GoogleMap>
  );
};

export default CustomGoogleMap;
