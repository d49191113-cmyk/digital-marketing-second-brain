import type {
  AchievementMilestone,
  AchievementSummary,
  Category,
  CategoryProgressStat,
  DashboardMetrics,
  OrbitalPosition,
  QuizQuestion,
  ResourceItem,
  SearchResult,
  StudyLog,
  Topic,
  WeeklyPointStat,
} from '../types/knowledge';

export function computeDashboardMetrics(
  topics: Topic[],
  categories: Category[],
  studyLogs: StudyLog[],
  dailyGoalTarget: number,
  referenceDate: Date = new Date()
): DashboardMetrics {
  const totalNotes = topics.length;
  const totalCategories = categories.length;
  const completedTopics = topics.filter((t) => t.status === 'completed').length;
  const learningTopics = topics.filter((t) => t.status === 'learning').length;
  const notStartedTopics = topics.filter((t) => t.status === 'not_started').length;
  const overallProgressPercent =
    totalNotes > 0 ? Math.round(((completedTopics + learningTopics * 0.45) / totalNotes) * 100) : 0;

  const todayIso = referenceDate.toISOString().slice(0, 10);
  const todayCompletedActions = studyLogs.filter((l) => l.createdAt.slice(0, 10) === todayIso).length;
  const safeGoal = Math.max(1, dailyGoalTarget || 3);
  const dailyGoalPercent = Math.min(100, Math.round((todayCompletedActions / safeGoal) * 100));

  const categoryBreakdown: CategoryProgressStat[] = categories.map((cat) => {
    const catTopics = topics.filter((t) => t.categoryId === cat.id);
    const completed = catTopics.filter((t) => t.status === 'completed').length;
    const learning = catTopics.filter((t) => t.status === 'learning').length;
    const notStarted = catTopics.filter((t) => t.status === 'not_started').length;
    const total = catTopics.length;
    const progressPercent =
      total > 0 ? Math.round(((completed + learning * 0.45) / total) * 100) : 0;
    return {
      categoryId: cat.id,
      name: cat.name,
      color: cat.color,
      total,
      completed,
      learning,
      notStarted,
      progressPercent,
    };
  });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyStats: Array<{ day: string; actions: number; minutes: number; points: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setUTCDate(d.getUTCDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const dayLogs = studyLogs.filter((l) => l.createdAt.slice(0, 10) === iso);
    const actions = dayLogs.length;
    const points = dayLogs.reduce((acc, item) => acc + (Number(item.points) || 0), 0);
    const minutes = dayLogs.reduce((acc, item) => acc + Math.max(5, item.points * 4), 0);
    weeklyStats.push({
      day: dayNames[d.getUTCDay()],
      actions,
      minutes,
      points,
    });
  }

  return {
    totalNotes,
    totalCategories,
    completedTopics,
    learningTopics,
    notStartedTopics,
    overallProgressPercent,
    todayCompletedActions,
    dailyGoalTarget: safeGoal,
    dailyGoalPercent,
    categoryBreakdown,
    weeklyStats,
  };
}

export function searchKnowledgeBase(
  query: string,
  topics: Topic[],
  categories: Category[],
  resources: ResourceItem[]
): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const results: SearchResult[] = [];

  for (const cat of categories) {
    const hay = `${cat.name} ${cat.nameKm} ${cat.description}`.toLowerCase();
    if (hay.includes(q)) {
      const score = cat.name.toLowerCase().startsWith(q) ? 110 : 85;
      results.push({
        id: `cat:${cat.id}`,
        type: 'category',
        title: cat.name,
        subtitle: cat.description,
        categoryId: cat.id,
        score,
      });
    }
  }

  for (const topic of topics) {
    const catName = categoryMap.get(topic.categoryId)?.name ?? 'Marketing';
    const titleLower = topic.title.toLowerCase();
    const defLower = topic.shortDefinition.toLowerCase();
    const notesLower = topic.personalNotesHtml.replace(/<[^>]+>/g, ' ').toLowerCase();
    const tagsLower = topic.tags.join(' ').toLowerCase();
    const termsLower = topic.terminology.map((t) => `${t.term} ${t.definition}`).join(' ').toLowerCase();

    let score = 0;
    if (titleLower === q) score += 150;
    else if (titleLower.startsWith(q)) score += 120;
    else if (titleLower.includes(q)) score += 100;
    if (topic.titleKm.toLowerCase().includes(q)) score += 95;
    if (defLower.includes(q)) score += 70;
    if (tagsLower.includes(q)) score += 65;
    if (termsLower.includes(q)) score += 50;
    if (notesLower.includes(q) || topic.detailedExplanation.toLowerCase().includes(q)) score += 40;

    if (score > 0) {
      results.push({
        id: `topic:${topic.id}`,
        type: 'topic',
        title: topic.title,
        subtitle: `${catName} · ${topic.shortDefinition}`,
        categoryId: topic.categoryId,
        topicId: topic.id,
        score,
      });
    }
  }

  for (const res of resources) {
    const hay = `${res.title} ${res.description} ${res.resourceType}`.toLowerCase();
    if (hay.includes(q)) {
      results.push({
        id: `res:${res.id}`,
        type: 'resource',
        title: res.title,
        subtitle: `${res.resourceType.toUpperCase()} · ${res.description}`,
        categoryId: res.categoryId,
        topicId: res.topicId ?? undefined,
        score: 55,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 24);
}

export interface TopicValidationInput {
  title: string;
  categoryId: string;
  shortDefinition: string;
}

export function validateTopicInput(input: TopicValidationInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!input.title || input.title.trim().length < 2) {
    errors.push('Topic title must be at least 2 characters.');
  }
  if (!input.categoryId || input.categoryId.trim().length === 0) {
    errors.push('A marketing category is required.');
  }
  if (!input.shortDefinition || input.shortDefinition.trim().length < 8) {
    errors.push('Short definition must be at least 8 characters.');
  }
  return { valid: errors.length === 0, errors };
}

export function calculateOrbitalPositions(
  categories: Category[],
  topics: Topic[]
): {
  planets: Map<string, OrbitalPosition>;
  nodes: Map<string, OrbitalPosition>;
} {
  const planets = new Map<string, OrbitalPosition>();
  const nodes = new Map<string, OrbitalPosition>();

  categories.forEach((cat, idx) => {
    const radius = cat.orbitRadius || 18 + idx * 3.5;
    const angle = cat.orbitAngle ?? (idx / Math.max(1, categories.length)) * Math.PI * 2;
    const yOffset = Math.sin(idx * 1.7) * 2.2;
    const px = Math.cos(angle) * radius;
    const pz = Math.sin(angle) * radius;
    planets.set(cat.id, { id: cat.id, x: px, y: yOffset, z: pz });

    const catTopics = topics.filter((t) => t.categoryId === cat.id);
    catTopics.forEach((topic, tIdx) => {
      const ring = Math.floor(tIdx / 7);
      const localRadius = (cat.planetSize || 1.8) * 1.9 + 1.8 + ring * 1.7;
      const localAngle = (tIdx / Math.max(1, Math.min(catTopics.length, 7))) * Math.PI * 2 + ring * 0.65;
      const tilt = ((tIdx % 3) - 1) * 0.75;
      nodes.set(topic.id, {
        id: topic.id,
        x: px + Math.cos(localAngle) * localRadius,
        y: yOffset + tilt + Math.sin(localAngle * 2) * 0.45,
        z: pz + Math.sin(localAngle) * localRadius,
      });
    });
  });

  return { planets, nodes };
}

export function scoreQuizAttempt(
  questions: QuizQuestion[],
  selectedAnswers: Record<string, number>
): { total: number; answered: number; correct: number; scorePercent: number } {
  const total = questions.length;
  let answered = 0;
  let correct = 0;
  for (const q of questions) {
    if (selectedAnswers[q.id] !== undefined) {
      answered += 1;
      if (selectedAnswers[q.id] === q.correctIndex) {
        correct += 1;
      }
    }
  }
  const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0;
  return { total, answered, correct, scorePercent };
}

function parseIsoDayIndex(isoDateStr: string): number | null {
  const dayPart = isoDateStr.slice(0, 10);
  const parts = dayPart.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  return Math.floor(Date.UTC(parts[0], parts[1] - 1, parts[2]) / 86_400_000);
}

export function computeStudyStreak(
  studyLogs: StudyLog[],
  referenceDate: Date = new Date()
): {
  currentStreak: number;
  longestStreak: number;
  activeDaysCount: number;
  sevenDayUnlockedAt: string | null;
} {
  if (studyLogs.length === 0) {
    return { currentStreak: 0, longestStreak: 0, activeDaysCount: 0, sevenDayUnlockedAt: null };
  }

  const dayToFirstCreatedAt = new Map<number, string>();
  const sortedLogs = [...studyLogs].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  for (const log of sortedLogs) {
    const idx = parseIsoDayIndex(log.createdAt);
    if (idx !== null && !dayToFirstCreatedAt.has(idx)) {
      dayToFirstCreatedAt.set(idx, log.createdAt);
    }
  }

  const sortedDays = [...dayToFirstCreatedAt.keys()].sort((a, b) => a - b);
  if (sortedDays.length === 0) {
    return { currentStreak: 0, longestStreak: 0, activeDaysCount: 0, sevenDayUnlockedAt: null };
  }

  let longestStreak = 1;
  let run = 1;
  let sevenDayUnlockedAt: string | null = null;

  for (let i = 1; i < sortedDays.length; i++) {
    if (sortedDays[i] === sortedDays[i - 1] + 1) {
      run += 1;
      if (run > longestStreak) longestStreak = run;
      if (run === 7 && !sevenDayUnlockedAt) {
        sevenDayUnlockedAt = dayToFirstCreatedAt.get(sortedDays[i]) ?? null;
      }
    } else {
      run = 1;
    }
  }

  const todayIdx = Math.floor(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate()
    ) / 86_400_000
  );
  const daySet = new Set(sortedDays);
  let cursor = daySet.has(todayIdx) ? todayIdx : daySet.has(todayIdx - 1) ? todayIdx - 1 : -1;
  let currentStreak = 0;
  while (cursor !== -1 && daySet.has(cursor)) {
    currentStreak += 1;
    cursor -= 1;
  }

  return {
    currentStreak,
    longestStreak,
    activeDaysCount: sortedDays.length,
    sevenDayUnlockedAt,
  };
}

export function computeAchievements(
  studyLogs: StudyLog[],
  topics: Topic[] = [],
  referenceDate: Date = new Date()
): AchievementSummary {
  const sortedLogs = [...studyLogs].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const streak = computeStudyStreak(sortedLogs, referenceDate);

  const totalPoints = sortedLogs.reduce((sum, l) => sum + (Number(l.points) || 0), 0);
  const completedFromTopics = topics.filter((t) => t.status === 'completed').length;
  const completedLogs = sortedLogs.filter((l) => l.activityType === 'topic_completed');
  const completedCount = Math.max(completedFromTopics, completedLogs.length);

  const recallLogs = sortedLogs.filter(
    (l) => l.activityType === 'flashcard_review' || l.activityType === 'quiz_completed'
  );

  // Find exact log timestamp when cumulative XP reached 50
  let xpRunning = 0;
  let xp50UnlockedAt: string | null = null;
  for (const log of sortedLogs) {
    xpRunning += Number(log.points) || 0;
    if (xpRunning >= 50 && !xp50UnlockedAt) {
      xp50UnlockedAt = log.createdAt;
      break;
    }
  }

  const milestones: AchievementMilestone[] = [
    {
      id: 'first-study-session',
      title: 'First Spark',
      titleKm: 'ចំណុចចាប់ផ្តើមដំបូង',
      description: 'Record your first study activity in your Second Brain.',
      descriptionKm: 'កត់ត្រាសកម្មភាពសិក្សាដំបូងរបស់អ្នក។',
      iconKey: 'sparkles',
      category: 'consistency',
      current: Math.min(sortedLogs.length, 1),
      target: 1,
      progressPercent: sortedLogs.length >= 1 ? 100 : 0,
      unlocked: sortedLogs.length >= 1,
      unlockedAt: sortedLogs[0]?.createdAt ?? null,
    },
    {
      id: 'streak-7-days',
      title: '7-Day Streak',
      titleKm: 'សិក្សាជាប់គ្នា ៧ ថ្ងៃ',
      description: 'Log learning sessions across 7 consecutive days.',
      descriptionKm: 'បន្តសកម្មភាពសិក្សារៀងរាល់ថ្ងៃរយៈពេល ៧ ថ្ងៃជាប់គ្នា។',
      iconKey: 'flame',
      category: 'streak',
      current: Math.min(streak.longestStreak, 7),
      target: 7,
      progressPercent: Math.min(100, Math.round((streak.longestStreak / 7) * 100)),
      unlocked: streak.longestStreak >= 7,
      unlockedAt: streak.sevenDayUnlockedAt,
    },
    {
      id: 'recall-scholar-5',
      title: 'Active Recall Scholar',
      titleKm: 'អ្នកជំនាញរំលឹកចងចាំ',
      description: 'Complete 5 flashcard reviews or knowledge quizzes.',
      descriptionKm: 'បញ្ចប់ការរំលឹកកាតសិក្សា ឬតេស្តសាកល្បងចំនួន ៥ ដង។',
      iconKey: 'brain',
      category: 'consistency',
      current: Math.min(recallLogs.length, 5),
      target: 5,
      progressPercent: Math.min(100, Math.round((recallLogs.length / 5) * 100)),
      unlocked: recallLogs.length >= 5,
      unlockedAt: recallLogs[4]?.createdAt ?? null,
    },
    {
      id: 'topics-25-learned',
      title: '25 Topics Learned',
      titleKm: 'បានរៀន ២៥ ប្រធានបទ',
      description: 'Mark 25 digital marketing topics as completed.',
      descriptionKm: 'បញ្ចប់ការសិក្សាប្រធានបទ Digital Marketing ចំនួន ២៥។',
      iconKey: 'compass',
      category: 'mastery',
      current: Math.min(completedCount, 25),
      target: 25,
      progressPercent: Math.min(100, Math.round((completedCount / 25) * 100)),
      unlocked: completedCount >= 25,
      unlockedAt:
        completedCount >= 25
          ? (completedLogs[24]?.createdAt ?? completedLogs[completedLogs.length - 1]?.createdAt ?? null)
          : null,
    },
    {
      id: 'xp-50-architect',
      title: 'Knowledge Architect',
      titleKm: 'ស្ថាបត្យករចំណេះដឹង (50 XP)',
      description: 'Earn 50 study points across notes, reviews, and quizzes.',
      descriptionKm: 'សន្សំពិន្ទុសិក្សាឱ្យបាន ៥០ XP ពីកំណត់ត្រា និងការអនុវត្ត។',
      iconKey: 'trophy',
      category: 'consistency',
      current: Math.min(totalPoints, 50),
      target: 50,
      progressPercent: Math.min(100, Math.round((totalPoints / 50) * 100)),
      unlocked: totalPoints >= 50,
      unlockedAt: xp50UnlockedAt,
    },
    {
      id: 'topics-100-learned',
      title: '100 Topics Learned',
      titleKm: 'បានរៀន ១០០ ប្រធានបទ',
      description: 'Master 100 digital marketing concepts across your universe.',
      descriptionKm: 'សម្រេចការសិក្សាប្រធានបទចំនួន ១០០ ក្នុងចក្រវាឡចំណេះដឹង។',
      iconKey: 'book',
      category: 'mastery',
      current: Math.min(completedCount, 100),
      target: 100,
      progressPercent: Math.min(100, Math.round((completedCount / 100) * 100)),
      unlocked: completedCount >= 100,
      unlockedAt: completedCount >= 100 ? (completedLogs[99]?.createdAt ?? null) : null,
    },
  ];

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    activeDaysCount: streak.activeDaysCount,
    totalPoints,
    unlockedCount: milestones.filter((m) => m.unlocked).length,
    milestones,
  };
}

