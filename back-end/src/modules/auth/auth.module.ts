import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from '../../database/database.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

// Registering JwtModule here is what makes JwtService injectable, and listing
// JwtStrategy as a provider is what actually activates the 'jwt' passport
// strategy that JwtAuthGuard looks for. Without both, the guard silently
// rejects every request because no strategy is registered under that name.
@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'eventpro_secret_key',
      // Cast needed because @types/ms types this as a template-literal union
      // ('12h', '7d', ...), which an env-var string cannot be narrowed to.
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '12h') as any },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  // Exported so StaffModule can sign tokens for its own login/signup routes.
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
