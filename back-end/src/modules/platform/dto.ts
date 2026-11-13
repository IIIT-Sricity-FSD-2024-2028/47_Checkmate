import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

// Global Settings. Every field is optional so the page can save just what changed.
export class PlatformSettingsDto {
  @ApiPropertyOptional({ example: 10, description: 'Platform commission in percent' })
  @IsOptional() @IsNumber() @Min(0) @Max(50)
  commissionRate?: number;

  @ApiPropertyOptional({ example: 1000, description: 'Smallest budget a new event may have (0 = no minimum)' })
  @IsOptional() @IsNumber() @Min(0)
  minEventBudget?: number;

  @ApiPropertyOptional({ example: false, description: 'Approve vendor applications as soon as they arrive' })
  @IsOptional() @IsBoolean()
  autoApproveVendors?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Only admins and superusers may change data while this is on' })
  @IsOptional() @IsBoolean()
  maintenanceMode?: boolean;
}

export const AUDIENCES = ['all', 'client', 'vendor', 'staff'] as const;

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'Scheduled maintenance on Sunday' })
  @IsString() @MinLength(3) @MaxLength(100)
  title: string;

  @ApiProperty({ example: 'The platform will be read-only from 2 AM to 4 AM.' })
  @IsString() @MinLength(3) @MaxLength(500)
  message: string;

  @ApiProperty({ enum: AUDIENCES })
  @IsIn(AUDIENCES)
  audience: (typeof AUDIENCES)[number];
}

export class SupportReplyDto {
  @ApiProperty({ example: 'emily.client@example.com' })
  @IsEmail()
  recipientEmail: string;

  @ApiProperty({ example: 'Thanks, we are looking into it.' })
  @IsString() @MinLength(1) @MaxLength(1000)
  text: string;
}
