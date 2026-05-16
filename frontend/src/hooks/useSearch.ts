"use client";

import { useCallback, useState } from "react";
import { AxiosError } from "axios";
import { useApi } from "@/hooks/use-api";

export interface HybridSearchResult {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  text: string;
  vectorScore: number;
  keywordScore: number;
  hybridScore: number;
  chunkIndex: number;
}

interface SearchState {
  query: string;
  results: HybridSearchResult[];
  suggestions: string[];
  isLoading: boolean;
  error: string | null;
}

const initialState: SearchState = {
  query: "",
  results: [],
  suggestions: [],
  isLoading: false,
  error: null,
};

export function useSearch() {
  const api = useApi();
  const [state, setState] = useState<SearchState>(initialState);

  const getErrorMessage = useCallback((error: unknown) => {
    if (error instanceof AxiosError) {
      const data = error.response?.data;
      if (
        data &&
        typeof data === "object" &&
        "message" in data &&
        typeof data.message === "string"
      ) {
        return data.message;
      }

      return error.message;
    }

    return error instanceof Error ? error.message : "Search failed";
  }, []);

  const search = useCallback(
    async (query: string, limit = 8): Promise<HybridSearchResult[]> => {
      const cleanQuery = query.trim();

      if (!cleanQuery) {
        setState((previous) => ({
          ...previous,
          query: "",
          results: [],
          isLoading: false,
          error: null,
        }));
        return [];
      }

      setState((previous) => ({
        ...previous,
        query: cleanQuery,
        isLoading: true,
        error: null,
      }));

      try {
        const response = await api.post<HybridSearchResult[]>("/search", {
          query: cleanQuery,
          limit,
        });

        setState((previous) => ({
          ...previous,
          query: cleanQuery,
          results: response.data,
          isLoading: false,
        }));

        return response.data;
      } catch (error) {
        const message = getErrorMessage(error);
        setState((previous) => ({
          ...previous,
          error: message,
          isLoading: false,
        }));
        return [];
      }
    },
    [api, getErrorMessage],
  );

  const suggest = useCallback(
    async (partial: string): Promise<string[]> => {
      const cleanQuery = partial.trim();

      if (!cleanQuery) {
        setState((previous) => ({ ...previous, suggestions: [] }));
        return [];
      }

      try {
        const response = await api.get<string[]>("/search/suggest", {
          params: { q: cleanQuery },
        });

        setState((previous) => ({
          ...previous,
          suggestions: response.data,
        }));

        return response.data;
      } catch (error) {
        const message = getErrorMessage(error);
        setState((previous) => ({
          ...previous,
          suggestions: [],
          error: message,
        }));
        return [];
      }
    },
    [api, getErrorMessage],
  );

  const clear = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    search,
    suggest,
    clear,
  };
}
