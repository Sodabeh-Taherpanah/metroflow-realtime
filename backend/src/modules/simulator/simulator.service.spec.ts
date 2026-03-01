import { mkdirSync, rmSync, writeFileSync } from "fs";
import { resolve } from "path";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "@jest/globals";
import { SimulatorService } from "./simulator.service";

describe("SimulatorService", () => {
  const baseDir = resolve(
    process.cwd(),
    ".tmp-tests",
    `simulator-service-${Date.now()}`,
  );

  const createSamples = (routeId: string) => {
    const samplesDir = resolve(baseDir, "samples");
    mkdirSync(samplesDir, { recursive: true });

    writeFileSync(
      resolve(samplesDir, `route-${routeId}-samples.json`),
      JSON.stringify(
        {
          routeId,
          samples: [
            { seq: 0, lat: 52.52, lng: 13.405, dist: 0, bearing: 0 },
            { seq: 1, lat: 52.521, lng: 13.406, dist: 50, bearing: 45 },
            { seq: 2, lat: 52.522, lng: 13.407, dist: 100, bearing: 90 },
          ],
        },
        null,
        2,
      ),
    );
  };

  beforeEach(() => {
    jest.useFakeTimers();
    process.env.DATA_DIR = baseDir;
    rmSync(baseDir, { recursive: true, force: true });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  afterAll(() => {
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("starts a simulation and completes for non-looping jobs", () => {
    createSamples("r1");

    const realtimeGateway = {
      emitAgentLocationUpdate: jest.fn(() => true),
    };
    const service = new SimulatorService(realtimeGateway as any);

    const started = service.startSimulation({
      routeId: "r1",
      intervalMs: 10,
      loop: false,
      agents: 1,
      jitterMeters: 0,
      speedKph: 20,
    });

    expect(started.status).toBe("running");
    expect(started.config.sampleCount).toBe(3);

    jest.advanceTimersByTime(40);

    const job = service.getSimulationJob(started.jobId);
    expect(job.status).toBe("completed");
    expect(job.emittedCount).toBe(3);
    expect(realtimeGateway.emitAgentLocationUpdate).toHaveBeenCalledTimes(3);
  });

  it("throws when routeId is missing", () => {
    const realtimeGateway = {
      emitAgentLocationUpdate: jest.fn(() => true),
    };
    const service = new SimulatorService(realtimeGateway as any);

    expect(() =>
      service.startSimulation({
        routeId: "",
      }),
    ).toThrow(BadRequestException);
  });

  it("throws when the requested job does not exist", () => {
    const realtimeGateway = {
      emitAgentLocationUpdate: jest.fn(() => true),
    };
    const service = new SimulatorService(realtimeGateway as any);

    expect(() => service.getSimulationJob("missing-job")).toThrow(
      NotFoundException,
    );
  });

  it("emits a test update with defaults", () => {
    const realtimeGateway = {
      emitAgentLocationUpdate: jest.fn(() => true),
    };
    const service = new SimulatorService(realtimeGateway as any);

    const result = service.emitTestUpdate({});

    expect(result).toEqual({
      ok: true,
      event: "agent.location.update",
      emitted: true,
    });

    expect(realtimeGateway.emitAgentLocationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        routeId: "test-route",
        status: "active",
        meta: expect.objectContaining({
          speedKph: 8.5,
          seq: 0,
        }),
      }),
    );
  });
});
