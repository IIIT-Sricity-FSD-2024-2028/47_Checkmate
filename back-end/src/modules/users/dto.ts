import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString } from 'class-validator';
import { IsNumber, IsOptional, MaxLength, Min, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Emily Carter' }) @IsString() name: string;
  @ApiProperty({ example: 'emily.client@example.com' }) @IsEmail() email: string;
  @ApiProperty({ example: '+1 555-1004', required: false }) @IsOptional() @IsString() phone?: string;
  @ApiProperty({ enum: ['Admin', 'Superuser', 'Vendor', 'Staff', 'Client'] }) @IsIn(['Admin', 'Superuser', 'Vendor', 'Staff', 'Client']) role: 'Admin' | 'Superuser' | 'Vendor' | 'Staff' | 'Client';
  @ApiProperty({ enum: ['Active', 'Inactive', 'Pending', 'active', 'inactive', 'pending'] }) @IsIn(['Active', 'Inactive', 'Pending', 'active', 'inactive', 'pending']) status: 'Active' | 'Inactive' | 'Pending' | 'active' | 'inactive' | 'pending';
  @ApiProperty({ example: '2026-05-01' }) @IsString() created: string;
  @ApiProperty({ example: 'Emily@2026', required: false }) @IsOptional() @IsString() @MinLength(8) password?: string;
}
export class UpdateUserDto extends PartialType(CreateUserDto) {}

// What a signed-in user may change on their OWN profile (PUT /users/profile).
// It is a class (not an inline type) so the global ValidationPipe runs on it:
// any other field -- role, status, email, passwordHash -- is rejected with 400.
export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Emily Carter' }) @IsOptional() @IsString() @MaxLength(80) name?: string;
  @ApiPropertyOptional({ example: 'emily.client@example.com' }) @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) bio?: string;
  @ApiPropertyOptional({ example: '+1 555-1004' }) @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) location?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(250) address?: string;
  @ApiPropertyOptional({ example: '1995-04-12' }) @IsOptional() @IsString() date_of_birth?: string;
  @ApiPropertyOptional({ example: 5 }) @IsOptional() @IsNumber() @Min(0) years_experience?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) skills?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(250) website_url?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(250) linkedin_url?: string;
}

// The only keys updateProfile() will ever copy into the user record
export const PROFILE_FIELDS = ['name', 'bio', 'phone', 'location', 'address', 'date_of_birth', 'years_experience', 'skills', 'website_url', 'linkedin_url'] as const;
