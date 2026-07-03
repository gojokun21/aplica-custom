import { Module } from '@nestjs/common';
import { AdminLegalController } from './admin-legal.controller';
import { LegalController } from './legal.controller';
import { LegalService } from './legal.service';

@Module({
  controllers: [LegalController, AdminLegalController],
  providers: [LegalService],
})
export class LegalModule {}
