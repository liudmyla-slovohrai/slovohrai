-- Run this once in Supabase Dashboard -> SQL Editor.
-- It adds dobzhansky.igor@gmail.com to the card admins list.

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

update public.cards as cards
set is_public = true,
    created_by_email = coalesce(cards.created_by_email, lower(users.email))
from auth.users as users
where cards.user_id = users.id
  and lower(users.email) = 'dobzhansky.igor@gmail.com';
