import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

// Sent as multipart form data, because the documents travel with it.
export class ApplyDto {
  @ApiProperty({ example: 'Alex Johnson' }) @IsString() @IsNotEmpty() @MaxLength(80) name: string;
  @ApiProperty({ example: 'alex@example.com' }) @IsEmail() email: string;
  @ApiProperty({ example: '9876543210' }) @IsString() @IsNotEmpty() @MaxLength(20) phone: string;
  @ApiProperty({ example: 'Alex@2026' }) @IsString() @MinLength(8) password: string;
  @ApiProperty({ example: 'V005', description: 'The vendor whose work the person chose' }) @IsString() @IsNotEmpty() vendorId: string;
}

export class ApplicationDecisionDto {
  @ApiProperty({ enum: ['approved', 'rejected'] }) @IsIn(['approved', 'rejected']) status: 'approved' | 'rejected';
  @ApiPropertyOptional({ example: 'Position already filled.' }) @IsOptional() @IsString() @MaxLength(400) note?: string;
}
