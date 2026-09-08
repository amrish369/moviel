CREATE TABLE public.unlock_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  movie_slug text,
  chat_id text,
  verified boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '2 hours'
);
CREATE INDEX idx_unlock_tokens_token ON public.unlock_tokens(token);
GRANT ALL ON public.unlock_tokens TO service_role;
ALTER TABLE public.unlock_tokens ENABLE ROW LEVEL SECURITY;