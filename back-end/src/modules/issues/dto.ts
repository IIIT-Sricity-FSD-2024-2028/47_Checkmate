import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateIssueDto {
  @ApiPropertyOptional({ example: 'ISS001' }) @IsOptional() @IsString() id?: string;
  @ApiPropertyOptional({ example: 'EVT003' }) @IsOptional() @IsString() event?: string;
  @ApiPropertyOptional({ example: 'EVT003' }) @IsOptional() @IsString() eventId?: string;
  @ApiProperty({ example: 'Lighting rig power fluctuation' }) @IsString() title: string;
  @ApiPropertyOptional({ example: 'Equipment' }) @IsOptional() @IsString() category?: string;
  @ApiProperty({ example: 'High' }) @IsString() priority: string;
  @ApiPropertyOptional({ example: 'Main stage lights flicker when the LED wall is active.' }) @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ example: 'Main stage lights flicker.' }) @IsOptional() @IsString() desc?: string;
  @ApiPropertyOptional({ example: 'Sarah Williams' }) @IsOptional() @IsString() reporter?: string;
  @ApiPropertyOptional({ example: 'Vendor' }) @IsOptional() @IsString() reporterRole?: string;
  @ApiPropertyOptional({ example: 'sarah@eliteevents.com' }) @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional({ example: 'Vendor' }) @IsOptional() @IsString() role?: string;
  @ApiPropertyOptional({ example: 'open' }) @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() createdAt?: string;
  @ApiPropertyOptional({ example: 'issue' }) @IsOptional() @IsString() type?: string;
  @ApiPropertyOptional({ example: 'high' }) @IsOptional() @IsString() severity?: string;
  @ApiPropertyOptional({ example: 'admin' }) @IsOptional() @IsString() target?: string;
}
export class UpdateIssueDto extends PartialType(CreateIssueDto) {}
