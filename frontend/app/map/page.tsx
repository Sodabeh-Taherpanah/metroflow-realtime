'use client';

import React, { useEffect, useState, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import apiClient from '@/utils/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [MapContainer, setMapContainer] = useState<React.ComponentType<any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [TileLayer, setTileLayer] = useState<React.ComponentType<any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [Marker, setMarker] = useState<React.ComponentType<any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [Popup, setPopup] = useState<React.ComponentType<any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [Polyline, setPolyline] = useState<React.ComponentType<any> | null>(null);
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
  const mapRef = useRef<L.Map | null>(null); // Update the type of mapRef to L.Map

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setMapContainer(() => mod.MapContainer as any);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setTileLayer(() => mod.TileLayer as any);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setMarker(() => mod.Marker as any);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setPopup(() => mod.Popup as any);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setPolyline(() => mod.Polyline as any);
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

      if (station.location) {
        if (mapRef.current && mapRef.current.setView) {
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

        if (mapRef.current && mapRef.current.setView) {
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
        .sort((a, b) => a.distance - b.distance);

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

      if (items.length > 0 && items[0].location) {
        const firstStation = items[0];
        if (mapRef.current && mapRef.current.setView) {
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
      <div className="flex min-h-[60vh] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500 dark:border-slate-800/60 dark:bg-slate-950/60 dark:text-slate-300">
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
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Map</p>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Live station map</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Search stations and visualize realtime data.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card className="flex h-[70vh] flex-col">
          <div className="border-b border-slate-200 p-5 dark:border-slate-800/60">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Find stations</h2>
            <div className="mt-4 space-y-3">
              <div className="relative flex gap-2">
                <input
                  type="text"
                  placeholder="Search location or station..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-slate-800/60 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                <Button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isLoadingStations}
                  className="bg-blue-600 text-white hover:bg-blue-500"
                >
                  Search
                </Button>
                {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) && (
                  <div className="absolute left-0 right-20 top-[110%] z-10 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800/60 dark:bg-slate-950/95">
                    {isLoadingSuggestions && (
                      <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                        Loading...
                      </div>
                    )}
                    {!isLoadingSuggestions && suggestions.length === 0 && (
                      <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                        No stations found
                      </div>
                    )}
                    {suggestions.map((station: Station) => (
                      <button
                        key={station.id}
                        onClick={() => handleSuggestionClick(station)}
                        className="flex w-full flex-col gap-1 border-b border-slate-200 px-3 py-2 text-left text-sm text-slate-900 hover:bg-slate-100 dark:border-slate-800/40 dark:text-slate-100 dark:hover:bg-slate-900"
                      >
                        <span className="font-medium">{station.name}</span>
                        <span className="text-xs text-slate-500">ID: {station.id}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={handleLocateMe}
                disabled={isLocating}
                className="w-full bg-slate-900 text-slate-100 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                {isLocating ? 'Locating...' : '📍 Locate Me'}
              </Button>
              {locationError && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  {locationError}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {isLoadingStations && (
              <div className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                Loading stations...
              </div>
            )}
            {!isLoadingStations && stations.length === 0 && (
              <div className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No stations found. Try searching or locating yourself.
              </div>
            )}
            <div className="space-y-2">
              {stationMarkers.map((station: Station) => {
                const distanceKm =
                  userLocation && station.location
                    ? getDistanceKm(userLocation, {
                        latitude: station.location.latitude,
                        longitude: station.location.longitude,
                      })
                    : null;

                const isSelected = selectedStation?.id === station.id;

                return (
                  <button
                    key={station.id}
                    onClick={() => {
                      setSelectedStation(station);
                      if (mapRef.current && mapRef.current.setView && station.location) {
                        mapRef.current.setView(
                          [station.location.latitude, station.location.longitude],
                          15
                        );
                      }
                    }}
                    className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                      isSelected
                        ? 'border-blue-500/70 bg-blue-500/10 text-blue-700 dark:text-blue-100'
                        : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-100 dark:border-slate-800/60 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="text-sm font-semibold">{station.name}</div>
                    {distanceKm !== null && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        📍 {distanceKm.toFixed(2)} km away
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card className="h-[70vh] overflow-hidden">
          {MapContainer && TileLayer && Marker && Popup && (
            <MapContainer center={center} zoom={12} className="h-full w-full" ref={mapRef}>
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

              {stationMarkers.map(
                (station: Station) =>
                  station.location && (
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
                  )
              )}
            </MapContainer>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MapView;
