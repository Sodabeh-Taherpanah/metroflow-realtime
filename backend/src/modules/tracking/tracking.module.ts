import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentTrace } from '../../entities/agent-trace.entity';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';

@Module({
  imports: [TypeOrmModule.forFeature([AgentTrace])],
  controllers: [TrackingController],
  providers: [TrackingService],
})
export class TrackingModule {}
