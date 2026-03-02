"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const globals_1 = require("@jest/globals");
const ingest_service_1 = require("./ingest.service");
(0, globals_1.describe)("IngestService sampler", () => {
    const baseDir = (0, path_1.resolve)(process.cwd(), ".tmp-tests", `ingest-sampler-${Date.now()}`);
    (0, globals_1.beforeEach)(() => {
        process.env.DATA_DIR = baseDir;
        (0, fs_1.rmSync)(baseDir, { recursive: true, force: true });
        if (!(0, fs_1.existsSync)(baseDir))
            (0, fs_1.mkdirSync)((0, path_1.resolve)(baseDir, "canonical"), { recursive: true });
    });
    (0, globals_1.afterAll)(() => {
        (0, fs_1.rmSync)(baseDir, { recursive: true, force: true });
    });
    (0, globals_1.it)("samples linestring near fixed spacing and preserves route end as final sample", () => {
        const routeId = "synthetic-line";
        const canonicalPath = (0, path_1.resolve)(baseDir, "canonical", `route-${routeId}.geojson`);
        const lineString = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    properties: {
                        shape_id: routeId,
                        route_id: "R1",
                        route_name: "Synthetic",
                    },
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            [0, 0],
                            [0.001, 0],
                        ],
                    },
                },
            ],
        };
        (0, fs_1.writeFileSync)(canonicalPath, JSON.stringify(lineString, null, 2));
        const service = new ingest_service_1.IngestService();
        const result = service.sampleRoute({ routeId, spacingMeters: 20 });
        (0, globals_1.expect)(result.sampleCount).toBeGreaterThan(2);
        (0, globals_1.expect)((0, fs_1.existsSync)(result.outputPath)).toBe(true);
        const output = JSON.parse((0, fs_1.readFileSync)(result.outputPath, "utf-8"));
        const samples = output.samples;
        for (let index = 1; index < samples.length - 1; index += 1) {
            const current = samples[index];
            const previous = samples[index - 1];
            if (!current || !previous) {
                continue;
            }
            const step = current.dist - previous.dist;
            (0, globals_1.expect)(step).toBeGreaterThanOrEqual(18);
            (0, globals_1.expect)(step).toBeLessThanOrEqual(22);
        }
        const lastSample = samples[samples.length - 1];
        if (!lastSample) {
            throw new Error("Expected at least one sample point");
        }
        (0, globals_1.expect)(lastSample.lng).toBeCloseTo(0.001, 6);
        (0, globals_1.expect)(lastSample.lat).toBeCloseTo(0, 6);
    });
});
//# sourceMappingURL=ingest.service.spec.js.map