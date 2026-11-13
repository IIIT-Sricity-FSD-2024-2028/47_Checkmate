import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';

export class CreateResourceDto {
  @ApiPropertyOptional({ example: 'R006' }) @IsOptional() @IsString() id?: string;
  @ApiProperty({ example: 'LED Screen 4K' }) @IsString() name: string;
  @ApiProperty({ example: 'Equipment' }) @IsString() category: string;
  @ApiPropertyOptional({ example: 'Visual' }) @IsOptional() @IsString() cat?: string;
  @ApiPropertyOptional({ example: 'Elite Events Co.' }) @IsOptional() @IsString() vendor?: string;
  @ApiPropertyOptional({ example: 'V001' }) @IsOptional() @IsString() vendorId?: string;
  @ApiPropertyOptional({ example: 'vendor@eliteevents.com' }) @IsOptional() @IsString() vendorEmail?: string;
  @ApiPropertyOptional({ example: 'vendor@eliteevents.com' }) @IsOptional() @IsString() createdBy?: string;
  @ApiProperty({ example: 8 }) @IsNumber() @Min(0) quantity: number;
  @ApiPropertyOptional({ example: 8 }) @IsOptional() @IsNumber() @Min(0) total?: number;
  @ApiPropertyOptional({ example: 8 }) @IsOptional() @IsNumber() @Min(0) avail?: number;
  @ApiProperty({ example: 300 }) @IsNumber() @Min(0) price: number;
  @ApiPropertyOptional({ example: 'day' }) @IsOptional() @IsString() unit?: string;
  @ApiProperty({ example: true }) @IsBoolean() available: boolean;
  @ApiPropertyOptional({ example: 'Ready' }) @IsOptional() @IsString() condition?: string;
}
export class UpdateResourceDto extends PartialType(CreateResourceDto) {}

// Query string for GET /resources/availability and /resources/:id/availability.
// Send `date` (and optionally the rest), or just `eventId` to use that event's window.
export class AvailabilityQueryDto {
  @ApiPropertyOptional({ example: '2026-04-15' }) @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must look like YYYY-MM-DD' }) date?: string;
  @ApiPropertyOptional({ example: '2026-04-16', description: 'Last day of a multi-day event' }) @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate must look like YYYY-MM-DD' }) endDate?: string;
  @ApiPropertyOptional({ example: '09:00' }) @IsOptional() @IsString() time?: string;
  @ApiPropertyOptional({ example: '17:00' }) @IsOptional() @IsString() endTime?: string;
  @ApiPropertyOptional({ example: 'EVT005', description: 'Use this event\'s window and ignore its own allocations' }) @IsOptional() @IsString() eventId?: string;
  @ApiPropertyOptional({ example: 'EVT005', description: 'Ignore this event\'s allocations (when editing it)' }) @IsOptional() @IsString() excludeEventId?: string;
}
