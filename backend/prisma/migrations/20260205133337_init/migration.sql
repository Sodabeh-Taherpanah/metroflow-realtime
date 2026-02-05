-- CreateTable
CREATE TABLE "Station" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Departure" (
    "id" TEXT NOT NULL,
    "departureId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "lineNumber" VARCHAR(50) NOT NULL,
    "direction" VARCHAR(255) NOT NULL,
    "departureTime" TIMESTAMP(3) NOT NULL,
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "delayMinutes" INTEGER NOT NULL DEFAULT 0,
    "platform" VARCHAR(10),
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "realtime" BOOLEAN NOT NULL DEFAULT false,
    "provider" VARCHAR(50) NOT NULL,
    "routeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Departure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "lineNumber" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "operator" VARCHAR(100) NOT NULL,
    "color" VARCHAR(7),
    "textColor" VARCHAR(7),
    "originStationId" TEXT,
    "provider" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealtimeCache" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RealtimeCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analytics" (
    "id" TEXT NOT NULL,
    "event" VARCHAR(100) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "userId" VARCHAR(255),
    "stationId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorLog" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "provider" VARCHAR(50),
    "endpoint" VARCHAR(255),
    "statusCode" INTEGER,
    "userId" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Station_stationId_key" ON "Station"("stationId");

-- CreateIndex
CREATE INDEX "Station_provider_idx" ON "Station"("provider");

-- CreateIndex
CREATE INDEX "Station_city_idx" ON "Station"("city");

-- CreateIndex
CREATE UNIQUE INDEX "Departure_departureId_key" ON "Departure"("departureId");

-- CreateIndex
CREATE INDEX "Departure_stationId_idx" ON "Departure"("stationId");

-- CreateIndex
CREATE INDEX "Departure_departureTime_idx" ON "Departure"("departureTime");

-- CreateIndex
CREATE INDEX "Departure_provider_idx" ON "Departure"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "Route_routeId_key" ON "Route"("routeId");

-- CreateIndex
CREATE INDEX "Route_provider_idx" ON "Route"("provider");

-- CreateIndex
CREATE INDEX "Route_lineNumber_idx" ON "Route"("lineNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RealtimeCache_key_key" ON "RealtimeCache"("key");

-- CreateIndex
CREATE INDEX "RealtimeCache_expiresAt_idx" ON "RealtimeCache"("expiresAt");

-- CreateIndex
CREATE INDEX "RealtimeCache_provider_idx" ON "RealtimeCache"("provider");

-- CreateIndex
CREATE INDEX "Analytics_event_idx" ON "Analytics"("event");

-- CreateIndex
CREATE INDEX "Analytics_createdAt_idx" ON "Analytics"("createdAt");

-- CreateIndex
CREATE INDEX "ErrorLog_provider_idx" ON "ErrorLog"("provider");

-- CreateIndex
CREATE INDEX "ErrorLog_createdAt_idx" ON "ErrorLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Departure" ADD CONSTRAINT "Departure_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Departure" ADD CONSTRAINT "Departure_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_originStationId_fkey" FOREIGN KEY ("originStationId") REFERENCES "Station"("id") ON DELETE SET NULL ON UPDATE CASCADE;