export function computeWeeklyPointsSeries(
  studyLogs: StudyLog[],
  referenceDate: Date = new Date()
): {
  series: WeeklyPointStat[];
  totalWeeklyPoints: number;
  dailyAveragePoints: number;
  bestDay: WeeklyPointStat | null;
} {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayIso = referenceDate.toISOString().slice(0, 10);
  const series: WeeklyPointStat[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setUTCDate(d.getUTCDate() - i);
    const dateIso = d.toISOString().slice(0, 10);
    const dayLogs = studyLogs.filter((l) => l.createdAt.slice(0, 10) === dateIso);
    const points = dayLogs.reduce((sum, item) => sum + (Number(item.points) || 0), 0);
    series.push({
      date: dateIso,
      day: dayNames[d.getUTCDay()],
      points,
      actions: dayLogs.length,
      isToday: dateIso === todayIso,
    });
  }

  const totalWeeklyPoints = series.reduce((sum, entry) => sum + entry.points, 0);
  const dailyAveragePoints = Math.round((totalWeeklyPoints / 7) * 10) / 10;
  const bestDay = series.reduce<WeeklyPointStat | null>(
    (best, entry) => (!best || entry.points > best.points ? entry : best),
    null
  );

  return {
    series,
    totalWeeklyPoints,
    dailyAveragePoints,
    bestDay: bestDay && bestDay.points > 0 ? bestDay : null,
  };
}


