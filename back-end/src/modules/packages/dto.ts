import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePackageDto {
  @ApiPropertyOptional({ example: 'P005' }) @IsOptional() @IsString() id?: string;
  @ApiProperty({ example: 'Executive Launch Package' }) @IsString() name: string;
  @ApiProperty({ example: 'Corporate' }) @IsString() category: string;
  @ApiProperty({ example: 6200 }) @IsNumber() @Min(0) price: number;
  @ApiProperty({ example: 12 }) @IsNumber() @Min(1) duration: number;
  @ApiProperty({ example: '100-300' }) @IsString() capacity: string;
  @ApiProperty({ example: 'Premium launch event package.' }) @IsString() desc: string;
  @ApiProperty({ example: ['Stage', 'Lighting Rig'] }) @IsArray() resources: string[];
  @ApiProperty({ example: ['Event Director', 'Security'] }) @IsArray() staff: string[];
}
export class UpdatePackageDto extends PartialType(CreatePackageDto) {}
