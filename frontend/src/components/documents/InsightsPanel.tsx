"use client";

import { motion } from "framer-motion";
import useSWR from "swr";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  User,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo } from "react";
import { useApi } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

type InsightType =
  | "METRIC"
  | "FACT"
  | "DATE"
  | "PERSON"
  | "PROCESS"
  | "REQUIREMENT";

interface DocumentInsight {
  id: string;
  type: InsightType;
  label: string;
  value: string;
  unit: string | null;
  context: string | null;
  extractedAt: string;
}

interface MetricChartPoint {
  label: string;
  value: number;
}

function parseMetric(value: string): number | null {
  const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function InsightCard({ insight, index }: { insight: DocumentInsight; index: number }) {
  const borderByType: Record<InsightType, string> = {
    METRIC: "border-l-[#7c3aed]",
    FACT: "border-l-[#1a1a2e]",
    DATE: "border-l-[#22c55e]",
    PERSON: "border-l-[#1a1a2e]",
    PROCESS: "border-l-[#7c3aed]",
    REQUIREMENT: "border-l-[#FF4545]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.15 }}
      className={cn(
        "rounded-[4px] border border-l-2 border-[#1a1a2e] bg-[#0d0d1a] px-5 py-4 transition-colors hover:border-[#7c3aed]",
        borderByType[insight.type],
      )}
    >
      {insight.type === "METRIC" ? (
        <div className="space-y-2">
          <div className="flex items-end gap-2">
            <span className="font-mono text-[40px] leading-none text-[#7c3aed]">
              {insight.value}
            </span>
            {insight.unit && (
              <span className="pb-1 font-mono text-[14px] text-[#6B6A72]">
                {insight.unit}
              </span>
            )}
          </div>
          <p className="text-[12px] text-[#6B6A72]">{insight.label}</p>
          {insight.context && (
            <p className="text-[11px] italic text-[#6B6A72]">
              {insight.context}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase text-[#6B6A72]">
            {insight.label}
          </p>
          <div className="flex items-start gap-2">
            {insight.type === "DATE" && (
              <Calendar className="mt-0.5 size-3.5 shrink-0 text-[#7c3aed]" />
            )}
            {insight.type === "PERSON" && (
              <User className="mt-0.5 size-3.5 shrink-0 text-[#7c3aed]" />
            )}
            {insight.type === "PROCESS" && (
              <ArrowRight className="mt-0.5 size-3 shrink-0 text-[#7c3aed]" />
            )}
            {insight.type === "REQUIREMENT" && (
              <AlertCircle className="mt-0.5 size-3 shrink-0 text-[#FF4545]" />
            )}
            <p
              className={cn(
                "text-[#F0EEE9]",
                insight.type === "DATE" && "text-[16px] font-bold",
                insight.type === "PERSON" && "text-[14px] font-bold",
                insight.type !== "DATE" &&
                  insight.type !== "PERSON" &&
                  "text-[13px]",
              )}
            >
              {insight.value}
            </p>
          </div>
          {insight.context && (
            <p className="text-[11px] italic text-[#6B6A72]">
              {insight.context}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}

export function InsightsPanel({ documentId }: { documentId: string }) {
  const api = useApi();
  const { data, error, isLoading } = useSWR<DocumentInsight[]>(
    ["document-insights", documentId],
    async () => {
      const response = await api.get<DocumentInsight[]>(
        `/documents/${documentId}/insights`,
      );
      return response.data;
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  const chartData = useMemo<MetricChartPoint[]>(() => {
    return (data ?? [])
      .filter((insight) => insight.type === "METRIC")
      .map((insight) => ({
        label:
          insight.label.length > 15
            ? `${insight.label.slice(0, 15)}...`
            : insight.label,
        value: parseMetric(insight.value),
      }))
      .filter((point): point is MetricChartPoint => point.value !== null);
  }, [data]);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-b-[4px] border border-t-0 border-[#1a1a2e] bg-[#080810]"
    >
      <div className="space-y-5 px-6 py-5">
        {isLoading && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-[4px] border border-[#1a1a2e] bg-[#0d0d1a]"
              />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <p className="text-sm text-[#FF4545]">
            Failed to extract insights. Try again.
          </p>
        )}

        {!isLoading && data?.length === 0 && (
          <p className="text-[14px] text-[#6B6A72]">
            No key insights found in this document.
          </p>
        )}

        {!isLoading && chartData.length >= 3 && (
          <div className="hidden h-64 rounded-[4px] border border-[#1a1a2e] bg-[#0d0d1a] p-4 md:block">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke="#1a1a2e" vertical={false} />
                <XAxis dataKey="label" stroke="#6B6A72" fontSize={11} />
                <YAxis stroke="#6B6A72" fontSize={11} />
                <Tooltip
                  cursor={{ fill: "#12121f" }}
                  contentStyle={{
                    background: "#0d0d1a",
                    border: "1px solid #1a1a2e",
                    borderRadius: 4,
                    color: "#F0EEE9",
                  }}
                />
                <Bar dataKey="value" fill="#7c3aed" radius={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {!isLoading && data && data.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((insight, index) => (
              <InsightCard key={insight.id} insight={insight} index={index} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
