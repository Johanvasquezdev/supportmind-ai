import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { TenantRateLimitGuard } from '../auth/guards/tenant-rate-limit.guard';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    tenantId: string;
  };
};

// Guards execute in order: Clerk first (authenticates + attaches tenantId),
// then rate limit (reads tenantId to enforce per-tenant throttling).
@UseGuards(ClerkAuthGuard, TenantRateLimitGuard)
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

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
      mode: dto.mode,
    });
  }

  @Post('stream')
  @HttpCode(HttpStatus.OK)
  async streamMessage(
    @CurrentTenant() tenantId: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Body() dto: ChatRequestDto,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering in Nginx if present

    const sendEvent = (data: object) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      await this.chatService.streamMessage({
        tenantId,
        userId: req.user.userId,
        message: dto.message,
        conversationId: dto.conversationId,
        mode: dto.mode,
        onToken: (token) => {
          sendEvent({ type: 'token', content: token });
        },
        onDone: (result) => {
          sendEvent({
            type: 'done',
            conversationId: result.conversationId,
            context: result.context,
            usage: result.usage,
          });
          res.end();
        },
        onError: (error) => {
          this.logger.error(`Stream error: ${error.message}`);
          sendEvent({ type: 'error', message: error.message });
          res.end();
        },
      });
    } catch (error) {
      this.logger.error(`Stream caught error: ${error.message}`);
      sendEvent({ type: 'error', message: error.message });
      res.end();
    }
  }

  @Get('conversations')
  getConversations(
    @CurrentTenant() tenantId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.chatService.getConversations(tenantId, req.user.userId);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.chatService.getConversationMessages(tenantId, id);
  }
}
