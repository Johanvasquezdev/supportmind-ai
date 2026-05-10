import { IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class SendSmsDto {
  @IsPhoneNumber()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  sender?: string;
}
