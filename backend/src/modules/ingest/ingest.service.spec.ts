import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { afterAll, beforeEach, describe, expect, it } from "@jest/globals";
import { IngestService } from "./ingest.service";

describe("IngestService sampler", () => {
  const baseDir = resolve(
    process.cwd(),
    ".tmp-tests",
    `ingest-sampler-${Date.now()}`,
  );

  beforeEach(() => {
    process.env.DATA_DIR = baseDir;
    rmSync(baseDir, { recursive: true, force: true });
    if (!existsSync(baseDir))
      mkdirSync(resolve(baseDir, "canonical"), { recursive: true });
  });

  afterAll(() => {
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("samples linestring near fixed spacing and preserves route end as final sample", () => {
    const routeId = "synthetic-line";
    const canonicalPath = resolve(
      baseDir,
      "canonical",
      `route-${routeId}.geojson`,
    );

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

    writeFileSync(canonicalPath, JSON.stringify(lineString, null, 2));

    const service = new IngestService();
    const result = service.sampleRoute({ routeId, spacingMeters: 20 });

    expect(result.sampleCount).toBeGreaterThan(2);
    expect(existsSync(result.outputPath)).toBe(true);

    const output = JSON.parse(readFileSync(result.outputPath, "utf-8"));
    const samples = output.samples as Array<{
      lat: number;
      lng: number;
      dist: number;
      seq: number;
      bearing: number;
    }>;

    for (let index = 1; index < samples.length - 1; index += 1) {
      const current = samples[index];
      const previous = samples[index - 1];
      if (!current || !previous) {
        continue;
      }

      const step = current.dist - previous.dist;
      expect(step).toBeGreaterThanOrEqual(18);
      expect(step).toBeLessThanOrEqual(22);
    }

    const lastSample = samples[samples.length - 1];
    if (!lastSample) {
      throw new Error("Expected at least one sample point");
    }

    expect(lastSample.lng).toBeCloseTo(0.001, 6);
    expect(lastSample.lat).toBeCloseTo(0, 6);
  });
});
