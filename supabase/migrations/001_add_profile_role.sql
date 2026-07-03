-- Роли пользователей: member (по умолчанию) и admin.
-- Выполните в Supabase SQL Editor один раз перед использованием add-admin.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('member', 'admin'));

UPDATE public.profiles
SET role = 'member'
WHERE role IS NULL OR trim(role) = '';

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);
