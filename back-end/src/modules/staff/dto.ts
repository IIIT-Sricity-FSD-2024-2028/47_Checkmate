import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

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
  @ApiPropertyOptional({ example: 5 }) @IsOptional() @IsNumber() @Min(0) @Max(60) experienceYears?: number;
  @ApiPropertyOptional({ example: ['Live Sound', 'Stage Management'] }) @IsOptional() @IsArray() @IsString({ each: true }) skills?: string[];
  @ApiPropertyOptional({ example: 'Runs stages for galas.' }) @IsOptional() @IsString() @MaxLength(300) bio?: string;
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
export class UpdateStaffAssignmentDto extends PartialType(CreateStaffAssignmentDto) {
  // Why the staff member turned the assignment down (required when declining)
  @ApiPropertyOptional({ example: 'Schedule conflict' }) @IsOptional() @IsString() @MaxLength(500) declineReason?: string;
}

export class StaffProgressDto {
  @ApiProperty({ enum: ['on_site', 'working', 'on_break', 'finished'] }) @IsIn(['on_site', 'working', 'on_break', 'finished']) workStatus: string;
  @ApiPropertyOptional({ example: 'Stage rigging finished.' }) @IsOptional() @IsString() @MaxLength(200) note?: string;
}

export class StaffLoginDto {
  @ApiProperty({ example: 'mike.staff@eliteevents.com' }) @IsEmail() email: string;
  @ApiProperty({ example: 'Mike@2026' }) @IsString() password: string;
}

export class StaffSignupDto {
  @ApiProperty({ example: 'Alex Johnson' }) @IsString() name: string;
  @ApiProperty({ example: 'alex@eliteevents.com' }) @IsEmail() email: string;
  @ApiPropertyOptional({ example: '+1 234-567-8901' }) @IsOptional() @IsString() phone?: string;
  @ApiProperty({ example: 'Alex@2026' }) @IsString() @MinLength(8) password: string;
}

/** A vendor's rating of one staff member for one completed event. */
export class RateStaffDto {
  @ApiProperty({ example: 'EVT002' }) @IsString() eventId: string;
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 }) @IsInt() @Min(1) @Max(5) stars: number;
  @ApiPropertyOptional({ example: 'On time and great with guests.' }) @IsOptional() @IsString() @MaxLength(300) comment?: string;
}

/** Optional date window for GET /staff-profiles (marks who is busy then). */
export class StaffProfilesQueryDto {
  @ApiPropertyOptional({ example: '2027-03-10' }) @IsOptional() @IsString() date?: string;
  @ApiPropertyOptional({ example: '2027-03-11' }) @IsOptional() @IsString() endDate?: string;
  @ApiPropertyOptional({ example: '18:00' }) @IsOptional() @IsString() time?: string;
  @ApiPropertyOptional({ example: '23:00' }) @IsOptional() @IsString() endTime?: string;
  @ApiPropertyOptional({ example: 'EVT012' }) @IsOptional() @IsString() excludeEventId?: string;
}
