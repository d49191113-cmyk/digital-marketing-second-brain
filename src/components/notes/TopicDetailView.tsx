import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  Check,
  ExternalLink,
  ImagePlus,
  Link2,
  Orbit,
  Pencil,
  Plus,
  Star,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import type {
  Category,
  Language,
  LearningStatus,
  Topic,
  TopicAttachment,
  TopicConnection,
} from '../../types/knowledge';
import { TRANSLATIONS } from '../../i18n/translations';
import { RichTextEditor } from './RichTextEditor';

interface TopicDetailViewProps {
  topic: Topic;
  category?: Category;
  allTopics: Topic[];
  connections: TopicConnection[];
  language: Language;
  onBack: () => void;
  onUpdateTopic: (topicId: string, updates: Partial<Topic>) => Promise<void>;
  onDeleteTopic: (topicId: string) => Promise<void>;
  onOpenTopic: (topicId: string) => void;
  onCreateConnection: (sourceId: string, targetId: string, label: string) => Promise<void>;
  onDeleteConnection: (connId: string) => Promise<void>;
  onLocateInUniverse: (topicId: string) => void;
  onAskAiAboutTopic: (topic: Topic) => void;
}

export function TopicDetailView({
  topic,
  category,
  allTopics,
  connections,
  language,
  onBack,
  onUpdateTopic,
  onDeleteTopic,
  onOpenTopic,
  onCreateConnection,
  onDeleteConnection,
  onLocateInUniverse,
  onAskAiAboutTopic,
}: TopicDetailViewProps) {
  const t = TRANSLATIONS[language];
  const [notesHtml, setNotesHtml] = useState(topic.personalNotesHtml);
  const [notesDirty, setNotesDirty] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  const [editingDetails, setEditingDetails] = useState(false);
  const [editTitle, setEditTitle] = useState(topic.title);
  const [editTitleKm, setEditTitleKm] = useState(topic.titleKm);
  const [editDef, setEditDef] = useState(topic.shortDefinition);
  const [editSimple, setEditSimple] = useState(topic.simpleExplanation);
  const [editDetailed, setEditDetailed] = useState(topic.detailedExplanation);
  const [editConcepts, setEditConcepts] = useState(topic.keyConcepts.join('\n'));
  const [editExamples, setEditExamples] = useState(topic.practicalExamples.join('\n'));
  const [editApps, setEditApps] = useState(topic.realWorldApplications.join('\n'));
  const [editGuide, setEditGuide] = useState(topic.stepByStepGuide.join('\n'));

  const [newTag, setNewTag] = useState('');
  const [linkTargetId, setLinkTargetId] = useState('');
  const [linkLabel, setLinkLabel] = useState('Connects with');

  const [resTitle, setResTitle] = useState('');
  const [resUrl, setResUrl] = useState('');
  const [refInput, setRefInput] = useState('');
  const [attachName, setAttachName] = useState('');
  const [attachUrl, setAttachUrl] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setNotesHtml(topic.personalNotesHtml);
    setNotesDirty(false);
    setEditTitle(topic.title);
    setEditTitleKm(topic.titleKm);
    setEditDef(topic.shortDefinition);
    setEditSimple(topic.simpleExplanation);
    setEditDetailed(topic.detailedExplanation);
    setEditConcepts(topic.keyConcepts.join('\n'));
    setEditExamples(topic.practicalExamples.join('\n'));
    setEditApps(topic.realWorldApplications.join('\n'));
    setEditGuide(topic.stepByStepGuide.join('\n'));
    setEditingDetails(false);
    setConfirmDelete(false);
  }, [topic]);

  const relatedConnections = useMemo(
    () =>
      connections.filter(
        (c) => c.sourceTopicId === topic.id || c.targetTopicId === topic.id
      ),
    [connections, topic.id]
  );

  const topicMap = useMemo(() => new Map(allTopics.map((tp) => [tp.id, tp])), [allTopics]);

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      await onUpdateTopic(topic.id, { personalNotesHtml: notesHtml });
      setNotesDirty(false);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateTopic(topic.id, {
      title: editTitle.trim() || topic.title,
      titleKm: editTitleKm.trim(),
      shortDefinition: editDef.trim() || topic.shortDefinition,
      simpleExplanation: editSimple.trim(),
      detailedExplanation: editDetailed.trim(),
      keyConcepts: editConcepts.split('\n').map((s) => s.trim()).filter(Boolean),
      practicalExamples: editExamples.split('\n').map((s) => s.trim()).filter(Boolean),
      realWorldApplications: editApps.split('\n').map((s) => s.trim()).filter(Boolean),
      stepByStepGuide: editGuide.split('\n').map((s) => s.trim()).filter(Boolean),
    });
    setEditingDetails(false);
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTag.trim().toLowerCase();
    if (!clean || topic.tags.includes(clean)) return;
    await onUpdateTopic(topic.id, { tags: [...topic.tags, clean] });
    setNewTag('');
  };

  const handleRemoveTag = async (tag: string) => {
    await onUpdateTopic(topic.id, { tags: topic.tags.filter((tg) => tg !== tag) });
  };

  const handleAddConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTargetId) return;
    await onCreateConnection(topic.id, linkTargetId, linkLabel.trim() || 'Related to');
    setLinkTargetId('');
  };

  const handleAddExternalResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitle.trim() || !resUrl.trim()) return;
    await onUpdateTopic(topic.id, {
      externalResources: [
        ...topic.externalResources,
        { title: resTitle.trim(), url: resUrl.trim() },
      ],
    });
    setResTitle('');
    setResUrl('');
  };

  const handleAddReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refInput.trim()) return;
    await onUpdateTopic(topic.id, {
      referencesList: [...topic.referencesList, refInput.trim()],
    });
    setRefInput('');
  };

  const handleAddAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachName.trim() || !attachUrl.trim()) return;
    const item: TopicAttachment = {
      id: `att-${Date.now()}`,
      name: attachName.trim(),
      url: attachUrl.trim(),
      type: /\.(png|jpe?g|webp|gif|svg)$/i.test(attachUrl) ? 'image' : 'link',
    };
    await onUpdateTopic(topic.id, { attachments: [...topic.attachments, item] });
    setAttachName('');
    setAttachUrl('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const item: TopicAttachment = {
          id: `att-${Date.now()}`,
          name: file.name,
          url: reader.result,
          type: file.type.startsWith('image/') ? 'image' : 'document',
        };
        await onUpdateTopic(topic.id, { attachments: [...topic.attachments, item] });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mx-auto max-w-[1160px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Top Action Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to library</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onLocateInUniverse(topic.id)}
            className="liquid-btn-glass inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium"
          >
            <Orbit className="h-3.5 w-3.5 text-[#5EA2EF]" />
            <span>{t.actions.locateInUniverse}</span>
          </button>

          <button
            type="button"
            onClick={() => onAskAiAboutTopic(topic)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5B85C]/40 bg-[#E5B85C]/12 px-3 py-1.5 text-xs font-medium text-[#E5B85C] hover:bg-[#E5B85C]/20 transition-colors"
          >
            <Bot className="h-3.5 w-3.5" />
            <span>{t.actions.askAi}</span>
          </button>

          <button
            type="button"
            onClick={() => onUpdateTopic(topic.id, { isFavorite: !topic.isFavorite })}
            aria-label={topic.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
              topic.isFavorite
                ? 'border-[#E5B85C]/50 bg-[#E5B85C]/15 text-[#E5B85C]'
                : 'liquid-btn-glass text-[#A1A1AA]'
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${topic.isFavorite ? 'fill-current' : ''}`} />
            <span>{topic.isFavorite ? 'Favorited' : 'Favorite'}</span>
          </button>

          <button
            type="button"
            onClick={() => setEditingDetails((v) => !v)}
            className="liquid-btn-glass inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>{editingDetails ? 'Close Editor' : t.actions.edit}</span>
          </button>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              aria-label={`Delete topic ${topic.title}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{t.actions.delete}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={async () => {
                await onDeleteTopic(topic.id);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
            >
              <span>Confirm Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Header & Status Selector */}
      <section className="liquid-glass rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-slate-400">
              <span style={{ color: category?.color || '#E5B85C' }}>
                {category?.name || 'Digital Marketing'}
              </span>
              {topic.titleKm && (
                <>
                  <span aria-hidden="true"> · </span>
                  <span>{topic.titleKm}</span>
                </>
              )}
            </div>
            <h2 className="mt-1.5 font-display text-2xl sm:text-3xl font-semibold text-white text-balance">
              {topic.title}
            </h2>
            <p className="mt-3 text-base text-slate-200 leading-relaxed">{topic.shortDefinition}</p>
          </div>

          <div className="shrink-0">
            <span className="block text-[11px] text-slate-400 mb-1.5">Learning Status</span>
            <div className="inline-flex rounded-lg border border-white/10 bg-black/40 p-1">
              {(['not_started', 'learning', 'completed'] as LearningStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => onUpdateTopic(topic.id, { status: st })}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    topic.status === st
                      ? st === 'completed'
                        ? 'bg-emerald-500 text-slate-950 font-semibold'
                        : st === 'learning'
                          ? 'bg-[#E5B85C] text-slate-950 font-semibold'
                          : 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {t.statuses[st]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tags Editor */}
        <div className="mt-5 pt-4 border-t border-white/[0.07] flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Tag className="h-3.5 w-3.5" />
            <span>Tags:</span>
          </div>
          {topic.tags.map((tg) => (
            <span
              key={tg}
              className="inline-flex items-center gap-1 text-xs text-slate-200 bg-white/[0.05] px-2 py-0.5 rounded"
            >
              <span>#{tg}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tg)}
                aria-label={`Remove tag ${tg}`}
                className="text-slate-400 hover:text-rose-400"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <form onSubmit={handleAddTag} className="inline-flex items-center gap-1.5">
            <label htmlFor="add-tag-input" className="sr-only">
              Add tag
            </label>
            <input
              id="add-tag-input"
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag..."
              className="w-28 rounded border border-white/10 bg-black/30 px-2 py-1 text-xs text-white placeholder-slate-500 focus:border-[#E5B85C] focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Add tag"
              className="rounded border border-white/10 px-2 py-1 text-xs text-slate-300 hover:text-white"
            >
              <Plus className="h-3 w-3" />
            </button>
          </form>
        </div>
      </section>

      {/* Edit Topic Content Form */}
      {editingDetails && (
        <form
          onSubmit={handleSaveDetails}
          className="liquid-glass rounded-2xl border-[#E5B85C]/35 p-6 space-y-4"
        >
          <h3 className="font-display text-base font-semibold text-white">Edit Knowledge Entry</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-title" className="block text-xs text-slate-300 mb-1">
                Topic Title
              </label>
              <input
                id="edit-title"
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label htmlFor="edit-title-km" className="block text-xs text-slate-300 mb-1">
                Khmer Title
              </label>
              <input
                id="edit-title-km"
                type="text"
                value={editTitleKm}
                onChange={(e) => setEditTitleKm(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-def" className="block text-xs text-slate-300 mb-1">
              {t.topicSections.shortDefinition}
            </label>
            <textarea
              id="edit-def"
              rows={2}
              required
              value={editDef}
              onChange={(e) => setEditDef(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-simple" className="block text-xs text-slate-300 mb-1">
                {t.topicSections.simpleExplanation}
              </label>
              <textarea
                id="edit-simple"
                rows={3}
                value={editSimple}
                onChange={(e) => setEditSimple(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label htmlFor="edit-detailed" className="block text-xs text-slate-300 mb-1">
                {t.topicSections.detailedExplanation}
              </label>
              <textarea
                id="edit-detailed"
                rows={3}
                value={editDetailed}
                onChange={(e) => setEditDetailed(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-concepts" className="block text-xs text-slate-300 mb-1">
                Key Concepts (one per line)
              </label>
              <textarea
                id="edit-concepts"
                rows={3}
                value={editConcepts}
                onChange={(e) => setEditConcepts(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label htmlFor="edit-guide" className="block text-xs text-slate-300 mb-1">
                Step-by-Step Guide (one step per line)
              </label>
              <textarea
                id="edit-guide"
                rows={3}
                value={editGuide}
                onChange={(e) => setEditGuide(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label htmlFor="edit-examples" className="block text-xs text-slate-300 mb-1">
                Practical Examples (one per line)
              </label>
              <textarea
                id="edit-examples"
                rows={3}
                value={editExamples}
                onChange={(e) => setEditExamples(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label htmlFor="edit-apps" className="block text-xs text-slate-300 mb-1">
                Real-World Applications (one per line)
              </label>
              <textarea
                id="edit-apps"
                rows={3}
                value={editApps}
                onChange={(e) => setEditApps(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingDetails(false)}
              className="rounded-lg border border-white/15 px-4 py-2 text-xs text-slate-300"
            >
              {t.actions.cancel}
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#E5B85C] px-4 py-2 text-xs font-semibold text-[#080B12]"
            >
              {t.actions.save}
            </button>
          </div>
        </form>
      )}

      {/* Structured Knowledge Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <section className="liquid-glass rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="font-display text-sm font-semibold text-[#E5B85C]">
                {t.topicSections.simpleExplanation}
              </h3>
              <p className="mt-2 text-sm text-slate-200 leading-relaxed">
                {topic.simpleExplanation || 'No simple explanation recorded yet.'}
              </p>
            </div>

            <div className="pt-4 border-t border-white/[0.06]">
              <h3 className="font-display text-sm font-semibold text-[#5EA2EF]">
                {t.topicSections.detailedExplanation}
              </h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                {topic.detailedExplanation || 'Add deeper technical breakdown via the Edit form.'}
              </p>
            </div>

            <div className="pt-4 border-t border-white/[0.06] grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-display text-sm font-semibold text-white">
                  {t.topicSections.keyConcepts}
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-300 list-disc pl-5">
                  {topic.keyConcepts.length > 0 ? (
                    topic.keyConcepts.map((c, i) => <li key={i}>{c}</li>)
                  ) : (
                    <li className="text-slate-500">None listed yet</li>
                  )}
                </ul>
              </div>

              <div>
                <h3 className="font-display text-sm font-semibold text-white">
                  {t.topicSections.stepByStepGuide}
                </h3>
                <ol className="mt-2 space-y-1.5 text-sm text-slate-300 list-decimal pl-5">
                  {topic.stepByStepGuide.length > 0 ? (
                    topic.stepByStepGuide.map((s, i) => <li key={i}>{s}</li>)
                  ) : (
                    <li className="text-slate-500">No steps listed yet</li>
                  )}
                </ol>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-display text-sm font-semibold text-white">
                  {t.topicSections.practicalExamples}
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-300 list-disc pl-5">
                  {topic.practicalExamples.map((ex, i) => (
                    <li key={i}>{ex}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-display text-sm font-semibold text-white">
                  {t.topicSections.realWorldApplications}
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-300 list-disc pl-5">
                  {topic.realWorldApplications.map((app, i) => (
                    <li key={i}>{app}</li>
                  ))}
                </ul>
              </div>
            </div>

            {topic.terminology.length > 0 && (
              <div className="pt-4 border-t border-white/[0.06]">
                <h3 className="font-display text-sm font-semibold text-white">
                  {t.topicSections.terminology}
                </h3>
                <dl className="mt-2 space-y-2">
                  {topic.terminology.map((item, i) => (
                    <div key={i} className="text-sm">
                      <dt className="inline font-semibold text-[#E5B85C]">{item.term}: </dt>
                      <dd className="inline text-slate-300">{item.definition}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </section>

          {/* Personal Rich-Text Notes */}
          <section className="liquid-glass rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-medium text-[#F5F5F7]">
                {t.topicSections.personalNotes}
              </h3>
              <button
                type="button"
                onClick={saveNotes}
                disabled={savingNotes}
                className="liquid-btn-primary inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold disabled:opacity-60"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{savingNotes ? 'Saving...' : notesDirty ? 'Save Notes' : 'Saved'}</span>
              </button>
            </div>
            <RichTextEditor
              value={notesHtml}
              onChange={(html) => {
                setNotesHtml(html);
                setNotesDirty(true);
              }}
            />
          </section>
        </div>

        {/* Right Column: Related Topics, External Resources, References, Attachments */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Related Topics & Knowledge Links */}
          <section className="liquid-glass rounded-2xl p-5 space-y-4">
            <h3 className="font-display text-sm font-semibold text-white flex items-center gap-2">
              <Link2 className="h-4 w-4 text-[#5EA2EF]" />
              <span>{t.topicSections.relatedTopics}</span>
            </h3>

            <div className="space-y-2">
              {relatedConnections.length === 0 ? (
                <p className="text-xs text-slate-400">No linked topics yet. Connect one below.</p>
              ) : (
                relatedConnections.map((conn) => {
                  const otherId =
                    conn.sourceTopicId === topic.id ? conn.targetTopicId : conn.sourceTopicId;
                  const other = topicMap.get(otherId);
                  if (!other) return null;
                  return (
                    <div
                      key={conn.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2"
                    >
                      <button
                        type="button"
                        onClick={() => onOpenTopic(other.id)}
                        className="text-left min-w-0 flex-1"
                      >
                        <div className="text-xs font-medium text-slate-100 hover:text-[#E5B85C] truncate">
                          {other.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {conn.relationshipLabel}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteConnection(conn.id)}
                        aria-label={`Unlink ${other.title}`}
                        className="p-1 text-slate-500 hover:text-rose-400"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleAddConnection} className="space-y-2 pt-2 border-t border-white/[0.07]">
              <label htmlFor="link-topic-select" className="sr-only">
                Select topic to connect
              </label>
              <select
                id="link-topic-select"
                value={linkTargetId}
                onChange={(e) => setLinkTargetId(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="">Link related topic...</option>
                {allTopics
                  .filter((tp) => tp.id !== topic.id)
                  .map((tp) => (
                    <option key={tp.id} value={tp.id}>
                      {tp.title}
                    </option>
                  ))}
              </select>
              <div className="flex gap-2">
                <label htmlFor="link-label-input" className="sr-only">
                  Relationship label
                </label>
                <input
                  id="link-label-input"
                  type="text"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  placeholder="Relationship..."
                  className="flex-1 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-white"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
                >
                  Link
                </button>
              </div>
            </form>
          </section>

          {/* External Resources */}
          <section className="liquid-glass rounded-2xl p-5 space-y-3">
            <h3 className="font-display text-sm font-medium text-[#F5F5F7]">
              {t.topicSections.externalResources}
            </h3>
            <div className="space-y-2">
              {topic.externalResources.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 text-xs text-[#5EA2EF] hover:underline"
                >
                  <span className="truncate">{r.title}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ))}
            </div>
            <form onSubmit={handleAddExternalResource} className="space-y-2 pt-2 border-t border-white/[0.07]">
              <input
                type="text"
                value={resTitle}
                onChange={(e) => setResTitle(e.target.value)}
                placeholder="Resource title..."
                aria-label="External resource title"
                className="glass-input w-full rounded-xl px-2.5 py-1.5 text-xs"
              />
              <div className="flex gap-2">
                <input
                  type="url"
                  value={resUrl}
                  onChange={(e) => setResUrl(e.target.value)}
                  placeholder="https://..."
                  aria-label="External resource URL"
                  className="glass-input flex-1 rounded-xl px-2.5 py-1.5 text-xs"
                />
                <button
                  type="submit"
                  className="liquid-btn-glass rounded-xl px-3 py-1.5 text-xs"
                >
                  Add
                </button>
              </div>
            </form>
          </section>

          {/* References */}
          <section className="liquid-glass rounded-2xl p-5 space-y-3">
            <h3 className="font-display text-sm font-medium text-[#F5F5F7]">
              {t.topicSections.references}
            </h3>
            <ul className="space-y-1.5 text-xs text-[#A1A1AA] list-disc pl-4">
              {topic.referencesList.map((ref, idx) => (
                <li key={idx}>{ref}</li>
              ))}
            </ul>
            <form onSubmit={handleAddReference} className="flex gap-2 pt-1">
              <input
                type="text"
                value={refInput}
                onChange={(e) => setRefInput(e.target.value)}
                placeholder="Book, paper, or citation..."
                aria-label="Add reference citation"
                className="glass-input flex-1 rounded-xl px-2.5 py-1.5 text-xs"
              />
              <button
                type="submit"
                className="liquid-btn-glass rounded-xl px-3 py-1.5 text-xs"
              >
                Add
              </button>
            </form>
          </section>

          {/* Images & Attachments */}
          <section className="liquid-glass rounded-2xl p-5 space-y-3">
            <h3 className="font-display text-sm font-medium text-[#F5F5F7] flex items-center gap-2">
              <ImagePlus className="h-4 w-4 text-[#E5B85C]" />
              <span>{t.topicSections.attachments}</span>
            </h3>

            {topic.attachments.length > 0 && (
              <div className="space-y-2">
                {topic.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="rounded-lg border border-white/10 bg-black/30 p-2 space-y-2"
                  >
                    {att.type === 'image' && (
                      <img
                        src={att.url}
                        alt={att.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-32 object-cover rounded"
                      />
                    )}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-slate-200">{att.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateTopic(topic.id, {
                            attachments: topic.attachments.filter((a) => a.id !== att.id),
                          })
                        }
                        aria-label={`Remove attachment ${att.name}`}
                        className="text-slate-400 hover:text-rose-400"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <label className="block cursor-pointer rounded-lg border border-dashed border-white/15 px-3 py-2 text-center text-xs text-slate-300 hover:border-[#E5B85C]/50">
              <span>Upload image or file</span>
              <input type="file" onChange={handleFileUpload} className="sr-only" />
            </label>

            <form onSubmit={handleAddAttachment} className="space-y-2">
              <input
                type="text"
                value={attachName}
                onChange={(e) => setAttachName(e.target.value)}
                placeholder="Attachment label..."
                aria-label="Attachment label"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-white"
              />
              <div className="flex gap-2">
                <input
                  type="url"
                  value={attachUrl}
                  onChange={(e) => setAttachUrl(e.target.value)}
                  placeholder="Image or doc URL..."
                  aria-label="Attachment URL"
                  className="flex-1 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-white"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
                >
                  Attach
                </button>
              </div>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}
