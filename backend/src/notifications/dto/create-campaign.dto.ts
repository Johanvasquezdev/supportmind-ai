import { IsString, IsArray, IsOptional, IsEmail, IsNumber } from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  name: string;

  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  senderName?: string;

  @IsOptional()
  @IsEmail()
  senderEmail?: string;

  @IsString()
  htmlContent: string;

  @IsArray()
  @IsNumber({}, { each: true })
  listIds: number[];

  @IsOptional()
  @IsString()
  scheduledAt?: string;
}
