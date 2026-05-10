export const smsTemplates = {
  welcome: (name: string) => 
    `Hi ${name}! Welcome to SupportMind AI. Your 14-day trial is active. Start by uploading your docs: supportmind.ai/dashboard`,
  
  planActivated: (plan: string) => 
    `SupportMind: Your ${plan} plan is now active. Thank you for subscribing! Dashboard: supportmind.ai/dashboard`,
  
  trialEnding: (daysLeft: number) => 
    `SupportMind: Your trial ends in ${daysLeft} day(s). Upgrade now to keep access: supportmind.ai/dashboard/billing`,
  
  otp: (otp: string) => 
    `SupportMind verification code: ${otp}. Valid for 10 minutes. Do not share this code.`
};
