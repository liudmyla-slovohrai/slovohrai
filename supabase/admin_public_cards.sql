-- Run this once in Supabase Dashboard -> SQL Editor.
-- It keeps existing cards and adds shared admin cards with personal progress.

create extension if not exists pgcrypto;

create or replace function public.is_card_admin()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = any (
    array[
      'dobjanskiy51@gmail.com',
      'lyudmiladobshanska@gmail.com',
      'petrostanislav@gmail.com',
      'dobzhansky.igor@gmail.com'
    ]
  );
$$;

alter table public.cards
  add column if not exists is_public boolean not null default false;

alter table public.cards
  add column if not exists created_by_email text;

update public.cards as cards
set is_public = true,
    created_by_email = coalesce(cards.created_by_email, lower(users.email))
from auth.users as users
where cards.user_id = users.id
  and lower(users.email) = any (
    array[
      'dobjanskiy51@gmail.com',
      'lyudmiladobshanska@gmail.com',
      'petrostanislav@gmail.com',
      'dobzhansky.igor@gmail.com'
    ]
  );

create table if not exists public.card_user_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  is_favorite boolean not null default false,
  is_learned boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

create or replace function public.touch_card_user_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_card_user_state_updated_at on public.card_user_state;
create trigger touch_card_user_state_updated_at
before update on public.card_user_state
for each row execute function public.touch_card_user_state_updated_at();

alter table public.cards enable row level security;
alter table public.card_user_state enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.cards to authenticated;
grant select, insert, update, delete on table public.card_user_state to authenticated;

drop policy if exists "Users can read own cards" on public.cards;
drop policy if exists "Users can create own cards" on public.cards;
drop policy if exists "Users can update own cards" on public.cards;
drop policy if exists "Users can delete own cards" on public.cards;
drop policy if exists "Users can read own and public cards" on public.cards;
drop policy if exists "Users can create own cards and admins can publish" on public.cards;
drop policy if exists "Users can update own cards and admins can manage public cards" on public.cards;
drop policy if exists "Users can delete own cards and admins can delete public cards" on public.cards;

create policy "Users can read own and public cards"
on public.cards for select
to authenticated
using (
  user_id = (select auth.uid())
  or is_public = true
);

create policy "Users can create own cards and admins can publish"
on public.cards for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (
    is_public = false
    or public.is_card_admin()
  )
);

create policy "Users can update own cards and admins can manage public cards"
on public.cards for update
to authenticated
using (
  user_id = (select auth.uid())
  or public.is_card_admin()
)
with check (
  user_id = (select auth.uid())
  or public.is_card_admin()
);

create policy "Users can delete own cards and admins can delete public cards"
on public.cards for delete
to authenticated
using (
  user_id = (select auth.uid())
  or public.is_card_admin()
);

drop policy if exists "Users can read own card state" on public.card_user_state;
drop policy if exists "Users can create own card state" on public.card_user_state;
drop policy if exists "Users can update own card state" on public.card_user_state;
drop policy if exists "Users can delete own card state" on public.card_user_state;

create policy "Users can read own card state"
on public.card_user_state for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can create own card state"
on public.card_user_state for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can update own card state"
on public.card_user_state for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can delete own card state"
on public.card_user_state for delete
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Admins can update card images" on storage.objects;
create policy "Admins can update card images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'card-images'
  and public.is_card_admin()
);

drop policy if exists "Admins can delete card images" on storage.objects;
create policy "Admins can delete card images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'card-images'
  and public.is_card_admin()
);
