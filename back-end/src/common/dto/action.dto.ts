import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class StatusDto {
  @ApiProperty({ example: 'approved' })
  @IsString()
  status: string;

  @ApiPropertyOptional({ example: 'Approval remarks or rejection reason' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 45000, description: 'Final price the vendor quotes when approving' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quotedPrice?: number;
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
