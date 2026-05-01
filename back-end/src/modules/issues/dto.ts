import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateIssueDto {
  @ApiPropertyOptional({ example: 'ISS001' }) @IsOptional() @IsString() id?: string;
  @ApiPropertyOptional({ example: 'EVT003' }) @IsOptional() @IsString() event?: string;
  @ApiPropertyOptional({ example: 'EVT003' }) @IsOptional() @IsString() eventId?: string;
  @ApiProperty({ example: 'Lighting rig power fluctuation' }) @IsString() title: string;
  @ApiProperty({ example: 'Equipment' }) @IsString() category: string;
  @ApiProperty({ example: 'High' }) @IsString() priority: string;
  @ApiProperty({ example: 'Main stage lights flicker when the LED wall is active.' }) @IsString() description: string;
  @ApiProperty({ example: 'Sarah Williams' }) @IsString() reporter: string;
  @ApiPropertyOptional({ example: 'sarah@eliteevents.com' }) @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional({ example: 'Vendor' }) @IsOptional() @IsString() role?: string;
  @ApiPropertyOptional({ example: 'open' }) @IsOptional() @IsString() status?: string;
}
export class UpdateIssueDto extends PartialType(CreateIssueDto) {}
