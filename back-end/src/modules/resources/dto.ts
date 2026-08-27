import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

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
