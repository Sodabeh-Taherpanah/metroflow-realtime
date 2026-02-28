import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import { randomUUID } from 'crypto';
import { basename, extname, isAbsolute, resolve } from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AdmZip = require('adm-zip');

type ProbeInput = {
  gtfsZipPath?: string;
  gpxFile?: Express.Multer.File;
  gpxContent?: string;
  normalizationTolerance?: number;
};

type ProbeShape = {
  id: string;
  pointCount: number;
  canonicalPointCount: number;
  routeId?: string;
  routeName?: string;
};

type RouteArtifact = {
  id: string;
  routeId?: string;
  routeName?: string;
  rawPath: string;
  canonicalPath: string;
  rawPointCount: number;
  canonicalPointCount: number;
};

type ProbeResponse = {
  jobId: string;
  status: 'completed';
  sourceType: 'gtfs' | 'gpx';
  stats: {
    shapeCount: number;
    pointCount: number;
    canonicalPointCount: number;
  };
  shapes: ProbeShape[];
  routeArtifacts: RouteArtifact[];
  validationWarnings: string[];
  dataDirs: {
    raw: string;
    canonical: string;
  };
};

type ProbeJobStatus = 'queued' | 'running' | 'completed' | 'failed';

type ProbeJob = {
  jobId: string;
  status: ProbeJobStatus;
  createdAt: string;
  updatedAt: string;
  error?: string;
  result?: ProbeResponse;
};

type ParsedShapePoint = {
  shapeId: string;
  lat: number;
  lon: number;
  sequence: number;
};

type RouteCandidate = {
  id: string;
  routeId?: string;
  routeName?: string;
  coordinates: Array<[number, number]>;
};

type ProbeBuildOutput = {
  sourceType: 'gtfs' | 'gpx';
  routes: RouteCandidate[];
  warnings: string[];
};

type ListedRoute = {
  id: string;
  routeId?: string;
  routeName?: string;
  rawPath?: string;
  canonicalPath?: string;
  rawPointCount?: number;
  canonicalPointCount?: number;
};

type RouteSamplePoint = {
  seq: number;
  lat: number;
  lng: number;
  dist: number;
  bearing: number;
};

type RouteSampleOutput = {
  routeId: string;
  sourcePath: string;
  outputPath: string;
  spacingMeters: number;
  sampleCount: number;
  totalDistanceMeters: number;
  firstPoint: RouteSamplePoint;
  lastPoint: RouteSamplePoint;
};

