import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, FolderKanban, Library, Orbit, Search, X } from 'lucide-react';
import type { Category, ResourceItem, SearchResult, Topic } from '../../types/knowledge';
import { searchKnowledgeBase } from '../../utils/knowledgeLogic';

interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
  topics: Topic[];
  categories: Category[];
  resources: ResourceItem[];
  onSelectResult: (result: SearchResult, highlightInUniverse?: boolean) => void;
}

export function GlobalSearchModal({
  open,
  onClose,
  topics,
  categories,
  resources,
  onSelectResult,
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    setTimeout(() => inputRef.current?.focus(), 40);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const results = useMemo(
    () => searchKnowledgeBase(query, topics, categories, resources),
    [query, topics, categories, resources]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/65 backdrop-blur-md px-4 pt-16 sm:pt-24"
      role="dialog"
      aria-modal="true"
      aria-label="Global Knowledge Search"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl liquid-glass-modal rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 border-b border-white/[0.10] px-5 py-3.5">
          <Search className="h-4 w-4 text-[#E5B85C] shrink-0" />
          <label htmlFor="global-search-input" className="sr-only">
            Search knowledge universe
          </label>
          <input
            id="global-search-input"
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics, definitions, tags, notes, resources..."
            className="w-full bg-transparent text-sm text-[#F5F5F7] placeholder-[#A1A1AA] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close global search"
            className="p-1.5 text-[#A1A1AA] hover:text-[#F5F5F7] rounded-xl hover:bg-white/[0.06] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto divide-y divide-white/[0.07]">
          {query.trim() === '' ? (
            <div className="px-5 py-9 text-center text-xs text-[#A1A1AA]">
              Try searching <span className="text-[#F5F5F7]">Quality Score</span>,{' '}
              <span className="text-[#F5F5F7]">ROAS</span>,{' '}
              <span className="text-[#F5F5F7]">Keyword Research</span>, or{' '}
              <span className="text-[#F5F5F7]">TikTok</span>.
            </div>
          ) : results.length === 0 ? (
            <div className="px-5 py-9 text-center text-sm text-[#A1A1AA]">
              No matching knowledge nodes found for "{query}".
            </div>
          ) : (
            results.map((item) => {
              const Icon =
                item.type === 'category'
                  ? FolderKanban
                  : item.type === 'resource'
                    ? Library
                    : BookOpen;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-white/[0.05] transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectResult(item, false);
                      onClose();
                    }}
                    className="flex items-start gap-3 text-left min-w-0 flex-1"
                  >
                    <Icon className="h-4 w-4 text-[#5EA2EF] mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#F5F5F7] truncate">
                        {item.title}
                      </div>
                      <div className="text-xs text-[#A1A1AA] truncate mt-0.5">
                        {item.subtitle}
                      </div>
                    </div>
                  </button>

                  {item.topicId || item.categoryId ? (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectResult(item, true);
                        onClose();
                      }}
                      title="Locate in 3D Knowledge Universe"
                      aria-label={`Locate ${item.title} in Universe`}
                      className="flex items-center gap-1.5 rounded-xl border border-[#E5B85C]/30 bg-[#E5B85C]/12 px-3 py-1.5 text-[11px] font-medium text-[#E5B85C] hover:bg-[#E5B85C]/20 shrink-0 whitespace-nowrap transition-colors"
                    >
                      <Orbit className="h-3 w-3" />
                      <span>Universe</span>
                    </button>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
