import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateEventDto {
  @ApiPropertyOptional({ example: 'EVT005' }) @IsOptional() @IsString() id?: string;
  @ApiProperty({ example: 'Investor Meetup' }) @IsString() name: string;
  @ApiProperty({ example: 'Corporate' }) @IsString() type: string;
  @ApiProperty({ example: '2026-06-12' }) @IsString() date: string;
  @ApiPropertyOptional({ example: '18:00' }) @IsOptional() @IsString() time?: string;
  @ApiProperty({ example: 'Skyline Ballroom' }) @IsString() venue: string;
  @ApiPropertyOptional({ example: 200 }) @IsOptional() @IsNumber() @Min(1) people?: number;
  @ApiPropertyOptional({ example: 200 }) @IsOptional() @IsNumber() @Min(1) guests?: number;
  @ApiPropertyOptional({ example: 'pending' }) @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional({ example: 'Acme Inc.' }) @IsOptional() @IsString() client?: string;
  @ApiPropertyOptional({ example: 'Elite Events Co.' }) @IsOptional() @IsString() vendor?: string;
  @ApiPropertyOptional({ example: 'client' }) @IsOptional() @IsString() createdBy?: string;
  @ApiPropertyOptional({ example: 'P004' }) @IsOptional() @IsString() packageId?: string;
  @ApiPropertyOptional({ example: 12000 }) @IsOptional() @IsNumber() @Min(0) budget?: number;
  @ApiPropertyOptional({ example: 'Vegetarian catering required.' }) @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional({ example: '2026-05-01T12:00:00.000Z' }) @IsOptional() @IsString() submittedAt?: string;
  @ApiPropertyOptional({ example: '2026-05-01T12:00:00.000Z' }) @IsOptional() @IsString() createdAt?: string;
  @ApiPropertyOptional({ example: 'P001' }) @IsOptional() @IsString() presetPackageId?: string;
  @ApiPropertyOptional({ example: '2026-05-01T12:00:00.000Z' }) @IsOptional() @IsString() approvedAt?: string;
  @ApiPropertyOptional({ example: '2026-05-01T12:00:00.000Z' }) @IsOptional() @IsString() startedAt?: string;
  @ApiPropertyOptional({ example: '2026-05-01T12:00:00.000Z' }) @IsOptional() @IsString() endedAt?: string;
}
export class UpdateEventDto extends PartialType(CreateEventDto) {}
