import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class StatusDto {
  @ApiProperty({ example: 'approved' })
  @IsString()
  status: string;

  @ApiPropertyOptional({ example: 'Approval remarks or rejection reason' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class DecisionDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsIn(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @ApiPropertyOptional({ example: 'Documents verified and vendor category matches services.' })
  @IsOptional()
  @IsString()
  note?: string;
}
