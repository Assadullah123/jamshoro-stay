CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, anon;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, anon;

DROP POLICY "profiles_select_own" ON public.profiles;
DROP POLICY "profiles_update_own" ON public.profiles;
DROP POLICY "roles_select_own" ON public.user_roles;
DROP POLICY "listings_owner_read" ON public.listings;
DROP POLICY "listings_owner_update" ON public.listings;
DROP POLICY "listings_owner_delete" ON public.listings;
DROP POLICY "contacts_owner_all" ON public.listing_contacts;
DROP POLICY "reports_admin_read" ON public.listing_reports;
DROP POLICY "reports_admin_update" ON public.listing_reports;
DROP POLICY "reports_admin_delete" ON public.listing_reports;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR private.has_role(auth.uid(),'admin')) WITH CHECK (true);
CREATE POLICY "roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "listings_owner_read" ON public.listings FOR SELECT TO authenticated USING (user_id = auth.uid() OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "listings_owner_update" ON public.listings FOR UPDATE TO authenticated USING (user_id = auth.uid() OR private.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid() OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "listings_owner_delete" ON public.listings FOR DELETE TO authenticated USING (user_id = auth.uid() OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "contacts_owner_all" ON public.listing_contacts FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (l.user_id = auth.uid() OR private.has_role(auth.uid(),'admin')))) WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (l.user_id = auth.uid() OR private.has_role(auth.uid(),'admin'))));
CREATE POLICY "reports_admin_read" ON public.listing_reports FOR SELECT TO authenticated USING (private.has_role(auth.uid(),'admin'));
CREATE POLICY "reports_admin_update" ON public.listing_reports FOR UPDATE TO authenticated USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));
CREATE POLICY "reports_admin_delete" ON public.listing_reports FOR DELETE TO authenticated USING (private.has_role(auth.uid(),'admin'));

DROP FUNCTION public.has_role(uuid, public.app_role);
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;