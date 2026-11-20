import { useMemo, useState } from 'react';
import {
  Bot,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Layers,
  Link2,
  Plus,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import type { Category, Language, LearningStatus, Topic, TopicConnection } from '../../types/knowledge';
import { TRANSLATIONS } from '../../i18n/translations';
import { Universe2D } from './Universe2D';
import { Universe3D } from './Universe3D';

interface KnowledgeUniverseViewProps {
  categories: Category[];
  topics: Topic[];
  connections: TopicConnection[];
  language: Language;
  initial2DMode: boolean;
  initialSelectedCategoryId?: string | null;
  initialSelectedTopicId?: string | null;
  onOpenTopicDetail: (topicId: string) => void;
  onAskAiAboutTopic: (topic: Topic) => void;
  onUpdateTopicStatus: (topicId: string, status: LearningStatus) => Promise<void>;
  onOpenAddTopicModal: () => void;
  onCreateConnection: (sourceId: string, targetId: string, label: string) => Promise<void>;
}

export function KnowledgeUniverseView({
  categories,
  topics,
  connections,
  language,
  initial2DMode,
  initialSelectedCategoryId = null,
  initialSelectedTopicId = null,
  onOpenTopicDetail,
  onAskAiAboutTopic,
  onUpdateTopicStatus,
  onOpenAddTopicModal,
  onCreateConnection,
}: KnowledgeUniverseViewProps) {
  const t = TRANSLATIONS[language];
  const [use2D, setUse2D] = useState(initial2DMode);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    initialSelectedCategoryId
  );
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(initialSelectedTopicId);
  const [searchQuery, setSearchQuery] = useState('');
  const [resetCounter, setResetCounter] = useState(0);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<{
    title: string;
    subtitle: string;
    x: number;
    y: number;
  } | null>(null);

  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [sourceId, setSourceId] = useState(topics[0]?.id ?? '');
  const [targetId, setTargetId] = useState(topics[1]?.id ?? '');
  const [relLabel, setRelLabel] = useState('Reinforces');
  const [connectError, setConnectError] = useState('');

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  );

  const selectedTopic = useMemo(
    () => topics.find((tp) => tp.id === selectedTopicId) ?? null,
    [topics, selectedTopicId]
  );

  const categoryTopics = useMemo(
    () => (selectedCategory ? topics.filter((tp) => tp.categoryId === selectedCategory.id) : []),
    [topics, selectedCategory]
  );

  const topicConnections = useMemo(() => {
    if (!selectedTopic) return [];
    return connections.filter(
      (c) => c.sourceTopicId === selectedTopic.id || c.targetTopicId === selectedTopic.id
    );
  }, [connections, selectedTopic]);

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId || sourceId === targetId) {
      setConnectError('Select two different topics to connect.');
      return;
    }
    setConnectError('');
    await onCreateConnection(sourceId, targetId, relLabel.trim() || 'Related to');
    setConnectModalOpen(false);
  };

  return (
    <div className="relative h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-[#05070d]">
      {/* 3D Galaxy or 2D Fallback */}
      {use2D ? (
        <Universe2D
          categories={categories}
          topics={topics}
          connections={connections}
          selectedCategoryId={selectedCategoryId}
          selectedTopicId={selectedTopicId}
          highlightQuery={searchQuery}
          onSelectCategory={(cid) => {
            setSelectedTopicId(null);
            setSelectedCategoryId(cid);
          }}
          onSelectTopic={(tid) => setSelectedTopicId(tid)}
        />
      ) : (
        <Universe3D
          categories={categories}
          topics={topics}
          connections={connections}
          selectedCategoryId={selectedCategoryId}
          selectedTopicId={selectedTopicId}
          highlightQuery={searchQuery}
          resetCounter={resetCounter}
          onSelectCategory={(cid) => {
            setSelectedTopicId(null);
            setSelectedCategoryId(cid);
          }}
          onSelectTopic={(tid) => setSelectedTopicId(tid)}
          onHoverItem={setHoverInfo}
          onWebGLUnavailable={() => setUse2D(true)}
        />
      )}

      {/* Minimal Top-Left Search & Status Header (no backdrop-blur over WebGL) */}
      <div className="pointer-events-auto absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 max-w-[calc(100vw-2rem)]">
        <div className="rounded-xl border border-white/[0.14] bg-[#0B101B]/90 px-3.5 py-1.5 text-xs text-[#F5F5F7] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
          <span className="font-medium text-[#E5B85C]">DIGITAL MARKETING</span>
          <span className="text-[#A1A1AA]">
            {' '}
            · {categories.length} planets · {topics.length} stars · {connections.length} links
          </span>
        </div>

        <div className="relative">
          <Search className="h-3.5 w-3.5 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
          <label htmlFor="universe-search-input" className="sr-only">
            Highlight topic in universe
          </label>
          <input
            id="universe-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Locate node..."
            className="w-44 sm:w-56 rounded-xl border border-white/[0.14] bg-[#0B101B]/90 pl-8 pr-7 py-1.5 text-xs text-[#F5F5F7] placeholder-[#A1A1AA] shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] focus:border-[#E5B85C] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear universe search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#F5F5F7]"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoverInfo && !use2D && (
        <div
          className="pointer-events-none fixed z-20 max-w-xs rounded-xl border border-white/[0.16] bg-[#0B101B]/92 px-3 py-2 text-xs shadow-2xl"
          style={{ left: Math.min(hoverInfo.x + 14, window.innerWidth - 260), top: hoverInfo.y + 14 }}
        >
          <div className="font-medium text-[#F5F5F7]">{hoverInfo.title}</div>
          <div className="mt-0.5 text-[#A1A1AA] line-clamp-2">{hoverInfo.subtitle}</div>
        </div>
      )}

      {/* Selected Topic or Planet Inspector Drawer */}
      {(selectedTopic || selectedCategory) && (
        <aside
          aria-label="Universe Inspector"
          className="pointer-events-auto absolute top-16 right-4 bottom-24 z-10 w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-white/[0.15] bg-[#0B101B]/92 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_20px_50px_-12px_rgba(0,0,0,0.85)] space-y-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[#E5B85C]">
                {selectedTopic ? 'Knowledge Star' : 'Marketing Planet'}
              </div>
              <h2 className="mt-1 font-display text-lg font-semibold text-white">
                {selectedTopic ? selectedTopic.title : selectedCategory?.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedTopicId(null);
                setSelectedCategoryId(null);
              }}
              aria-label="Close inspector"
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {selectedTopic ? (
            <>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedTopic.shortDefinition}
              </p>

              <div>
                <span className="block text-[11px] text-slate-400 mb-1.5">Learning Status</span>
                <div className="grid grid-cols-3 gap-1 rounded-lg border border-white/10 bg-black/40 p-1">
                  {(['not_started', 'learning', 'completed'] as LearningStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => onUpdateTopicStatus(selectedTopic.id, st)}
                      className={`px-2 py-1 rounded text-[11px] font-medium ${
                        selectedTopic.status === st
                          ? 'bg-[#E5B85C] text-[#080B12]'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {t.statuses[st]}
                    </button>
                  ))}
                </div>
              </div>

              {topicConnections.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-white/10">
                  <div className="text-xs font-medium text-slate-300">Connected Ideas</div>
                  {topicConnections.map((conn) => {
                    const otherId =
                      conn.sourceTopicId === selectedTopic.id
                        ? conn.targetTopicId
                        : conn.sourceTopicId;
                    const other = topics.find((tp) => tp.id === otherId);
                    if (!other) return null;
                    return (
                      <button
                        key={conn.id}
                        type="button"
                        onClick={() => setSelectedTopicId(other.id)}
                        className="w-full text-left rounded border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs hover:border-[#E5B85C]/50"
                      >
                        <div className="text-slate-100 font-medium">{other.title}</div>
                        <div className="text-[11px] text-slate-400">{conn.relationshipLabel}</div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => onOpenTopicDetail(selectedTopic.id)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#E5B85C] px-3 py-2 text-xs font-semibold text-[#080B12] hover:bg-[#f0c770]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open Full Knowledge Page</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAskAiAboutTopic(selectedTopic)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white"
                >
                  <Bot className="h-3.5 w-3.5 text-[#5EA2EF]" />
                  <span>{t.actions.askAi}</span>
                </button>
              </div>
            </>
          ) : (
            selectedCategory && (
              <>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedCategory.description}
                </p>
                <div className="space-y-1.5 pt-2 border-t border-white/10">
                  <div className="text-xs font-medium text-slate-300">
                    Orbiting Topics ({categoryTopics.length})
                  </div>
                  {categoryTopics.map((tp) => (
                    <button
                      key={tp.id}
                      type="button"
                      onClick={() => setSelectedTopicId(tp.id)}
                      className="w-full flex items-center justify-between gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-left text-xs hover:border-[#E5B85C]/50"
                    >
                      <span className="text-slate-200 truncate">{tp.title}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {t.statuses[tp.status]}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )
          )}
        </aside>
      )}

      {/* Unified Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
      <div className="pointer-events-auto absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center w-[calc(100vw-2rem)] sm:w-auto max-w-[96vw]">
        <button
          type="button"
          onClick={() => setDockCollapsed((v) => !v)}
          className="inline-flex items-center gap-1 rounded-t-xl border border-b-0 border-white/[0.14] bg-[#0B101B]/90 px-3.5 py-1 text-[11px] font-medium text-[#A1A1AA] hover:text-[#F5F5F7]"
        >
          {dockCollapsed ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          <span>{dockCollapsed ? 'Show Controls' : 'Hide Controls'}</span>
        </button>

        {!dockCollapsed && (
          <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:flex-nowrap items-center justify-center gap-1.5 sm:gap-2 rounded-2xl border border-white/[0.14] bg-[#0B101B]/90 px-2.5 sm:px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_20px_40px_-12px_rgba(0,0,0,0.85)]">
            <label htmlFor="dock-cat-filter" className="sr-only">
              Filter galaxy by category
            </label>
            <select
              id="dock-cat-filter"
              value={selectedCategoryId ?? 'all'}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedTopicId(null);
                setSelectedCategoryId(val === 'all' ? null : val);
              }}
              className="col-span-2 sm:col-span-1 rounded-xl border border-white/[0.14] bg-[#070A12] px-2.5 py-1.5 text-xs text-[#F5F5F7] focus:border-[#E5B85C] focus:outline-none"
            >
              <option value="all">All 10+ Planets</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onOpenAddTopicModal}
              className="liquid-btn-primary inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span>Add Node</span>
            </button>

            <button
              type="button"
              onClick={() => setConnectModalOpen(true)}
              className="liquid-btn-glass inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium whitespace-nowrap"
            >
              <Link2 className="h-3.5 w-3.5 shrink-0 text-[#E5B85C]" />
              <span>{t.actions.addConnection}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedCategoryId(null);
                setSelectedTopicId(null);
                setSearchQuery('');
                setResetCounter((c) => c + 1);
              }}
              className="liquid-btn-glass inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0" />
              <span>{t.actions.resetCamera}</span>
            </button>

            <button
              type="button"
              onClick={() => setUse2D((v) => !v)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#5EA2EF]/40 bg-[#5EA2EF]/12 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium text-[#5EA2EF] hover:bg-[#5EA2EF]/20 whitespace-nowrap transition-colors"
            >
              <Layers className="h-3.5 w-3.5 shrink-0" />
              <span>{use2D ? t.actions.switchTo3D : t.actions.switchTo2D}</span>
            </button>
          </div>
        )}
      </div>

      {/* Connect Topics Modal */}
      {connectModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Connect Knowledge Topics"
        >
          <form
            onSubmit={handleConnectSubmit}
            className="w-full max-w-md liquid-glass-modal rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-white">
                Connect Knowledge Nodes
              </h3>
              <button
                type="button"
                onClick={() => setConnectModalOpen(false)}
                aria-label="Close modal"
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {connectError && <p className="text-xs text-rose-400">{connectError}</p>}
            <div>
              <label htmlFor="conn-source" className="block text-xs text-slate-300 mb-1">
                Source Topic
              </label>
              <select
                id="conn-source"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              >
                {topics.map((tp) => (
                  <option key={tp.id} value={tp.id}>
                    {tp.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="conn-rel" className="block text-xs text-slate-300 mb-1">
                Relationship Label
              </label>
              <input
                id="conn-rel"
                type="text"
                value={relLabel}
                onChange={(e) => setRelLabel(e.target.value)}
                placeholder="e.g. Drives conversion lift in"
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label htmlFor="conn-target" className="block text-xs text-slate-300 mb-1">
                Target Topic
              </label>
              <select
                id="conn-target"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              >
                {topics.map((tp) => (
                  <option key={tp.id} value={tp.id}>
                    {tp.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConnectModalOpen(false)}
                className="rounded-lg border border-white/15 px-4 py-2 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#E5B85C] px-4 py-2 text-xs font-semibold text-[#080B12]"
              >
                Create Link
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
