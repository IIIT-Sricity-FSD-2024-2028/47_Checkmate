import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'Tech Summit 2026' }) @IsString() eventName: string;
  @ApiProperty({ example: 'Tech Corp' }) @IsString() client: string;
  @ApiProperty({ example: 'Dream Events Ltd.' }) @IsString() vendor: string;
  @ApiProperty({ example: 'Pending' }) @IsString() status: string;
  @ApiProperty({ example: 45000 }) @IsNumber() @Min(0) cost: number;
  @ApiProperty({ example: '2026-04-01' }) @IsString() created: string;
}
export class UpdateBookingDto extends PartialType(CreateBookingDto) {}
