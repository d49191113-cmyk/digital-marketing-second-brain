import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import {
  SEED_CATEGORIES,
  SEED_CONNECTIONS,
  SEED_FLASHCARDS,
  SEED_QUIZZES,
  SEED_RESOURCES,
  SEED_STUDY_LOGS,
  SEED_TOPICS,
} from '../src/data/seedLibrary';
import type {
  Category,
  Flashcard,
  Language,
  LearningStatus,
  QuizQuestion,
  ResourceItem,
  StudyLog,
  Topic,
  TopicConnection,
  UserProfile,
  WorkspaceData,
} from '../src/types/knowledge';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'second_brain.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  create table if not exists users (
    id text primary key,
    email text unique not null,
    password_hash text not null,
    is_demo integer not null default 0,
    created_at text not null
  );

  create table if not exists sessions (
    token text primary key,
    user_id text not null references users(id) on delete cascade,
    created_at text not null
  );

  create table if not exists profiles (
    user_id text primary key references users(id) on delete cascade,
    display_name text not null,
    role_title text not null,
    language text not null default 'en',
    daily_goal integer not null default 3,
    prefer_2d_universe integer not null default 0,
    updated_at text not null
  );

  create table if not exists categories (
    id text not null,
    user_id text not null references users(id) on delete cascade,
    slug text not null,
    name text not null,
    name_km text not null default '',
    description text not null default '',
    description_km text not null default '',
    color text not null default '#E5B85C',
    orbit_radius real not null default 20,
    orbit_angle real not null default 0,
    planet_size real not null default 1.8,
    sort_order integer not null default 0,
    is_custom integer not null default 0,
    primary key (user_id, id)
  );

  create table if not exists topics (
    id text not null,
    user_id text not null references users(id) on delete cascade,
    category_id text not null,
    slug text not null,
    title text not null,
    title_km text not null default '',
    short_definition text not null,
    simple_explanation text not null default '',
    detailed_explanation text not null default '',
    key_concepts text not null default '[]',
    practical_examples text not null default '[]',
    real_world_applications text not null default '[]',
    step_by_step_guide text not null default '[]',
    terminology text not null default '[]',
    external_resources text not null default '[]',
    references_list text not null default '[]',
    attachments text not null default '[]',
    last_viewed_at text,
    created_at text not null,
    updated_at text not null,
    primary key (user_id, id)
  );

  create table if not exists notes (
    user_id text not null,
    topic_id text not null,
    content_html text not null default '',
    updated_at text not null,
    primary key (user_id, topic_id)
  );

  create table if not exists topic_connections (
    id text not null,
    user_id text not null references users(id) on delete cascade,
    source_topic_id text not null,
    target_topic_id text not null,
    relationship_label text not null default 'Related to',
    created_at text not null,
    primary key (user_id, id)
  );

  create table if not exists tags (
    id text primary key,
    user_id text not null references users(id) on delete cascade,
    name text not null,
    unique (user_id, name)
  );

  create table if not exists topic_tags (
    user_id text not null,
    topic_id text not null,
    tag_id text not null references tags(id) on delete cascade,
    primary key (user_id, topic_id, tag_id)
  );

  create table if not exists learning_progress (
    user_id text not null,
    topic_id text not null,
    status text not null default 'not_started',
    updated_at text not null,
    primary key (user_id, topic_id)
  );

  create table if not exists favorites (
    user_id text not null,
    topic_id text not null,
    created_at text not null,
    primary key (user_id, topic_id)
  );

  create table if not exists flashcards (
    id text not null,
    user_id text not null references users(id) on delete cascade,
    topic_id text,
    category_id text not null,
    front text not null,
    back text not null,
    back_km text,
    mastery_level integer not null default 0,
    last_reviewed_at text,
    primary key (user_id, id)
  );

  create table if not exists quizzes (
    id text not null,
    user_id text not null references users(id) on delete cascade,
    topic_id text,
    category_id text not null,
    question text not null,
    options text not null,
    correct_index integer not null,
    explanation text not null,
    short_answer_prompt text,
    sample_short_answer text,
    primary key (user_id, id)
  );

  create table if not exists resources (
    id text not null,
    user_id text not null references users(id) on delete cascade,
    category_id text not null,
    topic_id text,
    title text not null,
    url text not null,
    resource_type text not null,
    description text not null default '',
    created_at text not null,
    primary key (user_id, id)
  );

  create table if not exists study_logs (
    id text not null,
    user_id text not null references users(id) on delete cascade,
    topic_id text,
    activity_type text not null,
    summary text not null,
    points integer not null default 2,
    created_at text not null,
    primary key (user_id, id)
  );
