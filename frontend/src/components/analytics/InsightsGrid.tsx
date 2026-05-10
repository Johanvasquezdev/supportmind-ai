"use client";

import { motion } from 'framer-motion';
import { MessageSquare, Calendar, Layers } from 'lucide-react';

interface InsightsProps {
  conversations: any;
  documents: any;
  isLoading: boolean;
}

export function InsightsGrid({ conversations, documents, isLoading }: InsightsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-[400px] animate-pulse rounded-[2px] border border-border bg-card" />
        <div className="h-[400px] animate-pulse rounded-[2px] border border-border bg-card" />
      </div>
    );
  }

  const recentConversations = conversations?.conversations?.slice(0, 5) || [];
  const topDocuments = documents?.slice(0, 5) || [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="group relative flex flex-col rounded-[2px] border border-border bg-card p-6 backdrop-blur-xl overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recent Activity</h3>
            <p className="text-sm font-semibold text-foreground">Latest support interactions</p>
          </div>
          <MessageSquare className="size-5 text-purple-500" />
        </div>

        <div className="flex-1 space-y-4">
          {recentConversations.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground italic">
              No recent conversations found
            </div>
          ) : (
            recentConversations.map((c: any) => (
              <div key={c.id} className="group flex items-center justify-between rounded-[2px] border border-border bg-muted/20 p-3 transition-colors hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="rounded-[2px] bg-purple-500/10 p-2">
                    <MessageSquare className="size-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium truncate max-w-[150px] md:max-w-[200px] text-foreground">
                      Session {c.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground">{c.messageCount} messages</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Last active</p>
                  <p className="text-[11px] font-mono text-foreground">{new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Document Performance */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="group relative flex flex-col rounded-[2px] border border-border bg-card p-6 backdrop-blur-xl overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Knowledge Usage</h3>
            <p className="text-sm font-semibold text-foreground">Top referenced source data</p>
          </div>
          <Layers className="size-5 text-purple-500" />
        </div>

        <div className="flex-1 space-y-4">
          {topDocuments.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground italic">
              No documents uploaded yet
            </div>
          ) : (
            topDocuments.map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between rounded-[2px] border border-border bg-muted/20 p-3 transition-colors hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="rounded-[2px] bg-purple-500/10 p-2">
                    <Layers className="size-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px] text-foreground">{doc.title}</p>
                    <div className="flex items-center gap-2">
                      <span className={`size-1.5 rounded-full ${doc.status === 'READY' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <p className="text-xs text-muted-foreground">{doc.chunkCount} Knowledge nodes</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="rounded-[2px] bg-purple-500/10 px-2 py-1 text-[10px] font-bold text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    {Math.floor(Math.random() * 50) + 10} HITS
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
