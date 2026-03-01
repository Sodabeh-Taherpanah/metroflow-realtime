import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createClient } from 'redis';

@Controller('api/health')
export class ApiHealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  async getHealth() {
    let databaseStatus: 'up' | 'down' = 'down';
    let redisStatus: 'up' | 'down' = 'down';

    try {
      await this.dataSource.query('SELECT 1');
      databaseStatus = 'up';
    } catch {
      databaseStatus = 'down';
    }

    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      const redisClient = createClient({ url: redisUrl });
      try {
        await redisClient.connect();
        await redisClient.ping();
        redisStatus = 'up';
      } catch {
        redisStatus = 'down';
      } finally {
        if (redisClient.isOpen) {
          await redisClient.quit();
        }
      }
    }

    const status =
      databaseStatus === 'up' && redisStatus === 'up' ? 'ok' : 'degraded';

    return {
      status,
      checks: {
        database: databaseStatus,
        redis: redisStatus,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
