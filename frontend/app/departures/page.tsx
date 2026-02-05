'use client';

import React, { useEffect, useState } from 'react';
import socket from '../../utils/websocket';

interface Departure {
  tripId: string;
  stop: {
    id: string;
    name: string;
  };
  when: string;
  plannedWhen: string;
  direction: string;
  line: {
    name: string;
  };
}

const RealTimeDepartures = () => {
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [stationId] = useState('900029305'); // Default station

  useEffect(() => {
    socket.connect();

    // Subscribe to departures for the station
    socket.emit('subscribe:departures', { stationId });

    socket.on('departures:update', (data: { stationId: string; departures: Departure[] }) => {
      setDepartures(Array.isArray(data.departures) ? data.departures : []);
    });

    return () => {
      socket.emit('unsubscribe:departures', { stationId });
      socket.off('departures:update');
      socket.disconnect();
    };
  }, [stationId]);

  return (
    <div>
      <h1>Real-Time Departures</h1>
      <p>Station: Berlin, Staaken Bhf</p>
      {departures.length === 0 ? (
        <p>Loading departures...</p>
      ) : (
        <ul>
          {departures.map((departure: Departure, index: number) => {
            const lineName = departure.line?.name ?? 'Unknown Line';
            const direction = departure.direction ?? 'Unknown Direction';
            const whenValue = departure.when ?? departure.plannedWhen;
            const whenLabel = whenValue ? new Date(whenValue).toLocaleTimeString() : 'Unknown Time';

            return (
              <li key={departure.tripId ?? whenValue ?? index}>
                <strong>{lineName}</strong> → {direction} | {whenLabel}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default RealTimeDepartures;
