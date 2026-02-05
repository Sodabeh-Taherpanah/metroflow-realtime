import { z } from 'zod';

export const stationSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
});

export const routeSchema = z.object({
  id: z.string(),
  startStation: stationSchema,
  endStation: stationSchema,
  distance: z.number(),
});
