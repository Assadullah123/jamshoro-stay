CREATE TYPE public.app_role AS ENUM ('admin','operator','student');
CREATE TYPE public.listing_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.listing_type AS ENUM ('hostel','private_room','shared_room','roommate_wanted');
CREATE TYPE public.gender_target AS ENUM ('boys','girls');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_type public.listing_type NOT NULL DEFAULT 'hostel',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  gender public.gender_target NOT NULL,
  monthly_rent integer NOT NULL,
  security_deposit integer,
  room_type text NOT NULL DEFAULT 'single',
  available_beds integer NOT NULL DEFAULT 1,
  available_now boolean NOT NULL DEFAULT true,
  available_from date,
  is_available boolean NOT NULL DEFAULT true,
  area text NOT NULL,
  address text NOT NULL DEFAULT '',
  latitude double precision,
  longitude double precision,
  nearby_campus text,
  amenities text[] NOT NULL DEFAULT '{}',
  images text[] NOT NULL DEFAULT '{}',
  status public.listing_status NOT NULL DEFAULT 'pending',
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT SELECT ON public.listings TO anon;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.listing_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Owner',
  phone text NOT NULL,
  whatsapp boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_contacts TO authenticated;
GRANT SELECT ON public.listing_contacts TO anon;
GRANT ALL ON public.listing_contacts TO service_role;
ALTER TABLE public.listing_contacts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.listing_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NOT NULL,
  note text,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_reports TO authenticated;
GRANT INSERT ON public.listing_reports TO anon;
GRANT ALL ON public.listing_reports TO service_role;
ALTER TABLE public.listing_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin')) WITH CHECK (true);

CREATE POLICY "roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "listings_public_read" ON public.listings FOR SELECT USING (status = 'approved');
CREATE POLICY "listings_owner_read" ON public.listings FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "listings_owner_insert" ON public.listings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "listings_owner_update" ON public.listings FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "listings_owner_delete" ON public.listings FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "contacts_public_read" ON public.listing_contacts FOR SELECT USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.status = 'approved'));
CREATE POLICY "contacts_owner_all" ON public.listing_contacts FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (l.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))) WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (l.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

CREATE POLICY "reports_insert_any" ON public.listing_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "reports_admin_read" ON public.listing_reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "reports_admin_update" ON public.listing_reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "reports_admin_delete" ON public.listing_reports FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER listings_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE(NULLIF(NEW.raw_user_meta_data->>'role',''), 'student')::public.app_role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE INDEX listings_status_idx ON public.listings (status);
CREATE INDEX listings_gender_idx ON public.listings (gender);
CREATE INDEX listings_user_idx ON public.listings (user_id);