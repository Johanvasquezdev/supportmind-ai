import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { IsString, IsUUID, MaxLength } from 'class-validator';
import { VoiceService } from './voice.service';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';

class SynthesizeDto {
  @IsString()
  @MaxLength(5000)
  text: string;
}

class SummarizeDto {
  @IsUUID()
  documentId: string;
}

@UseGuards(ClerkAuthGuard)
@Controller('voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Post('transcribe')
  @UseInterceptors(FileInterceptor('audio'))
  async transcribe(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Audio file is required');
    }
    return this.voiceService.transcribe(file.buffer, file.mimetype);
  }

  @Post('synthesize')
  async synthesize(@Body() dto: SynthesizeDto, @Res() res: Response) {
    const buffer = await this.voiceService.synthesize(dto.text);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post('summarize')
  async summarize(
    @CurrentTenant() tenantId: string,
    @Body() dto: SummarizeDto,
    @Res() res: Response,
  ) {
    const { audioBuffer, summaryText } = await this.voiceService.summarizeDocument(
      dto.documentId,
      tenantId,
    );
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'X-Summary-Text': Buffer.from(summaryText).toString('base64'),
      'Access-Control-Expose-Headers': 'X-Summary-Text',
    });
    res.end(audioBuffer);
  }

  @Post('search')
  @UseInterceptors(FileInterceptor('audio'))
  async search(
    @CurrentTenant() tenantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Audio file is required');
    }
    return this.voiceService.voiceSearch(file.buffer, file.mimetype, tenantId);
  }
}