`);

export const DEMO_USER_ID = 'demo-user';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'));
}

function setTopicTagsForUser(userId: string, topicId: string, tags: string[]): void {
  db.prepare('delete from topic_tags where user_id = ? and topic_id = ?').run(userId, topicId);
  const insertTag = db.prepare(
    'insert or ignore into tags (id, user_id, name) values (?, ?, ?)'
  );
  const selectTag = db.prepare('select id from tags where user_id = ? and name = ?');
  const linkTag = db.prepare(
    'insert or ignore into topic_tags (user_id, topic_id, tag_id) values (?, ?, ?)'
  );
  for (const raw of tags) {
    const clean = raw.trim().toLowerCase();
    if (!clean) continue;
    insertTag.run(`tag-${crypto.randomUUID()}`, userId, clean);
    const row = selectTag.get(userId, clean) as { id: string } | undefined;
    if (row) {
      linkTag.run(userId, topicId, row.id);
    }
  }
}

export function seedUserWorkspace(userId: string): void {
  const existing = db
    .prepare('select count(*) as cnt from categories where user_id = ?')
    .get(userId) as { cnt: number };
  if (existing.cnt > 0) return;

  const insertCat = db.prepare(`
    insert into categories (
      id, user_id, slug, name, name_km, description, description_km,
      color, orbit_radius, orbit_angle, planet_size, sort_order, is_custom
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTopic = db.prepare(`
    insert into topics (
      id, user_id, category_id, slug, title, title_km, short_definition,
      simple_explanation, detailed_explanation, key_concepts, practical_examples,
      real_world_applications, step_by_step_guide, terminology, external_resources,
      references_list, attachments, last_viewed_at, created_at, updated_at
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertNote = db.prepare(
    'insert into notes (user_id, topic_id, content_html, updated_at) values (?, ?, ?, ?)'
  );
  const insertProgress = db.prepare(
    'insert into learning_progress (user_id, topic_id, status, updated_at) values (?, ?, ?, ?)'
  );
  const insertFav = db.prepare(
    'insert into favorites (user_id, topic_id, created_at) values (?, ?, ?)'
  );
  const insertConn = db.prepare(`
    insert into topic_connections (id, user_id, source_topic_id, target_topic_id, relationship_label, created_at)
    values (?, ?, ?, ?, ?, ?)
  `);
  const insertFlashcard = db.prepare(`
    insert into flashcards (id, user_id, topic_id, category_id, front, back, back_km, mastery_level, last_reviewed_at)
    values (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertQuiz = db.prepare(`
    insert into quizzes (
      id, user_id, topic_id, category_id, question, options, correct_index,
      explanation, short_answer_prompt, sample_short_answer
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertResource = db.prepare(`
    insert into resources (id, user_id, category_id, topic_id, title, url, resource_type, description, created_at)
    values (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertLog = db.prepare(`
    insert into study_logs (id, user_id, topic_id, activity_type, summary, points, created_at)
    values (?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    for (const c of SEED_CATEGORIES) {
      insertCat.run(
        c.id,
        userId,
        c.slug,
        c.name,
        c.nameKm,
        c.description,
        c.descriptionKm,
        c.color,
        c.orbitRadius,
        c.orbitAngle,
        c.planetSize,
        c.sortOrder,
        c.isCustom ? 1 : 0
      );
    }

    for (const t of SEED_TOPICS) {
      insertTopic.run(
        t.id,
        userId,
        t.categoryId,
        t.slug,
        t.title,
        t.titleKm,
        t.shortDefinition,
        t.simpleExplanation,
        t.detailedExplanation,
        JSON.stringify(t.keyConcepts),
        JSON.stringify(t.practicalExamples),
        JSON.stringify(t.realWorldApplications),
        JSON.stringify(t.stepByStepGuide),
        JSON.stringify(t.terminology),
        JSON.stringify(t.externalResources),
        JSON.stringify(t.referencesList),
        JSON.stringify(t.attachments),
        t.lastViewedAt,
        t.createdAt,
        t.updatedAt
      );
      insertNote.run(userId, t.id, t.personalNotesHtml, t.updatedAt);
      insertProgress.run(userId, t.id, t.status, t.updatedAt);
      if (t.isFavorite) {
        insertFav.run(userId, t.id, t.updatedAt);
      }
      setTopicTagsForUser(userId, t.id, t.tags);
    }

    for (const conn of SEED_CONNECTIONS) {
      insertConn.run(
        conn.id,
        userId,
        conn.sourceTopicId,
        conn.targetTopicId,
        conn.relationshipLabel,
        conn.createdAt
      );
    }

    for (const fc of SEED_FLASHCARDS) {
      insertFlashcard.run(
        fc.id,
        userId,
        fc.topicId,
        fc.categoryId,
        fc.front,
        fc.back,
        fc.backKm ?? null,
        fc.masteryLevel,
        fc.lastReviewedAt
      );
    }

    for (const q of SEED_QUIZZES) {
      insertQuiz.run(
        q.id,
        userId,
        q.topicId,
        q.categoryId,
        q.question,
        JSON.stringify(q.options),
        q.correctIndex,
        q.explanation,
        q.shortAnswerPrompt ?? null,
        q.sampleShortAnswer ?? null
      );
    }

    for (const r of SEED_RESOURCES) {
      insertResource.run(
        r.id,
        userId,
        r.categoryId,
        r.topicId ?? null,
        r.title,
        r.url,
        r.resourceType,
        r.description,
        r.createdAt
      );
    }

    const today = new Date().toISOString();
    SEED_STUDY_LOGS.forEach((log, index) => {
      // Shift recent logs relative to current server date so weekly charts always look alive
      const d = new Date();
      d.setDate(d.getDate() - Math.max(0, SEED_STUDY_LOGS.length - 1 - index));
      const ts = index === SEED_STUDY_LOGS.length - 1 ? today : d.toISOString();
      insertLog.run(log.id, userId, log.topicId, log.activityType, log.summary, log.points, ts);
    });
  });

  tx();
}

export function ensureDemoUser(): void {
  const existing = db.prepare('select id from users where id = ?').get(DEMO_USER_ID);
  const now = new Date().toISOString();
  if (!existing) {
    db.prepare(
      'insert into users (id, email, password_hash, is_demo, created_at) values (?, ?, ?, 1, ?)'
    ).run(DEMO_USER_ID, 'explorer@secondbrain.local', hashPassword('demo-workspace'), now);

    db.prepare(
      'insert into profiles (user_id, display_name, role_title, language, daily_goal, prefer_2d_universe, updated_at) values (?, ?, ?, ?, ?, ?, ?)'
    ).run(DEMO_USER_ID, 'Alex Chen', 'Digital Marketing Strategist', 'en', 3, 0, now);
  }
  seedUserWorkspace(DEMO_USER_ID);
}

ensureDemoUser();

export function resolveUserFromToken(token?: string | null): string {
  if (!token) return DEMO_USER_ID;
  const row = db
    .prepare('select user_id from sessions where token = ?')
    .get(token) as { user_id: string } | undefined;
  return row?.user_id ?? DEMO_USER_ID;
}

export function registerUser(email: string, password: string, displayName: string): {
  token: string;
  profile: UserProfile;
} {
  const normalized = email.trim().toLowerCase();
  const existing = db.prepare('select id from users where email = ?').get(normalized);
  if (existing) {
    throw new Error('An account with that email already exists.');
  }
  const userId = `user-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  db.prepare(
    'insert into users (id, email, password_hash, is_demo, created_at) values (?, ?, ?, 0, ?)'
  ).run(userId, normalized, hashPassword(password), now);

  db.prepare(
    'insert into profiles (user_id, display_name, role_title, language, daily_goal, prefer_2d_universe, updated_at) values (?, ?, ?, ?, ?, ?, ?)'
  ).run(userId, displayName.trim() || 'Marketing Explorer', 'Digital Marketing Strategist', 'en', 3, 0, now);

  seedUserWorkspace(userId);
  const token = crypto.randomBytes(24).toString('hex');
  db.prepare('insert into sessions (token, user_id, created_at) values (?, ?, ?)').run(
    token,
    userId,
    now
  );
  return { token, profile: getProfile(userId) };
}

export function loginUser(email: string, password: string): {
  token: string;
  profile: UserProfile;
} {
  const normalized = email.trim().toLowerCase();
  const user = db
    .prepare('select id, password_hash from users where email = ?')
    .get(normalized) as { id: string; password_hash: string } | undefined;

  if (!user || !verifyPassword(password, user.password_hash)) {
    throw new Error('Invalid email or password.');
  }
  const token = crypto.randomBytes(24).toString('hex');
  db.prepare('insert into sessions (token, user_id, created_at) values (?, ?, ?)').run(
    token,
    user.id,
    new Date().toISOString()
  );
  return { token, profile: getProfile(user.id) };
}

export function logoutSession(token?: string | null): void {
  if (token) {
    db.prepare('delete from sessions where token = ?').run(token);
  }
}

export function getProfile(userId: string): UserProfile {
  const row = db
    .prepare(
      `select u.id, u.email, u.is_demo, p.display_name, p.role_title, p.language, p.daily_goal, p.prefer_2d_universe
       from users u join profiles p on u.id = p.user_id where u.id = ?`
    )
    .get(userId) as
    | {
        id: string;
        email: string;
        is_demo: number;
        display_name: string;
        role_title: string;
        language: Language;
        daily_goal: number;
        prefer_2d_universe: number;
      }
    | undefined;

  if (!row) {
    ensureDemoUser();
    return getProfile(DEMO_USER_ID);
  }

  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    roleTitle: row.role_title,
    language: row.language,
    dailyGoal: row.daily_goal,
    prefer2DUniverse: Boolean(row.prefer_2d_universe),
    isDemo: Boolean(row.is_demo),
  };
}

export function updateProfileSettings(
  userId: string,
  updates: Partial<{
    displayName: string;
    roleTitle: string;
    language: Language;
    dailyGoal: number;
    prefer2DUniverse: boolean;
  }>
): UserProfile {
  const current = getProfile(userId);
  const next = {
    displayName: updates.displayName ?? current.displayName,
    roleTitle: updates.roleTitle ?? current.roleTitle,
    language: updates.language ?? current.language,
    dailyGoal: updates.dailyGoal ?? current.dailyGoal,
    prefer2DUniverse:
      updates.prefer2DUniverse !== undefined ? updates.prefer2DUniverse : current.prefer2DUniverse,
  };
  db.prepare(
    `update profiles set display_name = ?, role_title = ?, language = ?, daily_goal = ?, prefer_2d_universe = ?, updated_at = ?
     where user_id = ?`
  ).run(
    next.displayName,
    next.roleTitle,
    next.language,
    next.dailyGoal,
    next.prefer2DUniverse ? 1 : 0,
    new Date().toISOString(),
    userId
  );
  return getProfile(userId);
}

export function getWorkspaceData(userId: string): WorkspaceData {
  const profile = getProfile(userId);

  const catRows = db
    .prepare('select * from categories where user_id = ? order by sort_order asc, name asc')
    .all(userId) as Array<Record<string, unknown>>;

  const categories: Category[] = catRows.map((r) => ({
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    nameKm: String(r.name_km ?? ''),
    description: String(r.description ?? ''),
    descriptionKm: String(r.description_km ?? ''),
    color: String(r.color ?? '#E5B85C'),
    orbitRadius: Number(r.orbit_radius ?? 20),
    orbitAngle: Number(r.orbit_angle ?? 0),
    planetSize: Number(r.planet_size ?? 1.8),
    sortOrder: Number(r.sort_order ?? 0),
    isCustom: Boolean(r.is_custom),
  }));

  const topicRows = db
    .prepare(
      `select t.*, coalesce(n.content_html, '') as note_html,
              coalesce(lp.status, 'not_started') as learning_status,
              case when f.topic_id is not null then 1 else 0 end as is_fav
       from topics t
       left join notes n on n.user_id = t.user_id and n.topic_id = t.id
       left join learning_progress lp on lp.user_id = t.user_id and lp.topic_id = t.id
       left join favorites f on f.user_id = t.user_id and f.topic_id = t.id
       where t.user_id = ?
       order by t.created_at asc`
    )
    .all(userId) as Array<Record<string, unknown>>;

  const tagRows = db
    .prepare(
      `select tt.topic_id, tg.name from topic_tags tt
       join tags tg on tg.id = tt.tag_id
       where tt.user_id = ?`
    )
    .all(userId) as Array<{ topic_id: string; name: string }>;

  const tagMap = new Map<string, string[]>();
  for (const row of tagRows) {
    const list = tagMap.get(row.topic_id) ?? [];
    list.push(row.name);
    tagMap.set(row.topic_id, list);
  }

  const topics: Topic[] = topicRows.map((r) => ({
    id: String(r.id),
    categoryId: String(r.category_id),
    slug: String(r.slug),
    title: String(r.title),
    titleKm: String(r.title_km ?? ''),
    shortDefinition: String(r.short_definition),
    simpleExplanation: String(r.simple_explanation ?? ''),
    detailedExplanation: String(r.detailed_explanation ?? ''),
    keyConcepts: JSON.parse(String(r.key_concepts || '[]')),
    practicalExamples: JSON.parse(String(r.practical_examples || '[]')),
    realWorldApplications: JSON.parse(String(r.real_world_applications || '[]')),
    stepByStepGuide: JSON.parse(String(r.step_by_step_guide || '[]')),
    terminology: JSON.parse(String(r.terminology || '[]')),
    personalNotesHtml: String(r.note_html ?? ''),
    externalResources: JSON.parse(String(r.external_resources || '[]')),
    referencesList: JSON.parse(String(r.references_list || '[]')),
    attachments: JSON.parse(String(r.attachments || '[]')),
    tags: tagMap.get(String(r.id)) ?? [],
    status: String(r.learning_status || 'not_started') as LearningStatus,
    isFavorite: Boolean(r.is_fav),
    lastViewedAt: r.last_viewed_at ? String(r.last_viewed_at) : null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  }));

  const connRows = db
    .prepare('select * from topic_connections where user_id = ?')
    .all(userId) as Array<Record<string, unknown>>;
  const connections: TopicConnection[] = connRows.map((r) => ({
    id: String(r.id),
    sourceTopicId: String(r.source_topic_id),
    targetTopicId: String(r.target_topic_id),
    relationshipLabel: String(r.relationship_label),
    createdAt: String(r.created_at),
  }));

  const fcRows = db
    .prepare('select * from flashcards where user_id = ?')
    .all(userId) as Array<Record<string, unknown>>;
  const flashcards: Flashcard[] = fcRows.map((r) => ({
    id: String(r.id),
    topicId: r.topic_id ? String(r.topic_id) : null,
    categoryId: String(r.category_id),
    front: String(r.front),
    back: String(r.back),
    backKm: r.back_km ? String(r.back_km) : undefined,
    masteryLevel: Number(r.mastery_level ?? 0),
    lastReviewedAt: r.last_reviewed_at ? String(r.last_reviewed_at) : null,
  }));

  const qRows = db
    .prepare('select * from quizzes where user_id = ?')
    .all(userId) as Array<Record<string, unknown>>;
  const quizzes: QuizQuestion[] = qRows.map((r) => ({
    id: String(r.id),
    topicId: r.topic_id ? String(r.topic_id) : null,
    categoryId: String(r.category_id),
    question: String(r.question),
    options: JSON.parse(String(r.options || '[]')),
    correctIndex: Number(r.correct_index ?? 0),
    explanation: String(r.explanation ?? ''),
    shortAnswerPrompt: r.short_answer_prompt ? String(r.short_answer_prompt) : undefined,
    sampleShortAnswer: r.sample_short_answer ? String(r.sample_short_answer) : undefined,
  }));

  const resRows = db
    .prepare('select * from resources where user_id = ? order by created_at desc')
    .all(userId) as Array<Record<string, unknown>>;
  const resources: ResourceItem[] = resRows.map((r) => ({
    id: String(r.id),
    categoryId: String(r.category_id),
    topicId: r.topic_id ? String(r.topic_id) : null,
    title: String(r.title),
    url: String(r.url),
    resourceType: String(r.resource_type) as ResourceItem['resourceType'],
    description: String(r.description ?? ''),
    createdAt: String(r.created_at),
  }));

  const logRows = db
    .prepare('select * from study_logs where user_id = ? order by created_at desc limit 50')
    .all(userId) as Array<Record<string, unknown>>;
  const studyLogs: StudyLog[] = logRows.map((r) => ({
    id: String(r.id),
    topicId: r.topic_id ? String(r.topic_id) : null,
    activityType: String(r.activity_type) as StudyLog['activityType'],
    summary: String(r.summary),
    points: Number(r.points ?? 2),
    createdAt: String(r.created_at),
  }));

  const geminiKey = process.env.GEMINI_API_KEY;
  const aiConfigured = Boolean(geminiKey && geminiKey !== 'MY_GEMINI_API_KEY' && geminiKey.trim().length > 10);
  const supabaseConfigured = Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY);

  return {
    profile,
    categories,
    topics,
    connections,
    flashcards,
    quizzes,
    resources,
    studyLogs,
    aiConfigured,
    supabaseConfigured,
  };
}

export function createCategory(
  userId: string,
  payload: { name: string; nameKm?: string; description: string; color: string }
): Category {
  const existingCount = (
    db.prepare('select count(*) as cnt from categories where user_id = ?').get(userId) as { cnt: number }
  ).cnt;
  const id = `cat-${crypto.randomUUID().slice(0, 8)}`;
  const slug = payload.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const orbitRadius = 18 + existingCount * 4.5;
  const orbitAngle = (existingCount * 0.72) % (Math.PI * 2);

  db.prepare(
    `insert into categories (
      id, user_id, slug, name, name_km, description, description_km,
      color, orbit_radius, orbit_angle, planet_size, sort_order, is_custom
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
  ).run(
    id,
    userId,
    slug || id,
    payload.name.trim(),
    (payload.nameKm ?? payload.name).trim(),
    payload.description.trim(),
    payload.description.trim(),
    payload.color || '#E5B85C',
    orbitRadius,
    orbitAngle,
    1.85,
    existingCount + 1
  );

  return {
    id,
    slug: slug || id,
    name: payload.name.trim(),
    nameKm: (payload.nameKm ?? payload.name).trim(),
    description: payload.description.trim(),
    descriptionKm: payload.description.trim(),
    color: payload.color || '#E5B85C',
    orbitRadius,
    orbitAngle,
    planetSize: 1.85,
    sortOrder: existingCount + 1,
    isCustom: true,
  };
}

export function createTopic(userId: string, input: Omit<Topic, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'lastViewedAt'>): Topic {
  const id = `topic-${crypto.randomUUID().slice(0, 8)}`;
  const slug =
    input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || id;
  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    db.prepare(
      `insert into topics (
        id, user_id, category_id, slug, title, title_km, short_definition,
        simple_explanation, detailed_explanation, key_concepts, practical_examples,
        real_world_applications, step_by_step_guide, terminology, external_resources,
        references_list, attachments, last_viewed_at, created_at, updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      userId,
      input.categoryId,
      slug,
      input.title.trim(),
      (input.titleKm || input.title).trim(),
      input.shortDefinition.trim(),
      input.simpleExplanation || '',
      input.detailedExplanation || '',
      JSON.stringify(input.keyConcepts ?? []),
      JSON.stringify(input.practicalExamples ?? []),
      JSON.stringify(input.realWorldApplications ?? []),
      JSON.stringify(input.stepByStepGuide ?? []),
      JSON.stringify(input.terminology ?? []),
      JSON.stringify(input.externalResources ?? []),
      JSON.stringify(input.referencesList ?? []),
      JSON.stringify(input.attachments ?? []),
      now,
      now,
      now
    );

    db.prepare('insert into notes (user_id, topic_id, content_html, updated_at) values (?, ?, ?, ?)').run(
      userId,
      id,
      input.personalNotesHtml || '',
      now
    );
    db.prepare(
      'insert into learning_progress (user_id, topic_id, status, updated_at) values (?, ?, ?, ?)'
    ).run(userId, id, input.status || 'not_started', now);
    if (input.isFavorite) {
      db.prepare('insert into favorites (user_id, topic_id, created_at) values (?, ?, ?)').run(
        userId,
        id,
        now
      );
    }
    setTopicTagsForUser(userId, id, input.tags ?? []);

    db.prepare(
      'insert into study_logs (id, user_id, topic_id, activity_type, summary, points, created_at) values (?, ?, ?, ?, ?, ?, ?)'
    ).run(`log-${crypto.randomUUID().slice(0, 8)}`, userId, id, 'note_updated', `Added topic: ${input.title.trim()}`, 3, now);
  });

  tx();

  return {
    ...input,
    id,
    slug,
    lastViewedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateTopic(
  userId: string,
  topicId: string,
  updates: Partial<Topic>
): Topic | null {
  const existingRow = db
    .prepare('select * from topics where user_id = ? and id = ?')
    .get(userId, topicId) as Record<string, unknown> | undefined;
  if (!existingRow) return null;

  const now = new Date().toISOString();
  const prevStatusRow = db
    .prepare('select status from learning_progress where user_id = ? and topic_id = ?')
    .get(userId, topicId) as { status: LearningStatus } | undefined;

  const tx = db.transaction(() => {
    db.prepare(
      `update topics set
        category_id = ?, title = ?, title_km = ?, short_definition = ?,
        simple_explanation = ?, detailed_explanation = ?, key_concepts = ?,
        practical_examples = ?, real_world_applications = ?, step_by_step_guide = ?,
        terminology = ?, external_resources = ?, references_list = ?, attachments = ?,
        updated_at = ?
       where user_id = ? and id = ?`
    ).run(
      updates.categoryId ?? String(existingRow.category_id),
      updates.title ?? String(existingRow.title),
      updates.titleKm ?? String(existingRow.title_km ?? ''),
      updates.shortDefinition ?? String(existingRow.short_definition),
      updates.simpleExplanation ?? String(existingRow.simple_explanation ?? ''),
      updates.detailedExplanation ?? String(existingRow.detailed_explanation ?? ''),
      updates.keyConcepts ? JSON.stringify(updates.keyConcepts) : String(existingRow.key_concepts),
      updates.practicalExamples
        ? JSON.stringify(updates.practicalExamples)
        : String(existingRow.practical_examples),
      updates.realWorldApplications
        ? JSON.stringify(updates.realWorldApplications)
        : String(existingRow.real_world_applications),
      updates.stepByStepGuide
        ? JSON.stringify(updates.stepByStepGuide)
        : String(existingRow.step_by_step_guide),
      updates.terminology ? JSON.stringify(updates.terminology) : String(existingRow.terminology),
      updates.externalResources
        ? JSON.stringify(updates.externalResources)
        : String(existingRow.external_resources),
      updates.referencesList
        ? JSON.stringify(updates.referencesList)
        : String(existingRow.references_list),
      updates.attachments ? JSON.stringify(updates.attachments) : String(existingRow.attachments),
      now,
      userId,
      topicId
    );

    if (updates.personalNotesHtml !== undefined) {
      db.prepare(
        `insert into notes (user_id, topic_id, content_html, updated_at)
         values (?, ?, ?, ?)
         on conflict(user_id, topic_id) do update set content_html = excluded.content_html, updated_at = excluded.updated_at`
      ).run(userId, topicId, updates.personalNotesHtml, now);
    }

    if (updates.status !== undefined) {
      db.prepare(
        `insert into learning_progress (user_id, topic_id, status, updated_at)
         values (?, ?, ?, ?)
         on conflict(user_id, topic_id) do update set status = excluded.status, updated_at = excluded.updated_at`
      ).run(userId, topicId, updates.status, now);

      if (updates.status === 'completed' && prevStatusRow?.status !== 'completed') {
        db.prepare(
          'insert into study_logs (id, user_id, topic_id, activity_type, summary, points, created_at) values (?, ?, ?, ?, ?, ?, ?)'
        ).run(
          `log-${crypto.randomUUID().slice(0, 8)}`,
          userId,
          topicId,
          'topic_completed',
          `Completed ${updates.title ?? String(existingRow.title)}`,
          5,
          now
        );
      }
    }

    if (updates.isFavorite !== undefined) {
      if (updates.isFavorite) {
        db.prepare(
          'insert or ignore into favorites (user_id, topic_id, created_at) values (?, ?, ?)'
        ).run(userId, topicId, now);
      } else {
        db.prepare('delete from favorites where user_id = ? and topic_id = ?').run(userId, topicId);
      }
    }

    if (updates.tags !== undefined) {
      setTopicTagsForUser(userId, topicId, updates.tags);
    }
  });

  tx();
  const ws = getWorkspaceData(userId);
  return ws.topics.find((t) => t.id === topicId) ?? null;
}

export function markTopicViewed(userId: string, topicId: string): void {
  db.prepare('update topics set last_viewed_at = ? where user_id = ? and id = ?').run(
    new Date().toISOString(),
    userId,
    topicId
  );
}

export function deleteTopic(userId: string, topicId: string): boolean {
  const tx = db.transaction(() => {
    db.prepare('delete from notes where user_id = ? and topic_id = ?').run(userId, topicId);
    db.prepare('delete from learning_progress where user_id = ? and topic_id = ?').run(userId, topicId);
    db.prepare('delete from favorites where user_id = ? and topic_id = ?').run(userId, topicId);
    db.prepare('delete from topic_tags where user_id = ? and topic_id = ?').run(userId, topicId);
    db.prepare(
      'delete from topic_connections where user_id = ? and (source_topic_id = ? or target_topic_id = ?)'
    ).run(userId, topicId, topicId);
    const info = db.prepare('delete from topics where user_id = ? and id = ?').run(userId, topicId);
    return info.changes > 0;
  });
  return tx();
}

export function createConnection(
  userId: string,
  sourceTopicId: string,
  targetTopicId: string,
  relationshipLabel: string
): TopicConnection {
  const id = `conn-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  db.prepare(
    `insert into topic_connections (id, user_id, source_topic_id, target_topic_id, relationship_label, created_at)
     values (?, ?, ?, ?, ?, ?)`
  ).run(id, userId, sourceTopicId, targetTopicId, relationshipLabel || 'Related to', now);

  return {
    id,
    sourceTopicId,
    targetTopicId,
    relationshipLabel: relationshipLabel || 'Related to',
    createdAt: now,
  };
}

export function deleteConnection(userId: string, connId: string): boolean {
  const info = db
    .prepare('delete from topic_connections where user_id = ? and id = ?')
    .run(userId, connId);
  return info.changes > 0;
}

export function createFlashcard(
  userId: string,
  payload: { topicId?: string | null; categoryId: string; front: string; back: string; backKm?: string }
): Flashcard {
  const id = `fc-${crypto.randomUUID().slice(0, 8)}`;
  db.prepare(
    `insert into flashcards (id, user_id, topic_id, category_id, front, back, back_km, mastery_level, last_reviewed_at)
     values (?, ?, ?, ?, ?, ?, ?, 0, null)`
  ).run(
    id,
    userId,
    payload.topicId ?? null,
    payload.categoryId,
    payload.front.trim(),
    payload.back.trim(),
    payload.backKm?.trim() ?? null
  );
  return {
    id,
    topicId: payload.topicId ?? null,
    categoryId: payload.categoryId,
    front: payload.front.trim(),
    back: payload.back.trim(),
    backKm: payload.backKm?.trim(),
    masteryLevel: 0,
    lastReviewedAt: null,
  };
}

export function reviewFlashcard(userId: string, cardId: string, masteryLevel: number): void {
  const now = new Date().toISOString();
  const clamped = Math.max(0, Math.min(5, masteryLevel));
  db.prepare(
    'update flashcards set mastery_level = ?, last_reviewed_at = ? where user_id = ? and id = ?'
  ).run(clamped, now, userId, cardId);
  db.prepare(
    'insert into study_logs (id, user_id, topic_id, activity_type, summary, points, created_at) values (?, ?, ?, ?, ?, ?, ?)'
  ).run(`log-${crypto.randomUUID().slice(0, 8)}`, userId, null, 'flashcard_review', 'Reviewed flashcard deck item', 2, now);
}

export function createQuizQuestion(
  userId: string,
  payload: Omit<QuizQuestion, 'id'>
): QuizQuestion {
  const id = `quiz-${crypto.randomUUID().slice(0, 8)}`;
  db.prepare(
    `insert into quizzes (
      id, user_id, topic_id, category_id, question, options, correct_index,
      explanation, short_answer_prompt, sample_short_answer
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    userId,
    payload.topicId ?? null,
    payload.categoryId,
    payload.question,
    JSON.stringify(payload.options),
    payload.correctIndex,
    payload.explanation,
    payload.shortAnswerPrompt ?? null,
    payload.sampleShortAnswer ?? null
  );
  return { ...payload, id };
}

export function logStudyActivity(
  userId: string,
  activityType: StudyLog['activityType'],
  summary: string,
  points: number,
  topicId?: string | null
): StudyLog {
  const id = `log-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  db.prepare(
    'insert into study_logs (id, user_id, topic_id, activity_type, summary, points, created_at) values (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, userId, topicId ?? null, activityType, summary, points, now);
  return {
    id,
    topicId: topicId ?? null,
    activityType,
    summary,
    points,
    createdAt: now,
  };
}

export function createResource(
  userId: string,
  payload: Omit<ResourceItem, 'id' | 'createdAt'>
): ResourceItem {
  const id = `res-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  db.prepare(
    `insert into resources (id, user_id, category_id, topic_id, title, url, resource_type, description, created_at)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    userId,
    payload.categoryId,
    payload.topicId ?? null,
    payload.title.trim(),
    payload.url.trim(),
    payload.resourceType,
    payload.description.trim(),
    now
  );
  return { ...payload, id, createdAt: now };
}

export function deleteResource(userId: string, resId: string): boolean {
  const info = db.prepare('delete from resources where user_id = ? and id = ?').run(userId, resId);
  return info.changes > 0;
}
