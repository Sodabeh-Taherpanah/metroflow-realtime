"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const supertest_1 = require("supertest");
const app_module_1 = require("../src/app.module");
describe('App (e2e)', () => {
    let app;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });
    it('/ (GET) - health check', () => {
        return (0, supertest_1.default)(app.getHttpServer()).get('/health').expect(200);
    });
    describe('VBB Stations', () => {
        it('/vbb/stations (GET) - should return array', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/vbb/stations?query=Berlin&limit=5')
                .expect(200)
                .expect((res) => {
                expect(Array.isArray(res.body)).toBe(true);
                if (res.body.length > 0) {
                    expect(res.body[0]).toHaveProperty('id');
                    expect(res.body[0]).toHaveProperty('name');
                    expect(res.body[0]).toHaveProperty('location');
                }
            });
        });
        it('/vbb/stations (GET) - should handle empty query', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/vbb/stations?query=&limit=5')
                .expect(200);
        });
        it('/vbb/stations (GET) - should respect limit parameter', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/vbb/stations?query=Berlin&limit=3')
                .expect(200)
                .expect((res) => {
                expect(res.body.length).toBeLessThanOrEqual(3);
            });
        });
    });
    describe('VBB Departures', () => {
        it('/vbb/departures (GET) - should return departures for valid station', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/vbb/departures?stationId=900029305&duration=60')
                .expect(200)
                .expect((res) => {
                expect(Array.isArray(res.body)).toBe(true);
            });
        });
        it('/vbb/departures (GET) - should handle invalid station', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/vbb/departures?stationId=invalid&duration=60')
                .expect(200);
        });
    });
    describe('Error Handling', () => {
        it('should return 404 for non-existent route', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/non-existent-route')
                .expect(404);
        });
        it('should handle missing required parameters', () => {
            return (0, supertest_1.default)(app.getHttpServer()).get('/vbb/departures').expect(400);
        });
    });
});
//# sourceMappingURL=app.e2e-spec.js.map