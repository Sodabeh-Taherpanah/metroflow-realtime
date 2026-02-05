'use client';

import React, { useEffect, useState } from 'react';

const MapView = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [MapContainer, setMapContainer] = useState<any>(null);
  const [TileLayer, setTileLayer] = useState<any>(null);
  const [Marker, setMarker] = useState<any>(null);

  useEffect(() => {
    // Dynamically import leaflet components only on client
    (async () => {
      try {
        const mod = await import('react-leaflet');
        setMapContainer(() => mod.MapContainer);
        setTileLayer(() => mod.TileLayer);
        setMarker(() => mod.Marker);
        setIsMounted(true);
      } catch (error) {
        console.error('Failed to load react-leaflet:', error);
      }
    })();
  }, []);

  if (!isMounted || !MapContainer || !TileLayer || !Marker) {
    return (
      <div
        style={{
          height: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Loading map...
      </div>
    );
  }

  const position: [number, number] = [51.505, -0.09];

  return (
    <MapContainer center={position} zoom={13} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
      />
      <Marker position={position} />
    </MapContainer>
  );
};

export default MapView;
