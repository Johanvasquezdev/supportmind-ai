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
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-600/10 dark:bg-blue-400/10"
    },
    {
      title: "AI Responses",
      value: data?.aiResponses || 0,
      icon: Bot,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-600/10 dark:bg-purple-400/10"
    },
    {
      title: "Documents Uploaded",
      value: data?.documentsUploaded || 0,
      icon: FileText,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-600/10 dark:bg-emerald-400/10"
    },
    {
      title: "Avg Response Time",
      value: `${data?.averageResponseTimeMs || 0}ms`,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-600/10 dark:bg-amber-400/10"
    },
    {
      title: "Total Tokens",
      value: data?.totalTokens?.toLocaleString() || 0,
      icon: Zap,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-600/10 dark:bg-purple-400/10"
    },
    {
      title: "Est. AI Cost",
      value: `$${((data?.totalTokens || 0) * 0.00002).toFixed(2)}`,
      icon: Coins,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-600/10 dark:bg-rose-400/10"
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
          className="group relative overflow-hidden rounded-[2px] border border-border bg-card p-5 backdrop-blur-xl"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="flex items-center gap-3">
            <div className={`rounded-[2px] ${card.bg} p-2.5`}>
              <card.icon className={`size-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{card.title}</p>
              {isLoading ? (
                <div className="mt-1 h-6 w-16 animate-pulse rounded-[2px] bg-muted" />
              ) : (
                <h4 className="text-xl font-bold tracking-tight text-foreground">{card.value}</h4>
              )}
            </div>
          </div>
          
          {/* Subtle glow effect */}
          <div className={`absolute -right-4 -top-4 size-24 blur-3xl opacity-10 rounded-full ${card.bg}`} />
        </motion.div>
      ))}
    </div>
  );
}
