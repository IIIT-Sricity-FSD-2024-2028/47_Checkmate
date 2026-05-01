import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString } from 'class-validator';
import { IsOptional, MinLength } from 'class-validator';

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