@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);
  private readonly jobs = new Map<string, ProbeJob>();
  private readonly defaultTolerance = Number(
    process.env.NORMALIZATION_TOLERANCE || 0.00003,
  );
  private readonly snapPrecision = Number(process.env.SNAP_PRECISION || 6);
  private readonly defaultSampleSpacingMeters = Number(
    process.env.SAMPLE_SPACING_METERS || 20,
  );

  queueProbe(input: ProbeInput): { jobId: string; status: 'queued' } {
    const hasGtfsPath = Boolean(input.gtfsZipPath?.trim());
    const hasGpx = Boolean(input.gpxFile || input.gpxContent?.trim());

    if (!hasGtfsPath && !hasGpx) {
      throw new BadRequestException(
        'Provide either gtfsZipPath or gpxFile/gpxContent.',
      );
    }

    const jobId = randomUUID();
    const now = new Date().toISOString();
    this.jobs.set(jobId, {
      jobId,
      status: 'queued',
      createdAt: now,
      updatedAt: now,
    });

    this.logger.log(
      `[probe:${jobId}] queued gtfsZipPath=${input.gtfsZipPath || 'none'} gpxFile=${input.gpxFile?.originalname || 'none'}`,
    );

    setTimeout(() => {
      this.processProbeJob(jobId, input);
    }, 0);

    return { jobId, status: 'queued' };
  }

  getProbeJob(jobId: string): ProbeJob {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new NotFoundException(`Probe job not found: ${jobId}`);
    }

    return job;
  }

  sampleRoute(input: {
    routeId: string;
    spacingMeters?: number;
  }): RouteSampleOutput {
    const routeId = input.routeId?.trim();
    if (!routeId) {
      throw new BadRequestException('routeId is required.');
    }

    const spacingMeters = this.resolveSpacingMeters(input.spacingMeters);
    const route = this.findRouteArtifact(routeId);
    const sourcePath = route.canonicalPath || route.rawPath;
    if (!sourcePath) {
      throw new NotFoundException(
        `No route artifact found for routeId=${routeId}. Run probe first.`,
      );
    }

    const geojson = JSON.parse(readFileSync(sourcePath, 'utf-8'));
    const coordinates =
      geojson?.features?.[0]?.geometry?.type === 'LineString'
        ? geojson?.features?.[0]?.geometry?.coordinates
        : undefined;

    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      throw new BadRequestException(
        `Route ${routeId} does not contain a valid LineString with >= 2 points.`,
      );
    }

    const normalizedCoordinates = coordinates.map((point: any) => [
      Number(point?.[0]),
      Number(point?.[1]),
    ]) as Array<[number, number]>;

    if (
      normalizedCoordinates.some(
        ([lng, lat]) => Number.isNaN(lng) || Number.isNaN(lat),
      )
    ) {
      throw new BadRequestException(
        `Route ${routeId} contains invalid coordinate values.`,
      );
    }

    const samples = this.sampleLineString(normalizedCoordinates, spacingMeters);
    const { samplesDir } = this.resolveDataDirs();
    mkdirSync(samplesDir, { recursive: true });

    const safeId = this.safeFileSegment(routeId);
    const outputPath = resolve(samplesDir, `route-${safeId}-samples.json`);
    writeFileSync(
      outputPath,
      JSON.stringify(
        {
          routeId,
          sourcePath,
          spacingMeters,
          sampleCount: samples.length,
          totalDistanceMeters: samples[samples.length - 1]?.dist || 0,
          samples,
        },
        null,
        2,
      ),
    );

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

  listRoutes(): {
    dataDir: string;
    rawDir: string;
    canonicalDir: string;
    routes: ListedRoute[];
  } {
    const { dataDir, rawDir, canonicalDir } = this.resolveDataDirs();
    mkdirSync(rawDir, { recursive: true });
    mkdirSync(canonicalDir, { recursive: true });

    const routesMap = new Map<string, ListedRoute>();

    const applyFile = (filePath: string, isCanonical: boolean) => {
      try {
        const file = JSON.parse(readFileSync(filePath, 'utf-8'));
        const feature = file?.features?.[0];
        const properties = feature?.properties || {};
        const points = feature?.geometry?.coordinates || [];
        const id =
          properties.shape_id ||
          basename(filePath, extname(filePath)).replace(/^route-/, '');

        const existing: ListedRoute = routesMap.get(id) || { id };
        if (isCanonical) {
          existing.canonicalPath = filePath;
          existing.canonicalPointCount = Array.isArray(points)
            ? points.length
            : undefined;
        } else {
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
      } catch {
        // Skip malformed files
      }
    };

    for (const file of readdirSync(rawDir)) {
      if (file.endsWith('.geojson')) {
        applyFile(resolve(rawDir, file), false);
      }
    }

    for (const file of readdirSync(canonicalDir)) {
      if (file.endsWith('.geojson')) {
        applyFile(resolve(canonicalDir, file), true);
      }
    }

    return {
      dataDir,
      rawDir,
      canonicalDir,
      routes: Array.from(routesMap.values()).sort((a, b) =>
        String(a.id).localeCompare(String(b.id)),
      ),
    };
  }

  private processProbeJob(jobId: string, input: ProbeInput) {
    const job = this.jobs.get(jobId);
    if (!job) {
      return;
    }

    job.status = 'running';
    job.updatedAt = new Date().toISOString();
    this.jobs.set(jobId, job);

    this.logger.log(
      `[probe:${jobId}] started gtfsZipPath=${input.gtfsZipPath || 'none'} gpxFile=${input.gpxFile?.originalname || 'none'}`,
    );

    try {
      const hasGtfsPath = Boolean(input.gtfsZipPath?.trim());
      const tolerance = this.resolveTolerance(input.normalizationTolerance);
      const buildOutput = hasGtfsPath
        ? this.probeGtfs(input.gtfsZipPath!.trim())
        : this.probeGpx(input.gpxFile, input.gpxContent);

      const result = this.writeArtifacts(
        jobId,
        buildOutput.sourceType,
        buildOutput.routes,
        buildOutput.warnings,
        tolerance,
      );

      job.status = 'completed';
      job.result = result;
      job.updatedAt = new Date().toISOString();
      this.jobs.set(jobId, job);

      this.logger.log(
        `[probe:${jobId}] completed source=${result.sourceType} shapes=${result.stats.shapeCount} points=${result.stats.pointCount} canonicalPoints=${result.stats.canonicalPointCount}`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown probe processing error';
      job.status = 'failed';
      job.error = message;
      job.updatedAt = new Date().toISOString();
      this.jobs.set(jobId, job);

      this.logger.error(`[probe:${jobId}] failed: ${message}`);
    }
  }

  private probeGtfs(gtfsZipPath: string): ProbeBuildOutput {
    const resolvedPath = isAbsolute(gtfsZipPath)
      ? gtfsZipPath
      : resolve(process.cwd(), gtfsZipPath);

    if (!existsSync(resolvedPath)) {
      throw new NotFoundException(`GTFS zip not found: ${resolvedPath}`);
    }

    const zip = new AdmZip(resolvedPath);
    const shapesEntry = zip
      .getEntries()
      .find((entry: any) => /(^|\/)shapes\.txt$/i.test(entry.entryName));
    const tripsEntry = zip
      .getEntries()
      .find((entry: any) => /(^|\/)trips\.txt$/i.test(entry.entryName));
    const routesEntry = zip
      .getEntries()
      .find((entry: any) => /(^|\/)routes\.txt$/i.test(entry.entryName));

    if (!shapesEntry) {
      throw new BadRequestException(
        'Invalid GTFS zip: shapes.txt not found in archive.',
      );
    }

    const csv = zip.readAsText(shapesEntry);
    const rows = this.parseCsvText(csv);
    const warnings: string[] = [];

    if (rows.length === 0) {
      throw new BadRequestException('Invalid shapes.txt: no rows found.');
    }

    const headers = this.parseCsvLine(rows[0]);
    const shapeIdIndex = headers.indexOf('shape_id');
    const shapeLatIndex = headers.indexOf('shape_pt_lat');
    const shapeLonIndex = headers.indexOf('shape_pt_lon');
    const shapeSeqIndex = headers.indexOf('shape_pt_sequence');

    if (
      shapeIdIndex < 0 ||
      shapeLatIndex < 0 ||
      shapeLonIndex < 0 ||
      shapeSeqIndex < 0
    ) {
      throw new BadRequestException(
        'Invalid shapes.txt: required columns are shape_id, shape_pt_lat, shape_pt_lon, shape_pt_sequence.',
      );
    }

    const points: ParsedShapePoint[] = [];

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
        warnings.push(
          `Row ${index + 1}: invalid lat/lon/sequence for shape ${shapeId}; skipped.`,
        );
        continue;
      }

      points.push({ shapeId, lat, lon, sequence });
    }

    const shapeToRoute = new Map<string, string>();
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

    const routeIdToName = new Map<string, string>();
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
            const routeName =
              columns[longNameIdx]?.trim() ||
              columns[shortNameIdx]?.trim() ||
              routeId;
            routeIdToName.set(routeId, routeName);
          }
        }
      }
    }

    const grouped = new Map<string, ParsedShapePoint[]>();
    for (const point of points) {
      const bucket = grouped.get(point.shapeId) || [];
      bucket.push(point);
      grouped.set(point.shapeId, bucket);
    }

    const routes: RouteCandidate[] = [];
    for (const [shapeId, shapePoints] of grouped.entries()) {
      const ordered = [...shapePoints].sort((a, b) => a.sequence - b.sequence);
      const coordinates = this.removeExactDuplicates(
        ordered.map((point) => [point.lon, point.lat] as [number, number]),
      );

      if (coordinates.length < 2) {
        warnings.push(
          `Shape ${shapeId}: fewer than 2 unique points after cleanup; skipped.`,
        );
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
      throw new BadRequestException(
        `No valid route geometries generated from GTFS. ${warnings.join(' | ')}`,
      );
    }

    return { sourceType: 'gtfs', routes, warnings };
  }

  private probeGpx(
    gpxFile: Express.Multer.File | undefined,
    gpxContent: string | undefined,
  ): ProbeBuildOutput {
    const xml = gpxFile?.buffer?.toString('utf-8') || gpxContent || '';
    if (!xml.trim()) {
      throw new BadRequestException('GPX payload is empty.');
    }

    const warnings: string[] = [];
    const routes: RouteCandidate[] = [];

    const tracks = Array.from(xml.matchAll(/<trk[\s\S]*?<\/trk>/gi)).map(
      (match) => match[0],
    );

    if (tracks.length > 0) {
      tracks.forEach((track, index) => {
        const trackName =
          track.match(/<name>([^<]+)<\/name>/i)?.[1]?.trim() ||
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
      throw new BadRequestException('No valid GPX track/route points found.');
    }

    return { sourceType: 'gpx', routes, warnings };
  }

  private writeArtifacts(
    jobId: string,
    sourceType: 'gtfs' | 'gpx',
    routes: RouteCandidate[],
    warnings: string[],
    tolerance: number,
  ): ProbeResponse {
    const { rawDir, canonicalDir } = this.resolveDataDirs();
    mkdirSync(rawDir, { recursive: true });
    mkdirSync(canonicalDir, { recursive: true });

    const routeArtifacts: RouteArtifact[] = [];

    for (const route of routes) {
      const safeId = this.safeFileSegment(route.id);
      const rawPath = resolve(rawDir, `route-${safeId}.geojson`);
      const canonicalPath = resolve(canonicalDir, `route-${safeId}.geojson`);

      const rawCoordinates = this.removeExactDuplicates(route.coordinates);
      const canonicalCoordinates = this.normalizeCoordinates(
        rawCoordinates,
        tolerance,
      );

      if (rawCoordinates.length < 2) {
        warnings.push(`Route ${route.id}: fewer than 2 raw points; skipped.`);
        continue;
      }

      if (canonicalCoordinates.length < 2) {
        warnings.push(
          `Route ${route.id}: fewer than 2 canonical points; skipped.`,
        );
        continue;
      }

      writeFileSync(
        rawPath,
        JSON.stringify(
          this.asFeatureCollection(route, rawCoordinates),
          null,
          2,
        ),
      );
      writeFileSync(
        canonicalPath,
        JSON.stringify(
          this.asFeatureCollection(route, canonicalCoordinates),
          null,
          2,
        ),
      );

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
      throw new BadRequestException(
        `No artifacts generated. ${warnings.join(' | ')}`,
      );
    }

    const shapes: ProbeShape[] = routeArtifacts.map((route) => ({
      id: route.id,
      pointCount: route.rawPointCount,
      canonicalPointCount: route.canonicalPointCount,
      routeId: route.routeId,
      routeName: route.routeName,
    }));

    const pointCount = shapes.reduce((sum, shape) => sum + shape.pointCount, 0);
    const canonicalPointCount = shapes.reduce(
      (sum, shape) => sum + shape.canonicalPointCount,
      0,
    );

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

  private resolveDataDirs(): {
    dataDir: string;
    rawDir: string;
    canonicalDir: string;
    samplesDir: string;
  } {
    const configuredDataDir = process.env.DATA_DIR || './data';
    const dataDir = isAbsolute(configuredDataDir)
      ? configuredDataDir
      : resolve(process.cwd(), configuredDataDir);
    const rawDir = resolve(dataDir, 'raw');
    const canonicalDir = resolve(dataDir, 'canonical');
    const samplesDir = resolve(dataDir, 'samples');
    return { dataDir, rawDir, canonicalDir, samplesDir };
  }

  private resolveSpacingMeters(value: number | undefined): number {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value;
    }

    if (
      Number.isFinite(this.defaultSampleSpacingMeters) &&
      this.defaultSampleSpacingMeters > 0
    ) {
      return this.defaultSampleSpacingMeters;
    }

    return 20;
  }

  private findRouteArtifact(routeId: string): ListedRoute {
    const routes = this.listRoutes().routes;
    const found = routes.find((route) => route.id === routeId);
    if (!found) {
      throw new NotFoundException(
        `Route not found for routeId=${routeId}. Run probe first.`,
      );
    }
    return found;
  }

  private sampleLineString(
    coordinates: Array<[number, number]>,
    spacingMeters: number,
  ): RouteSamplePoint[] {
    const distances: number[] = [0];

    for (let index = 1; index < coordinates.length; index += 1) {
      const segmentDistance = this.distanceMeters(
        coordinates[index - 1],
        coordinates[index],
      );
      distances.push(distances[index - 1] + segmentDistance);
    }

    const totalDistance = distances[distances.length - 1];
    const targets: number[] = [0];
    for (
      let nextDistance = spacingMeters;
      nextDistance < totalDistance;
      nextDistance += spacingMeters
    ) {
      targets.push(nextDistance);
    }
    if (totalDistance > 0) {
      targets.push(totalDistance);
    }

    const samples: RouteSamplePoint[] = [];

    for (let targetIndex = 0; targetIndex < targets.length; targetIndex += 1) {
      const targetDistance = targets[targetIndex];
      let segmentIndex = 1;
      while (
        segmentIndex < distances.length &&
        distances[segmentIndex] < targetDistance
      ) {
        segmentIndex += 1;
      }

      const prevIndex = Math.max(0, segmentIndex - 1);
      const nextIndex = Math.min(coordinates.length - 1, segmentIndex);
      const segmentStartDistance = distances[prevIndex];
      const segmentEndDistance = distances[nextIndex];
      const segmentLength = Math.max(
        0,
        segmentEndDistance - segmentStartDistance,
      );
      const ratio =
        segmentLength === 0
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

  private interpolatePoint(
    start: [number, number],
    end: [number, number],
    ratio: number,
  ): [number, number] {
    const clampedRatio = Math.min(1, Math.max(0, ratio));
    return [
      start[0] + (end[0] - start[0]) * clampedRatio,
      start[1] + (end[1] - start[1]) * clampedRatio,
    ];
  }

  private distanceMeters(
    start: [number, number],
    end: [number, number],
  ): number {
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

    const a =
      sinHalfLat * sinHalfLat +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * sinHalfLng * sinHalfLng;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  }

  private computeBearing(
    start: [number, number],
    end: [number, number],
  ): number {
    const [lng1, lat1] = start;
    const [lng2, lat2] = end;
    const rad = Math.PI / 180;

    const phi1 = lat1 * rad;
    const phi2 = lat2 * rad;
    const lambda1 = lng1 * rad;
    const lambda2 = lng2 * rad;

    const y = Math.sin(lambda2 - lambda1) * Math.cos(phi2);
    const x =
      Math.cos(phi1) * Math.sin(phi2) -
      Math.sin(phi1) * Math.cos(phi2) * Math.cos(lambda2 - lambda1);

    const bearingDeg = (Math.atan2(y, x) * 180) / Math.PI;
    return Number(((bearingDeg + 360) % 360 || 0).toFixed(3));
  }

  private resolveTolerance(value: number | undefined): number {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      return value;
    }
    return this.defaultTolerance;
  }

  private parseCsvText(csv: string): string[] {
    return csv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  private extractGpxPoints(
    xmlChunk: string,
    tag: 'trkpt' | 'rtept',
  ): Array<[number, number]> {
    const regex = new RegExp(`<${tag}\\b([^>]*)>`, 'gi');
    const points: Array<[number, number]> = [];
    let match: RegExpExecArray | null = regex.exec(xmlChunk);

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

  private removeExactDuplicates(
    coordinates: Array<[number, number]>,
  ): Array<[number, number]> {
    const deduped: Array<[number, number]> = [];
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

  private normalizeCoordinates(
    coordinates: Array<[number, number]>,
    tolerance: number,
  ): Array<[number, number]> {
    if (coordinates.length <= 2) {
      return coordinates.map((point) => this.snapPoint(point));
    }

    const snapped = coordinates.map((point) => this.snapPoint(point));
    const deduped = this.removeExactDuplicates(snapped);
    if (deduped.length <= 2) {
      return deduped;
    }

    const reduced: Array<[number, number]> = [deduped[0]];

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

  private snapPoint(point: [number, number]): [number, number] {
    const precision = Math.max(0, this.snapPrecision);
    return [
      Number(point[0].toFixed(precision)),
      Number(point[1].toFixed(precision)),
    ];
  }

  private pointLineDistance(
    pointA: [number, number],
    pointB: [number, number],
    pointC: [number, number],
  ): number {
    const [x1, y1] = pointA;
    const [x0, y0] = pointB;
    const [x2, y2] = pointC;

    const denominator = Math.hypot(x2 - x1, y2 - y1);
    if (denominator === 0) {
      return Math.hypot(x0 - x1, y0 - y1);
    }

    return (
      Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1) /
      denominator
    );
  }

  private asFeatureCollection(
    route: RouteCandidate,
    coordinates: Array<[number, number]>,
  ) {
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

  private safeFileSegment(value: string): string {
    return (
      value
        .trim()
        .replace(/[^a-zA-Z0-9_-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'route'
    );
  }

  private parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let insideQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];

      if (char === '"') {
        const nextChar = line[index + 1];
        if (insideQuotes && nextChar === '"') {
          current += '"';
          index += 1;
        } else {
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
}
