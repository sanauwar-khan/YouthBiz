"use client";

import { useEffect, useState } from "react";
import { adminRequest } from "./adminApi";

export function useAdminData(path) {
  const [state, setState] = useState({ path: null, result: null, error: "", isLoading: true });

  useEffect(() => {
    if (!path) return undefined;
    const controller = new AbortController();
    adminRequest(path, { signal: controller.signal })
      .then((result) => setState({ path, result, error: "", isLoading: false }))
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setState({ path, result: null, error: requestError.message || "Could not load this information.", isLoading: false });
        }
      });
    return () => controller.abort();
  }, [path]);

  if (!path) return { result: null, error: "", isLoading: false };
  if (state.path !== path) return { result: null, error: "", isLoading: true };
  return state;
}
