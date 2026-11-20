import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOrbitalPositions,
  computeAchievements,
  computeDashboardMetrics,
  computeStudyStreak,
  computeWeeklyPointsSeries,
  scoreQuizAttempt,
  searchKnowledgeBase,
  validateTopicInput,
} from './knowledgeLogic';
import type { Category, QuizQuestion, ResourceItem, StudyLog, Topic } from '../types/knowledge';

const sampleCategories: Category[] = [
  {
    id: 'cat-seo',
    slug: 'seo',
    name: 'SEO',
    nameKm: 'SEO',
    description: 'Search engine optimization',
    descriptionKm: 'ការបង្កើនប្រសិទ្ធភាពម៉ាស៊ីនស្វែងរក',
    color: '#5EA2EF',
    orbitRadius: 20,
    orbitAngle: 0,
    planetSize: 1.8,
    sortOrder: 1,
  },
  {
    id: 'cat-sem',
    slug: 'sem',
    name: 'SEM & Paid Advertising',
    nameKm: 'SEM និងការផ្សាយពាណិជ្ជកម្មបង់ប្រាក់',
    description: 'Paid search and display campaigns',
    descriptionKm: 'យុទ្ធនាការផ្សាយពាណិជ្ជកម្មបង់ប្រាក់',
    color: '#E5B85C',
    orbitRadius: 28,
    orbitAngle: Math.PI / 2,
    planetSize: 1.9,
    sortOrder: 2,
  },
];

const sampleTopics: Topic[] = [
  {
    id: 't1',
    categoryId: 'cat-seo',
    slug: 'keyword-research',
    title: 'Keyword Research',
    titleKm: 'ការស្រាវជ្រាវពាក្យគន្លឹះ',
    shortDefinition: 'Discovering high-intent search queries your audience uses.',
    simpleExplanation: 'Finding what people type into Google.',
    detailedExplanation: 'Deep analysis of search volume, intent, and keyword difficulty.',
    keyConcepts: ['Search Intent', 'Long-tail Keywords'],
    practicalExamples: ['Comparing transactional vs informational queries'],
    realWorldApplications: ['Building content clusters'],
    stepByStepGuide: ['Seed terms', 'Expand', 'Prioritize'],
    terminology: [{ term: 'Search Volume', definition: 'Monthly average searches' }],
    personalNotesHtml: '<p>Focus on commercial intent first.</p>',
    externalResources: [],
    referencesList: [],
    attachments: [],
    tags: ['search', 'research'],
    status: 'completed',
    isFavorite: true,
    lastViewedAt: '2026-11-19T10:00:00Z',
    createdAt: '2026-11-18T10:00:00Z',
    updatedAt: '2026-11-19T10:00:00Z',
  },
  {
    id: 't2',
    categoryId: 'cat-sem',
    slug: 'quality-score',
    title: 'Quality Score',
    titleKm: 'ពិន្ទុគុណភាព',
    shortDefinition: 'Google Ads diagnostic rating from 1 to 10 measuring ad relevance.',
    simpleExplanation: 'How relevant Google thinks your ad and landing page are.',
    detailedExplanation: 'Driven by expected CTR, ad relevance, and landing page experience.',
    keyConcepts: ['Expected CTR', 'Ad Relevance'],
    practicalExamples: ['Aligning ad headline with keyword'],
    realWorldApplications: ['Lowering CPC'],
    stepByStepGuide: ['Audit ad groups', 'Improve landing page speed'],
    terminology: [{ term: 'CPC', definition: 'Cost Per Click' }],
    personalNotesHtml: '<p>Higher quality score reduces ad costs.</p>',
    externalResources: [],
    referencesList: [],
    attachments: [],
    tags: ['google-ads', 'ppc'],
    status: 'learning',
    isFavorite: false,
    lastViewedAt: null,
    createdAt: '2026-11-19T08:00:00Z',
    updatedAt: '2026-11-19T08:00:00Z',
  },
];

