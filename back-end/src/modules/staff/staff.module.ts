import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

// AuthModule is imported for its exported JwtModule -- the staff portal has its
// own login/signup routes and must issue the same kind of token.
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [StaffController],
  providers: [StaffService],
})
export class StaffModule {}
