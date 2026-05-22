export type GpxUploadFile = {
    buffer: Buffer;
    originalname: string;
};
type ProbeInput = {
    gtfsZipPath?: string;
    gpxFile?: GpxUploadFile;
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
export declare class IngestService {
    private readonly logger;
    private readonly jobs;
    private readonly jobLogs;
    private readonly defaultTolerance;
    private readonly snapPrecision;
    private readonly defaultSampleSpacingMeters;
    queueProbe(input: ProbeInput): {
        jobId: string;
        status: 'queued';
    };
    getProbeLogs(jobId: string, limit?: number): {
        jobId: string;
        lines: string[];
    };
    resolveDownloadPath(input: {
        routeId: string;
        view?: 'raw' | 'canonical' | 'samples';
    }): {
        filePath: string;
        fileName: string;
    };
    getProbeJob(jobId: string): ProbeJob;
    sampleRoute(input: {
        routeId: string;
        spacingMeters?: number;
    }): RouteSampleOutput;
    listRoutes(): {
        dataDir: string;
        rawDir: string;
        canonicalDir: string;
        routes: ListedRoute[];
    };
    private processProbeJob;
    private appendJobLog;
    private probeGtfs;
    private probeGpx;
    private writeArtifacts;
    private resolveDataDirs;
    private resolveSpacingMeters;
    private findRouteArtifact;
    private sampleLineString;
    private interpolatePoint;
    private distanceMeters;
    private computeBearing;
    private resolveTolerance;
    private parseCsvText;
    private extractGpxPoints;
    private removeExactDuplicates;
    private normalizeCoordinates;
    private snapPoint;
    private pointLineDistance;
    private asFeatureCollection;
    private safeFileSegment;
    private parseCsvLine;
}
export {};
