import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ example: 'vendor-client' }) @IsString() threadId: string;
  @ApiPropertyOptional({ description: 'Ignored: the signed-in user is the sender' }) @IsOptional() @IsString() sender?: string;
  @ApiPropertyOptional({ example: 'SW' }) @IsOptional() @IsString() initials?: string;
  @ApiPropertyOptional({ example: false }) @IsOptional() @IsBoolean() self?: boolean;
  @ApiProperty({ example: 'Can we confirm the revised seating plan?' }) @IsString() text: string;
  @ApiPropertyOptional({ example: 'teal' }) @IsOptional() @IsString() avatar?: string;
}
