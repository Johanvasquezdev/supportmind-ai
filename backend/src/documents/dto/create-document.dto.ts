import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200_000)
  content: string;
}
