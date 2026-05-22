"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var IngestService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestService = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const crypto_1 = require("crypto");
const path_1 = require("path");
const AdmZip = require('adm-zip');
let IngestService = IngestService_1 = class IngestService {
    constructor() {
        this.logger = new common_1.Logger(IngestService_1.name);
        this.jobs = new Map();
        this.jobLogs = new Map();
        this.defaultTolerance = Number(process.env.NORMALIZATION_TOLERANCE || 0.00003);
        this.snapPrecision = Number(process.env.SNAP_PRECISION || 6);
        this.defaultSampleSpacingMeters = Number(process.env.SAMPLE_SPACING_METERS || 20);
    }
    queueProbe(input) {
        const hasGtfsPath = Boolean(input.gtfsZipPath?.trim());
        const hasGpx = Boolean(input.gpxFile || input.gpxContent?.trim());
        if (!hasGtfsPath && !hasGpx) {
            throw new common_1.BadRequestException('Provide either gtfsZipPath or gpxFile/gpxContent.');
        }
        const jobId = (0, crypto_1.randomUUID)();
        const now = new Date().toISOString();
        this.jobs.set(jobId, {
            jobId,
            status: 'queued',
            createdAt: now,
            updatedAt: now,
        });
        this.jobLogs.set(jobId, []);
        this.appendJobLog(jobId, `queued gtfsZipPath=${input.gtfsZipPath || 'none'} gpxFile=${input.gpxFile?.originalname || 'none'}`);
        setTimeout(() => {
            this.processProbeJob(jobId, input);
        }, 0);
        return { jobId, status: 'queued' };
    }
    getProbeLogs(jobId, limit) {
        if (!this.jobs.has(jobId)) {
            throw new common_1.NotFoundException(`Probe job not found: ${jobId}`);
        }
        const max = Number.isFinite(limit)
            ? Math.min(500, Math.max(1, Number(limit)))
            : 200;
        const lines = this.jobLogs.get(jobId) || [];
        return {
            jobId,
            lines: lines.slice(-max),
        };
    }
    resolveDownloadPath(input) {
        const routeId = input.routeId?.trim();
        if (!routeId) {
            throw new common_1.BadRequestException('routeId is required.');
        }
        const view = input.view || 'canonical';
        const route = this.findRouteArtifact(routeId);
        const safeId = this.safeFileSegment(routeId);
        if (view === 'raw') {
            if (!route.rawPath || !(0, fs_1.existsSync)(route.rawPath)) {
                throw new common_1.NotFoundException(`Raw artifact not found for route ${routeId}.`);
            }
            return {
                filePath: route.rawPath,
                fileName: `route-${safeId}-raw.geojson`,
            };
        }
        if (view === 'canonical') {
            if (!route.canonicalPath || !(0, fs_1.existsSync)(route.canonicalPath)) {
                throw new common_1.NotFoundException(`Canonical artifact not found for route ${routeId}.`);
            }
            return {
                filePath: route.canonicalPath,
                fileName: `route-${safeId}-canonical.geojson`,
            };
        }
        const { samplesDir } = this.resolveDataDirs();
        const outputPath = (0, path_1.resolve)(samplesDir, `route-${safeId}-samples.json`);
        if (!(0, fs_1.existsSync)(outputPath)) {
            this.sampleRoute({ routeId });
        }
        if (!(0, fs_1.existsSync)(outputPath)) {
            throw new common_1.NotFoundException(`Sample output not found for route ${routeId}.`);
        }
        return {
            filePath: outputPath,
            fileName: `route-${safeId}-samples.json`,
        };
    }
    getProbeJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            throw new common_1.NotFoundException(`Probe job not found: ${jobId}`);
        }
        return job;
    }
    sampleRoute(input) {
        const routeId = input.routeId?.trim();
        if (!routeId) {
            throw new common_1.BadRequestException('routeId is required.');
        }
        const spacingMeters = this.resolveSpacingMeters(input.spacingMeters);
        const route = this.findRouteArtifact(routeId);
        const sourcePath = route.canonicalPath || route.rawPath;
        if (!sourcePath) {
            throw new common_1.NotFoundException(`No route artifact found for routeId=${routeId}. Run probe first.`);
        }
        const geojson = JSON.parse((0, fs_1.readFileSync)(sourcePath, 'utf-8'));
        const coordinates = geojson?.features?.[0]?.geometry?.type === 'LineString'
            ? geojson?.features?.[0]?.geometry?.coordinates
            : undefined;
        if (!Array.isArray(coordinates) || coordinates.length < 2) {
            throw new common_1.BadRequestException(`Route ${routeId} does not contain a valid LineString with >= 2 points.`);
        }
        const normalizedCoordinates = coordinates.map((point) => [
            Number(point?.[0]),
            Number(point?.[1]),
        ]);
        if (normalizedCoordinates.some(([lng, lat]) => Number.isNaN(lng) || Number.isNaN(lat))) {
            throw new common_1.BadRequestException(`Route ${routeId} contains invalid coordinate values.`);
        }
        const samples = this.sampleLineString(normalizedCoordinates, spacingMeters);
        const { samplesDir } = this.resolveDataDirs();
        (0, fs_1.mkdirSync)(samplesDir, { recursive: true });
        const safeId = this.safeFileSegment(routeId);
        const outputPath = (0, path_1.resolve)(samplesDir, `route-${safeId}-samples.json`);
        (0, fs_1.writeFileSync)(outputPath, JSON.stringify({
            routeId,
            sourcePath,
            spacingMeters,
            sampleCount: samples.length,
            totalDistanceMeters: samples[samples.length - 1]?.dist || 0,
            samples,
        }, null, 2));
        return {
            routeId,
            sourcePath,
            outputPath,
            spacingMeters,
            sampleCount: samples.length,
            totalDistanceMeters: samples[samples.length - 1]?.dist || 0,
            firstPoint: samples[0],
            lastPoint: samples[samples.length - 1],
        };
    }
    listRoutes() {
        const { dataDir, rawDir, canonicalDir } = this.resolveDataDirs();
        (0, fs_1.mkdirSync)(rawDir, { recursive: true });
        (0, fs_1.mkdirSync)(canonicalDir, { recursive: true });
        const routesMap = new Map();
        const applyFile = (filePath, isCanonical) => {
            try {
                const file = JSON.parse((0, fs_1.readFileSync)(filePath, 'utf-8'));
                const feature = file?.features?.[0];
                const properties = feature?.properties || {};
                const points = feature?.geometry?.coordinates || [];
                const id = properties.shape_id ||
                    (0, path_1.basename)(filePath, (0, path_1.extname)(filePath)).replace(/^route-/, '');
                const existing = routesMap.get(id) || { id };
                if (isCanonical) {
                    existing.canonicalPath = filePath;
                    existing.canonicalPointCount = Array.isArray(points)
                        ? points.length
                        : undefined;
                }
                else {
                    existing.rawPath = filePath;
                    existing.rawPointCount = Array.isArray(points)
                        ? points.length
                        : undefined;
                }
                if (!existing.routeId && properties.route_id) {
                    existing.routeId = properties.route_id;
                }
                if (!existing.routeName && properties.route_name) {
                    existing.routeName = properties.route_name;
                }
                routesMap.set(id, existing);
            }
            catch {
            }
        };
        for (const file of (0, fs_1.readdirSync)(rawDir)) {
            if (file.endsWith('.geojson')) {
                applyFile((0, path_1.resolve)(rawDir, file), false);
            }
        }
        for (const file of (0, fs_1.readdirSync)(canonicalDir)) {
            if (file.endsWith('.geojson')) {
                applyFile((0, path_1.resolve)(canonicalDir, file), true);
            }
        }
        return {
            dataDir,
            rawDir,
            canonicalDir,
            routes: Array.from(routesMap.values()).sort((a, b) => String(a.id).localeCompare(String(b.id))),
        };
    }
    processProbeJob(jobId, input) {
        const job = this.jobs.get(jobId);
        if (!job) {
            return;
        }
        job.status = 'running';
        job.updatedAt = new Date().toISOString();
        this.jobs.set(jobId, job);
        this.appendJobLog(jobId, `started gtfsZipPath=${input.gtfsZipPath || 'none'} gpxFile=${input.gpxFile?.originalname || 'none'}`);
        try {
            const hasGtfsPath = Boolean(input.gtfsZipPath?.trim());
            const tolerance = this.resolveTolerance(input.normalizationTolerance);
            const buildOutput = hasGtfsPath
                ? this.probeGtfs(input.gtfsZipPath.trim())
                : this.probeGpx(input.gpxFile, input.gpxContent);
            const result = this.writeArtifacts(jobId, buildOutput.sourceType, buildOutput.routes, buildOutput.warnings, tolerance);
            job.status = 'completed';
            job.result = result;
            job.updatedAt = new Date().toISOString();
            this.jobs.set(jobId, job);
            this.appendJobLog(jobId, `completed source=${result.sourceType} shapes=${result.stats.shapeCount} points=${result.stats.pointCount} canonicalPoints=${result.stats.canonicalPointCount}`);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'Unknown probe processing error';
            job.status = 'failed';
            job.error = message;
            job.updatedAt = new Date().toISOString();
            this.jobs.set(jobId, job);
            this.appendJobLog(jobId, `failed: ${message}`);
        }
    }
    appendJobLog(jobId, message) {
        const line = `${new Date().toISOString()} ${message}`;
        const current = this.jobLogs.get(jobId) || [];
        const updated = [...current, line].slice(-500);
        this.jobLogs.set(jobId, updated);
        this.logger.log(`[probe:${jobId}] ${message}`);
    }
    probeGtfs(gtfsZipPath) {
        const resolvedPath = (0, path_1.isAbsolute)(gtfsZipPath)
            ? gtfsZipPath
            : (0, path_1.resolve)(process.cwd(), gtfsZipPath);
        if (!(0, fs_1.existsSync)(resolvedPath)) {
            throw new common_1.NotFoundException(`GTFS zip not found: ${resolvedPath}`);
        }
        const zip = new AdmZip(resolvedPath);
        const shapesEntry = zip
            .getEntries()
            .find((entry) => /(^|\/)shapes\.txt$/i.test(entry.entryName));
        const tripsEntry = zip
            .getEntries()
            .find((entry) => /(^|\/)trips\.txt$/i.test(entry.entryName));
        const routesEntry = zip
            .getEntries()
            .find((entry) => /(^|\/)routes\.txt$/i.test(entry.entryName));
        if (!shapesEntry) {
            throw new common_1.BadRequestException('Invalid GTFS zip: shapes.txt not found in archive.');
        }
        const csv = zip.readAsText(shapesEntry);
        const rows = this.parseCsvText(csv);
        const warnings = [];
        if (rows.length === 0) {
            throw new common_1.BadRequestException('Invalid shapes.txt: no rows found.');
        }
        const headers = this.parseCsvLine(rows[0]);
        const shapeIdIndex = headers.indexOf('shape_id');
        const shapeLatIndex = headers.indexOf('shape_pt_lat');
        const shapeLonIndex = headers.indexOf('shape_pt_lon');
        const shapeSeqIndex = headers.indexOf('shape_pt_sequence');
        if (shapeIdIndex < 0 ||
            shapeLatIndex < 0 ||
            shapeLonIndex < 0 ||
            shapeSeqIndex < 0) {
            throw new common_1.BadRequestException('Invalid shapes.txt: required columns are shape_id, shape_pt_lat, shape_pt_lon, shape_pt_sequence.');
        }
        const points = [];
        for (let index = 1; index < rows.length; index += 1) {
            const columns = this.parseCsvLine(rows[index]);
            const shapeId = columns[shapeIdIndex]?.trim();
            const lat = Number(columns[shapeLatIndex]);
            const lon = Number(columns[shapeLonIndex]);
            const sequence = Number(columns[shapeSeqIndex]);
            if (!shapeId) {
                warnings.push(`Row ${index + 1}: missing shape_id; skipped.`);
                continue;
            }
            if ([lat, lon, sequence].some((value) => Number.isNaN(value))) {
                warnings.push(`Row ${index + 1}: invalid lat/lon/sequence for shape ${shapeId}; skipped.`);
                continue;
            }
            points.push({ shapeId, lat, lon, sequence });
        }
        const shapeToRoute = new Map();
        if (tripsEntry) {
            const tripsRows = this.parseCsvText(zip.readAsText(tripsEntry));
            if (tripsRows.length > 0) {
                const tripHeaders = this.parseCsvLine(tripsRows[0]);
                const tripShapeIdx = tripHeaders.indexOf('shape_id');
                const tripRouteIdx = tripHeaders.indexOf('route_id');
                if (tripShapeIdx >= 0 && tripRouteIdx >= 0) {
                    for (let index = 1; index < tripsRows.length; index += 1) {
                        const columns = this.parseCsvLine(tripsRows[index]);
                        const shapeId = columns[tripShapeIdx]?.trim();
                        const routeId = columns[tripRouteIdx]?.trim();
                        if (shapeId && routeId && !shapeToRoute.has(shapeId)) {
                            shapeToRoute.set(shapeId, routeId);
                        }
                    }
                }
            }
        }
        const routeIdToName = new Map();
        if (routesEntry) {
            const routeRows = this.parseCsvText(zip.readAsText(routesEntry));
            if (routeRows.length > 0) {
                const routeHeaders = this.parseCsvLine(routeRows[0]);
                const routeIdIdx = routeHeaders.indexOf('route_id');
                const longNameIdx = routeHeaders.indexOf('route_long_name');
                const shortNameIdx = routeHeaders.indexOf('route_short_name');
                if (routeIdIdx >= 0) {
                    for (let index = 1; index < routeRows.length; index += 1) {
                        const columns = this.parseCsvLine(routeRows[index]);
                        const routeId = columns[routeIdIdx]?.trim();
                        if (!routeId) {
                            continue;
                        }
                        const routeName = columns[longNameIdx]?.trim() ||
                            columns[shortNameIdx]?.trim() ||
                            routeId;
                        routeIdToName.set(routeId, routeName);
                    }
                }
            }
        }
        const grouped = new Map();
        for (const point of points) {
            const bucket = grouped.get(point.shapeId) || [];
            bucket.push(point);
            grouped.set(point.shapeId, bucket);
        }
        const routes = [];
        for (const [shapeId, shapePoints] of grouped.entries()) {
            const ordered = [...shapePoints].sort((a, b) => a.sequence - b.sequence);
            const coordinates = this.removeExactDuplicates(ordered.map((point) => [point.lon, point.lat]));
            if (coordinates.length < 2) {
                warnings.push(`Shape ${shapeId}: fewer than 2 unique points after cleanup; skipped.`);
                continue;
            }
            const routeId = shapeToRoute.get(shapeId);
            const routeName = routeId ? routeIdToName.get(routeId) : undefined;
            routes.push({
                id: shapeId,
                routeId,
                routeName,
                coordinates,
            });
        }
        if (routes.length === 0) {
            throw new common_1.BadRequestException(`No valid route geometries generated from GTFS. ${warnings.join(' | ')}`);
        }
        return { sourceType: 'gtfs', routes, warnings };
    }
    probeGpx(gpxFile, gpxContent) {
        const xml = gpxFile?.buffer?.toString('utf-8') || gpxContent || '';
        if (!xml.trim()) {
            throw new common_1.BadRequestException('GPX payload is empty.');
        }
        const warnings = [];
        const routes = [];
        const tracks = Array.from(xml.matchAll(/<trk[\s\S]*?<\/trk>/gi)).map((match) => match[0]);
        if (tracks.length > 0) {
            tracks.forEach((track, index) => {
                const trackName = track.match(/<name>([^<]+)<\/name>/i)?.[1]?.trim() ||
                    `gpx-track-${index + 1}`;
                const points = this.extractGpxPoints(track, 'trkpt');
                const deduped = this.removeExactDuplicates(points);
                if (deduped.length < 2) {
                    warnings.push(`Track ${trackName}: fewer than 2 points; skipped.`);
                    return;
                }
                routes.push({
                    id: trackName,
                    routeName: trackName,
                    coordinates: deduped,
                });
            });
        }
        if (routes.length === 0) {
            const routePoints = this.extractGpxPoints(xml, 'rtept');
            const deduped = this.removeExactDuplicates(routePoints);
            if (deduped.length >= 2) {
                routes.push({
                    id: 'gpx-route-1',
                    routeName: 'gpx-route-1',
                    coordinates: deduped,
                });
            }
        }
        if (routes.length === 0) {
            throw new common_1.BadRequestException('No valid GPX track/route points found.');
        }
        return { sourceType: 'gpx', routes, warnings };
    }
    writeArtifacts(jobId, sourceType, routes, warnings, tolerance) {
        const { rawDir, canonicalDir } = this.resolveDataDirs();
        (0, fs_1.mkdirSync)(rawDir, { recursive: true });
        (0, fs_1.mkdirSync)(canonicalDir, { recursive: true });
        const routeArtifacts = [];
        for (const route of routes) {
            const safeId = this.safeFileSegment(route.id);
            const rawPath = (0, path_1.resolve)(rawDir, `route-${safeId}.geojson`);
            const canonicalPath = (0, path_1.resolve)(canonicalDir, `route-${safeId}.geojson`);
            const rawCoordinates = this.removeExactDuplicates(route.coordinates);
            const canonicalCoordinates = this.normalizeCoordinates(rawCoordinates, tolerance);
            if (rawCoordinates.length < 2) {
                warnings.push(`Route ${route.id}: fewer than 2 raw points; skipped.`);
                continue;
            }
            if (canonicalCoordinates.length < 2) {
                warnings.push(`Route ${route.id}: fewer than 2 canonical points; skipped.`);
                continue;
            }
            (0, fs_1.writeFileSync)(rawPath, JSON.stringify(this.asFeatureCollection(route, rawCoordinates), null, 2));
            (0, fs_1.writeFileSync)(canonicalPath, JSON.stringify(this.asFeatureCollection(route, canonicalCoordinates), null, 2));
            routeArtifacts.push({
                id: route.id,
                routeId: route.routeId,
                routeName: route.routeName,
                rawPath,
                canonicalPath,
                rawPointCount: rawCoordinates.length,
                canonicalPointCount: canonicalCoordinates.length,
            });
        }
        if (routeArtifacts.length === 0) {
            throw new common_1.BadRequestException(`No artifacts generated. ${warnings.join(' | ')}`);
        }
        const shapes = routeArtifacts.map((route) => ({
            id: route.id,
            pointCount: route.rawPointCount,
            canonicalPointCount: route.canonicalPointCount,
            routeId: route.routeId,
            routeName: route.routeName,
        }));
        const pointCount = shapes.reduce((sum, shape) => sum + shape.pointCount, 0);
        const canonicalPointCount = shapes.reduce((sum, shape) => sum + shape.canonicalPointCount, 0);
        return {
            jobId,
            status: 'completed',
            sourceType,
            stats: {
                shapeCount: shapes.length,
                pointCount,
                canonicalPointCount,
            },
            shapes,
            routeArtifacts,
            validationWarnings: warnings,
            dataDirs: {
                raw: rawDir,
                canonical: canonicalDir,
            },
        };
    }
    resolveDataDirs() {
        const configuredDataDir = process.env.DATA_DIR || './data';
        const dataDir = (0, path_1.isAbsolute)(configuredDataDir)
            ? configuredDataDir
            : (0, path_1.resolve)(process.cwd(), configuredDataDir);
        const rawDir = (0, path_1.resolve)(dataDir, 'raw');
        const canonicalDir = (0, path_1.resolve)(dataDir, 'canonical');
        const samplesDir = (0, path_1.resolve)(dataDir, 'samples');
        return { dataDir, rawDir, canonicalDir, samplesDir };
    }
    resolveSpacingMeters(value) {
        if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
            return value;
        }
        if (Number.isFinite(this.defaultSampleSpacingMeters) &&
            this.defaultSampleSpacingMeters > 0) {
            return this.defaultSampleSpacingMeters;
        }
        return 20;
    }
    findRouteArtifact(routeId) {
        const routes = this.listRoutes().routes;
        const found = routes.find((route) => route.id === routeId);
        if (!found) {
            throw new common_1.NotFoundException(`Route not found for routeId=${routeId}. Run probe first.`);
        }
        return found;
    }
    sampleLineString(coordinates, spacingMeters) {
        const distances = [0];
        for (let index = 1; index < coordinates.length; index += 1) {
            const segmentDistance = this.distanceMeters(coordinates[index - 1], coordinates[index]);
            distances.push(distances[index - 1] + segmentDistance);
        }
        const totalDistance = distances[distances.length - 1];
        const targets = [0];
        for (let nextDistance = spacingMeters; nextDistance < totalDistance; nextDistance += spacingMeters) {
            targets.push(nextDistance);
        }
        if (totalDistance > 0) {
            targets.push(totalDistance);
        }
        const samples = [];
        for (let targetIndex = 0; targetIndex < targets.length; targetIndex += 1) {
            const targetDistance = targets[targetIndex];
            let segmentIndex = 1;
            while (segmentIndex < distances.length &&
                distances[segmentIndex] < targetDistance) {
                segmentIndex += 1;
            }
            const prevIndex = Math.max(0, segmentIndex - 1);
            const nextIndex = Math.min(coordinates.length - 1, segmentIndex);
            const segmentStartDistance = distances[prevIndex];
            const segmentEndDistance = distances[nextIndex];
            const segmentLength = Math.max(0, segmentEndDistance - segmentStartDistance);
            const ratio = segmentLength === 0
                ? 0
                : (targetDistance - segmentStartDistance) / segmentLength;
            const start = coordinates[prevIndex];
            const end = coordinates[nextIndex];
            const point = this.interpolatePoint(start, end, ratio);
            const bearing = this.computeBearing(start, end);
            samples.push({
                seq: targetIndex,
                lat: point[1],
                lng: point[0],
                dist: Number(targetDistance.toFixed(3)),
                bearing,
            });
        }
        if (samples.length === 0) {
            const [startLng, startLat] = coordinates[0];
            samples.push({
                seq: 0,
                lat: startLat,
                lng: startLng,
                dist: 0,
                bearing: 0,
            });
        }
        return samples;
    }
    interpolatePoint(start, end, ratio) {
        const clampedRatio = Math.min(1, Math.max(0, ratio));
        return [
            start[0] + (end[0] - start[0]) * clampedRatio,
            start[1] + (end[1] - start[1]) * clampedRatio,
        ];
    }
    distanceMeters(start, end) {
        const [lng1, lat1] = start;
        const [lng2, lat2] = end;
        const earthRadius = 6371000;
        const rad = Math.PI / 180;
        const lat1Rad = lat1 * rad;
        const lat2Rad = lat2 * rad;
        const deltaLat = (lat2 - lat1) * rad;
        const deltaLng = (lng2 - lng1) * rad;
        const sinHalfLat = Math.sin(deltaLat / 2);
        const sinHalfLng = Math.sin(deltaLng / 2);
        const a = sinHalfLat * sinHalfLat +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) * sinHalfLng * sinHalfLng;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadius * c;
    }
    computeBearing(start, end) {
        const [lng1, lat1] = start;
        const [lng2, lat2] = end;
        const rad = Math.PI / 180;
        const phi1 = lat1 * rad;
        const phi2 = lat2 * rad;
        const lambda1 = lng1 * rad;
        const lambda2 = lng2 * rad;
        const y = Math.sin(lambda2 - lambda1) * Math.cos(phi2);
        const x = Math.cos(phi1) * Math.sin(phi2) -
            Math.sin(phi1) * Math.cos(phi2) * Math.cos(lambda2 - lambda1);
        const bearingDeg = (Math.atan2(y, x) * 180) / Math.PI;
        return Number(((bearingDeg + 360) % 360 || 0).toFixed(3));
    }
    resolveTolerance(value) {
        if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
            return value;
        }
        return this.defaultTolerance;
    }
    parseCsvText(csv) {
        return csv
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
    }
    extractGpxPoints(xmlChunk, tag) {
        const regex = new RegExp(`<${tag}\\b([^>]*)>`, 'gi');
        const points = [];
        let match = regex.exec(xmlChunk);
        while (match) {
            const attributes = match[1] || '';
            const lat = Number(attributes.match(/lat="([^"]+)"/i)?.[1]);
            const lon = Number(attributes.match(/lon="([^"]+)"/i)?.[1]);
            if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
                points.push([lon, lat]);
            }
            match = regex.exec(xmlChunk);
        }
        return points;
    }
    removeExactDuplicates(coordinates) {
        const deduped = [];
        let lastKey = '';
        for (const coordinate of coordinates) {
            const key = `${coordinate[0]}:${coordinate[1]}`;
            if (key !== lastKey) {
                deduped.push(coordinate);
                lastKey = key;
            }
        }
        return deduped;
    }
    normalizeCoordinates(coordinates, tolerance) {
        if (coordinates.length <= 2) {
            return coordinates.map((point) => this.snapPoint(point));
        }
        const snapped = coordinates.map((point) => this.snapPoint(point));
        const deduped = this.removeExactDuplicates(snapped);
        if (deduped.length <= 2) {
            return deduped;
        }
        const reduced = [deduped[0]];
        for (let index = 1; index < deduped.length - 1; index += 1) {
            const previous = reduced[reduced.length - 1];
            const current = deduped[index];
            const next = deduped[index + 1];
            const distance = this.pointLineDistance(previous, current, next);
            if (distance >= tolerance) {
                reduced.push(current);
            }
        }
        reduced.push(deduped[deduped.length - 1]);
        return this.removeExactDuplicates(reduced);
    }
    snapPoint(point) {
        const precision = Math.max(0, this.snapPrecision);
        return [
            Number(point[0].toFixed(precision)),
            Number(point[1].toFixed(precision)),
        ];
    }
    pointLineDistance(pointA, pointB, pointC) {
        const [x1, y1] = pointA;
        const [x0, y0] = pointB;
        const [x2, y2] = pointC;
        const denominator = Math.hypot(x2 - x1, y2 - y1);
        if (denominator === 0) {
            return Math.hypot(x0 - x1, y0 - y1);
        }
        return (Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1) /
            denominator);
    }
    asFeatureCollection(route, coordinates) {
        return {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {
                        shape_id: route.id,
                        route_id: route.routeId || null,
                        route_name: route.routeName || null,
                    },
                    geometry: {
                        type: 'LineString',
                        coordinates,
                    },
                },
            ],
        };
    }
    safeFileSegment(value) {
        return (value
            .trim()
            .replace(/[^a-zA-Z0-9_-]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || 'route');
    }
    parseCsvLine(line) {
        const values = [];
        let current = '';
        let insideQuotes = false;
        for (let index = 0; index < line.length; index += 1) {
            const char = line[index];
            if (char === '"') {
                const nextChar = line[index + 1];
                if (insideQuotes && nextChar === '"') {
                    current += '"';
                    index += 1;
                }
                else {
                    insideQuotes = !insideQuotes;
                }
                continue;
            }
            if (char === ',' && !insideQuotes) {
                values.push(current);
                current = '';
                continue;
            }
            current += char;
        }
        values.push(current);
        return values;
    }
};
exports.IngestService = IngestService;
exports.IngestService = IngestService = IngestService_1 = __decorate([
    (0, common_1.Injectable)()
], IngestService);
//# sourceMappingURL=ingest.service.js.map