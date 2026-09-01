import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Allow, IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateEventDto {
  @ApiPropertyOptional({ example: 'EVT005' }) @IsOptional() @IsString() id?: string;
  @ApiProperty({ example: 'Investor Meetup' }) @IsString() name: string;
  @ApiProperty({ example: 'Corporate' }) @IsString() type: string;
  @ApiProperty({ example: '2026-06-12' }) @IsString() date: string;
  @ApiPropertyOptional({ example: '18:00' }) @IsOptional() @IsString() time?: string;
  @ApiProperty({ example: 'Skyline Ballroom' }) @IsString() venue: string;
  @ApiPropertyOptional({ example: 200 }) @IsOptional() @IsNumber() @Min(0) people?: number;
  @ApiPropertyOptional({ example: 200 }) @IsOptional() @IsNumber() @Min(0) guests?: number;
  @ApiPropertyOptional({ example: 'pending' }) @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional({ example: 'Acme Inc.' }) @IsOptional() @IsString() client?: string;
  @ApiPropertyOptional({ example: 'U004' }) @IsOptional() @IsString() clientId?: string;
  @ApiPropertyOptional({ example: 'client@example.com' }) @IsOptional() @IsString() clientEmail?: string;
  @ApiPropertyOptional({ example: 'Elite Events Co.' }) @IsOptional() @IsString() vendor?: string;
  @ApiPropertyOptional({ example: 'V001' }) @IsOptional() @IsString() vendorId?: string;
  @ApiPropertyOptional({ example: 'vendor@example.com' }) @IsOptional() @IsString() vendorEmail?: string;
  @ApiPropertyOptional({ example: 'client' }) @IsOptional() @IsString() createdBy?: string;
  @ApiPropertyOptional({ example: 'P004' }) @IsOptional() @IsString() packageId?: string;
  @ApiPropertyOptional({ example: 12000 }) @IsOptional() @Allow() budget?: any;
  @ApiPropertyOptional({ example: '$1,000 - $5,000' }) @IsOptional() @IsString() budgetRange?: string;
  @ApiPropertyOptional({ example: 'Vegetarian catering required.' }) @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional({ example: '2026-05-01T12:00:00.000Z' }) @IsOptional() @IsString() submittedAt?: string;
  @ApiPropertyOptional({ example: '2026-05-01T12:00:00.000Z' }) @IsOptional() @IsString() createdAt?: string;
  @ApiPropertyOptional({ example: 'P001' }) @IsOptional() @IsString() presetPackageId?: string;
  @ApiPropertyOptional({ example: '2026-05-01T12:00:00.000Z' }) @IsOptional() @IsString() approvedAt?: string;
  @ApiPropertyOptional({ example: '2026-05-01T12:00:00.000Z' }) @IsOptional() @IsString() startedAt?: string;
  @ApiPropertyOptional({ example: '2026-05-01T12:00:00.000Z' }) @IsOptional() @IsString() endedAt?: string;
  @ApiPropertyOptional({ description: 'Resources requested by client' }) @IsOptional() @Allow() requestedResources?: any[];
  @ApiPropertyOptional({ description: 'Staff requested by client' }) @IsOptional() @Allow() requestedStaff?: any[];
  @ApiPropertyOptional({ example: 5000 }) @IsOptional() @Allow() estimatedCost?: any;
  @ApiPropertyOptional({ description: 'Reason for rejection' }) @IsOptional() @IsString() rejectionReason?: string;
  @ApiPropertyOptional({ example: '2026-05-01T12:00:00.000Z' }) @IsOptional() @IsString() rejectedAt?: string;
  @ApiPropertyOptional({ example: ['V001', 'V002'] }) @IsOptional() @IsArray() vendorIds?: string[];
  @ApiPropertyOptional({ description: 'Array of involved vendor names or objects' }) @IsOptional() @Allow() vendors?: any[];
  @ApiPropertyOptional({ example: ['Lighting', 'Catering'] }) @IsOptional() @IsArray() categories?: string[];
  @ApiPropertyOptional({ description: 'Per-vendor response states' }) @IsOptional() @Allow() vendorResponses?: any[];
  @ApiPropertyOptional({ description: 'Detected conflicts' }) @IsOptional() @Allow() conflicts?: any[];
}
export class UpdateEventDto extends PartialType(CreateEventDto) {}
