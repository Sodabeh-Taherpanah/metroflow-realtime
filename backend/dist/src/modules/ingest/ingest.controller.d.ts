import { IngestService, type GpxUploadFile } from "./ingest.service";
declare class ProbeIngestDto {
    gtfsZipPath?: string;
    gpxContent?: string;
    normalizationTolerance?: string;
}
declare class SampleRouteDto {
    routeId: string;
    spacingMeters?: string;
}
export declare class IngestController {
    private readonly ingestService;
    constructor(ingestService: IngestService);
    getStatus(): void;
    probe(body: ProbeIngestDto, gpxFile?: GpxUploadFile): {
        jobId: string;
        status: "queued";
    };
    getProbeJob(jobId: string): {
        jobId: string;
        status: "completed" | "queued" | "running" | "failed";
        createdAt: string;
        updatedAt: string;
        error?: string;
        result?: {
            jobId: string;
            status: "completed";
            sourceType: "gtfs" | "gpx";
            stats: {
                shapeCount: number;
                pointCount: number;
                canonicalPointCount: number;
            };
            shapes: {
                id: string;
                pointCount: number;
                canonicalPointCount: number;
                routeId?: string;
                routeName?: string;
            }[];
            routeArtifacts: {
                id: string;
                routeId?: string;
                routeName?: string;
                rawPath: string;
                canonicalPath: string;
                rawPointCount: number;
                canonicalPointCount: number;
            }[];
            validationWarnings: string[];
            dataDirs: {
                raw: string;
                canonical: string;
            };
        };
    };
    getRoutes(): {
        dataDir: string;
        rawDir: string;
        canonicalDir: string;
        routes: {
            id: string;
            routeId?: string;
            routeName?: string;
            rawPath?: string;
            canonicalPath?: string;
            rawPointCount?: number;
            canonicalPointCount?: number;
        }[];
    };
    sampleRoute(body: SampleRouteDto): {
        routeId: string;
        sourcePath: string;
        outputPath: string;
        spacingMeters: number;
        sampleCount: number;
        totalDistanceMeters: number;
        firstPoint: {
            seq: number;
            lat: number;
            lng: number;
            dist: number;
            bearing: number;
        };
        lastPoint: {
            seq: number;
            lat: number;
            lng: number;
            dist: number;
            bearing: number;
        };
    };
}
export {};
