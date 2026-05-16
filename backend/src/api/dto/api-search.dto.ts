import {
  IsString,
  IsOptional,
  IsInt,
  MaxLength,
  MinLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ApiSearchDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  query: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}
