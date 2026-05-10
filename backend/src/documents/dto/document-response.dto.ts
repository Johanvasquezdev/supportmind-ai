import { DocumentStatus } from '@prisma/client';

export class DocumentResponseDto {
  id: string;
  tenantId: string;
  title: string | null;
  status: DocumentStatus;
  content?: string;
  chunksCount?: number;
  tokensCount?: number;
  errorMsg?: string | null;
  createdAt: Date;

  constructor(partial: Partial<DocumentResponseDto>) {
    Object.assign(this, partial);
  }
}
