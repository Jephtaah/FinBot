-- Add financial profile fields to the profiles table
alter table public.profiles
add column if not exists monthly_income numeric(10, 2) null,
add column if not exists monthly_expense numeric(10, 2) null,
add column if not exists savings_goal numeric(10, 2) null;

-- Add helpful comments
comment on column public.profiles.monthly_income is 'User''s declared monthly income in their local currency';
comment on column public.profiles.monthly_expense is 'User''s expected monthly expenses';
comment on column public.profiles.savings_goal is 'User''s target savings amount per month or total goal';

-- Update the updated_at timestamp when financial fields are modified
create or replace function update_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger if it doesn't exist
drop trigger if exists update_profiles_updated_at_trigger on public.profiles;
create trigger update_profiles_updated_at_trigger
  before update on public.profiles
  for each row
  execute function update_profiles_updated_at();