import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateBookingDto {
  @ApiPropertyOptional({ example: 'EVT001' }) @IsOptional() @IsString() eventId?: string;
  @ApiProperty({ example: 'Tech Summit 2026' }) @IsString() eventName: string;
  @ApiProperty({ example: 'Tech Corp' }) @IsString() client: string;
  @ApiPropertyOptional({ example: 'U004' }) @IsOptional() @IsString() clientId?: string;
  @ApiProperty({ example: 'Dream Events Ltd.' }) @IsString() vendor: string;
  @ApiPropertyOptional({ example: 'V002' }) @IsOptional() @IsString() vendorId?: string;
  @ApiProperty({ example: 'Confirmed' }) @IsString() status: string;
  @ApiProperty({ example: 45000 }) @IsNumber() @Min(0) cost: number;
  @ApiPropertyOptional({ example: 10000 }) @IsOptional() @IsNumber() @Min(0) advancePaid?: number;
  @ApiPropertyOptional({ example: 'unpaid' }) @IsOptional() @IsString() paymentStatus?: string;
  @ApiPropertyOptional({ example: 0.10 }) @IsOptional() @IsNumber() commissionRate?: number;
  @ApiPropertyOptional({ example: 4500 }) @IsOptional() @IsNumber() commissionAmount?: number;
  @ApiPropertyOptional({ example: 40500 }) @IsOptional() @IsNumber() vendorPayoutAmount?: number;
  @ApiPropertyOptional({ example: 'pending' }) @IsOptional() @IsString() payoutStatus?: string;
  @ApiPropertyOptional({ example: '2026-05-02T14:30:00.000Z' }) @IsOptional() @IsString() settledAt?: string;
  @ApiPropertyOptional({ example: 'U001' }) @IsOptional() @IsString() settledBy?: string;
  @ApiPropertyOptional({ example: '2026-04-01' }) @IsOptional() @IsString() created?: string;
}

export class UpdateBookingDto extends PartialType(CreateBookingDto) {}

export class SettlePayoutDto {
  @ApiPropertyOptional({ example: 'U001', description: 'Admin User ID authorizing payout' })
  @IsOptional()
  @IsString()
  settledBy?: string;

  @ApiPropertyOptional({ example: 'Batch payout released via bank transfer', description: 'Settlement audit note' })
  @IsOptional()
  @IsString()
  note?: string;
}
