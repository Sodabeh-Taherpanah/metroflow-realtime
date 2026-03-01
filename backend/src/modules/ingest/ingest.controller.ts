import {
  HttpCode,
  BadRequestException,
  Controller,
  Get,
  NotImplementedException,
  Post,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { IsOptional, IsString } from "class-validator";
import { IngestService, type GpxUploadFile } from "./ingest.service";

class ProbeIngestDto {
  @IsOptional()
  @IsString()
  gtfsZipPath?: string;

  @IsOptional()
  @IsString()
  gpxContent?: string;

  @IsOptional()
  @IsString()
  normalizationTolerance?: string;
}

class SampleRouteDto {
  @IsString()
  routeId!: string;

  @IsOptional()
  @IsString()
  spacingMeters?: string;
}

@ApiTags("Ingest")
@Controller("api/ingest")
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  @Get()
  @ApiOperation({ summary: "Ingest pipeline status (stub)" })
  @ApiResponse({ status: 501, description: "Not Implemented" })
  getStatus() {
    throw new NotImplementedException(
      "Ingest pipeline is not implemented yet.",
    );
  }

  @Post("probe")
  @HttpCode(202)
  @UseInterceptors(FileInterceptor("gpxFile"))
  @ApiConsumes("multipart/form-data", "application/json")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        gtfsZipPath: { type: "string", example: "./data/gtfs/sample.zip" },
        gpxContent: { type: "string", example: "<gpx>...</gpx>" },
        gpxFile: { type: "string", format: "binary" },
        normalizationTolerance: { type: "number", example: 0.00003 },
      },
    },
  })
  @ApiOperation({ summary: "Queue GTFS/GPX probe job" })
  @ApiResponse({ status: 202, description: "Probe queued with job id" })
  probe(@Body() body: ProbeIngestDto, @UploadedFile() gpxFile?: GpxUploadFile) {
    let normalizationTolerance: number | undefined;
    if (body.normalizationTolerance !== undefined) {
      normalizationTolerance = Number(body.normalizationTolerance);
      if (
        !Number.isFinite(normalizationTolerance) ||
        normalizationTolerance < 0
      ) {
        throw new BadRequestException(
          "normalizationTolerance must be a non-negative number.",
        );
      }
    }

    return this.ingestService.queueProbe({
      gtfsZipPath: body.gtfsZipPath,
      gpxContent: body.gpxContent,
      gpxFile,
      normalizationTolerance,
    });
  }

  @Get("jobs/:jobId")
  @ApiOperation({ summary: "Get probe job status" })
  @ApiResponse({ status: 200, description: "Probe job status payload" })
  getProbeJob(@Param("jobId") jobId: string) {
    return this.ingestService.getProbeJob(jobId);
  }

  @Get("routes")
  @ApiOperation({ summary: "List raw/canonical route artifacts" })
  @ApiResponse({ status: 200, description: "Route artifact list" })
  getRoutes() {
    return this.ingestService.listRoutes();
  }

  @Post("sample")
  @ApiOperation({ summary: "Sample canonical route geometry at fixed spacing" })
  @ApiResponse({
    status: 200,
    description: "Sampling metadata and output path",
  })
  sampleRoute(@Body() body: SampleRouteDto) {
    let spacingMeters: number | undefined;
    if (body.spacingMeters !== undefined) {
      spacingMeters = Number(body.spacingMeters);
      if (!Number.isFinite(spacingMeters) || spacingMeters <= 0) {
        throw new BadRequestException(
          "spacingMeters must be a positive number.",
        );
      }
    }

    return this.ingestService.sampleRoute({
      routeId: body.routeId,
      spacingMeters,
    });
  }
}
