import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hashPassword, verifyPassword } from '../../common/security/password';
import { DataService } from '../../database/data.service';
import { User } from '../../domain/models';
import { LoginDto, RegisterDto, ResetPasswordDto } from './dto';

// Login / signup for every role except staff, which has its own endpoints in
// staff.service.ts. There are no real sessions: login just returns the user
// object, and the frontend stores it in sessionStorage.
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  // Reset codes by email. `attempts` counts wrong guesses (max MAX_OTP_ATTEMPTS).
  private otpStore = new Map<string, { otp: string; expiresAt: number; attempts: number }>();
  private static readonly MAX_OTP_ATTEMPTS = 5;

  constructor(
    private readonly data: DataService,
    private readonly jwt: JwtService,
  ) {}

  login(dto: LoginDto) {
    const user = this.data.collection('users').find((row) => row.email.toLowerCase() === dto.email.toLowerCase());
    if (!user || !verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    // A deactivated account must not be able to sign in even with the right password.
    if (!['Active', 'active'].includes(user.status)) {
      throw new UnauthorizedException('This account is not active.');
    }
    return this.session(user);
  }

  register(dto: RegisterDto) {
    const cleanEmail = String(dto.email || '').trim().toLowerCase();
    const existingUser = this.data.collection('users').find((row) => row.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      throw new BadRequestException('This email is already registered. Please sign in instead.');
    }

    // Phone number constraint: maximum 2 accounts with the same phone number
    if (dto.phone && String(dto.phone).trim()) {
      const cleanDigits = String(dto.phone).replace(/\D/g, '');
      if (cleanDigits.length >= 7) {
        const matchingPhoneUsers = this.data.collection('users').filter((row) => {
          const rowDigits = String(row.phone || '').replace(/\D/g, '');
          if (!rowDigits) return false;
          return (
            rowDigits === cleanDigits ||
            (cleanDigits.length >= 10 && rowDigits.endsWith(cleanDigits.slice(-10))) ||
            (rowDigits.length >= 10 && cleanDigits.endsWith(rowDigits.slice(-10)))
          );
        });

        if (matchingPhoneUsers.length >= 2) {
          throw new BadRequestException('A maximum of 2 accounts can be registered with the same phone number.');
        }
      }
    }

    // New accounts registered via Create Account default to Client role
    let rawRole = String(dto.role || 'Client').trim();
    let role = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();
    if (role === 'Staff') {
      throw new BadRequestException('Staff accounts are created when a vendor approves an application.');
    }
    if (!['Client', 'Vendor'].includes(role)) {
      role = 'Client';
    }

    const user = this.data.create('users', 'U', {
      name: dto.name.trim(),
      email: cleanEmail,
      phone: dto.phone ? dto.phone.trim() : '',
      role: role as any,
      status: 'Active',
      created: new Date().toISOString().slice(0, 10),
      passwordHash: hashPassword(dto.password),
    });

    // Auto-provision a Vendor entity if a Vendor signs up directly
    if (dto.role === 'Vendor') {
      const vendors = this.data.collection('vendors');
      const vendorExists = vendors.some((v) => v.userId === user.id || v.name.toLowerCase() === dto.name.toLowerCase());
      if (!vendorExists) {
        this.data.create('vendors', 'V', {
          userId: user.id,
          name: dto.name,
          businessName: dto.name,
          category: 'Event Services',
          status: 'Approved',
          rating: 5.0,
          created: new Date().toISOString().slice(0, 10),
        });
      }
    }

    return this.session(user);
  }

  forgotPassword(email: string) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const user = this.data.collection('users').find((row) => row.email.toLowerCase() === cleanEmail);
    if (!user) {
      throw new NotFoundException('No account found with this email address.');
    }

    // Generate random 6-digit verification code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpStore.set(cleanEmail, { otp, expiresAt: Date.now() + 15 * 60 * 1000, attempts: 0 });

    // The code must reach only the account owner, so it is NEVER put in the
    // HTTP response. There is no email service yet: in development it is printed
    // to the backend console instead; in production it is not shown anywhere.
    if (process.env.NODE_ENV !== 'production') {
      this.logger.warn(`[DEV ONLY] Password reset code for ${user.email}: ${otp}`);
    }

    const rawPhone = String(user.phone || '').replace(/\D/g, '');
    const phoneLast4 = rawPhone.length >= 4 ? rawPhone.slice(-4) : '****';

    return {
      success: true,
      message: process.env.NODE_ENV !== 'production'
        ? 'Verification code created. Development mode: it is printed in the backend console.'
        : 'A verification code was sent to your registered contact.',
      email: user.email,
      phoneLast4,
    };
  }

  resetPassword(dto: ResetPasswordDto) {
    const cleanEmail = String(dto.email || '').trim().toLowerCase();
    const user = this.data.collection('users').find((row) => row.email.toLowerCase() === cleanEmail);
    if (!user) {
      throw new NotFoundException('No account found with this email address.');
    }

    // Only the code generated for THIS email is accepted (no master code).
    const record = this.otpStore.get(cleanEmail);
    if (!record || Date.now() >= record.expiresAt) {
      this.otpStore.delete(cleanEmail);
      throw new BadRequestException('Invalid or expired verification code.');
    }
    if (record.otp !== String(dto.otp || '').trim()) {
      record.attempts += 1;
      // Too many wrong guesses: throw the code away so it cannot be brute-forced
      if (record.attempts >= AuthService.MAX_OTP_ATTEMPTS) this.otpStore.delete(cleanEmail);
      throw new BadRequestException('Invalid or expired verification code.');
    }

    if (!dto.newPassword || dto.newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long.');
    }

    const hashedPassword = hashPassword(dto.newPassword);
    this.data.update('users', user.id, { passwordHash: hashedPassword });
    this.otpStore.delete(cleanEmail);

    return {
      success: true,
      message: 'Password reset successful! You may now sign in with your new password.',
    };
  }

  findAccount(phone: string) {
    const cleanDigits = String(phone || '').replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 4) {
      throw new BadRequestException('Please enter at least 4 digits of your registered phone number.');
    }

    const user = this.data.collection('users').find((row) => {
      const uDigits = String(row.phone || '').replace(/\D/g, '');
      return uDigits && (uDigits.includes(cleanDigits) || cleanDigits.includes(uDigits));
    });

    if (!user) {
      throw new NotFoundException('No registered account found matching that phone number.');
    }

    const parts = user.email.split('@');
    const masked = parts[0].length > 2
      ? parts[0][0] + '***' + parts[0].slice(-1) + '@' + parts[1]
      : user.email;

    return {
      success: true,
      name: user.name,
      email: user.email,
      maskedEmail: masked,
      role: user.role,
      phone: user.phone,
    };
  }

  // Builds what the frontend keeps as the logged-in session. Strips the password
  // hash, then attaches the tenant id the portal needs (vendorId / staffId) so
  // pages can filter data down to "mine" without a second lookup.
  private session(user: User) {
    // Destructure-and-drop: pull passwordHash out, keep everything else. This is
    // the idiom used throughout the codebase to avoid leaking the hash.
    const { passwordHash, ...safeUser } = user;
    const enrichedUser: any = { ...safeUser };

    if (user.role === 'Vendor') {
      const vendors = this.data.collection('vendors');
      const vendor = vendors.find((v) => v.userId === user.id || v.name.toLowerCase() === user.name.toLowerCase() || (user.email && user.email.toLowerCase().includes(v.name.toLowerCase().split(' ')[0])));
      if (vendor) {
        enrichedUser.vendorId = vendor.id;
        enrichedUser.vendorName = vendor.name;
        enrichedUser.businessName = vendor.businessName || vendor.name;
      } else {
        // Link default or generate
        enrichedUser.vendorId = `V_${user.id}`;
        enrichedUser.vendorName = user.name;
        enrichedUser.businessName = user.name;
      }
    } else if (user.role === 'Staff') {
      const staff = this.data.collection('staff').find((s) => s.userId === user.id || (s.email && s.email.toLowerCase() === user.email.toLowerCase()));
      if (staff) {
        enrichedUser.staffId = staff.id;
      }
    }

    return {
      user: enrichedUser,
      role: String(user.role).toLowerCase(),
      // A real signed JWT. `sub` is the standard claim for "who this is"; the
      // signature is what makes the role trustworthy on the way back in.
      token: this.jwt.sign({ sub: user.id, email: user.email, role: String(user.role).toLowerCase() }),
    };
  }
}
