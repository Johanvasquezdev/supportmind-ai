import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    tenantId: string;
  };
};

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  sendMessage(
    @CurrentTenant() tenantId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChatRequestDto,
  ) {
    return this.chatService.sendMessage({
      tenantId,
      userId: req.user.userId,
      message: dto.message,
      conversationId: dto.conversationId,
    });
  }
}
