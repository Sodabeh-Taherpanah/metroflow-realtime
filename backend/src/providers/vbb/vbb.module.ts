import { Module } from "@nestjs/common";
import { VbbService } from "./vbb.service";
// Ensure './vbb.service.ts' exists and is correctly named

@Module({
  providers: [VbbService],
  exports: [VbbService],
})
export class VbbModule {}
