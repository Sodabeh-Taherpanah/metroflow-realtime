import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentTrace } from '../../entities/agent-trace.entity';
import { VbbModule } from '../../vbb/vbb.module';

@Module({
  imports: [TypeOrmModule.forFeature([AgentTrace]), VbbModule],
  providers: [RealtimeGateway, RealtimeService],
  exports: [RealtimeService, RealtimeGateway],
})
export class RealtimeModule {}
