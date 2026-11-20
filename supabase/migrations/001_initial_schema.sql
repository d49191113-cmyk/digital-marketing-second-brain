-- Digital Marketing Second Brain — Supabase PostgreSQL Schema
-- Covers users, profiles, categories, topics, notes, topic_connections,
-- tags, topic_tags, learning_progress, flashcards, quizzes, resources, favorites.

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references public.users(id) on delete cascade,
  display_name text not null,
  role_title text default 'Digital Marketing Strategist',
  language text not null default 'en' check (language in ('en', 'km')),
  daily_goal integer not null default 3,
  prefer_2d_universe boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  slug text not null,
  name text not null,
  name_km text not null default '',
  description text not null default '',
  description_km text not null default '',
  color text not null default '#E5B85C',
  orbit_radius numeric not null default 20,
  orbit_angle numeric not null default 0,
  planet_size numeric not null default 1.8,
  sort_order integer not null default 0,
  is_custom boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  slug text not null,
  title text not null,
  title_km text not null default '',
  short_definition text not null,
  simple_explanation text not null default '',
  detailed_explanation text not null default '',
  key_concepts jsonb not null default '[]'::jsonb,
  practical_examples jsonb not null default '[]'::jsonb,
  real_world_applications jsonb not null default '[]'::jsonb,
  step_by_step_guide jsonb not null default '[]'::jsonb,
  terminology jsonb not null default '[]'::jsonb,
  external_resources jsonb not null default '[]'::jsonb,
  references_list jsonb not null default '[]'::jsonb,
  attachments jsonb not null default '[]'::jsonb,
  last_viewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  topic_id uuid unique not null references public.topics(id) on delete cascade,
  content_html text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.topic_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  source_topic_id uuid not null references public.topics(id) on delete cascade,
  target_topic_id uuid not null references public.topics(id) on delete cascade,
  relationship_label text not null default 'Related to',
  created_at timestamptz not null default now(),
  unique (source_topic_id, target_topic_id)
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null,
  unique (user_id, name)
);

create table if not exists public.topic_tags (
  topic_id uuid not null references public.topics(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (topic_id, tag_id)
);

create table if not exists public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started', 'learning', 'completed')),
  updated_at timestamptz not null default now(),
  unique (user_id, topic_id)
);

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  category_id uuid not null references public.categories(id) on delete cascade,
  front text not null,
  back text not null,
  back_km text,
  mastery_level integer not null default 0,
  last_reviewed_at timestamptz
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  category_id uuid not null references public.categories(id) on delete cascade,
  question text not null,
  options jsonb not null,
  correct_index integer not null,
  explanation text not null,
  short_answer_prompt text,
  sample_short_answer text
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  title text not null,
  url text not null,
  resource_type text not null default 'guide',
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id uuid not null references public.users(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.topics enable row level security;
alter table public.notes enable row level security;
alter table public.topic_connections enable row level security;
alter table public.tags enable row level security;
alter table public.topic_tags enable row level security;
alter table public.learning_progress enable row level security;
alter table public.flashcards enable row level security;
alter table public.quizzes enable row level security;
alter table public.resources enable row level security;
alter table public.favorites enable row level security;

create policy "Users manage own profile" on public.profiles for all using (auth.uid() = id);
create policy "Users manage own categories" on public.categories for all using (auth.uid() = user_id);
create policy "Users manage own topics" on public.topics for all using (auth.uid() = user_id);
create policy "Users manage own notes" on public.notes for all using (auth.uid() = user_id);
create policy "Users manage own connections" on public.topic_connections for all using (auth.uid() = user_id);
create policy "Users manage own tags" on public.tags for all using (auth.uid() = user_id);
create policy "Users manage own learning_progress" on public.learning_progress for all using (auth.uid() = user_id);
create policy "Users manage own flashcards" on public.flashcards for all using (auth.uid() = user_id);
create policy "Users manage own quizzes" on public.quizzes for all using (auth.uid() = user_id);
create policy "Users manage own resources" on public.resources for all using (auth.uid() = user_id);
create policy "Users manage own favorites" on public.favorites for all using (auth.uid() = user_id);
