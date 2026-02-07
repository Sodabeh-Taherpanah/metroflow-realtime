import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { Station } from "../entities/station.entity";

dotenv.config({ path: __dirname + "/../../.env" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set in .env");
  process.exit(1);
}

const AppDataSource = new DataSource({
  type: "postgres",
  url: DATABASE_URL,
  entities: [Station],
  synchronize: false,
});

async function seed() {
  await AppDataSource.initialize();
  console.log("Connected to DB");
  const repo = AppDataSource.getRepository(Station);

  const samples: Partial<Station>[] = [
    { name: "Central Station", location: "52.5200,13.4050" },
    { name: "North Station", location: "52.5300,13.4050" },
    { name: "East Station", location: "52.5200,13.4150" },
  ];

  for (const s of samples) {
    const exists = await repo.findOneBy({ name: s.name as string } as any);
    if (!exists) {
      const created = repo.create(s as Station);
      await repo.save(created);
      console.log("Inserted", (created as Station).name);
    } else {
      console.log("Already exists", s.name);
    }
  }

  const count = await repo.count();
  console.log(`Stations count: ${count}`);
  await AppDataSource.destroy();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed", err);
    process.exit(1);
  });
