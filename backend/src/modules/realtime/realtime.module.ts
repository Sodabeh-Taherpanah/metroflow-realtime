import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentTrace } from '../../entities/agent-trace.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AgentTrace])],
  providers: [RealtimeGateway, RealtimeService],
  exports: [RealtimeService, RealtimeGateway],
})
export class RealtimeModule {}