test('computeDashboardMetrics calculates totals, goal progress, and category breakdown accurately', () => {
  const logs: StudyLog[] = [
    {
      id: 'l1',
      topicId: 't1',
      activityType: 'topic_completed',
      summary: 'Completed Keyword Research',
      points: 5,
      createdAt: '2026-11-19T12:00:00Z',
    },
    {
      id: 'l2',
      topicId: 't2',
      activityType: 'flashcard_review',
      summary: 'Reviewed Quality Score',
      points: 3,
      createdAt: '2026-11-19T14:00:00Z',
    },
  ];

  const metrics = computeDashboardMetrics(
    sampleTopics,
    sampleCategories,
    logs,
    4,
    new Date('2026-11-19T20:00:00Z')
  );

  assert.equal(metrics.totalNotes, 2);
  assert.equal(metrics.totalCategories, 2);
  assert.equal(metrics.completedTopics, 1);
  assert.equal(metrics.learningTopics, 1);
  assert.equal(metrics.notStartedTopics, 0);
  assert.equal(metrics.overallProgressPercent, 73); // (1 + 0.45) / 2 = 72.5 -> 73
  assert.equal(metrics.todayCompletedActions, 2);
  assert.equal(metrics.dailyGoalPercent, 50);
  assert.equal(metrics.weeklyStats.length, 7);
  assert.equal(metrics.weeklyStats[6].actions, 2);
});

test('searchKnowledgeBase ranks exact and prefix topic matches highest', () => {
  const resources: ResourceItem[] = [
    {
      id: 'r1',
      categoryId: 'cat-sem',
      title: 'Google Ads Quality Score Guide',
      url: 'https://support.google.com/google-ads',
      resourceType: 'guide',
      description: 'Official breakdown of Quality Score factors.',
      createdAt: '2026-11-19T00:00:00Z',
    },
  ];

  const results = searchKnowledgeBase('Quality Score', sampleTopics, sampleCategories, resources);
  assert.ok(results.length >= 2);
  assert.equal(results[0].type, 'topic');
  assert.equal(results[0].topicId, 't2');
});

test('validateTopicInput rejects empty or undersized required fields', () => {
  const bad = validateTopicInput({ title: 'A', categoryId: '', shortDefinition: 'short' });
  assert.equal(bad.valid, false);
  assert.equal(bad.errors.length, 3);

  const good = validateTopicInput({
    title: 'Conversion Rate Optimization',
    categoryId: 'cat-seo',
    shortDefinition: 'Systematic improvement of landing page conversion percentage.',
  });
  assert.equal(good.valid, true);
  assert.equal(good.errors.length, 0);
});

test('calculateOrbitalPositions creates deterministic planet and node coordinates', () => {
  const { planets, nodes } = calculateOrbitalPositions(sampleCategories, sampleTopics);
  assert.equal(planets.size, 2);
  assert.equal(nodes.size, 2);
  const p1 = planets.get('cat-seo')!;
  const n1 = nodes.get('t1')!;
  assert.ok(Math.hypot(p1.x, p1.z) > 15);
  assert.ok(Math.hypot(n1.x - p1.x, n1.z - p1.z) > 2);
});

test('scoreQuizAttempt grades answered questions accurately', () => {
  const questions: QuizQuestion[] = [
    {
      id: 'q1',
      topicId: 't1',
      categoryId: 'cat-seo',
      question: 'Which metric measures monthly search demand?',
      options: ['CTR', 'Search Volume', 'CPC', 'ROAS'],
      correctIndex: 1,
      explanation: 'Search Volume measures average monthly queries.',
    },
    {
      id: 'q2',
      topicId: 't2',
      categoryId: 'cat-sem',
      question: 'Quality Score scale runs from?',
      options: ['1-5', '1-10', '1-100', '0-1'],
      correctIndex: 1,
      explanation: 'Quality Score is scored 1 to 10.',
    },
  ];

  const result = scoreQuizAttempt(questions, { q1: 1, q2: 0 });
  assert.equal(result.total, 2);
  assert.equal(result.answered, 2);
  assert.equal(result.correct, 1);
  assert.equal(result.scorePercent, 50);
});

