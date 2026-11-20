import { useMemo, useState } from 'react';
import { ArrowRight, Plus, Search, Star, X } from 'lucide-react';
import type { Category, Language, LearningStatus, Topic } from '../../types/knowledge';
import { TRANSLATIONS } from '../../i18n/translations';
import { validateTopicInput } from '../../utils/knowledgeLogic';

interface NotesWorkspaceViewProps {
  topics: Topic[];
  categories: Category[];
  language: Language;
  initialCategoryFilter?: string;
  onOpenTopic: (topicId: string) => void;
  onToggleFavorite: (topic: Topic) => Promise<void>;
  onCreateTopic: (
    payload: Omit<Topic, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'lastViewedAt'>
  ) => Promise<Topic>;
  createModalOpen: boolean;
  onSetCreateModalOpen: (open: boolean) => void;
}

export function NotesWorkspaceView({
  topics,
  categories,
  language,
  initialCategoryFilter = 'all',
  onOpenTopic,
  onToggleFavorite,
  onCreateTopic,
  createModalOpen,
  onSetCreateModalOpen,
}: NotesWorkspaceViewProps) {
  const t = TRANSLATIONS[language];
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState(initialCategoryFilter);
  const [statusFilter, setStatusFilter] = useState<'all' | LearningStatus>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Create Topic Form State
  const [title, setTitle] = useState('');
  const [titleKm, setTitleKm] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [shortDefinition, setShortDefinition] = useState('');
  const [simpleExplanation, setSimpleExplanation] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');
  const [status, setStatus] = useState<LearningStatus>('learning');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return topics.filter((tp) => {
      if (catFilter !== 'all' && tp.categoryId !== catFilter) return false;
      if (statusFilter !== 'all' && tp.status !== statusFilter) return false;
      if (onlyFavorites && !tp.isFavorite) return false;
      if (!q) return true;
      return `${tp.title} ${tp.titleKm} ${tp.shortDefinition} ${tp.tags.join(' ')} ${tp.personalNotesHtml}`
        .toLowerCase()
        .includes(q);
    });
  }, [topics, search, catFilter, statusFilter, onlyFavorites]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateTopicInput({
      title,
      categoryId: categoryId || categories[0]?.id || '',
      shortDefinition,
    });
    if (!check.valid) {
      setFormError(check.errors.join(' '));
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const created = await onCreateTopic({
        categoryId: categoryId || categories[0].id,
        title: title.trim(),
        titleKm: titleKm.trim() || title.trim(),
        shortDefinition: shortDefinition.trim(),
        simpleExplanation: simpleExplanation.trim() || shortDefinition.trim(),
        detailedExplanation: '',
        keyConcepts: [],
        practicalExamples: [],
        realWorldApplications: [],
        stepByStepGuide: [],
        terminology: [],
        personalNotesHtml: `<p>${simpleExplanation.trim() || shortDefinition.trim()}</p>`,
        externalResources: [],
        referencesList: [],
        attachments: [],
        tags: tagsRaw
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean),
        status,
        isFavorite: false,
      });
      setTitle('');
      setTitleKm('');
      setShortDefinition('');
      setSimpleExplanation('');
      setTagsRaw('');
      onSetCreateModalOpen(false);
      onOpenTopic(created.id);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save topic.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-white">{t.nav.notes}</h2>
          <p className="mt-1 text-sm text-slate-400">
            Browse, filter, edit, and connect all {topics.length} Digital Marketing knowledge topics.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSetCreateModalOpen(true)}
          className="liquid-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold"
        >
          <Plus className="h-4 w-4" />
          <span>{t.actions.newTopic}</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <label htmlFor="notes-search-input" className="sr-only">
            Filter knowledge notes
          </label>
          <input
            id="notes-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by title, tag, definition, or note text..."
            className="glass-input w-full rounded-xl pl-10 pr-3 py-2 text-sm placeholder-[#A1A1AA]"
          />
        </div>

        <label htmlFor="notes-cat-select" className="sr-only">
          Category filter
        </label>
        <select
          id="notes-cat-select"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="glass-input rounded-xl px-3 py-2 text-sm text-[#F5F5F7] bg-[#0C101B]"
        >
          <option value="all">All Planets ({topics.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 rounded-xl liquid-glass-subtle p-1">
          {(['all', 'not_started', 'learning', 'completed'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                statusFilter === st ? 'bg-[#E5B85C] text-[#080B12] font-semibold' : 'text-[#A1A1AA] hover:text-[#F5F5F7]'
              }`}
            >
              {st === 'all' ? 'All' : t.statuses[st]}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOnlyFavorites((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
            onlyFavorites
              ? 'border-[#E5B85C]/50 bg-[#E5B85C]/15 text-[#E5B85C]'
              : 'liquid-btn-glass text-[#A1A1AA]'
          }`}
        >
          <Star className={`h-3.5 w-3.5 ${onlyFavorites ? 'fill-current' : ''}`} />
          <span>Favorites</span>
        </button>
      </div>

      {/* Topic List */}
      {filtered.length === 0 ? (
        <div className="liquid-glass rounded-2xl p-12 text-center space-y-3">
          <p className="text-sm text-[#A1A1AA]">No knowledge topics match your current filters.</p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCatFilter('all');
              setStatusFilter('all');
              setOnlyFavorites(false);
            }}
            className="liquid-btn-glass rounded-xl px-3.5 py-1.5 text-xs"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="liquid-glass divide-y divide-white/[0.07] rounded-2xl overflow-hidden">
          {filtered.map((topic) => {
            const cat = categoryMap.get(topic.categoryId);
            return (
              <div
                key={topic.id}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-white/[0.04] transition-colors"
              >
                <button
                  type="button"
                  onClick={() => onOpenTopic(topic.id)}
                  className="text-left min-w-0 flex-1"
                >
                  <div className="text-xs text-slate-400">
                    <span style={{ color: cat?.color || '#E5B85C' }}>{cat?.name}</span>
                    <span aria-hidden="true"> · </span>
                    <span
                      className={
                        topic.status === 'completed'
                          ? 'text-emerald-400'
                          : topic.status === 'learning'
                            ? 'text-[#E5B85C]'
                            : 'text-slate-400'
                      }
                    >
                      {t.statuses[topic.status]}
                    </span>
                    {topic.tags.length > 0 && (
                      <>
                        <span aria-hidden="true"> · </span>
                        <span>{topic.tags.map((tg) => `#${tg}`).join(' ')}</span>
                      </>
                    )}
                  </div>
                  <h3 className="mt-1 font-display text-base font-medium text-white truncate">
                    {language === 'km' && topic.titleKm ? topic.titleKm : topic.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-1">{topic.shortDefinition}</p>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(topic)}
                    aria-label={`Toggle favorite for ${topic.title}`}
                    className={`p-2 rounded-lg transition-colors ${
                      topic.isFavorite ? 'text-[#E5B85C]' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <Star className={`h-4 w-4 ${topic.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenTopic(topic.id)}
                    aria-label={`Open ${topic.title}`}
                    className="p-2 text-slate-400 hover:text-white rounded-lg"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create New Topic Modal */}
      {createModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Create New Topic"
        >
          <form
            onSubmit={handleCreate}
            className="w-full max-w-lg liquid-glass-modal rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-white">
                Add Knowledge Topic
              </h3>
              <button
                type="button"
                onClick={() => onSetCreateModalOpen(false)}
                aria-label="Close modal"
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && <p className="text-xs text-rose-400">{formError}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="new-topic-title" className="block text-xs text-slate-300 mb-1">
                  Topic Title
                </label>
                <input
                  id="new-topic-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Programmatic SEO"
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-[#E5B85C] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="new-topic-title-km" className="block text-xs text-slate-300 mb-1">
                  Khmer Title (Optional)
                </label>
                <input
                  id="new-topic-title-km"
                  type="text"
                  value={titleKm}
                  onChange={(e) => setTitleKm(e.target.value)}
                  placeholder="Optional Khmer label..."
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-[#E5B85C] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="new-topic-cat" className="block text-xs text-slate-300 mb-1">
                  Marketing Planet
                </label>
                <select
                  id="new-topic-cat"
                  value={categoryId || categories[0]?.id || ''}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-[#E5B85C] focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="new-topic-status" className="block text-xs text-slate-300 mb-1">
                  Learning Status
                </label>
                <select
                  id="new-topic-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LearningStatus)}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-[#E5B85C] focus:outline-none"
                >
                  <option value="not_started">Not Started</option>
                  <option value="learning">Learning</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="new-topic-def" className="block text-xs text-slate-300 mb-1">
                Short Definition
              </label>
              <textarea
                id="new-topic-def"
                rows={2}
                required
                value={shortDefinition}
                onChange={(e) => setShortDefinition(e.target.value)}
                placeholder="Concise one-sentence definition (min 8 chars)..."
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-[#E5B85C] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="new-topic-simple" className="block text-xs text-slate-300 mb-1">
                Simple Explanation
              </label>
              <textarea
                id="new-topic-simple"
                rows={2}
                value={simpleExplanation}
                onChange={(e) => setSimpleExplanation(e.target.value)}
                placeholder="Explain it in everyday language..."
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-[#E5B85C] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="new-topic-tags" className="block text-xs text-slate-300 mb-1">
                Tags (comma separated)
              </label>
              <input
                id="new-topic-tags"
                type="text"
                value={tagsRaw}
                onChange={(e) => setTagsRaw(e.target.value)}
                placeholder="seo, automation, growth"
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-[#E5B85C] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => onSetCreateModalOpen(false)}
                className="liquid-btn-glass rounded-xl px-4 py-2 text-xs"
              >
                {t.actions.cancel}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="liquid-btn-primary rounded-xl px-4 py-2 text-xs font-semibold disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Create Topic'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
