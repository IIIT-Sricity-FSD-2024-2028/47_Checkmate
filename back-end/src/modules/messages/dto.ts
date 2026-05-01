import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ example: 'vendor-client' }) @IsString() threadId: string;
  @ApiProperty({ example: 'Sarah Williams' }) @IsString() sender: string;
  @ApiProperty({ example: 'SW' }) @IsString() initials: string;
  @ApiProperty({ example: false }) @IsBoolean() self: boolean;
  @ApiProperty({ example: 'Can we confirm the revised seating plan?' }) @IsString() text: string;
  @ApiPropertyOptional({ example: 'teal' }) @IsOptional() @IsString() avatar?: string;
}
