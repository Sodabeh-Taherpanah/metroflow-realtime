import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from '../realtime/realtime.gateway';

type TestEmitInput = {
  routeId?: string;
  agentId?: string;
  lat?: number;
  lng?: number;
  speed?: number;
  seq?: number;
};

@Injectable()
export class SimulatorService {
  constructor(private readonly realtimeGateway: RealtimeGateway) {}

  emitTestUpdate(input: TestEmitInput) {
    const payload = {
      agentId: input.agentId || `agent-${Date.now()}`,
      routeId: input.routeId || 'test-route',
      location: {
        lat: Number.isFinite(input.lat) ? input.lat : 52.52,
        lng: Number.isFinite(input.lng) ? input.lng : 13.405,
      },
      speed: Number.isFinite(input.speed) ? input.speed : 8.5,
      seq: Number.isFinite(input.seq) ? input.seq : 0,
      emittedAt: new Date().toISOString(),
      source: 'simulator:test-emit',
    };

    const emitted = this.realtimeGateway.emitAgentLocationUpdate(payload);

    return {
      ok: true,
      event: 'agent.location.update',
      emitted,
    };
  }
}
