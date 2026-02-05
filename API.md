# API Specification

## Base URL

- Development: `http://localhost:3001`
- Production: `https://api.metroflow.app`

## Authentication

(Coming in Phase 2)

## Endpoints

### Health Check

```
GET /
GET /health
```

Response:

```json
{
  "status": "ok",
  "uptime": 123.456
}
```

### Stations

#### List Stations

```
GET /stations
```

Query Parameters:

- `lat` - Latitude for nearby search
- `lon` - Longitude for nearby search
- `radius` - Search radius in km
- `limit` - Max results

Response:

```json
{
  "data": [
    {
      "id": "station-1",
      "name": "Berlin Hauptbahnhof",
      "latitude": 52.5257,
      "longitude": 13.3686,
      "type": "main_station"
    }
  ]
}
```

#### Get Station Details

```
GET /stations/:id
```

Response:

```json
{
  "id": "station-1",
  "name": "Berlin Hauptbahnhof",
  "latitude": 52.5257,
  "longitude": 13.3686,
  "type": "main_station",
  "operators": ["DB", "BVG"],
  "connections": ["S1", "S3", "U55"]
}
```

### Real-time Updates

#### WebSocket Connection

```
ws://localhost:3001/socket.io/
```

Events:

- `connect` - Client connected
- `subscribe` - Subscribe to channel
- `unsubscribe` - Unsubscribe from channel
- `update` - Real-time update received

Example Subscribe:

```json
{
  "event": "subscribe",
  "data": {
    "channel": "station:berlin-hbf"
  }
}
```

## Error Responses

### 4xx Client Errors

```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 5xx Server Errors

```json
{
  "statusCode": 500,
  "message": "Internal Server Error",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Rate Limiting

(Planned for Phase 2)

- 100 requests per minute per IP
- 1000 requests per hour per user

## Webhooks

(Planned for Phase 3)
