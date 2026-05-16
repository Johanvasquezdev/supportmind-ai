import { IsString, IsUUID, MaxLength, MinLength, IsOptional, IsArray, ValidateNested, IsIn, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

class ConversationHistoryItem {
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  @MaxLength(2000)
  content: string;
}

export class WidgetChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  message: string;

  @IsUUID()
  sessionId: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => ConversationHistoryItem)
  conversationHistory?: ConversationHistoryItem[];
}
