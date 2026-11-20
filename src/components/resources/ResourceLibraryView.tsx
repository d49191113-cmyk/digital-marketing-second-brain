import { useMemo, useState } from 'react';
import { ExternalLink, Plus, Search, Trash2, X } from 'lucide-react';
import type { Category, Language, ResourceItem } from '../../types/knowledge';
import { TRANSLATIONS } from '../../i18n/translations';

interface ResourceLibraryViewProps {
  resources: ResourceItem[];
  categories: Category[];
  language: Language;
  onCreateResource: (payload: Omit<ResourceItem, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteResource: (id: string) => Promise<void>;
}

export function ResourceLibraryView({
  resources,
  categories,
  language,
  onCreateResource,
  onDeleteResource,
}: ResourceLibraryViewProps) {
  const t = TRANSLATIONS[language];
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [resourceType, setResourceType] = useState<ResourceItem['resourceType']>('guide');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return resources.filter((r) => {
      if (selectedCat !== 'all' && r.categoryId !== selectedCat) return false;
      if (selectedType !== 'all' && r.resourceType !== selectedType) return false;
      if (!q) return true;
      return `${r.title} ${r.description} ${r.resourceType}`.toLowerCase().includes(q);
    });
  }, [resources, search, selectedCat, selectedType]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim() || !categoryId) {
      setError('Title, URL, and category are required.');
      return;
    }
    setError('');
    await onCreateResource({
      title: title.trim(),
      url: url.trim(),
      categoryId,
      resourceType,
      description: description.trim(),
    });
    setTitle('');
    setUrl('');
    setDescription('');
    setModalOpen(false);
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-white">{t.nav.resources}</h2>
          <p className="mt-1 text-sm text-slate-400">
            Curated guides, tools, templates, and official documentation across Digital Marketing.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="liquid-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold"
        >
          <Plus className="h-4 w-4" />
          <span>Add Resource</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <label htmlFor="res-search" className="sr-only">
            Filter resources
          </label>
          <input
            id="res-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter resources..."
            className="glass-input w-full rounded-xl pl-10 pr-3 py-2 text-sm placeholder-[#A1A1AA]"
          />
        </div>

        <label htmlFor="res-cat-filter" className="sr-only">
          Filter by category
        </label>
        <select
          id="res-cat-filter"
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="glass-input rounded-xl px-3 py-2 text-sm text-[#F5F5F7] bg-[#0C101B]"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 rounded-xl liquid-glass-subtle p-1">
          {(['all', 'guide', 'tool', 'template', 'video'] as const).map((tp) => (
            <button
              key={tp}
              type="button"
              onClick={() => setSelectedType(tp)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                selectedType === tp ? 'bg-[#E5B85C] text-[#080B12] font-semibold' : 'text-[#A1A1AA] hover:text-[#F5F5F7]'
              }`}
            >
              {tp}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="liquid-glass rounded-2xl p-10 text-center">
          <p className="text-sm text-[#A1A1AA]">No resources match your filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((res) => (
            <article
              key={res.id}
              className="flex flex-col justify-between liquid-glass liquid-glass-interactive rounded-2xl p-5"
            >
              <div>
                <div className="text-xs text-slate-400">
                  <span className="uppercase tracking-wider text-[#5EA2EF]">{res.resourceType}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{categoryMap.get(res.categoryId)?.name ?? 'General'}</span>
                </div>
                <h3 className="mt-1.5 font-display text-base font-semibold text-white">
                  {res.title}
                </h3>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">{res.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#E5B85C] hover:underline"
                >
                  <span>Open resource</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => onDeleteResource(res.id)}
                  aria-label={`Delete resource ${res.title}`}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Add Resource"
        >
          <form
            onSubmit={handleAdd}
            className="w-full max-w-md liquid-glass-modal rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-white">Add Resource</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {error && <p className="text-xs text-rose-400">{error}</p>}

            <div>
              <label htmlFor="res-title" className="block text-xs font-medium text-slate-300 mb-1">
                Title
              </label>
              <input
                id="res-title"
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-[#E5B85C] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="res-url" className="block text-xs font-medium text-slate-300 mb-1">
                URL
              </label>
              <input
                id="res-url"
                required
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-[#E5B85C] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="res-cat" className="block text-xs font-medium text-slate-300 mb-1">
                  Category
                </label>
                <select
                  id="res-cat"
                  value={categoryId}
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
                <label htmlFor="res-type" className="block text-xs font-medium text-slate-300 mb-1">
                  Type
                </label>
                <select
                  id="res-type"
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value as ResourceItem['resourceType'])}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-[#E5B85C] focus:outline-none"
                >
                  <option value="guide">Guide</option>
                  <option value="tool">Tool</option>
                  <option value="template">Template</option>
                  <option value="video">Video</option>
                  <option value="article">Article</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="res-desc" className="block text-xs font-medium text-slate-300 mb-1">
                Description
              </label>
              <textarea
                id="res-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-[#E5B85C] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#E5B85C] px-4 py-2 text-xs font-semibold text-[#080B12]"
              >
                Save Resource
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
