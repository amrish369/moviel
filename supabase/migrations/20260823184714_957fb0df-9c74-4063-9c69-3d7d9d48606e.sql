DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view movie streams" ON public.movie_streams;
REVOKE SELECT ON public.movie_streams FROM anon;
GRANT SELECT ON public.movie_streams TO authenticated;
GRANT ALL ON public.movie_streams TO service_role;
CREATE POLICY "Authenticated users can view movie streams" ON public.movie_streams FOR SELECT TO authenticated USING (true);