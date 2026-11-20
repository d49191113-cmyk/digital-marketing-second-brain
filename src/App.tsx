import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type {
  Language,
  LearningStatus,
  QuizQuestion,
  SearchResult,
  Topic,
  WorkspaceData,
} from './types/knowledge';
import { api } from './services/api';
import { Sidebar, type NavSection } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { GlobalSearchModal } from './components/search/GlobalSearchModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { KnowledgeUniverseView } from './components/universe/KnowledgeUniverseView';
import { CategoriesView } from './components/categories/CategoriesView';
import { NotesWorkspaceView } from './components/notes/NotesWorkspaceView';
import { TopicDetailView } from './components/notes/TopicDetailView';
import { LearningCenterView } from './components/learning/LearningCenterView';
import { ResourceLibraryView } from './components/resources/ResourceLibraryView';
import { AIAssistantView } from './components/ai/AIAssistantView';
import { SettingsView } from './components/settings/SettingsView';

export default function App() {
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeSection, setActiveSection] = useState<NavSection>('home');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [notesCatFilter, setNotesCatFilter] = useState<string>('all');
  const [createTopicModalOpen, setCreateTopicModalOpen] = useState(false);

  const [universeCatId, setUniverseCatId] = useState<string | null>(null);
  const [universeTopicId, setUniverseTopicId] = useState<string | null>(null);
  const [aiSeedTopic, setAiSeedTopic] = useState<Topic | null>(null);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getWorkspace();
      setWorkspace(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspace.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  // Global Cmd/Ctrl + K search shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const language: Language = workspace?.profile.language ?? 'en';

  const handleToggleLanguage = async () => {
    if (!workspace) return;
    const next: Language = language === 'en' ? 'km' : 'en';
    setWorkspace({
      ...workspace,
      profile: { ...workspace.profile, language: next },
    });
    await api.updateSettings({ language: next });
  };

  const handleOpenTopic = async (topicId: string) => {
    setSelectedTopicId(topicId);
    setActiveSection('notes');
    const now = new Date().toISOString();
    setWorkspace((prev) =>
      prev
        ? {
            ...prev,
            topics: prev.topics.map((tp) =>
              tp.id === topicId ? { ...tp, lastViewedAt: now } : tp
            ),
          }
        : prev
    );
    api.markTopicViewed(topicId).catch(() => {});
  };

  const handleOpenUniverse = (topicId?: string | null, categoryId?: string | null) => {
    setUniverseTopicId(topicId ?? null);
    setUniverseCatId(categoryId ?? null);
    setActiveSection('universe');
  };

  const handleSearchResult = (result: SearchResult, highlightInUniverse = false) => {
    if (highlightInUniverse) {
      handleOpenUniverse(result.topicId ?? null, result.categoryId ?? null);
      return;
    }
    if (result.type === 'topic' && result.topicId) {
      handleOpenTopic(result.topicId);
    } else if (result.type === 'category' && result.categoryId) {
      setSelectedTopicId(null);
      setNotesCatFilter(result.categoryId);
      setActiveSection('notes');
    } else if (result.type === 'resource') {
      setActiveSection('resources');
    }
  };

  const handleCreateTopic = async (
    payload: Omit<Topic, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'lastViewedAt'>
  ) => {
    const { topic } = await api.createTopic(payload);
    await loadWorkspace();
    return topic;
  };

  const handleUpdateTopic = async (topicId: string, updates: Partial<Topic>) => {
    const { topic } = await api.updateTopic(topicId, updates);
    setWorkspace((prev) =>
      prev
        ? {
            ...prev,
            topics: prev.topics.map((tp) => (tp.id === topicId ? topic : tp)),
          }
        : prev
    );
    if (updates.status === 'completed') {
      loadWorkspace();
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    await api.deleteTopic(topicId);
    setSelectedTopicId(null);
    await loadWorkspace();
  };

  const handleCreateConnection = async (
    sourceId: string,
    targetId: string,
    label: string
  ) => {
    const { connection } = await api.createConnection(sourceId, targetId, label);
    setWorkspace((prev) =>
      prev ? { ...prev, connections: [...prev.connections, connection] } : prev
    );
  };

  const handleDeleteConnection = async (connId: string) => {
    await api.deleteConnection(connId);
    setWorkspace((prev) =>
      prev
        ? {
            ...prev,
            connections: prev.connections.filter((c) => c.id !== connId),
          }
        : prev
    );
  };

  const selectedTopic = useMemo(
    () => workspace?.topics.find((tp) => tp.id === selectedTopicId) ?? null,
    [workspace, selectedTopicId]
  );

  if (loading && !workspace) {
    return (
      <div className="min-h-screen bg-[#080B12] flex items-center justify-center p-6">
        <div className="liquid-glass rounded-2xl px-8 py-6 text-center space-y-2">
          <div className="font-display text-base font-medium text-[#F5F5F7]">
            Loading Digital Marketing Second Brain
          </div>
          <p className="text-xs text-[#A1A1AA]">Initializing knowledge universe and persistent storage...</p>
        </div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen bg-[#080B12] flex items-center justify-center p-6">
        <div className="max-w-md liquid-glass rounded-2xl border-rose-500/30 p-6 text-center space-y-4">
          <AlertCircle className="h-8 w-8 text-rose-400 mx-auto" />
          <div className="text-sm text-[#F5F5F7]">{error || 'Unable to load workspace.'}</div>
          <button
            type="button"
            onClick={loadWorkspace}
            className="liquid-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  const completedCount = workspace.topics.filter((t) => t.status === 'completed').length;

  return (
    <div className="relative min-h-screen flex bg-[#080B12] text-[#F5F5F7]">
      {/* Subtle ambient light layer for glass refraction (disabled on universe WebGL screen) */}
      {activeSection !== 'universe' && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 overflow-hidden"
        >
          <div
            className="absolute -top-40 left-1/4 h-[460px] w-[560px] rounded-full opacity-50 blur-[130px]"
            style={{ background: 'radial-gradient(circle, rgba(229,184,92,0.11) 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-[-140px] right-[-80px] h-[480px] w-[540px] rounded-full opacity-50 blur-[140px]"
            style={{ background: 'radial-gradient(circle, rgba(94,162,239,0.11) 0%, transparent 70%)' }}
          />
        </div>
      )}

      <Sidebar
        activeSection={activeSection}
        onSelectSection={(sec) => {
          if (sec !== 'notes') setSelectedTopicId(null);
          setActiveSection(sec);
        }}
        language={language}
        totalNotes={workspace.topics.length}
        completedTopics={completedCount}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="relative z-10 flex-1 flex flex-col min-w-0">
        <TopBar
          activeSection={activeSection}
          language={language}
          onToggleLanguage={handleToggleLanguage}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenNewTopic={() => {
            setSelectedTopicId(null);
            setActiveSection('notes');
            setCreateTopicModalOpen(true);
          }}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        <main key={activeSection} className="flex-1 min-w-0 animate-view-enter">
          {activeSection === 'home' && (
            <DashboardView
              profile={workspace.profile}
              categories={workspace.categories}
              topics={workspace.topics}
              studyLogs={workspace.studyLogs}
              language={language}
              onNavigate={(sec) => setActiveSection(sec)}
              onOpenTopic={handleOpenTopic}
              onOpenUniverseWithTopic={(tid, cid) => handleOpenUniverse(tid, cid)}
              onLogDailyCheckIn={async () => {
                await api.logStudy({
                  activityType: 'note_updated',
                  summary: 'Completed focused study check-in',
                  points: 3,
                });
                await loadWorkspace();
              }}
            />
          )}

          {activeSection === 'universe' && (
            <KnowledgeUniverseView
              categories={workspace.categories}
              topics={workspace.topics}
              connections={workspace.connections}
              language={language}
              initial2DMode={workspace.profile.prefer2DUniverse}
              initialSelectedCategoryId={universeCatId}
              initialSelectedTopicId={universeTopicId}
              onOpenTopicDetail={handleOpenTopic}
              onAskAiAboutTopic={(tp) => {
                setAiSeedTopic(tp);
                setActiveSection('ai');
              }}
              onUpdateTopicStatus={async (tid, status: LearningStatus) => {
                await handleUpdateTopic(tid, { status });
              }}
              onOpenAddTopicModal={() => {
                setSelectedTopicId(null);
                setActiveSection('notes');
                setCreateTopicModalOpen(true);
              }}
              onCreateConnection={handleCreateConnection}
            />
          )}

          {activeSection === 'categories' && (
            <CategoriesView
              categories={workspace.categories}
              topics={workspace.topics}
              language={language}
              onSelectCategoryTopics={(cid) => {
                setSelectedTopicId(null);
                setNotesCatFilter(cid);
                setActiveSection('notes');
              }}
              onInspectPlanetInUniverse={(cid) => handleOpenUniverse(null, cid)}
              onCreateCategory={async (payload) => {
                const { category } = await api.createCategory(payload);
                setWorkspace((prev) =>
                  prev ? { ...prev, categories: [...prev.categories, category] } : prev
                );
              }}
            />
          )}

          {activeSection === 'notes' &&
            (selectedTopic ? (
              <TopicDetailView
                topic={selectedTopic}
                category={workspace.categories.find((c) => c.id === selectedTopic.categoryId)}
                allTopics={workspace.topics}
                connections={workspace.connections}
                language={language}
                onBack={() => setSelectedTopicId(null)}
                onUpdateTopic={handleUpdateTopic}
                onDeleteTopic={handleDeleteTopic}
                onOpenTopic={handleOpenTopic}
                onCreateConnection={handleCreateConnection}
                onDeleteConnection={handleDeleteConnection}
                onLocateInUniverse={(tid) => handleOpenUniverse(tid, null)}
                onAskAiAboutTopic={(tp) => {
                  setAiSeedTopic(tp);
                  setActiveSection('ai');
                }}
              />
            ) : (
              <NotesWorkspaceView
                topics={workspace.topics}
                categories={workspace.categories}
                language={language}
                initialCategoryFilter={notesCatFilter}
                onOpenTopic={handleOpenTopic}
                onToggleFavorite={(tp) =>
                  handleUpdateTopic(tp.id, { isFavorite: !tp.isFavorite })
                }
                onCreateTopic={handleCreateTopic}
                createModalOpen={createTopicModalOpen}
                onSetCreateModalOpen={setCreateTopicModalOpen}
              />
            ))}

          {activeSection === 'learning' && (
            <LearningCenterView
              categories={workspace.categories}
              topics={workspace.topics}
              flashcards={workspace.flashcards}
              quizzes={workspace.quizzes}
              studyLogs={workspace.studyLogs}
              dailyGoal={workspace.profile.dailyGoal}
              language={language}
              onOpenTopic={handleOpenTopic}
              onReviewFlashcard={async (cardId, level) => {
                await api.reviewFlashcard(cardId, level);
                await loadWorkspace();
              }}
              onCreateFlashcard={async (payload) => {
                await api.createFlashcard(payload);
                await loadWorkspace();
              }}
              onSubmitQuizLog={async (summary, points) => {
                await api.logStudy({
                  activityType: 'quiz_completed',
                  summary,
                  points,
                });
                await loadWorkspace();
              }}
            />
          )}

          {activeSection === 'resources' && (
            <ResourceLibraryView
              resources={workspace.resources}
              categories={workspace.categories}
              language={language}
              onCreateResource={async (payload) => {
                await api.createResource(payload);
                await loadWorkspace();
              }}
              onDeleteResource={async (id) => {
                await api.deleteResource(id);
                await loadWorkspace();
              }}
            />
          )}

          {activeSection === 'ai' && (
            <AIAssistantView
              topics={workspace.topics}
              categories={workspace.categories}
              language={language}
              aiConfigured={workspace.aiConfigured}
              initialTopic={aiSeedTopic}
              onSaveGeneratedFlashcards={async (cards, topicId, categoryId) => {
                for (const c of cards) {
                  await api.createFlashcard({
                    topicId: topicId ?? null,
                    categoryId: categoryId || workspace.categories[0].id,
                    front: c.front,
                    back: c.back,
                    backKm: c.backKm,
                  });
                }
                await loadWorkspace();
              }}
              onSaveGeneratedQuiz={async (quizzes: Array<Omit<QuizQuestion, 'id'>>) => {
                for (const q of quizzes) {
                  await api.createQuiz(q);
                }
                await loadWorkspace();
              }}
            />
          )}

          {activeSection === 'settings' && (
            <SettingsView
              profile={workspace.profile}
              supabaseConfigured={workspace.supabaseConfigured}
              aiConfigured={workspace.aiConfigured}
              onUpdateSettings={async (updates) => {
                const { profile } = await api.updateSettings(updates);
                setWorkspace((prev) => (prev ? { ...prev, profile } : prev));
              }}
              onAuthChanged={loadWorkspace}
            />
          )}
        </main>
      </div>

      <GlobalSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        topics={workspace.topics}
        categories={workspace.categories}
        resources={workspace.resources}
        onSelectResult={handleSearchResult}
      />
    </div>
  );
}
