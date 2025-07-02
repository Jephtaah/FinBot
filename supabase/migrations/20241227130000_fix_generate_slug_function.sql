-- migration: fix ambiguous column reference in generate_slug function
-- purpose: resolve PostgreSQL error where user_id column reference was ambiguous
-- affected: generate_slug function

-- update function to fix ambiguous column reference
create or replace function public.generate_slug(title text, user_id uuid)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  base_slug text;
  final_slug text;
  counter integer := 0;
begin
  -- convert title to lowercase, replace spaces/special chars with hyphens
  base_slug := lower(trim(regexp_replace(title, '[^a-zA-Z0-9\s]', '', 'g')));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := trim(base_slug, '-');
  
  -- ensure slug is not empty
  if base_slug = '' then
    base_slug := 'transaction';
  end if;
  
  final_slug := base_slug;
  
  -- check for uniqueness and append counter if needed
  -- use fully qualified column name to avoid ambiguity
  while exists (
    select 1 from public.transactions 
    where slug = final_slug and public.transactions.user_id = generate_slug.user_id
  ) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  end loop;
  
  return final_slug;
end;
$$; 