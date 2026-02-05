import { Controller, Get } from "@nestjs/common";
import { VbbService } from "./vbb.service";

@Controller("vbb")
export class VbbController {
  constructor(private readonly vbbService: VbbService) {}

  @Get("stations")
  async getStations() {
    return this.vbbService.getStations();
  }

  @Get("departures")
  async getDepartures() {
    return this.vbbService.getDepartures();
  }
}
