// Core type definitions for MetroFlow

export interface TransportData {
  id: string;
  name: string;
  type: 'bus' | 'train' | 'subway' | 'tram';
  status: 'on-time' | 'delayed' | 'cancelled';
  delay?: number;
  nextArrival?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
