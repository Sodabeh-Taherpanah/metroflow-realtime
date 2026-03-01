import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createClient, RedisClientType } from 'redis';
import { AgentTrace } from '../../entities/agent-trace.entity';

type AgentHistoryOptions = {
  page: number;
  limit: number;
};

@Injectable()
export class TrackingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TrackingService.name);
  private redisClient: RedisClientType | null = null;

  constructor(
    @InjectRepository(AgentTrace)
    private readonly agentTraceRepository: Repository<AgentTrace>,
  ) {}

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      this.logger.warn(
        'REDIS_URL is not set; tracking latest-state endpoint will return empty data',
      );
      return;
    }

    this.redisClient = createClient({ url: redisUrl });
    this.redisClient.on('error', (error) => {
      this.logger.error(`Redis tracking client error: ${error}`);
    });

    try {
      await this.redisClient.connect();
      this.logger.log('Tracking Redis client connected');
    } catch (error) {
      this.logger.error(`Failed to connect tracking Redis client: ${error}`);
      this.redisClient = null;
    }
  }

  async onModuleDestroy() {
    if (this.redisClient?.isOpen) {
      await this.redisClient.quit();
    }
  }

  async getLatestAgents() {
    if (!this.redisClient || !this.redisClient.isOpen) {
      return [];
    }

    const keys: string[] = [];
    for await (const key of this.redisClient.scanIterator({
      MATCH: 'agent:latest:*',
      COUNT: 100,
    })) {
      if (typeof key === 'string') {
        keys.push(key);
      }
    }

    if (keys.length === 0) {
      return [];
    }

    const values = await this.redisClient.mGet(keys);
    const latestAgents: Record<string, unknown>[] = [];

    values.forEach((rawValue, index) => {
      const key = keys[index];
      if (!rawValue || !key) {
        return;
      }

      try {
        const parsed = JSON.parse(rawValue) as Record<string, unknown>;
        if (!parsed.id) {
          parsed.id = key.replace('agent:latest:', '');
        }
        latestAgents.push(parsed);
      } catch {
        this.logger.warn(`Skipping invalid JSON for key ${key}`);
      }
    });

    return latestAgents;
  }

  async getAgentHistory(agentId: string, options: AgentHistoryOptions) {
    const page = Math.max(1, options.page);
    const limit = Math.min(200, Math.max(1, options.limit));
    const skip = (page - 1) * limit;

    const [items, total] = await this.agentTraceRepository.findAndCount({
      where: { agentId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }
}
