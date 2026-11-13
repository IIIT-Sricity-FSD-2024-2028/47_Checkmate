import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { StaffOnboardingController } from './staff-onboarding.controller';
import { StaffOnboardingService } from './staff-onboarding.service';

@Module({
  imports: [DatabaseModule],
  controllers: [StaffOnboardingController],
  providers: [StaffOnboardingService],
})
export class StaffOnboardingModule {}
