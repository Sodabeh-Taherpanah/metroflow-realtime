import { Injectable } from "@nestjs/common";
import { Station } from "../../entities/station.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class StationsService {
  constructor(
    @InjectRepository(Station)
    private readonly stationRepository: Repository<Station>,
  ) {}

  async getAllStations(): Promise<Station[]> {
    return this.stationRepository.find();
  }

  async getStationById(id: string): Promise<Station | null> {
    return this.stationRepository.findOneBy({ id: parseInt(id, 10) });
  }

  async createStation(station: Partial<Station>): Promise<Station> {
    const newStation = this.stationRepository.create(station);
    return this.stationRepository.save(newStation);
  }
}
