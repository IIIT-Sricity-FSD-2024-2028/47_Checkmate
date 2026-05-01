import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateStaffDto {
  @ApiPropertyOptional({ example: 'S005' }) @IsOptional() @IsString() id?: string;
  @ApiProperty({ example: 'Alex Johnson' }) @IsString() name: string;
  @ApiPropertyOptional({ example: 'AJ' }) @IsOptional() @IsString() initials?: string;
  @ApiProperty({ example: 'Event Coordinator' }) @IsString() role: string;
  @ApiPropertyOptional({ example: 'Elite Events Co.' }) @IsOptional() @IsString() vendor?: string;
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
  @ApiProperty({ example: 'EVT001' }) @IsString() eventId: string;
  @ApiProperty({ example: 'Tech Summit 2026' }) @IsString() eventName: string;
  @ApiProperty({ example: 'Event Coordinator' }) @IsString() role: string;
  @ApiPropertyOptional({ example: 'assigned' }) @IsOptional() @IsString() status?: string;
}
export class UpdateStaffAssignmentDto extends PartialType(CreateStaffAssignmentDto) {}
