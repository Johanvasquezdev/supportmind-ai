import { DocumentStatus } from '@prisma/client';

export class DocumentResponseDto {
  id: string;
  tenantId: string;
  title: string | null;
  status: DocumentStatus;
  createdAt: Date;

  constructor(partial: Partial<DocumentResponseDto>) {
    Object.assign(this, partial);
  }
}
