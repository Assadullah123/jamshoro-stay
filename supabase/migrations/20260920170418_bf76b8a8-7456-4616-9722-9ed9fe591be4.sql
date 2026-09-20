-- 1. Prevent owners from self-approving / self-featuring
CREATE OR REPLACE FUNCTION public.guard_listing_moderation_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status := OLD.status;
  END IF;
  IF NEW.is_featured IS DISTINCT FROM OLD.is_featured THEN
    NEW.is_featured := OLD.is_featured;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_listing_moderation_fields ON public.listings;
CREATE TRIGGER guard_listing_moderation_fields
BEFORE UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.guard_listing_moderation_fields();

-- also make sure a brand new listing can never be created pre-approved/featured by a non-admin
CREATE OR REPLACE FUNCTION public.guard_listing_insert_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    NEW.status := 'pending'::public.listing_status;
    NEW.is_featured := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_listing_insert_moderation ON public.listings;
CREATE TRIGGER guard_listing_insert_moderation
BEFORE INSERT ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.guard_listing_insert_moderation();

-- 2. Never trust client-supplied role at sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested text := NULLIF(NEW.raw_user_meta_data->>'role', '');
  safe_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;

  safe_role := CASE WHEN requested = 'operator' THEN 'operator'::public.app_role
                    ELSE 'student'::public.app_role END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, safe_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 3. Contact phone numbers only for signed-in visitors
DROP POLICY IF EXISTS contacts_public_read ON public.listing_contacts;
CREATE POLICY contacts_authenticated_read ON public.listing_contacts
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.listings l
  WHERE l.id = listing_contacts.listing_id AND l.status = 'approved'::public.listing_status
));

REVOKE SELECT ON public.listing_contacts FROM anon;