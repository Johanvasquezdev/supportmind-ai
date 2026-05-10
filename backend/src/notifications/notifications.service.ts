import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { baseTemplate } from './templates/email.templates';
import { smsTemplates } from './templates/sms.templates';

// Using require as per prompt instructions for Brevo SDK
const brevo = require('@getbrevo/brevo');

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly emailApi: any;
  private readonly smsApi: any;
  private readonly campaignApi: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');

    // Transactional Email client
    this.emailApi = new brevo.TransactionalEmailsApi();
    this.emailApi.authentications.apiKey.apiKey = apiKey;

    // SMS client
    this.smsApi = new brevo.TransactionalSMSApi();
    this.smsApi.authentications.apiKey.apiKey = apiKey;

    // Campaigns client
    this.campaignApi = new brevo.EmailCampaignsApi();
    this.campaignApi.authentications.apiKey.apiKey = apiKey;
  }

  async createEmailCampaign(options: {
    name: string;
    subject: string;
    senderName?: string;
    senderEmail?: string;
    htmlContent: string;
    listIds: number[];
    scheduledAt?: string;
  }) {
    try {
      const emailCampaigns = new brevo.CreateEmailCampaign();
      
      emailCampaigns.name = options.name;
      emailCampaigns.subject = options.subject;
      emailCampaigns.sender = {
        name: options.senderName || this.configService.get<string>('BREVO_SENDER_NAME'),
        email: options.senderEmail || this.configService.get<string>('BREVO_SENDER_EMAIL'),
      };
      emailCampaigns.type = 'classic';
      emailCampaigns.htmlContent = options.htmlContent;
      emailCampaigns.recipients = { listIds: options.listIds };
      
      if (options.scheduledAt) {
        emailCampaigns.scheduledAt = options.scheduledAt;
      }

      const result = await this.campaignApi.createEmailCampaign(emailCampaigns);
      this.logger.log(`Email campaign created successfully: ${options.name}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create email campaign: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async sendEmail(to: string, subject: string, htmlContent: string) {
    try {
      const senderEmail = this.configService.get<string>('BREVO_SENDER_EMAIL');
      const senderName = this.configService.get<string>('BREVO_SENDER_NAME');

      await this.emailApi.sendTransacEmail({
        sender: { email: senderEmail, name: senderName },
        to: [{ email: to }],
        subject,
        htmlContent,
      });

      this.logger.log(`Email sent successfully to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`, error.stack);
    }
  }

  private async sendSms(to: string, content: string) {
    try {
      const sender = this.configService.get<string>('BREVO_SMS_SENDER');

      await this.smsApi.sendTransacSms({
        sender,
        recipient: to,
        content,
      });

      this.logger.log(`SMS sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}: ${error.message}`, error.stack);
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const content = `
      <h1>Welcome to SupportMind AI, ${name}!</h1>
      <p>We're thrilled to have you on board. Your 14-day trial is now active, giving you full access to our AI-powered document analysis and chat features.</p>
      <p>Ready to get started? Upload your first document to begin chatting with your data.</p>
      <div class="button-container">
        <a href="${this.configService.get('FRONTEND_URL')}/dashboard" class="button">Go to Dashboard</a>
      </div>
      <p class="muted">Need help? Reply to this email and our support team will be happy to assist.</p>
    `;
    const html = baseTemplate(content, 'Welcome to SupportMind AI');
    await this.sendEmail(to, 'Welcome to SupportMind AI', html);
  }

  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    const content = `
      <h1>Reset your SupportMind password</h1>
      <p>We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.</p>
      <div class="button-container">
        <a href="${resetLink}" class="button">Reset Password</a>
      </div>
      <p class="muted">If you didn't request this, you can safely ignore this email. Your password will remain unchanged.</p>
    `;
    const html = baseTemplate(content, 'Reset your SupportMind password');
    await this.sendEmail(to, 'Reset your SupportMind password', html);
  }

  async sendPlanConfirmationEmail(to: string, name: string, plan: string, amount: string): Promise<void> {
    const limits = plan.toLowerCase() === 'pro' ? '10,000 messages' : '1,000 messages';
    const content = `
      <h1>Your SupportMind ${plan} plan is active</h1>
      <p>Hi ${name}, thank you for choosing SupportMind AI! Your subscription is now active.</p>
      <p><strong>Plan:</strong> ${plan}<br>
      <strong>Amount Charged:</strong> ${amount}<br>
      <strong>Included:</strong> ${limits} per month</p>
      <div class="button-container">
        <a href="${this.configService.get('FRONTEND_URL')}/dashboard" class="button">Go to Dashboard</a>
      </div>
    `;
    const html = baseTemplate(content, `Your SupportMind ${plan} plan is active`);
    await this.sendEmail(to, `Your SupportMind ${plan} plan is active`, html);
  }

  async sendTrialEndingEmail(to: string, name: string, daysLeft: number): Promise<void> {
    const content = `
      <h1>Your trial ends in ${daysLeft} days</h1>
      <p>Hi ${name}, your 14-day trial of SupportMind AI is coming to an end. We hope you've enjoyed the powerful insights from your documents!</p>
      <p>Upgrade now to a paid plan to keep your access uninterrupted and unlock even higher limits.</p>
      <p><strong>Start Plan:</strong> Perfect for individuals.<br>
      <strong>Pro Plan:</strong> Best for teams and heavy users.</p>
      <div class="button-container">
        <a href="${this.configService.get('FRONTEND_URL')}/dashboard/billing" class="button">Upgrade Now</a>
      </div>
    `;
    const html = baseTemplate(content, `Your trial ends in ${daysLeft} days`);
    await this.sendEmail(to, `Your trial ends in ${daysLeft} days`, html);
  }

  async sendTrialExpiredEmail(to: string, name: string): Promise<void> {
    const content = `
      <h1>Your SupportMind trial has ended</h1>
      <p>Hi ${name}, your trial has officially ended. To continue using SupportMind AI with your existing documents and chat history, please upgrade to a paid plan.</p>
      <p>Your account has been downgraded to the Free tier limits. Upgrade now to restore full functionality.</p>
      <div class="button-container">
        <a href="${this.configService.get('FRONTEND_URL')}/dashboard/billing" class="button">Upgrade to Pro</a>
      </div>
    `;
    const html = baseTemplate(content, 'Your SupportMind trial has ended');
    await this.sendEmail(to, 'Your SupportMind trial has ended', html);
  }

  async sendWelcomeSMS(to: string, name: string): Promise<void> {
    if (!to) return;
    const content = smsTemplates.welcome(name);
    await this.sendSms(to, content);
  }

  async sendPlanActivatedSMS(to: string, plan: string): Promise<void> {
    if (!to) return;
    const content = smsTemplates.planActivated(plan);
    await this.sendSms(to, content);
  }

  async sendTrialEndingSMS(to: string, daysLeft: number): Promise<void> {
    if (!to) return;
    const content = smsTemplates.trialEnding(daysLeft);
    await this.sendSms(to, content);
  }

  async sendOtpSMS(to: string, otp: string): Promise<void> {
    if (!to) return;
    const content = smsTemplates.otp(otp);
    await this.sendSms(to, content);
  }
}
