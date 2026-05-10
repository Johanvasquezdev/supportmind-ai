import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException, Logger } from '@nestjs/common';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { DocumentsService } from '../documents/documents.service';
import { AiService } from '../ai/ai.service';
import { RagService } from '../rag/rag.service';

@Injectable()
export class VoiceService {
  private readonly elevenlabs = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  });

  constructor(
    private readonly documentsService: DocumentsService,
    private readonly aiService: AiService,
    private readonly ragService: RagService,
  ) {}

  async transcribe(audioBuffer: Buffer, mimeType: string): Promise<{ text: string }> {
    if (audioBuffer.length > 1 * 1024 * 1024) {
      throw new BadRequestException('Recording too long.');
    }

    try {
      // Use Uint8Array to satisfy BlobPart requirement in Node.js
      const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
      const file = new File([blob], 'audio.webm', { type: mimeType });

      const result = await this.elevenlabs.speechToText.convert({
        file,
        modelId: (process.env.ELEVENLABS_STT_MODEL ?? 'scribe_v2') as any,
        languageCode: null,
        tagAudioEvents: false,
        diarize: false,
      });

      return { text: result.text };
    } catch (error) {
      throw new InternalServerErrorException(`Transcription failed: ${error.message}`);
    }
  }

  async synthesize(text: string): Promise<Buffer> {
    const trimmedText = text.trim().slice(0, 48000); // Allow more for internal split if needed, but SDK limit is usually 5000
    
    // Simple sentence boundary split for texts > 4800 chars
    const chunks: string[] = [];
    if (trimmedText.length > 4800) {
      const sentences = trimmedText.split(/(?<=[.!?])\s+/);
      let currentChunk = '';
      for (const sentence of sentences) {
        if ((currentChunk + sentence).length > 4800) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
      }
      if (currentChunk) chunks.push(currentChunk.trim());
    } else {
      chunks.push(trimmedText);
    }

    try {
      const audioBuffers: Buffer[] = [];
      const logger = new Logger('VoiceService');
      logger.log(`Synthesizing text (${chunks.length} chunks): ${trimmedText.slice(0, 50)}...`);

      for (const chunk of chunks) {
        const audioStream = await this.elevenlabs.textToSpeech.convert(
          process.env.ELEVENLABS_VOICE_ID ?? 'JBFqnCBsd6RMkjVDRZzb',
          {
            text: chunk,
            modelId: (process.env.ELEVENLABS_TTS_MODEL ?? 'eleven_turbo_v2_5') as any,
            languageCode: 'en',
          }
        );

        const streamChunks: Buffer[] = [];
        for await (const streamChunk of audioStream as any) {
          streamChunks.push(Buffer.from(streamChunk));
        }
        const chunkBuffer = Buffer.concat(streamChunks);
        audioBuffers.push(chunkBuffer);
        logger.log(`Generated chunk of size: ${chunkBuffer.length}`);
      }
      const finalBuffer = Buffer.concat(audioBuffers);
      logger.log(`Total audio generated: ${finalBuffer.length} bytes`);
      return finalBuffer;
    } catch (error) {
      throw new InternalServerErrorException(`Synthesis failed: ${error.message}`);
    }
  }

  async summarizeDocument(documentId: string, tenantId: string): Promise<{ audioBuffer: Buffer, summaryText: string }> {
    const document = await this.documentsService.findOne(tenantId, documentId);
    if (!document || !document.content) {
      throw new NotFoundException('Document or document content not found');
    }

    const content = document.content.slice(0, 8000);
    const summaryPrompt = `Summarize this document in 3 to 5 sentences as if speaking naturally to a colleague. Be clear and conversational. No bullet points, no headers, no markdown. Document: ${content}`;
    
    const summaryText = await this.aiService.generateSummary(summaryPrompt);
    const audioBuffer = await this.synthesize(summaryText);

    return { audioBuffer, summaryText };
  }

  async voiceSearch(audioBuffer: Buffer, mimeType: string, tenantId: string): Promise<{ query: string, results: any[] }> {
    const { text: query } = await this.transcribe(audioBuffer, mimeType);
    const results = await this.ragService.retrieve(query, tenantId);
    return { query, results };
  }
}