test('computeStudyStreak detects consecutive 7-day streaks and gap resets', () => {
  const sevenDayLogs: StudyLog[] = Array.from({ length: 7 }, (_, i) => ({
    id: `s-${i}`,
    topicId: null,
    activityType: 'note_updated',
    summary: `Day ${i + 1}`,
    points: 4,
    createdAt: `2026-11-${String(14 + i).padStart(2, '0')}T10:00:00Z`,
  }));

  const streak = computeStudyStreak(sevenDayLogs, new Date('2026-11-20T18:00:00Z'));
  assert.equal(streak.currentStreak, 7);
  assert.equal(streak.longestStreak, 7);
  assert.equal(streak.activeDaysCount, 7);
  assert.equal(streak.sevenDayUnlockedAt, '2026-11-20T10:00:00Z');

  // Gap between Nov 16 and Nov 19 resets currentStreak to 2 (Nov 19-20)
  const gappedLogs = sevenDayLogs.filter((_, idx) => idx !== 3 && idx !== 4);
  const gapped = computeStudyStreak(gappedLogs, new Date('2026-11-20T18:00:00Z'));
  assert.equal(gapped.currentStreak, 2);
  assert.equal(gapped.longestStreak, 3);
  assert.equal(gapped.sevenDayUnlockedAt, null);
});

test('computeAchievements unlocks 7-day streak and 100 topics learned milestones accurately', () => {
  const logs: StudyLog[] = [
    ...Array.from({ length: 7 }, (_, i) => ({
      id: `d-${i}`,
      topicId: null,
      activityType: 'flashcard_review' as const,
      summary: `Review ${i + 1}`,
      points: 8,
      createdAt: `2026-11-${String(14 + i).padStart(2, '0')}T08:00:00Z`,
    })),
    ...Array.from({ length: 100 }, (_, i) => ({
      id: `c-${i}`,
      topicId: `t-${i}`,
      activityType: 'topic_completed' as const,
      summary: `Completed topic ${i + 1}`,
      points: 5,
      createdAt: '2026-11-20T12:00:00Z',
    })),
  ];

  const summary = computeAchievements(logs, sampleTopics, new Date('2026-11-20T18:00:00Z'));
  assert.equal(summary.currentStreak, 7);
  assert.equal(summary.totalPoints, 556);
  assert.equal(summary.unlockedCount, summary.milestones.length);

  const streakBadge = summary.milestones.find((m) => m.id === 'streak-7-days')!;
  const topics100Badge = summary.milestones.find((m) => m.id === 'topics-100-learned')!;
  assert.equal(streakBadge.unlocked, true);
  assert.equal(streakBadge.progressPercent, 100);
  assert.equal(topics100Badge.unlocked, true);
  assert.equal(topics100Badge.current, 100);
});

test('computeWeeklyPointsSeries aggregates daily points over the trailing 7 UTC days', () => {
  const logs: StudyLog[] = [
    {
      id: 'w1',
      topicId: null,
      activityType: 'topic_completed',
      summary: 'Completed A',
      points: 5,
      createdAt: '2026-11-14T09:00:00Z',
    },
    {
      id: 'w2',
      topicId: null,
      activityType: 'quiz_completed',
      summary: 'Quiz B',
      points: 4,
      createdAt: '2026-11-18T10:00:00Z',
    },
    {
      id: 'w3',
      topicId: null,
      activityType: 'note_updated',
      summary: 'Note C',
      points: 3,
      createdAt: '2026-11-18T15:00:00Z',
    },
    {
      id: 'w4',
      topicId: null,
      activityType: 'topic_completed',
      summary: 'Completed Today',
      points: 8,
      createdAt: '2026-11-20T12:00:00Z',
    },
    {
      id: 'old',
      topicId: null,
      activityType: 'note_updated',
      summary: 'Outside 7-day window',
      points: 99,
      createdAt: '2026-11-10T12:00:00Z',
    },
  ];

  const weekly = computeWeeklyPointsSeries(logs, new Date('2026-11-20T18:00:00Z'));
  assert.equal(weekly.series.length, 7);
  assert.equal(weekly.series[0].date, '2026-11-14');
  assert.equal(weekly.series[0].points, 5);
  assert.equal(weekly.series[1].points, 0);
  assert.equal(weekly.series[4].date, '2026-11-18');
  assert.equal(weekly.series[4].points, 7);
  assert.equal(weekly.series[4].actions, 2);
  assert.equal(weekly.series[6].date, '2026-11-20');
  assert.equal(weekly.series[6].points, 8);
  assert.equal(weekly.series[6].isToday, true);
  assert.equal(weekly.totalWeeklyPoints, 20);
  assert.equal(weekly.dailyAveragePoints, 2.9);
  assert.equal(weekly.bestDay?.date, '2026-11-20');
});


