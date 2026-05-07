import { IsIn } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsIn(['basic', 'pro'])
  plan: 'basic' | 'pro';
}
