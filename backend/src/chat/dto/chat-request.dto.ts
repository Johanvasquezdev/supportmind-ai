import { IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { AnswerMode } from '../../ai/ai.service';

export class ChatRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message: string;

  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @IsOptional()
  @IsIn(['answer', 'summary', 'exact'])
  mode?: AnswerMode;
}
