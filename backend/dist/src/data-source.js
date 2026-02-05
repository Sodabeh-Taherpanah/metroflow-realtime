"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const station_entity_1 = require("./entities/station.entity");
const route_entity_1 = require("./entities/route.entity");
const provider_entity_1 = require("./entities/provider.entity");
const realtime_cache_entity_1 = require("./entities/realtime-cache.entity");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [station_entity_1.Station, route_entity_1.Route, provider_entity_1.Provider, realtime_cache_entity_1.RealtimeCache],
    synchronize: false,
    migrations: ["dist/migrations/*.js"],
});
//# sourceMappingURL=data-source.js.map