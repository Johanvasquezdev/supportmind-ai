"use client";

import { motion } from "framer-motion";
import useSWR from "swr";
import { useMemo, useState } from "react";
import { useApi } from "@/hooks/use-api";

interface DataTablesPanelProps {
  documentId: string;
  documentTitle: string;
}

interface DocumentTable {
  id: string;
  title: string | null;
  headers: string[];
  rows: unknown;
  extractedAt: string;
}

interface SortState {
  column: number;
  direction: "asc" | "desc";
}

function normalizeRows(rows: unknown): string[][] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row): row is unknown[] => Array.isArray(row))
    .map((row) => row.map((cell) => String(cell ?? "")));
}

function exportCSV(headers: string[], rows: string[][], filename: string) {
  const escapeCell = (cell: string) => `"${cell.replace(/"/g, '""')}"`;
  const csv = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => row.map(escapeCell).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function safeFilename(name: string) {
  return name.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-|-$/g, "");
}

function DataTableView({
  table,
  index,
  documentTitle,
}: {
  table: DocumentTable;
  index: number;
  documentTitle: string;
}) {
  const [sort, setSort] = useState<SortState | null>(null);
  const [showAll, setShowAll] = useState(false);
  const rows = useMemo(() => normalizeRows(table.rows), [table.rows]);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    return [...rows].sort((left, right) => {
      const a = left[sort.column] ?? "";
      const b = right[sort.column] ?? "";
      return sort.direction === "asc" ? a.localeCompare(b) : b.localeCompare(a);
    });
  }, [rows, sort]);

  const visibleRows = showAll ? sortedRows : sortedRows.slice(0, 10);

  function toggleSort(column: number) {
    setSort((current) => {
      if (!current || current.column !== column) {
        return { column, direction: "asc" };
      }
      return {
        column,
        direction: current.direction === "asc" ? "desc" : "asc",
      };
    });
  }

  return (
    <div className="space-y-3 border-b border-[#1a1a2e] pb-6 last:border-b-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-bold text-[#F0EEE9]">
            {table.title || `Table ${index + 1}`}
          </h3>
          <p className="font-mono text-[11px] text-[#6B6A72]">
            {rows.length} rows
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            exportCSV(
              table.headers,
              rows,
              `${safeFilename(documentTitle)}-table-${index + 1}.csv`,
            )
          }
          className="font-mono text-[11px] text-[#6B6A72] transition-colors hover:text-[#F0EEE9]"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#12121f]">
              {table.headers.map((header, column) => (
                <th
                  key={`${header}-${column}`}
                  className="border-b border-[#1a1a2e] px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-[#6B6A72]"
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(column)}
                    className="flex items-center gap-1 transition-colors hover:text-[#F0EEE9]"
                  >
                    {header}
                    {sort?.column === column && (
                      <span className="text-[#7c3aed]">
                        {sort.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, rowIndex) => (
              <tr
                key={`${table.id}-${rowIndex}`}
                className="border-b border-[#1a1a2e] odd:bg-[#0d0d1a] even:bg-[#080810] hover:bg-[#12121f]"
              >
                {table.headers.map((header, column) => (
                  <td
                    key={`${header}-${column}`}
                    title={row[column] ?? ""}
                    className="max-w-[240px] truncate px-3 py-2 text-[13px] text-[#F0EEE9]"
                  >
                    {row[column] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedRows.length > 10 && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="font-mono text-[11px] text-[#6B6A72] transition-colors hover:text-[#F0EEE9]"
        >
          {showAll ? "Show first 10 rows" : `Show all ${sortedRows.length} rows`}
        </button>
      )}
    </div>
  );
}

export function DataTablesPanel({
  documentId,
  documentTitle,
}: DataTablesPanelProps) {
  const api = useApi();
  const { data, error, isLoading } = useSWR<DocumentTable[]>(
    ["document-tables", documentId],
    async () => {
      const response = await api.get<DocumentTable[]>(
        `/documents/${documentId}/tables`,
      );
      return response.data;
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-b-[4px] border border-t-0 border-[#1a1a2e] bg-[#0d0d1a]"
    >
      <div className="space-y-6 px-6 py-5">
        {isLoading && (
          <div className="animate-pulse space-y-2">
            <div className="h-8 w-44 rounded-[2px] bg-[#12121f]" />
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="grid grid-cols-3 gap-2">
                <div className="h-9 rounded-[2px] bg-[#12121f]" />
                <div className="h-9 rounded-[2px] bg-[#12121f]" />
                <div className="h-9 rounded-[2px] bg-[#12121f]" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && error && (
          <p className="text-sm text-[#FF4545]">
            Failed to extract tables. Try again.
          </p>
        )}

        {!isLoading && data?.length === 0 && (
          <div className="space-y-1">
            <p className="text-[14px] text-[#6B6A72]">
              No structured tables found in this document.
            </p>
            <p className="text-[13px] text-[#6B6A72]">
              Tables with rows and columns will appear here automatically.
            </p>
          </div>
        )}

        {!isLoading &&
          data?.map((table, index) => (
            <DataTableView
              key={table.id}
              table={table}
              index={index}
              documentTitle={documentTitle}
            />
          ))}
      </div>
    </motion.div>
  );
}
