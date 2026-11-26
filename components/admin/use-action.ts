"use client";

import { useCallback, useEffect, useState } from "react";
import type { ActionResult } from "@/lib/action-result";

/** Loads data from a server action and exposes reload() for after a mutation. */
export function useActionData<T>(load: (() => Promise<ActionResult<T>>) | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!load) return;
    const result = await load();
    if (result.ok) {
      setData(result.data);
      setError("");
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [load]);

  useEffect(() => {
    // Deferred so the state updates do not happen synchronously inside the effect.
    const timer = window.setTimeout(() => void reload(), 0);
    return () => window.clearTimeout(timer);
  }, [reload]);

  return { data, error, loading, reload };
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(value);
}
