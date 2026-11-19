/**
 * LIVE MESSAGE DELIVERY (Socket.IO gateway)
 *
 * How it works:
 *   1. The React app opens one socket after login and sends its JWT
 *      (socket.io `auth: { token }`).
 *   2. handleConnection checks the token with the same secret as the REST API
 *      and re-reads the user (a deleted / inactive account is refused), then
 *      puts the socket in a private room "user:<id>".
 *   3. When a message is saved, MessagesService calls emitToUsers() with ONLY the
 *      people allowed in that conversation, so a message can never reach anyone
 *      else. Clients never send messages over the socket: sending stays a normal
 *      POST, with all the usual checks.
 * If the socket cannot connect, the pages fall back to polling every 3 seconds.
 */
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { corsOptions } from '../../common/security/cors.config';
import { DataService } from '../../database/data.service';

@WebSocketGateway({ cors: corsOptions as any })
export class MessagesGateway implements OnGatewayConnection {
  private readonly logger = new Logger(MessagesGateway.name);

  // The Socket.IO server Nest creates on the same port as the API
  @WebSocketServer() server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly data: DataService,
  ) {}

  // Runs for every new socket: no valid token -> disconnected straight away
  async handleConnection(socket: Socket) {
    try {
      const token = String(socket.handshake.auth?.token || '');
      const payload: any = this.jwt.verify(token);
      const user = (await this.data.collection('users')).find((u) => u.id === payload.sub);
      if (!user || !['Active', 'active'].includes(user.status)) throw new Error('inactive');
      socket.data.userId = user.id;
      socket.join(`user:${user.id}`);
    } catch {
      socket.emit('auth:error', 'Please sign in again.');
      socket.disconnect(true);
    }
  }

  /** Sends one event to each listed user (every tab they have open). */
  emitToUsers(userIds: Array<string | undefined>, event: string, payload: unknown) {
    if (!this.server) return; // e.g. unit tests: no socket server running
    [...new Set(userIds.filter(Boolean) as string[])].forEach((id) => {
      this.server.to(`user:${id}`).emit(event, payload);
    });
  }
}
