import { Injectable } from "@nestjs/common";

@Injectable()
export class VbbService {
  async getStations() {
    // Mock data for now
    return [
      { id: "1", name: "Station A" },
      { id: "2", name: "Station B" },
    ];
  }

  async getDepartures() {
    // Mock data for now
    return [
      { id: "1", train: "Train A", time: "10:00" },
      { id: "2", train: "Train B", time: "10:15" },
    ];
  }
}
