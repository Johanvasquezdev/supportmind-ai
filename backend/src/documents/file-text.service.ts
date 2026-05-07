import { BadRequestException, Injectable } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';

const SUPPORTED_MIME_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'application/pdf',
]);

@Injectable()
export class FileTextService {
  async extract(file: Express.Multer.File): Promise<string> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('File is empty');
    }

    if (!this.isSupported(file)) {
      throw new BadRequestException('Only .txt, .md, and .pdf files are supported');
    }

    if (this.isPdf(file)) {
      const parser = new PDFParse({ data: new Uint8Array(file.buffer) });

      try {
        const parsed = await parser.getText();
        return this.cleanText(parsed.text);
      } finally {
        await parser.destroy();
      }
    }

    return this.cleanText(file.buffer.toString('utf8'));
  }

  private isSupported(file: Express.Multer.File): boolean {
    const name = file.originalname.toLowerCase();
    return (
      SUPPORTED_MIME_TYPES.has(file.mimetype) ||
      name.endsWith('.txt') ||
      name.endsWith('.md') ||
      name.endsWith('.pdf')
    );
  }

  private isPdf(file: Express.Multer.File): boolean {
    return (
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf')
    );
  }

  private cleanText(text: string): string {
    const clean = text.replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

    if (!clean) {
      throw new BadRequestException('No readable text found in file');
    }

    return clean;
  }
}
