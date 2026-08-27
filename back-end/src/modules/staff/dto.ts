import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateStaffDto {
  @ApiPropertyOptional({ example: 'S005' }) @IsOptional() @IsString() id?: string;
  @ApiProperty({ example: 'Alex Johnson' }) @IsString() name: string;
  @ApiPropertyOptional({ example: 'AJ' }) @IsOptional() @IsString() initials?: string;
  @ApiProperty({ example: 'Event Coordinator' }) @IsString() role: string;
  @ApiPropertyOptional({ example: 'Elite Events Co.' }) @IsOptional() @IsString() vendor?: string;
  @ApiPropertyOptional({ example: 'V001' }) @IsOptional() @IsString() vendorId?: string;
  @ApiPropertyOptional({ example: 'vendor@eliteevents.com' }) @IsOptional() @IsString() vendorEmail?: string;
  @ApiPropertyOptional({ example: 'U002' }) @IsOptional() @IsString() userId?: string;
  @ApiPropertyOptional({ example: 'vendor@eliteevents.com' }) @IsOptional() @IsString() createdBy?: string;
  @ApiProperty({ example: '+1 234-567-8901' }) @IsString() phone: string;
  @ApiPropertyOptional({ example: 'alex@eliteevents.com' }) @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional({ example: 60 }) @IsOptional() @IsNumber() @Min(0) workload?: number;
  @ApiProperty({ example: 'available' }) @IsString() status: string;
  @ApiPropertyOptional({ example: 'Available' }) @IsOptional() @IsString() avail?: string;
  @ApiPropertyOptional({ example: 2 }) @IsOptional() @IsNumber() @Min(0) events?: number;
  @ApiPropertyOptional({ example: 'pink' }) @IsOptional() @IsString() avatar?: string;
  @ApiPropertyOptional({ example: ['EVT001'] }) @IsOptional() @IsArray() assignedEvents?: string[];
}
export class UpdateStaffDto extends PartialType(CreateStaffDto) {}

export class CreateStaffAssignmentDto {
  @ApiPropertyOptional({ example: 'A001' }) @IsOptional() @IsString() id?: string;
  @ApiProperty({ example: 'S001' }) @IsString() staffId: string;
  @ApiProperty({ example: 'Alex Johnson' }) @IsString() staffName: string;
  @ApiPropertyOptional({ example: 'Event Coordinator' }) @IsOptional() @IsString() staffRole?: string;
  @ApiProperty({ example: 'EVT001' }) @IsString() eventId: string;
  @ApiProperty({ example: 'Tech Summit 2026' }) @IsString() eventName: string;
  @ApiProperty({ example: 'Event Coordinator' }) @IsString() role: string;
  @ApiPropertyOptional({ example: '2026-05-10' }) @IsOptional() @IsString() eventDate?: string;
  @ApiPropertyOptional({ example: 'Convention Center' }) @IsOptional() @IsString() eventVenue?: string;
  @ApiPropertyOptional({ example: 500 }) @IsOptional() @IsNumber() eventPeople?: number;
  @ApiPropertyOptional({ example: 'Assigned as Event Coordinator' }) @IsOptional() @IsString() taskDesc?: string;
  @ApiPropertyOptional({ example: 'Medium' }) @IsOptional() @IsString() priority?: string;
  @ApiPropertyOptional({ example: 'assigned' }) @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() tasks?: any[];
  @ApiPropertyOptional() @IsOptional() @IsString() assignedAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() respondedAt?: string;
}
export class UpdateStaffAssignmentDto extends PartialType(CreateStaffAssignmentDto) {}
