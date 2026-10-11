import { useCallback, useEffect, useRef, useState } from 'react';
import { api, type FormSuggestion } from '@/services/api';

interface UseFormAssistantOptions {
  module: 'department' | 'rh' | 'recruitment' | 'meeting' | 'budget';
  context: Record<string, any>;
  enabled?: boolean;
  debounceMs?: number;
}

interface UseFormAssistantReturn {
  suggestions: FormSuggestion[];
  loading: boolean;
  error: string | null;
  regenerate: () => void;
  clear: () => void;
}

function getContextKey(context: Record<string, any>): string {
  const important = ['name', 'title', 'type'];
  const keys = Object.keys(context).filter(k => context[k] != null && context[k] !== '');
  return keys.sort().map(k => `${k}=${context[k]}`).join('&');
}

export function useFormAssistant({
  module,
  context,
  enabled = true,
  debounceMs = 800,
}: UseFormAssistantOptions): UseFormAssistantReturn {
  const [suggestions, setSuggestions] = useState<FormSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const lastKeyRef = useRef('');

  const fetchSuggestions = useCallback(async (ctx: Record<string, any>) => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.ai.formSuggestions(module, ctx);
      setSuggestions(res.suggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de génération');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [module, enabled]);

  useEffect(() => {
    if (!enabled) return;

    const key = getContextKey(context);
    if (!key || key === lastKeyRef.current) return;
    lastKeyRef.current = key;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchSuggestions(context), debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [context, fetchSuggestions, debounceMs, enabled]);

  const regenerate = useCallback(() => {
    if (!enabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setError(null);
    setLoading(true);
    fetchSuggestions(context);
  }, [fetchSuggestions, enabled, context]);

  const clear = useCallback(() => {
    setSuggestions([]);
    setError(null);
    lastKeyRef.current = '';
  }, []);

  return { suggestions, loading, error, regenerate, clear };
}
