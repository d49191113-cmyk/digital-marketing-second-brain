export type LearningStatus = 'not_started' | 'learning' | 'completed';
export type Language = 'en' | 'km';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  roleTitle: string;
  language: Language;
  dailyGoal: number;
  prefer2DUniverse: boolean;
  isDemo: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  nameKm: string;
  description: string;
  descriptionKm: string;
  color: string;
  orbitRadius: number;
  orbitAngle: number;
  planetSize: number;
  sortOrder: number;
  isCustom?: boolean;
}

export interface TopicAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document' | 'link';
}

export interface TopicReference {
  title: string;
  url: string;
  source?: string;
}

export interface Topic {
  id: string;
  categoryId: string;
  slug: string;
  title: string;
  titleKm: string;
  shortDefinition: string;
  simpleExplanation: string;
  detailedExplanation: string;
  keyConcepts: string[];
  practicalExamples: string[];
  realWorldApplications: string[];
  stepByStepGuide: string[];
  terminology: Array<{ term: string; definition: string }>;
  personalNotesHtml: string;
  externalResources: TopicReference[];
  referencesList: string[];
  attachments: TopicAttachment[];
  tags: string[];
  status: LearningStatus;
  isFavorite: boolean;
  lastViewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TopicConnection {
  id: string;
  sourceTopicId: string;
  targetTopicId: string;
  relationshipLabel: string;
  createdAt: string;
}

export interface Flashcard {
  id: string;
  topicId: string | null;
  categoryId: string;
  front: string;
  back: string;
  backKm?: string;
  masteryLevel: number; // 0 to 5
  lastReviewedAt: string | null;
}

export interface QuizQuestion {
  id: string;
  topicId: string | null;
  categoryId: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  shortAnswerPrompt?: string;
  sampleShortAnswer?: string;
}

export interface ResourceItem {
  id: string;
  categoryId: string;
  topicId?: string | null;
  title: string;
  url: string;
  resourceType: 'guide' | 'tool' | 'template' | 'video' | 'article';
  description: string;
  createdAt: string;
}

export interface StudyLog {
  id: string;
  topicId: string | null;
  activityType: 'topic_completed' | 'flashcard_review' | 'quiz_completed' | 'note_updated';
  summary: string;
  points: number;
  createdAt: string;
}

export interface WorkspaceData {
  profile: UserProfile;
  categories: Category[];
  topics: Topic[];
  connections: TopicConnection[];
  flashcards: Flashcard[];
  quizzes: QuizQuestion[];
  resources: ResourceItem[];
  studyLogs: StudyLog[];
  aiConfigured: boolean;
  supabaseConfigured: boolean;
}

export interface CategoryProgressStat {
  categoryId: string;
  name: string;
  color: string;
  total: number;
  completed: number;
  learning: number;
  notStarted: number;
  progressPercent: number;
}

export interface DashboardMetrics {
  totalNotes: number;
  totalCategories: number;
  completedTopics: number;
  learningTopics: number;
  notStartedTopics: number;
  overallProgressPercent: number;
  todayCompletedActions: number;
  dailyGoalTarget: number;
  dailyGoalPercent: number;
  categoryBreakdown: CategoryProgressStat[];
  weeklyStats: Array<{ day: string; actions: number; minutes: number; points: number }>;
}

export interface WeeklyPointStat {
  date: string;
  day: string;
  points: number;
  actions: number;
  isToday: boolean;
}

export interface SearchResult {
  id: string;
  type: 'topic' | 'category' | 'resource' | 'tag';
  title: string;
  subtitle: string;
  categoryId?: string;
  topicId?: string;
  score: number;
}

export interface OrbitalPosition {
  id: string;
  x: number;
  y: number;
  z: number;
}

export interface AchievementMilestone {
  id: string;
  title: string;
  titleKm: string;
  description: string;
  descriptionKm: string;
  iconKey: 'flame' | 'trophy' | 'book' | 'sparkles' | 'brain' | 'compass';
  category: 'streak' | 'mastery' | 'consistency';
  current: number;
  target: number;
  progressPercent: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface AchievementSummary {
  currentStreak: number;
  longestStreak: number;
  activeDaysCount: number;
  totalPoints: number;
  unlockedCount: number;
  milestones: AchievementMilestone[];
}

