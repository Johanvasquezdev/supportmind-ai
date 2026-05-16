"use client";

import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Bot, 
  FileText, 
  Zap, 
  Coins, 
  Clock 
} from 'lucide-react';

interface KPICardsProps {
  data: any;
  isLoading: boolean;
}

export function KPICards({ data, isLoading }: KPICardsProps) {
  const cards = [
    {
      title: "Messages This Month",
      value: data?.totalMessages || 0,
      icon: MessageSquare,
    },
    {
      title: "AI Responses",
      value: data?.aiResponses || 0,
      icon: Bot,
    },
    {
      title: "Documents Uploaded",
      value: data?.documentsUploaded || 0,
      icon: FileText,
    },
    {
      title: "Avg Response Time",
      value: `${data?.averageResponseTimeMs || 0}ms`,
      icon: Clock,
    },
    {
      title: "Total Tokens",
      value: data?.totalTokens?.toLocaleString() || 0,
      icon: Zap,
    },
    {
      title: "Est. AI Cost",
      value: `$${((data?.totalTokens || 0) * 0.00002).toFixed(2)}`,
      icon: Coins,
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="group relative overflow-hidden rounded-[2px] border border-border bg-card p-5"
        >
          <div className="flex items-center gap-4">
            <card.icon className="size-5 text-[#7c3aed] shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{card.title}</p>
              {isLoading ? (
                <div className="mt-1 h-6 w-16 animate-pulse rounded-[2px] bg-muted" />
              ) : (
                <h4 className="text-xl font-bold tracking-tight text-foreground">{card.value}</h4>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
