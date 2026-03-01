import { DataSource } from 'typeorm';
import { Station } from './entities/station.entity';
import { Route } from './entities/route.entity';
import { Provider } from './entities/provider.entity';
import { RealtimeCache } from './entities/realtime-cache.entity';
import { AgentTrace } from './entities/agent-trace.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Station, Route, Provider, RealtimeCache, AgentTrace],
  synchronize: false, // Use migrations instead
  migrations: ['dist/migrations/*.js'],
});
