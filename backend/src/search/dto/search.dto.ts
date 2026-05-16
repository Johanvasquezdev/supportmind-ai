import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchDto {
  @IsString()
  @MinLength(1)
  query!: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}

export class SuggestDto {
  @IsString()
  @MinLength(1)
  q!: string;
}
