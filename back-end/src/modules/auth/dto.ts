import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'sarah@eliteevents.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Sarah@2026' })
  @IsString()
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'Jordan Lee' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'jordan.client@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+1 555-1099', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Jordan@2026' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: ['Vendor', 'Client', 'Staff', 'vendor', 'client', 'staff'], required: false })
  @IsOptional()
  @IsIn(['Vendor', 'Client', 'Staff', 'vendor', 'client', 'staff'])
  role?: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'sarah@eliteevents.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'sarah@eliteevents.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;

  @ApiProperty({ example: 'Sarah@2026' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class FindAccountDto {
  @ApiProperty({ example: '5551002' })
  @IsString()
  phone: string;
}
