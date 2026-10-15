GRANT INSERT, DELETE ON public.user_roles TO authenticated;
CREATE POLICY "admin manage roles insert" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage roles delete" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));