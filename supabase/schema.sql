-- Initial Supabase schema for authenticated profiles and direct messages.
-- Run this once in the Supabase SQL Editor. Re-running is safe for the
-- existing objects created by this file.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null check (char_length(btrim(username)) between 2 and 30),
  student_id text check (
    student_id is null or student_id ~ '^[0-9]{4}-[1-3]-[1-4]-[0-9]{2}$'
  ),
  role text not null default 'user'
    check (role in ('user', 'manager', 'admin', 'teacher')),
  profile_image_url text,
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_username_lower_uidx
  on public.profiles (lower(username));

create unique index if not exists profiles_student_id_uidx
  on public.profiles (student_id)
  where student_id is not null;

create table if not exists public.dm_conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz not null default now(),
  constraint dm_conversations_distinct_users check (user_a < user_b),
  constraint dm_conversations_unique_pair unique (user_a, user_b)
);

create index if not exists dm_conversations_user_a_recent_idx
  on public.dm_conversations (user_a, last_message_at desc);

create index if not exists dm_conversations_user_b_recent_idx
  on public.dm_conversations (user_b, last_message_at desc);

create table if not exists public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.dm_conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null default '' check (char_length(content) <= 2000),
  file_url text check (
    file_url is null or (
      char_length(file_url) <= 2048
      and file_url ~ '^https://res\.cloudinary\.com/[A-Za-z0-9_-]+/'
    )
  ),
  file_name text check (file_name is null or char_length(file_name) <= 255),
  created_at timestamptz not null default now(),
  constraint dm_messages_content_or_file
    check (char_length(btrim(content)) > 0 or file_url is not null),
  constraint dm_messages_file_pair
    check ((file_url is null) = (file_name is null))
);

create index if not exists dm_messages_conversation_recent_idx
  on public.dm_messages (conversation_id, created_at desc, id desc);

create index if not exists dm_messages_sender_recent_idx
  on public.dm_messages (sender_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.dm_conversations enable row level security;
alter table public.dm_messages enable row level security;

drop policy if exists "Authenticated users can view profiles" on public.profiles;
create policy "Authenticated users can view profiles"
  on public.profiles for select to authenticated
  using (auth.uid() is not null);

drop policy if exists "Users can update their own editable profile fields" on public.profiles;
create policy "Users can update their own editable profile fields"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "Conversation participants can view conversations" on public.dm_conversations;
create policy "Conversation participants can view conversations"
  on public.dm_conversations for select to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "Conversation participants can view messages" on public.dm_messages;
create policy "Conversation participants can view messages"
  on public.dm_messages for select to authenticated
  using (
    exists (
      select 1
      from public.dm_conversations c
      where c.id = conversation_id
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

drop policy if exists "Participants can send messages as themselves" on public.dm_messages;
create policy "Participants can send messages as themselves"
  on public.dm_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.dm_conversations c
      where c.id = conversation_id
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

revoke all on table public.profiles from public, anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (student_id, profile_image_url) on table public.profiles to authenticated;

revoke all on table public.dm_conversations from public, anon, authenticated;
grant select on table public.dm_conversations to authenticated;

revoke all on table public.dm_messages from public, anon, authenticated;
grant select on table public.dm_messages to authenticated;
grant insert (conversation_id, sender_id, content, file_url, file_name)
  on table public.dm_messages to authenticated;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_username text;
  new_student_id text;
begin
  new_username := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'username'), ''),
    split_part(coalesce(new.email, ''), '@', 1)
  );
  new_student_id := nullif(btrim(new.raw_user_meta_data ->> 'student_id'), '');

  insert into public.profiles (id, username, student_id)
  values (new.id, new_username, new_student_id)
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create or replace function public.lookup_auth_email_by_username(login_username text)
returns text
language sql
security definer
set search_path = ''
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(p.username) = lower(btrim(login_username))
  limit 1
$$;

revoke all on function public.lookup_auth_email_by_username(text)
  from public, anon, authenticated;
grant execute on function public.lookup_auth_email_by_username(text)
  to service_role;

create or replace function public.get_or_create_dm_conversation(peer_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  first_user_id uuid;
  second_user_id uuid;
  conversation_id uuid;
begin
  if current_user_id is null then
    raise exception '로그인이 필요해요.' using errcode = '28000';
  end if;
  if peer_user_id is null or peer_user_id = current_user_id then
    raise exception '올바른 대화 상대를 선택해주세요.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.profiles p where p.id = current_user_id
  ) or not exists (
    select 1 from public.profiles p where p.id = peer_user_id
  ) then
    raise exception '회원 정보를 찾을 수 없어요.' using errcode = '22023';
  end if;

  first_user_id := least(current_user_id, peer_user_id);
  second_user_id := greatest(current_user_id, peer_user_id);

  insert into public.dm_conversations (user_a, user_b)
  values (first_user_id, second_user_id)
  on conflict (user_a, user_b) do nothing;

  select c.id into conversation_id
  from public.dm_conversations c
  where c.user_a = first_user_id and c.user_b = second_user_id;

  return conversation_id;
end;
$$;

revoke all on function public.get_or_create_dm_conversation(uuid) from public, anon;
grant execute on function public.get_or_create_dm_conversation(uuid) to authenticated;

create or replace function public.update_dm_conversation_preview()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  preview text;
begin
  preview := coalesce(
    nullif(btrim(new.content), ''),
    '[첨부] ' || new.file_name,
    '[첨부 파일]'
  );

  update public.dm_conversations
  set last_message_at = new.created_at,
      last_message_preview = left(preview, 240)
  where id = new.conversation_id;

  return new;
end;
$$;

revoke all on function public.update_dm_conversation_preview() from public, anon, authenticated;

drop trigger if exists on_dm_message_created on public.dm_messages;
create trigger on_dm_message_created
  after insert on public.dm_messages
  for each row execute function public.update_dm_conversation_preview();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'dm_messages'
    ) then
    execute 'alter publication supabase_realtime add table public.dm_messages';
  end if;
end;
$$;