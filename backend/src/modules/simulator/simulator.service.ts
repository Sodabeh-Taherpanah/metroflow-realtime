import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { isAbsolute, resolve } from 'path';
import { RealtimeGateway } from '../realtime/realtime.gateway';

type TestEmitInput = {
  routeId?: string;
  agentId?: string;
  lat?: number;
  lng?: number;
  speed?: number;
  seq?: number;
};

type StartSimulationInput = {
  routeId: string;
  intervalMs?: number;
  loop?: boolean;
  agents?: number;
  jitterMeters?: number;
  speedKph?: number;
};

type RouteSamplePoint = {
  seq: number;
  lat: number;
  lng: number;
  dist: number;
  bearing: number;
};

type SimulationJobStatus = 'running' | 'completed' | 'failed';

type SimulationJob = {
  jobId: string;
  routeId: string;
  status: SimulationJobStatus;
  createdAt: string;
  updatedAt: string;
  config: {
    intervalMs: number;
    loop: boolean;
    agents: number;
    jitterMeters: number;
    speedKph: number;
    sampleCount: number;
  };
  emittedCount: number;
  error?: string;
};

@Injectable()
export class SimulatorService {
  private readonly logger = new Logger(SimulatorService.name);
  private readonly jobs = new Map<string, SimulationJob>();
  private readonly timers = new Map<string, NodeJS.Timeout>();

  constructor(private readonly realtimeGateway: RealtimeGateway) {}

  startSimulation(input: StartSimulationInput) {
    const routeId = input.routeId?.trim();
    if (!routeId) {
      throw new BadRequestException('routeId is required.');
    }

    const intervalMs =
      Number.isFinite(input.intervalMs) && (input.intervalMs as number) > 0
        ? Number(input.intervalMs)
        : 1000;
    const agents =
      Number.isFinite(input.agents) && (input.agents as number) > 0
        ? Math.max(1, Math.floor(Number(input.agents)))
        : 1;
    const loop = input.loop !== undefined ? Boolean(input.loop) : true;
    const jitterMeters =
      Number.isFinite(input.jitterMeters) && (input.jitterMeters as number) >= 0
        ? Number(input.jitterMeters)
        : Number(process.env.SIM_JITTER_METERS || 0);
    const speedKph =
      Number.isFinite(input.speedKph) && (input.speedKph as number) > 0
        ? Number(input.speedKph)
        : 28;

    const samples = this.loadSamples(routeId);
    const jobId = randomUUID();
    const now = new Date().toISOString();

    const job: SimulationJob = {
      jobId,
      routeId,
      status: 'running',
      createdAt: now,
      updatedAt: now,
      config: {
        intervalMs,
        loop,
        agents,
        jitterMeters,
        speedKph,
        sampleCount: samples.length,
      },
      emittedCount: 0,
    };

    this.jobs.set(jobId, job);

    let tick = 0;
    const timer = setInterval(() => {
      try {
        const activeJob = this.jobs.get(jobId);
        if (!activeJob || activeJob.status !== 'running') {
          this.stopTimer(jobId);
          return;
        }

        const baseTs = Date.now();
        let emittedThisTick = 0;
        let completedAgents = 0;

        for (let agentIndex = 0; agentIndex < agents; agentIndex += 1) {
          const agentId = `${jobId}-${agentIndex + 1}`;
          const offset = Math.floor((agentIndex * samples.length) / agents);
          const absoluteIndex = tick + offset;

          if (!loop && absoluteIndex >= samples.length) {
            completedAgents += 1;
            continue;
          }

          const sampleIndex = loop
            ? absoluteIndex % samples.length
            : Math.min(absoluteIndex, samples.length - 1);
          const sample = samples[sampleIndex];
          if (!sample) {
            continue;
          }

          const jittered = this.applyJitter(
            { lat: sample.lat, lng: sample.lng },
            jitterMeters,
          );
          const locationTs = new Date(baseTs + agentIndex * 250).toISOString();
          const payload = {
            id: agentId,
            agentId,
            type: 'agent.location.update',
            routeId,
            location: {
              lat: Number(jittered.lat.toFixed(6)),
              lng: Number(jittered.lng.toFixed(6)),
              ts: locationTs,
            },
            status: 'active',
            meta: {
              speedKph,
              bearing: sample.bearing,
              seq: sample.seq,
            },
          };

          this.realtimeGateway.emitAgentLocationUpdate(payload);
          emittedThisTick += 1;
        }

        activeJob.emittedCount += emittedThisTick;
        activeJob.updatedAt = new Date().toISOString();
        this.jobs.set(jobId, activeJob);

        tick += 1;

        if (!loop && completedAgents >= agents) {
          activeJob.status = 'completed';
          activeJob.updatedAt = new Date().toISOString();
          this.jobs.set(jobId, activeJob);
          this.stopTimer(jobId);
        }
      } catch (error) {
        const activeJob = this.jobs.get(jobId);
        if (activeJob) {
          activeJob.status = 'failed';
          activeJob.error =
            error instanceof Error ? error.message : 'Unknown simulator error';
          activeJob.updatedAt = new Date().toISOString();
          this.jobs.set(jobId, activeJob);
        }
        this.stopTimer(jobId);
      }
    }, intervalMs);

    this.timers.set(jobId, timer);
    this.logger.log(
      `[sim:${jobId}] started route=${routeId} agents=${agents} intervalMs=${intervalMs} loop=${loop} jitterMeters=${jitterMeters}`,
    );

    return {
      jobId,
      status: job.status,
      routeId,
      config: job.config,
    };
  }

