import { Controller, Get, Query } from "@nestjs/common";
import { VbbService, VbbLocation } from "./vbb.service";

@Controller("vbb")
export class VbbController {
  constructor(private readonly vbbService: VbbService) {}

  @Get("stations")
  async getStations(
    @Query("query") query: string = "Berlin",
    @Query("limit") limit: number = 10,
  ): Promise<VbbLocation[]> {
    return this.vbbService.getStations(query, limit);
  }

  @Get("departures")
  async getDepartures(
    @Query("stationId") stationId: string = "900029305",
    @Query("duration") duration: number = 60,
  ) {
    return this.vbbService.getDepartures(stationId, duration);
  }
}
