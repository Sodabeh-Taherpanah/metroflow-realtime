import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { HealthController } from "./health.controller";
import { ApiHealthController } from "./api-health.controller";

@Module({
  imports: [TerminusModule],
  controllers: [HealthController, ApiHealthController],
})
export class HealthModule {}