  getSimulationJob(jobId: string): SimulationJob {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new NotFoundException(`Simulation job not found: ${jobId}`);
    }
    return job;
  }

  listSimulationJobs() {
    return Array.from(this.jobs.values()).sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
  }

  emitTestUpdate(input: TestEmitInput) {
    const locationTs = new Date().toISOString();
    const payload = {
      id: `test-${Date.now()}`,
      type: 'agent.location.update',
      routeId: input.routeId || 'test-route',
      location: {
        lat: Number.isFinite(input.lat) ? input.lat : 52.52,
        lng: Number.isFinite(input.lng) ? input.lng : 13.405,
        ts: locationTs,
      },
      status: 'active',
      meta: {
        speedKph: Number.isFinite(input.speed) ? input.speed : 8.5,
        bearing: 0,
        seq: Number.isFinite(input.seq) ? input.seq : 0,
      },
      agentId: input.agentId || `agent-${Date.now()}`,
    };

    const emitted = this.realtimeGateway.emitAgentLocationUpdate(payload);

    return {
      ok: true,
      event: 'agent.location.update',
      emitted,
    };
  }

  private loadSamples(routeId: string): RouteSamplePoint[] {
    const dataDir = process.env.DATA_DIR || './data';
    const absoluteDataDir = isAbsolute(dataDir)
      ? dataDir
      : resolve(process.cwd(), dataDir);
    const safeRouteId = this.safeFileSegment(routeId);
    const samplePath = resolve(
      absoluteDataDir,
      'samples',
      `route-${safeRouteId}-samples.json`,
    );

    if (!existsSync(samplePath)) {
      throw new NotFoundException(
        `Sample file not found for routeId=${routeId}: ${samplePath}. Run /api/ingest/sample first.`,
      );
    }

    const parsed = JSON.parse(readFileSync(samplePath, 'utf-8'));
    const samples = Array.isArray(parsed?.samples)
      ? (parsed.samples as RouteSamplePoint[])
      : [];
    if (samples.length === 0) {
      throw new BadRequestException(
        `No samples available in ${samplePath} for route ${routeId}.`,
      );
    }
    return samples;
  }

  private applyJitter(
    point: { lat: number; lng: number },
    jitterMeters: number,
  ): { lat: number; lng: number } {
    if (!Number.isFinite(jitterMeters) || jitterMeters <= 0) {
      return point;
    }

    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * jitterMeters;
    const northMeters = Math.cos(angle) * distance;
    const eastMeters = Math.sin(angle) * distance;

    const latOffset = northMeters / 111320;
    const lngScale = Math.max(
      Math.cos((point.lat * Math.PI) / 180) * 111320,
      1e-6,
    );
    const lngOffset = eastMeters / lngScale;

    return {
      lat: point.lat + latOffset,
      lng: point.lng + lngOffset,
    };
  }

  private stopTimer(jobId: string) {
    const timer = this.timers.get(jobId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(jobId);
    }
  }

  private safeFileSegment(value: string): string {
    return (
      value
        .trim()
        .replace(/[^a-zA-Z0-9_-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'route'
    );
  }
}
