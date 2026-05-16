import { IsString, IsOptional, IsBoolean, IsArray, IsIn, Matches, MaxLength, ArrayMaxSize } from 'class-validator';

export class WidgetConfigDto {
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'primaryColor must be a valid hex color (e.g. #7c3aed)' })
  primaryColor?: string;

  @IsOptional()
  @IsIn(['bottom-right', 'bottom-left'])
  position?: 'bottom-right' | 'bottom-left';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  placeholder?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  welcomeMessage?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  allowedOrigins?: string[];
}
