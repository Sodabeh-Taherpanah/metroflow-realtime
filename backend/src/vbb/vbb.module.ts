import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { VbbController } from './vbb.controller';
import { VbbService } from './vbb.service';
import { VbbService as VbbProviderService } from '../providers/vbb/vbb.service';

@Module({
  imports: [HttpModule],
  controllers: [VbbController],
  providers: [VbbService, VbbProviderService],
})
export class VbbModule {}
