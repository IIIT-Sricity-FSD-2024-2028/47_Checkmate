import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class StateValueDto {
  @ApiProperty({ description: 'Replacement value for a shared in-memory application state key.' })
  @IsNotEmpty()
  value: unknown;
}
