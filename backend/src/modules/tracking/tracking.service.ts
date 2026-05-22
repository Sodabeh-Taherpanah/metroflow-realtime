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
  private cleanupTimer: NodeJS.Timeout | null = null;
  private readonly traceRetentionDays = Math.max(
    1,
    Number(process.env.TRACE_RETENTION_DAYS || 7),
  );
  private readonly cleanupIntervalMs = Math.max(
    60_000,
    Number(process.env.TRACE_CLEANUP_INTERVAL_MS || 60 * 60 * 1000),
  );

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

    this.cleanupTimer = setInterval(() => {
      this.cleanupOldTraces().catch((error) => {
        this.logger.error(`Trace cleanup failed: ${error}`);
      });
    }, this.cleanupIntervalMs);

    this.cleanupOldTraces().catch((error) => {
      this.logger.error(`Initial trace cleanup failed: ${error}`);
    });
  }

  async onModuleDestroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    if (this.redisClient?.isOpen) {
      await this.redisClient.quit();
    }
  }

  private async cleanupOldTraces() {
    const cutoff = new Date(
      Date.now() - this.traceRetentionDays * 24 * 60 * 60 * 1000,
    );

    const result = await this.agentTraceRepository
      .createQueryBuilder()
      .delete()
      .from(AgentTrace)
      .where('"createdAt" < :cutoff', { cutoff })
      .execute();

    const deleted = result.affected || 0;
    if (deleted > 0) {
      this.logger.log(
        `Trace retention cleanup removed ${deleted} rows older than ${this.traceRetentionDays} day(s)`,
      );
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
        const fallbackAgentId = key.replace('agent:latest:', '');
        parsed.agentId = parsed.agentId || fallbackAgentId;
        parsed.id = parsed.id || parsed.agentId;
        latestAgents.push(parsed);
      } catch {
        this.logger.warn(`Skipping invalid JSON for key ${key}`);
      }
    });

    return latestAgents;
  }

  async getSummary() {
    const agentCount = await this.getLatestAgents()
      .then((a) => a.length)
      .catch(() => 0);

    // Hourly event counts for the last 24 hours from AgentTrace
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const raw = await this.agentTraceRepository
      .createQueryBuilder('t')
      .select(`date_trunc('hour', t."createdAt")`, 'hour')
      .addSelect('COUNT(*)', 'count')
      .where('t."createdAt" >= :since', { since })
      .groupBy(`date_trunc('hour', t."createdAt")`)
      .orderBy(`date_trunc('hour', t."createdAt")`, 'ASC')
      .getRawMany<{ hour: string; count: string }>();

    const hourlyActivity = raw.map((r) => ({
      hour: r.hour,
      count: parseInt(r.count, 10),
    }));

    return { agentCount, hourlyActivity };
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
