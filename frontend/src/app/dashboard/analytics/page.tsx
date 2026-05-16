"use client";

import { motion } from 'framer-motion';
import { useAnalytics } from '@/hooks/use-analytics';
import { KPICards } from '@/components/analytics/KPICards';
import dynamic from 'next/dynamic';
const UsageCharts = dynamic(() => import('@/components/analytics/UsageCharts').then(mod => mod.UsageCharts), { 
  ssr: false,
  loading: () => <div className="h-[350px] animate-pulse rounded-[2px] border border-white/10 bg-black/40" />
});
import { InsightsGrid } from '@/components/analytics/InsightsGrid';
import { KnowledgeHealth } from '@/components/analytics/KnowledgeHealth';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export default function AnalyticsPage() {
  const { 
    overview, 
    usage, 
    conversations, 
    documents, 
    health, 
    isLoading, 
    isError 
  } = useAnalytics();

  if (isError) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-rose-500/10 p-4">
          <AlertCircle className="size-8 text-rose-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Failed to load analytics</h2>
          <p className="text-muted-foreground">Please check your connection or try again later.</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 rounded-[2px] bg-muted px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/80"
        >
          <RefreshCcw className="size-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-8 font-sans">
      <header className="flex flex-col gap-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-[#F0EEE9]">Performance Analytics</h1>
          <p className="text-muted-foreground">Real-time monitoring of your AI assistant and knowledge base</p>
        </motion.div>
      </header>

      {/* Main Grid Layout */}
      <div className="flex flex-col gap-8">
        {/* KPI Row */}
        <KPICards data={overview} isLoading={isLoading} />

        {/* Charts Row */}
        <UsageCharts data={usage} isLoading={isLoading} />

        {/* Health Section */}
        <KnowledgeHealth data={health} isLoading={isLoading} />

        {/* Insights Row */}
        <InsightsGrid 
          conversations={conversations} 
          documents={documents} 
          isLoading={isLoading} 
        />
      </div>

      <footer className="mt-8 border-t border-border pt-8 text-center">
        <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest opacity-50">
          SupportMind AI • Analytics Engine v2.0
        </p>
      </footer>
    </div>
  );
}
