import { useState } from 'react';
import { ArrowRight, Orbit, Plus, X } from 'lucide-react';
import type { Category, Language, Topic } from '../../types/knowledge';
import { TRANSLATIONS } from '../../i18n/translations';

interface CategoriesViewProps {
  categories: Category[];
  topics: Topic[];
  language: Language;
  onSelectCategoryTopics: (categoryId: string) => void;
  onInspectPlanetInUniverse: (categoryId: string) => void;
  onCreateCategory: (payload: { name: string; nameKm?: string; description: string; color: string }) => Promise<void>;
}

const PLANET_COLORS = ['#E5B85C', '#5EA2EF', '#8B7CF6', '#34D399', '#FB7185', '#38BDF8', '#F59E0B'];

export function CategoriesView({
  categories,
  topics,
  language,
  onSelectCategoryTopics,
  onInspectPlanetInUniverse,
  onCreateCategory,
}: CategoriesViewProps) {
  const t = TRANSLATIONS[language];
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [nameKm, setNameKm] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PLANET_COLORS[0]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Category name must be at least 2 characters.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onCreateCategory({ name: name.trim(), nameKm: nameKm.trim(), description: description.trim(), color });
      setName('');
      setNameKm('');
      setDescription('');
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-white">
            {t.nav.categories}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            10 core planetary disciplines plus your custom marketing domains.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="liquid-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          <span>{t.actions.newCategory}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const catTopics = topics.filter((tp) => tp.categoryId === cat.id);
          const completed = catTopics.filter((tp) => tp.status === 'completed').length;
          const pct = catTopics.length > 0 ? Math.round((completed / catTopics.length) * 100) : 0;

          return (
            <article
              key={cat.id}
              className="flex flex-col justify-between liquid-glass liquid-glass-interactive rounded-2xl p-5"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                      aria-hidden="true"
                    />
                    <h3 className="font-display text-base font-medium text-[#F5F5F7] truncate">
                      {language === 'km' && cat.nameKm ? cat.nameKm : cat.name}
                    </h3>
                  </div>
                  <span className="font-mono text-xs text-[#A1A1AA] tabular-nums shrink-0">
                    {catTopics.length} topics
                  </span>
                </div>

                <p className="mt-2.5 text-sm text-[#A1A1AA] leading-relaxed line-clamp-2">
                  {language === 'km' && cat.descriptionKm ? cat.descriptionKm : cat.description}
                </p>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-[#A1A1AA] mb-1.5">
                    <span>Mastery</span>
                    <span className="font-mono tabular-nums text-[#F5F5F7]">
                      {completed}/{catTopics.length} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSelectCategoryTopics(cat.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#F5F5F7] hover:text-[#E5B85C] transition-colors"
                >
                  <span>Explore topics</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onInspectPlanetInUniverse(cat.id)}
                  className="liquid-btn-glass inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-[#F5F5F7]"
                >
                  <Orbit className="h-3.5 w-3.5 text-[#5EA2EF]" />
                  <span>3D Planet</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Create custom category"
        >
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md liquid-glass-modal rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-medium text-[#F5F5F7]">Create Marketing Planet</h3>
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
              <label htmlFor="cat-name" className="block text-xs font-medium text-slate-300 mb-1">
                Category Name (English)
              </label>
              <input
                id="cat-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Growth Experimentation"
                className="glass-input w-full rounded-xl px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="cat-name-km" className="block text-xs font-medium text-[#A1A1AA] mb-1">
                Khmer Name (Optional)
              </label>
              <input
                id="cat-name-km"
                type="text"
                value={nameKm}
                onChange={(e) => setNameKm(e.target.value)}
                placeholder="ការសាកល្បងកំណើនទីផ្សារ"
                className="glass-input w-full rounded-xl px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="cat-desc" className="block text-xs font-medium text-[#A1A1AA] mb-1">
                Description
              </label>
              <textarea
                id="cat-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this knowledge planet..."
                className="glass-input w-full rounded-xl px-3 py-2 text-sm"
              />
            </div>

            <div>
              <span className="block text-xs font-medium text-[#A1A1AA] mb-2">Planet Color</span>
              <div className="flex items-center gap-2">
                {PLANET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Select color ${c}`}
                    className={`h-7 w-7 rounded-full border-2 transition-transform ${
                      color === c ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="liquid-btn-glass rounded-xl px-4 py-2 text-xs font-medium"
              >
                {t.actions.cancel}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="liquid-btn-primary rounded-xl px-4 py-2 text-xs font-semibold disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Planet'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
