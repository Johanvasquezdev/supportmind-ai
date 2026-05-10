"use client";

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });

interface UsageChartsProps {
  data: any;
  isLoading: boolean;
}

export function UsageCharts({ data, isLoading }: UsageChartsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-[350px] animate-pulse rounded-[2px] border border-border bg-card" />
        <div className="h-[350px] animate-pulse rounded-[2px] border border-border bg-card" />
      </div>
    );
  }

  const chartData = data?.data || [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="group relative rounded-[2px] border border-border bg-card p-6 backdrop-blur-xl overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="mb-6">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Message Volume</h3>
          <p className="text-sm font-semibold text-foreground">Daily user and AI activity</p>
        </div>
        
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="var(--muted-foreground)" 
                fontSize={10}
                tickFormatter={(str) => {
                  const date = new Date(str);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis stroke="var(--muted-foreground)" fontSize={10} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--card)', 
                  border: '1px solid var(--border)',
                  borderRadius: '2px',
                  fontSize: '11px',
                  fontFamily: '"IBM Plex Mono", monospace',
                  color: 'var(--foreground)'
                }}
                itemStyle={{ color: 'var(--foreground)' }}
              />
              <Area 
                type="monotone" 
                dataKey="messages" 
                stroke="#7c3aed" 
                fillOpacity={1} 
                fill="url(#colorMessages)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="group relative rounded-[2px] border border-border bg-card p-6 backdrop-blur-xl overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="mb-6">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Token Consumption</h3>
          <p className="text-sm font-semibold text-foreground">AI compute usage trends</p>
        </div>
        
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="var(--muted-foreground)" 
                fontSize={10}
                tickFormatter={(str) => {
                  const date = new Date(str);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis stroke="var(--muted-foreground)" fontSize={10} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--card)', 
                  border: '1px solid var(--border)',
                  borderRadius: '2px',
                  fontSize: '11px',
                  fontFamily: '"IBM Plex Mono", monospace',
                  color: 'var(--foreground)'
                }}
                itemStyle={{ color: 'var(--foreground)' }}
              />
              <Bar 
                dataKey="tokens" 
                fill="#7c3aed" 
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
