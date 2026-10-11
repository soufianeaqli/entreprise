import { type FormSuggestion } from '@/services/api';
import { cn } from '@/utils/cn';
import { useMemo } from 'react';

interface FormAssistantPanelProps {
  suggestions: FormSuggestion[];
  loading: boolean;
  error: string | null;
  onInsert: (field: string, value: string) => void;
  onRegenerate: () => void;
}

export function FormAssistantPanel({
  suggestions,
  loading,
  error,
  onInsert,
  onRegenerate,
}: FormAssistantPanelProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, FormSuggestion[]>();
    for (const s of suggestions) {
      const arr = map.get(s.field) ?? [];
      arr.push(s);
      map.set(s.field, arr);
    }
    return Array.from(map.entries());
  }, [suggestions]);

  return (
    <div className="w-80 shrink-0">
      <div className="bg-white rounded-xl border border-surface-200/60 shadow-sm shadow-surface-200/40 p-5 sticky top-24">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-surface-900">
              Assistant IA
            </h3>
            <p className="text-xs text-surface-500 mt-0.5">
              Suggestions automatiques
            </p>
          </div>
          <button
            type="button"
            onClick={onRegenerate}
            disabled={loading}
            className={cn(
              'text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors',
              'text-emerald-600 hover:bg-emerald-50 disabled:opacity-40',
            )}
          >
            {loading ? '...' : '⟳'}
          </button>
        </div>

        {loading && (
          <div className="space-y-2">
            <div className="h-10 bg-surface-100 rounded-lg animate-pulse" />
            <div className="h-16 bg-surface-100 rounded-lg animate-pulse" />
            <div className="h-12 bg-surface-100 rounded-lg animate-pulse" />
          </div>
        )}

        {error && (
          <div className="text-xs text-red-600 bg-red-50 rounded-lg p-3 mb-3">
            {error}
          </div>
        )}

        {!loading && !error && grouped.length === 0 && (
          <div className="text-xs text-surface-400 text-center py-6">
            Remplissez les champs du formulaire pour obtenir des suggestions.
          </div>
        )}

        {!loading && grouped.length > 0 && (
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            {grouped.map(([field, items]) => (
              <div key={field}>
                <p className="text-xs font-medium text-surface-600 mb-1.5 capitalize">
                  {items[0]?.label ?? field}
                </p>
                <div className="space-y-1.5">
                  {items.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onInsert(s.field, s.value)}
                      className={cn(
                        'w-full text-left text-xs p-2.5 rounded-lg border transition-all',
                        'border-surface-200 hover:border-emerald-300',
                        'hover:bg-emerald-50/50 text-surface-700 leading-relaxed',
                      )}
                    >
                      {s.value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && grouped.length > 0 && (
          <button
            type="button"
            onClick={onRegenerate}
            className={cn(
              'w-full mt-4 text-xs font-medium py-2 rounded-lg transition-colors',
              'text-emerald-600 hover:bg-emerald-50 border border-emerald-200',
            )}
          >
            Générer de nouvelles suggestions
          </button>
        )}
      </div>
    </div>
  );
}
