import type {
  Category,
  Flashcard,
  Language,
  QuizQuestion,
  ResourceItem,
  StudyLog,
  Topic,
  TopicConnection,
  UserProfile,
  WorkspaceData,
} from '../types/knowledge';

const TOKEN_STORAGE_KEY = 'dm_second_brain_token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage restrictions
  }
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data as T;
}

export const api = {
  getWorkspace: () => apiFetch<WorkspaceData>('/api/workspace'),

  login: async (email: string, password: string) => {
    const res = await apiFetch<{ token: string; profile: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(res.token);
    return res;
  },

  register: async (email: string, password: string, displayName: string) => {
    const res = await apiFetch<{ token: string; profile: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
    setAuthToken(res.token);
    return res;
  },

  logout: async () => {
    await apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }).catch(() => ({}));
    setAuthToken(null);
  },

  updateSettings: (
    updates: Partial<{
      displayName: string;
      roleTitle: string;
      language: Language;
      dailyGoal: number;
      prefer2DUniverse: boolean;
    }>
  ) =>
    apiFetch<{ profile: UserProfile }>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  createCategory: (payload: { name: string; nameKm?: string; description: string; color: string }) =>
    apiFetch<{ category: Category }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createTopic: (
    payload: Omit<Topic, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'lastViewedAt'>
  ) =>
    apiFetch<{ topic: Topic }>('/api/topics', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateTopic: (topicId: string, updates: Partial<Topic>) =>
    apiFetch<{ topic: Topic }>(`/api/topics/${topicId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  markTopicViewed: (topicId: string) =>
    apiFetch<{ ok: boolean }>(`/api/topics/${topicId}/view`, { method: 'POST' }),

  deleteTopic: (topicId: string) =>
    apiFetch<{ ok: boolean }>(`/api/topics/${topicId}`, { method: 'DELETE' }),

  createConnection: (sourceTopicId: string, targetTopicId: string, relationshipLabel: string) =>
    apiFetch<{ connection: TopicConnection }>('/api/connections', {
      method: 'POST',
      body: JSON.stringify({ sourceTopicId, targetTopicId, relationshipLabel }),
    }),

  deleteConnection: (connId: string) =>
    apiFetch<{ ok: boolean }>(`/api/connections/${connId}`, { method: 'DELETE' }),

  createFlashcard: (payload: {
    topicId?: string | null;
    categoryId: string;
    front: string;
    back: string;
    backKm?: string;
  }) =>
    apiFetch<{ flashcard: Flashcard }>('/api/flashcards', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  reviewFlashcard: (cardId: string, masteryLevel: number) =>
    apiFetch<{ ok: boolean }>(`/api/flashcards/${cardId}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ masteryLevel }),
    }),

  createQuiz: (payload: Omit<QuizQuestion, 'id'>) =>
    apiFetch<{ quiz: QuizQuestion }>('/api/quizzes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logStudy: (payload: {
    activityType: StudyLog['activityType'];
    summary: string;
    points: number;
    topicId?: string | null;
  }) =>
    apiFetch<{ log: StudyLog }>('/api/study-logs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createResource: (payload: Omit<ResourceItem, 'id' | 'createdAt'>) =>
    apiFetch<{ resource: ResourceItem }>('/api/resources', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteResource: (resId: string) =>
    apiFetch<{ ok: boolean }>(`/api/resources/${resId}`, { method: 'DELETE' }),

  getSupabaseSchema: () => apiFetch<{ sql: string }>('/api/supabase-schema'),

  aiAssist: (payload: {
    mode: string;
    prompt: string;
    topicTitle?: string;
    topicContext?: string;
    language: Language;
  }) =>
    apiFetch<{
      mode: string;
      text?: string;
      flashcards?: Array<{ front: string; back: string; backKm: string }>;
      quizzes?: Array<{
        question: string;
        options: string[];
        correctIndex: number;
        explanation: string;
      }>;
    }>('/api/ai/assist', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
