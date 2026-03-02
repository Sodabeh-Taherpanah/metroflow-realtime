"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const common_1 = require("@nestjs/common");
const globals_1 = require("@jest/globals");
const simulator_service_1 = require("./simulator.service");
(0, globals_1.describe)("SimulatorService", () => {
    const baseDir = (0, path_1.resolve)(process.cwd(), ".tmp-tests", `simulator-service-${Date.now()}`);
    const createSamples = (routeId) => {
        const samplesDir = (0, path_1.resolve)(baseDir, "samples");
        (0, fs_1.mkdirSync)(samplesDir, { recursive: true });
        (0, fs_1.writeFileSync)((0, path_1.resolve)(samplesDir, `route-${routeId}-samples.json`), JSON.stringify({
            routeId,
            samples: [
                { seq: 0, lat: 52.52, lng: 13.405, dist: 0, bearing: 0 },
                { seq: 1, lat: 52.521, lng: 13.406, dist: 50, bearing: 45 },
                { seq: 2, lat: 52.522, lng: 13.407, dist: 100, bearing: 90 },
            ],
        }, null, 2));
    };
    (0, globals_1.beforeEach)(() => {
        jest.useFakeTimers();
        process.env.DATA_DIR = baseDir;
        (0, fs_1.rmSync)(baseDir, { recursive: true, force: true });
    });
    (0, globals_1.afterEach)(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });
    (0, globals_1.afterAll)(() => {
        (0, fs_1.rmSync)(baseDir, { recursive: true, force: true });
    });
    (0, globals_1.it)("starts a simulation and completes for non-looping jobs", () => {
        createSamples("r1");
        const realtimeGateway = {
            emitAgentLocationUpdate: jest.fn(() => true),
        };
        const service = new simulator_service_1.SimulatorService(realtimeGateway);
        const started = service.startSimulation({
            routeId: "r1",
            intervalMs: 10,
            loop: false,
            agents: 1,
            jitterMeters: 0,
            speedKph: 20,
        });
        (0, globals_1.expect)(started.status).toBe("running");
        (0, globals_1.expect)(started.config.sampleCount).toBe(3);
        jest.advanceTimersByTime(40);
        const job = service.getSimulationJob(started.jobId);
        (0, globals_1.expect)(job.status).toBe("completed");
        (0, globals_1.expect)(job.emittedCount).toBe(3);
        (0, globals_1.expect)(realtimeGateway.emitAgentLocationUpdate).toHaveBeenCalledTimes(3);
    });
    (0, globals_1.it)("throws when routeId is missing", () => {
        const realtimeGateway = {
            emitAgentLocationUpdate: jest.fn(() => true),
        };
        const service = new simulator_service_1.SimulatorService(realtimeGateway);
        (0, globals_1.expect)(() => service.startSimulation({
            routeId: "",
        })).toThrow(common_1.BadRequestException);
    });
    (0, globals_1.it)("throws when the requested job does not exist", () => {
        const realtimeGateway = {
            emitAgentLocationUpdate: jest.fn(() => true),
        };
        const service = new simulator_service_1.SimulatorService(realtimeGateway);
        (0, globals_1.expect)(() => service.getSimulationJob("missing-job")).toThrow(common_1.NotFoundException);
    });
    (0, globals_1.it)("emits a test update with defaults", () => {
        const realtimeGateway = {
            emitAgentLocationUpdate: jest.fn(() => true),
        };
        const service = new simulator_service_1.SimulatorService(realtimeGateway);
        const result = service.emitTestUpdate({});
        (0, globals_1.expect)(result).toEqual({
            ok: true,
            event: "agent.location.update",
            emitted: true,
        });
        (0, globals_1.expect)(realtimeGateway.emitAgentLocationUpdate).toHaveBeenCalledWith(globals_1.expect.objectContaining({
            routeId: "test-route",
            status: "active",
            meta: globals_1.expect.objectContaining({
                speedKph: 8.5,
                seq: 0,
            }),
        }));
    });
});
//# sourceMappingURL=simulator.service.spec.js.map