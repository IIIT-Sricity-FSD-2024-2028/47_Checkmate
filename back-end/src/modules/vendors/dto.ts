import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateVendorApplicationDto {
  @ApiProperty({ example: 'Priya Nair' }) @IsString() vendorName: string;
  @ApiProperty({ example: 'Aurora Event Studio' }) @IsString() businessName: string;
  @ApiProperty({ example: 'priya@auroraevents.com' }) @IsEmail() email: string;
  @ApiProperty({ example: '+1 555-0101' }) @IsString() phone: string;
  @ApiProperty({ example: 'Event Planning' }) @IsString() category: string;
  @ApiPropertyOptional({ example: 'active' }) @IsOptional() @IsString() categoryClass?: string;
  @ApiProperty({ example: [{ name: 'license.pdf', type: 'license' }] }) @IsArray() documents: Array<{ name: string; type: string }>;
  @ApiPropertyOptional({ enum: ['pending', 'approved', 'rejected'] }) @IsOptional() @IsIn(['pending', 'approved', 'rejected']) status?: 'pending' | 'approved' | 'rejected';
}
export class UpdateVendorApplicationDto extends PartialType(CreateVendorApplicationDto) {}

export class CreateVendorDto {
  @ApiProperty({ example: 'Elite Events Co.' }) @IsString() name: string;
  @ApiProperty({ enum: ['Approved', 'Pending', 'Rejected'] }) @IsIn(['Approved', 'Pending', 'Rejected']) status: 'Approved' | 'Pending' | 'Rejected';
}
export class UpdateVendorDto extends PartialType(CreateVendorDto) {}
