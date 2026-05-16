import {
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ApiChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message: string;

  @IsOptional()
  @IsIn(['answer', 'summary', 'exact'])
  mode?: 'answer' | 'summary' | 'exact';

  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @IsOptional()
  @IsBoolean()
  stream?: boolean;
}
