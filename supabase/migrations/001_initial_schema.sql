-- =====================================================
-- pharma-exam-ai: 初期スキーマ
-- Supabase Dashboard の SQL Editor で実行する
-- =====================================================

-- ユーザープロフィール（auth.users に紐づく）
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  grade int check (grade between 1 and 6),
  exam_year int,
  role text not null default 'student' check (role in ('student', 'graduate', 'lecturer')),
  pass_year int,
  created_at timestamptz not null default now()
);

-- 問題マスタ
create table questions (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  question_number int not null,
  section text not null check (section in ('必須', '理論', '実践')),
  subject text not null,
  category text not null,
  question_text text not null,
  choices jsonb not null,   -- [{ key: 1, text: "..." }, ...]
  correct_answer int not null check (correct_answer between 1 and 5),
  explanation text not null default '',
  tags text[] not null default '{}',
  image_url text,
  unique (year, question_number)
);

-- 回答履歴
create table answer_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  question_id uuid references questions on delete cascade not null,
  selected_answer int not null check (selected_answer between 1 and 5),
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  confidence_level text not null default 'medium' check (confidence_level in ('high', 'medium', 'low', 'guess')),
  time_spent_seconds int
);

-- 付箋
create table sticky_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  question_id uuid references questions on delete cascade not null,
  title text not null,
  body text not null,
  note_type text not null check (note_type in ('knowledge', 'solution', 'mnemonic', 'caution', 'related', 'intuition')),
  tags text[] not null default '{}',
  visibility text not null default 'private' check (visibility in ('private', 'limited', 'public')),
  saves_count int not null default 0,
  likes_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 付箋保存（ブックマーク）
create table saved_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  note_id uuid references sticky_notes on delete cascade not null,
  saved_at timestamptz not null default now(),
  unique (user_id, note_id)
);

-- =====================================================
-- RLS（Row Level Security：データの安全な分離）
-- =====================================================

alter table profiles enable row level security;
alter table answer_history enable row level security;
alter table sticky_notes enable row level security;
alter table saved_notes enable row level security;

-- questionsは全員が読める
alter table questions enable row level security;
create policy "questions_select_all" on questions for select using (true);

-- profilesは本人のみ読み書き
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- 回答履歴は本人のみ
create policy "answer_history_all_own" on answer_history
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 付箋：作成は認証済みユーザー、閲覧はvisibilityに応じる
create policy "sticky_notes_insert_auth" on sticky_notes
  for insert with check (auth.uid() = user_id);
create policy "sticky_notes_update_own" on sticky_notes
  for update using (auth.uid() = user_id);
create policy "sticky_notes_delete_own" on sticky_notes
  for delete using (auth.uid() = user_id);
create policy "sticky_notes_select" on sticky_notes
  for select using (
    auth.uid() = user_id           -- 自分の付箋
    or visibility = 'public'       -- 公開付箋
  );

-- 付箋保存は本人のみ
create policy "saved_notes_all_own" on saved_notes
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================================================
-- saves_count を自動更新するトリガー
-- =====================================================
create or replace function increment_saves_count()
returns trigger as $$
begin
  update sticky_notes set saves_count = saves_count + 1 where id = NEW.note_id;
  return NEW;
end;
$$ language plpgsql security definer;

create or replace function decrement_saves_count()
returns trigger as $$
begin
  update sticky_notes set saves_count = saves_count - 1 where id = OLD.note_id;
  return OLD;
end;
$$ language plpgsql security definer;

create trigger on_note_saved after insert on saved_notes
  for each row execute function increment_saves_count();

create trigger on_note_unsaved after delete on saved_notes
  for each row execute function decrement_saves_count();

-- updated_at 自動更新
create or replace function update_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

create trigger sticky_notes_updated_at before update on sticky_notes
  for each row execute function update_updated_at();
