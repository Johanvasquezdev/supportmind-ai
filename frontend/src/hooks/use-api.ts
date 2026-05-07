"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import api, { setAuthToken } from "@/lib/api";

/**
 * Hook that syncs the Clerk session token with the axios API client.
 * Returns the pre-configured axios instance with the Bearer token attached.
 *
 * Must be used inside a client component (uses useAuth from Clerk).
 *
 * Usage:
 *   const api = useApi();
 *   const res = await api.post('/chat', { message: '...' });
 */
export function useApi() {
  const { getToken, isSignedIn } = useAuth();
  const tokenSynced = useRef(false);

  useEffect(() => {
    if (!isSignedIn) {
      setAuthToken(null);
      tokenSynced.current = false;
      return;
    }

    // Fetch and set token
    getToken().then((token) => {
      setAuthToken(token);
      tokenSynced.current = true;
    });
  }, [getToken, isSignedIn]);

  // Also set up a request interceptor that refreshes the token before each call
  useEffect(() => {
    const interceptor = api.interceptors.request.use(async (config) => {
      if (isSignedIn) {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, [getToken, isSignedIn]);

  return api;
}
