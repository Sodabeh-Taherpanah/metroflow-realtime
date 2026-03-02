"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const vbb_service_1 = require("./vbb.service");
const rxjs_1 = require("rxjs");
(0, globals_1.describe)("VbbService (unit)", () => {
    let service;
    let mockHttpService;
    (0, globals_1.beforeAll)(() => {
        mockHttpService = {
            get: jest.fn(),
        };
        service = new vbb_service_1.VbbService(mockHttpService);
    });
    (0, globals_1.describe)("getStations", () => {
        (0, globals_1.it)("should call API with correct parameters", async () => {
            const mockData = [
                {
                    id: "1",
                    name: "Test Station",
                    location: { latitude: 52.52, longitude: 13.405 },
                },
            ];
            mockHttpService.get.mockReturnValue((0, rxjs_1.of)({ data: mockData }));
            const result = await service.getStations("Test", 10);
            (0, globals_1.expect)(mockHttpService.get).toHaveBeenCalledWith(globals_1.expect.stringContaining("/locations"), globals_1.expect.any(Object));
            (0, globals_1.expect)(Array.isArray(result)).toBe(true);
        });
        (0, globals_1.it)("should handle empty results", async () => {
            mockHttpService.get.mockReturnValue((0, rxjs_1.of)({ data: [] }));
            const result = await service.getStations("Unknown", 10);
            (0, globals_1.expect)(Array.isArray(result)).toBe(true);
            (0, globals_1.expect)(result.length).toBe(0);
        });
        (0, globals_1.it)("should handle API errors gracefully", async () => {
            mockHttpService.get.mockReturnValue((0, rxjs_1.throwError)(() => new Error("API Error")));
            await (0, globals_1.expect)(service.getStations("Test", 10)).rejects.toThrow("API Error");
        });
    });
});
//# sourceMappingURL=vbb.service.spec.js.map