import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { getJwtSecret } from '../../common/security/jwt-secret';
import { AdminChatController, MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { MessagesService } from './messages.service';

// JwtModule (same secret as AuthModule) lets the gateway check socket tokens.
@Module({
  imports: [DatabaseModule, JwtModule.register({ secret: getJwtSecret() })],
  controllers: [MessagesController, AdminChatController],
  providers: [MessagesService, MessagesGateway],
})
export class MessagesModule {}
