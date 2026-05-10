export class AnalyticsOverviewDto {
  totalMessages: number;
  aiResponses: number;
  documentsUploaded: number;
  totalTokens: number;
  averageResponseTimeMs: number;
  
  // Optional growth percentages vs previous period
  growth?: {
    messages: number;
    tokens: number;
    documents: number;
  };
}

export class UsageDataPoint {
  date: string;
  tokens: number;
  messages: number;
}

export class AnalyticsUsageDto {
  data: UsageDataPoint[];
  totalTokens: number;
}

export class ConversationMetric {
  id: string;
  messageCount: number;
  createdAt: Date;
  lastMessageAt: Date;
}

export class AnalyticsConversationsDto {
  conversations: ConversationMetric[];
  totalConversations: number;
}
