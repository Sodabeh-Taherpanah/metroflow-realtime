'use client';

import React, { useEffect, useState } from 'react';
import socket from '../../utils/websocket';

interface Departure {
  id: string;
  train: string;
  time: string;
}

const RealTimeDepartures = () => {
  const [departures, setDepartures] = useState<Departure[]>([]);

  useEffect(() => {
    socket.connect();

    socket.on('departures', (data: Departure[]) => {
      setDepartures(data);
    });

    return () => {
      socket.off('departures');
      socket.disconnect();
    };
  }, []);

  return (
    <div>
      <h1>Real-Time Departures</h1>
      <ul>
        {departures.map((departure: Departure) => (
          <li key={departure.id}>
            {departure.train} - {departure.time}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RealTimeDepartures;
