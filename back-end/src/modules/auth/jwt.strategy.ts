import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DataService } from '../../database/data.service';

// Teaches passport how to find and check a token. PassportStrategy(Strategy)
// registers it under the name 'jwt', which is what AuthGuard('jwt') asks for.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private dataService: DataService) {
    super({
      // Read the token from the "Authorization: Bearer <token>" header.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'eventpro_secret_key',
    });
  }

  // Runs only after the signature and expiry already checked out. `payload` is
  // what AuthService put in the token. We re-read the user from the database so
  // a deleted or deactivated account stops working immediately, instead of
  // staying valid until the token expires.
  async validate(payload: any) {
    const user = this.dataService.collection('users').find((u) => u.id === payload.sub);
    if (!user) throw new UnauthorizedException('Invalid token');
    if (!['Active', 'active'].includes(user.status)) {
      throw new UnauthorizedException('This account is not active.');
    }

    // Whatever this returns becomes req.user, which RolesGuard reads. The role
    // comes from the stored record, not the token, so it stays correct even if
    // an admin changes it mid-session. Never attach passwordHash here.
    const { passwordHash, ...safeUser } = user;
    return { ...safeUser, role: String(user.role).toLowerCase() };
  }
}
