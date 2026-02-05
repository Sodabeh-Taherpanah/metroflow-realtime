'use client';

import React, { useEffect, useState, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import apiClient from '@/utils/api';

type Station = {
  id: string;
  name: string;
  location?: {
    latitude: number;
    longitude: number;
  };
};

type UserLocation = {
  latitude: number;
  longitude: number;
};

const MapView = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [MapContainer, setMapContainer] = useState<any>(null);
  const [TileLayer, setTileLayer] = useState<any>(null);
  const [Marker, setMarker] = useState<any>(null);
  const [Popup, setPopup] = useState<any>(null);
  const [Polyline, setPolyline] = useState<any>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoadingStations, setIsLoadingStations] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [suggestions, setSuggestions] = useState<Station[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const leaflet = await import('leaflet');
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
        const mod = await import('react-leaflet');
        setMapContainer(() => mod.MapContainer);
        setTileLayer(() => mod.TileLayer);
        setMarker(() => mod.Marker);
        setPopup(() => mod.Popup);
        setPolyline(() => mod.Polyline);
        setIsMounted(true);
      } catch (error) {
        console.error('Failed to load react-leaflet:', error);
      }
    })();
  }, []);

  useEffect(() => {
    // Load initial stations when component mounts
    const loadInitialStations = async () => {
      setIsLoadingStations(true);
      try {
        const { data } = await apiClient.get('/vbb/stations?query=Berlin&limit=50');
        const items = Array.isArray(data) ? data : [];
        setStations(items);
      } catch (error) {
        console.error('Failed to load initial stations:', error);
        setStations([]);
      } finally {
        setIsLoadingStations(false);
      }
    };

    loadInitialStations();
  }, []);

  const toRadians = (value: number) => (value * Math.PI) / 180;

  const getDistanceKm = (from: UserLocation, to: UserLocation) => {
    if (from.latitude === to.latitude && from.longitude === to.longitude) {
      return 0; // Same location
    }
    const earthRadiusKm = 6371;
    const dLat = toRadians(to.latitude - from.latitude);
    const dLon = toRadians(to.longitude - from.longitude);
    const lat1 = toRadians(from.latitude);
    const lat2 = toRadians(to.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  };

  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const { data } = await apiClient.get(
        `/vbb/stations?query=${encodeURIComponent(query)}&limit=20`
      );
      const items = Array.isArray(data) ? data : [];
      setSuggestions(items);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    fetchSuggestions(query);
  };

  const handleSuggestionClick = async (station: Station) => {
    setSearchQuery(station.name);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedStation(station);

    setIsLoadingStations(true);
    try {
      const { data } = await apiClient.get(
        `/vbb/stations?query=${encodeURIComponent(station.name)}&limit=50`
      );
      const items = Array.isArray(data) ? data : [];
      setStations(items);

      const stationMarkers = stations.filter(
        (station: Station) => station.location?.latitude && station.location?.longitude
      );

      if (station.location) {
        if (mapRef.current) {
          mapRef.current.setView([station.location.latitude, station.location.longitude], 13);
        }
      }
    } catch (error) {
      console.error('Failed to search stations:', error);
      setStations([]);
    } finally {
      setIsLoadingStations(false);
    }
  };

  const handleLocateMe = () => {
    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      position => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(location);
        setIsLocating(false);
        loadNearbyStations(location);

        if (mapRef.current) {
          mapRef.current.setView([location.latitude, location.longitude], 13);
        }
      },
      error => {
        setLocationError(error.message || 'Unable to get your location.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const loadNearbyStations = async (location: UserLocation) => {
    setIsLoadingStations(true);
    try {
      const { data } = await apiClient.get('/vbb/stations?query=Berlin&limit=50');
      const items = Array.isArray(data) ? data : [];

      const stationsWithDistance = items
        .filter((s: Station) => s.location?.latitude && s.location?.longitude)
        .map((s: Station) => ({
          ...s,
          distance: getDistanceKm(location, {
            latitude: s.location!.latitude,
            longitude: s.location!.longitude,
          }),
        }))
        .sort((a: any, b: any) => a.distance - b.distance);

      setStations(stationsWithDistance);
    } catch (error) {
      console.error('Failed to load stations:', error);
      setStations([]);
    } finally {
      setIsLoadingStations(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoadingStations(true);
    setLocationError(null);
    setShowSuggestions(false);

    try {
      const { data } = await apiClient.get(
        `/vbb/stations?query=${encodeURIComponent(searchQuery)}&limit=50`
      );
      const items = Array.isArray(data) ? data : [];
      setStations(items);

      const stationMarkers = stations.filter(
        (station: Station) => station.location?.latitude && station.location?.longitude
      );

      if (items.length > 0 && items[0].location) {
        const firstStation = items[0];
        if (mapRef.current) {
          mapRef.current.setView(
            [firstStation.location.latitude, firstStation.location.longitude],
            13
          );
        }
      }
    } catch (error) {
      console.error('Failed to search stations:', error);
      setStations([]);
    } finally {
      setIsLoadingStations(false);
    }
  };

  if (!isMounted || !MapContainer || !TileLayer || !Marker || !Popup || !Polyline) {
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

  const position: [number, number] = [52.52, 13.405];

  const stationMarkers = stations.filter(
    (station: Station) =>
      typeof station.location?.latitude === 'number' &&
      typeof station.location?.longitude === 'number'
  );

  const center: [number, number] = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : position;

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative', display: 'flex' }}>
      <div
        style={{
          width: 380,
          height: '100%',
          background: '#fff',
          borderRight: '1px solid #ddd',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
        }}
      >
        <div style={{ padding: 16, borderBottom: '1px solid #eee' }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: 18, fontWeight: 600, color: '#000' }}>
            Find Stations
          </h2>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, position: 'relative' }}>
            <input
              type="text"
              placeholder="Search location or station..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: 6,
                fontSize: 14,
                color: '#000',
                backgroundColor: '#fff',
              }}
            />
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isLoadingStations}
              style={{
                padding: '8px 16px',
                background: '#1d4ed8',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Search
            </button>
            {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 40,
                  background: '#fff',
                  border: '1px solid #ddd',
                  borderTop: 'none',
                  borderRadius: '0 0 6px 6px',
                  maxHeight: 200,
                  overflowY: 'auto',
                  zIndex: 1001,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
              >
                {isLoadingSuggestions && (
                  <div style={{ padding: '10px 12px', color: '#666', fontSize: 13 }}>
                    Loading...
                  </div>
                )}
                {!isLoadingSuggestions && suggestions.length === 0 && (
                  <div style={{ padding: '10px 12px', color: '#999', fontSize: 13 }}>
                    No stations found
                  </div>
                )}
                {suggestions.map((station: Station) => (
                  <div
                    key={station.id}
                    onClick={() => handleSuggestionClick(station)}
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid #f0f0f0',
                      cursor: 'pointer',
                      fontSize: 14,
                      transition: 'background 0.1s',
                      color: '#000',
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = '#f3f4f6';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ fontWeight: 500 }}>{station.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleLocateMe}
            disabled={isLocating}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: isLocating ? '#93c5fd' : '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: isLocating ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {isLocating ? 'Locating...' : '📍 Locate Me'}
          </button>
          {locationError && (
            <div
              style={{
                marginTop: 8,
                padding: 8,
                background: '#fee',
                color: '#c00',
                borderRadius: 4,
                fontSize: 12,
              }}
            >
              {locationError}
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {isLoadingStations && (
            <div style={{ textAlign: 'center', padding: 20, color: '#666' }}>
              Loading stations...
            </div>
          )}
          {!isLoadingStations && stations.length === 0 && (
            <div style={{ textAlign: 'center', padding: 20, color: '#666' }}>
              No stations found. Try searching or locating yourself.
            </div>
          )}
          {stationMarkers.map((station: any) => {
            const distanceKm = userLocation
              ? getDistanceKm(userLocation, {
                  latitude: station.location.latitude,
                  longitude: station.location.longitude,
                })
              : null;

            return (
              <div
                key={station.id}
                onClick={() => {
                  setSelectedStation(station);
                  if (mapRef.current && station.location) {
                    mapRef.current.setView(
                      [station.location.latitude, station.location.longitude],
                      15
                    );
                  }
                }}
                style={{
                  padding: 12,
                  marginBottom: 8,
                  background: selectedStation?.id === station.id ? '#dbeafe' : '#f9fafb',
                  border:
                    selectedStation?.id === station.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: '#000',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: '#000' }}>
                  {station.name}
                </div>
                {distanceKm !== null && (
                  <div style={{ fontSize: 12, color: '#666' }}>
                    📍 {distanceKm.toFixed(2)} km away
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <MapContainer center={center} zoom={12} style={{ flex: 1, height: '100%' }} ref={mapRef}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        />

        {userLocation && (
          <Marker position={[userLocation.latitude, userLocation.longitude]}>
            <Popup>
              <strong>Your Location</strong>
              <div style={{ fontSize: 12 }}>
                {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}
              </div>
            </Popup>
          </Marker>
        )}

        {stationMarkers.map((station: any) => (
          <Marker
            key={station.id}
            position={[station.location.latitude, station.location.longitude]}
          >
            <Popup>
              <strong>{station.name}</strong>
              {userLocation && (
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  Distance:{' '}
                  {getDistanceKm(userLocation, {
                    latitude: station.location.latitude,
                    longitude: station.location.longitude,
                  }).toFixed(2)}{' '}
                  km
                </div>
              )}
            </Popup>
          </Marker>
        ))}

        {userLocation && selectedStation?.location && (
          <Polyline
            positions={[
              [userLocation.latitude, userLocation.longitude],
              [selectedStation.location.latitude, selectedStation.location.longitude],
            ]}
            color="#ef4444"
            weight={3}
            opacity={0.7}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;
