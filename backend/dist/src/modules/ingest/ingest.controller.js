"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const class_validator_1 = require("class-validator");
const ingest_service_1 = require("./ingest.service");
class ProbeIngestDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProbeIngestDto.prototype, "gtfsZipPath", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProbeIngestDto.prototype, "gpxContent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProbeIngestDto.prototype, "normalizationTolerance", void 0);
class SampleRouteDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SampleRouteDto.prototype, "routeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SampleRouteDto.prototype, "spacingMeters", void 0);
let IngestController = class IngestController {
    constructor(ingestService) {
        this.ingestService = ingestService;
    }
    getStatus() {
        throw new common_1.NotImplementedException('Ingest pipeline is not implemented yet.');
    }
    probe(body, gpxFile) {
        let normalizationTolerance;
        if (body.normalizationTolerance !== undefined) {
            normalizationTolerance = Number(body.normalizationTolerance);
            if (!Number.isFinite(normalizationTolerance) ||
                normalizationTolerance < 0) {
                throw new common_1.BadRequestException('normalizationTolerance must be a non-negative number.');
            }
        }
        return this.ingestService.queueProbe({
            gtfsZipPath: body.gtfsZipPath,
            gpxContent: body.gpxContent,
            gpxFile,
            normalizationTolerance,
        });
    }
    getProbeJob(jobId) {
        return this.ingestService.getProbeJob(jobId);
    }
    getProbeLogs(jobId, limit) {
        const parsedLimit = limit !== undefined ? Number(limit) : undefined;
        if (limit !== undefined &&
            (!Number.isFinite(parsedLimit) || parsedLimit <= 0)) {
            throw new common_1.BadRequestException('limit must be a positive number.');
        }
        return this.ingestService.getProbeLogs(jobId, parsedLimit);
    }
    getRoutes() {
        return this.ingestService.listRoutes();
    }
    downloadRouteArtifact(routeId, view = 'canonical', res) {
        if (!['raw', 'canonical', 'samples'].includes(view)) {
            throw new common_1.BadRequestException('view must be raw, canonical, or samples.');
        }
        const resolved = this.ingestService.resolveDownloadPath({ routeId, view });
        return res.download(resolved.filePath, resolved.fileName);
    }
    sampleRoute(body) {
        let spacingMeters;
        if (body.spacingMeters !== undefined) {
            spacingMeters = Number(body.spacingMeters);
            if (!Number.isFinite(spacingMeters) || spacingMeters <= 0) {
                throw new common_1.BadRequestException('spacingMeters must be a positive number.');
            }
        }
        return this.ingestService.sampleRoute({
            routeId: body.routeId,
            spacingMeters,
        });
    }
};
exports.IngestController = IngestController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Ingest pipeline status (stub)' }),
    (0, swagger_1.ApiResponse)({ status: 501, description: 'Not Implemented' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IngestController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('probe'),
    (0, common_1.HttpCode)(202),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('gpxFile')),
    (0, swagger_1.ApiConsumes)('multipart/form-data', 'application/json'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                gtfsZipPath: { type: 'string', example: './data/gtfs/sample.zip' },
                gpxContent: { type: 'string', example: '<gpx>...</gpx>' },
                gpxFile: { type: 'string', format: 'binary' },
                normalizationTolerance: { type: 'number', example: 0.00003 },
            },
        },
    }),
    (0, swagger_1.ApiOperation)({ summary: 'Queue GTFS/GPX probe job' }),
    (0, swagger_1.ApiResponse)({ status: 202, description: 'Probe queued with job id' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ProbeIngestDto, Object]),
    __metadata("design:returntype", void 0)
], IngestController.prototype, "probe", null);
__decorate([
    (0, common_1.Get)('jobs/:jobId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get probe job status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Probe job status payload' }),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], IngestController.prototype, "getProbeJob", null);
__decorate([
    (0, common_1.Get)('logs/:jobId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get probe job logs' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Probe log lines' }),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], IngestController.prototype, "getProbeLogs", null);
__decorate([
    (0, common_1.Get)('routes'),
    (0, swagger_1.ApiOperation)({ summary: 'List raw/canonical route artifacts' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Route artifact list' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IngestController.prototype, "getRoutes", null);
__decorate([
    (0, common_1.Get)('download/:routeId'),
    (0, swagger_1.ApiOperation)({ summary: 'Download route artifacts or samples' }),
    __param(0, (0, common_1.Param)('routeId')),
    __param(1, (0, common_1.Query)('view')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], IngestController.prototype, "downloadRouteArtifact", null);
__decorate([
    (0, common_1.Post)('sample'),
    (0, swagger_1.ApiOperation)({ summary: 'Sample canonical route geometry at fixed spacing' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Sampling metadata and output path',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SampleRouteDto]),
    __metadata("design:returntype", void 0)
], IngestController.prototype, "sampleRoute", null);
exports.IngestController = IngestController = __decorate([
    (0, swagger_1.ApiTags)('Ingest'),
    (0, common_1.Controller)('api/ingest'),
    __metadata("design:paramtypes", [ingest_service_1.IngestService])
], IngestController);
//# sourceMappingURL=ingest.controller.js.map