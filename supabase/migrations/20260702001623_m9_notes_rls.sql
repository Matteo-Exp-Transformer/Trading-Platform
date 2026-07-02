-- M9: taccuino personale con isolamento owner-only.
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  content text not null default '',
  color text not null default '',
  font text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.notes is
  'Note personali dell''utente (taccuino). Testo libero + stile (font/colore). Owner-only via RLS.';

create index notes_user_updated_idx on public.notes (user_id, updated_at desc);

alter table public.notes enable row level security;

create policy notes_select_own on public.notes
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy notes_insert_own on public.notes
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy notes_update_own on public.notes
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy notes_delete_own on public.notes
  for delete to authenticated
  using (user_id = (select auth.uid()));

create function public.set_notes_updated_at()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_notes_updated_at() from public, anon, authenticated;

create trigger notes_set_updated_at
before update on public.notes
for each row
execute function public.set_notes_updated_at();
