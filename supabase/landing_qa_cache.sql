-- ─────────────────────────────────────────────────────────────────────────────
-- landing_qa_cache
--
-- Stores AI-generated answers to questions asked on the landing page.
-- When a new question matches an existing entry (Jaccard ≥ 0.35 on keywords),
-- the cached answer is served instantly instead of calling Gemini.
--
-- RLS is open (SELECT / INSERT / UPDATE) because this table only holds
-- cached marketing answers — no sensitive user data.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.landing_qa_cache (
  id            uuid        default gen_random_uuid() primary key,

  -- original question exactly as the user typed it
  question_raw  text        not null,

  -- normalized form used for exact-duplicate detection
  question_norm text        not null,

  -- tokenized keywords extracted from the question (for array-overlap pre-filter)
  keywords      text[]      not null default '{}',

  -- answers per language (null = not yet generated for that language)
  answer_en     text,
  answer_sw     text,

  -- usage statistics
  hit_count     integer     not null default 0,
  created_at    timestamptz not null default now(),
  last_hit_at   timestamptz
);

-- Deduplicate: same normalized question → one row
create unique index if not exists landing_qa_cache_norm_uidx
  on public.landing_qa_cache (question_norm);

-- GIN index for fast array-overlap queries:  keywords && '{word1,word2}'
create index if not exists landing_qa_cache_keywords_gin
  on public.landing_qa_cache using gin (keywords);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.landing_qa_cache enable row level security;

create policy "public_read_landing_qa_cache"
  on public.landing_qa_cache for select
  using (true);

create policy "public_insert_landing_qa_cache"
  on public.landing_qa_cache for insert
  with check (true);

create policy "public_update_landing_qa_cache"
  on public.landing_qa_cache for update
  using (true) with check (true);
