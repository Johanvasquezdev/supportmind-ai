"use client";

import { motion } from 'framer-motion';
import { ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

interface KnowledgeHealthProps {
  data: any;
  isLoading: boolean;
}

export function KnowledgeHealth({ data, isLoading }: KnowledgeHealthProps) {
  if (isLoading) {
    return (
      <div className="h-[250px] animate-pulse rounded-[2px] border border-border bg-card" />
    );
  }

  const score = data?.healthScore || 0;
  const coverage = data?.coveragePercentage || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative rounded-[2px] border border-border bg-card p-8 backdrop-blur-xl overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-6">
          <div className="relative flex size-32 items-center justify-center">
            <svg className="absolute size-full -rotate-90 transform">
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                className="text-muted"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={364.4}
                initial={{ strokeDashoffset: 364.4 }}
                animate={{ strokeDashoffset: 364.4 - (364.4 * score) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={`${
                  score > 80 ? "text-emerald-500" : score > 50 ? "text-amber-500" : "text-rose-500"
                }`}
              />
            </svg>
            <div className="text-center">
              <span className="text-3xl font-bold text-foreground">{score}</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Health</p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Knowledge Health Score</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              A comprehensive metric based on document processing success, content coverage, and retrieval accuracy.
            </p>
            
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-[2px] bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-3" />
                {data?.readyDocs || 0} Ready
              </div>
              <div className="flex items-center gap-2 rounded-[2px] bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <RefreshCw className="size-3 animate-spin" />
                {data?.totalDocs - data?.readyDocs - data?.failedDocs || 0} Processing
              </div>
              <div className="flex items-center gap-2 rounded-[2px] bg-rose-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                <AlertCircle className="size-3" />
                {data?.failedDocs || 0} Issues
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-[2px] border border-border bg-muted/30 p-6 lg:w-72">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Coverage</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{coverage}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-[2px] bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${coverage}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-emerald-500"
            />
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground italic">
            Knowledge is currently covering {coverage}% of your configured domains.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
