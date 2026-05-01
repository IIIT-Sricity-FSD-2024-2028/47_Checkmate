import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class IdParamDto {
  @ApiProperty({ example: 'EVT001' })
  @IsString()
  @MinLength(1)
  id: string;
}
