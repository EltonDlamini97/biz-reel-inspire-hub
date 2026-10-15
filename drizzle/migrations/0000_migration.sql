CREATE TYPE public.app_role AS ENUM ('user','business_owner','editor','admin');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  popia_consent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('editor','admin'))
$$;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, anon;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, popia_consent_at)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
    CASE WHEN NEW.raw_user_meta_data->>'popia_consent' = 'true' THEN now() ELSE NULL END);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Businesses
CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid,
  name text NOT NULL,
  category text NOT NULL,
  description text NOT NULL DEFAULT '',
  services text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  province text NOT NULL DEFAULT '',
  phone text, email text, website text,
  verified boolean NOT NULL DEFAULT false,
  featured boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.businesses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;
GRANT ALL ON public.businesses TO service_role;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public approved" ON public.businesses FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "owner read" ON public.businesses FOR SELECT TO authenticated USING (auth.uid() = owner_id OR public.is_staff(auth.uid()));
CREATE POLICY "owner insert" ON public.businesses FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND status = 'pending' AND verified = false AND featured = false);
CREATE POLICY "owner update" ON public.businesses FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "staff update" ON public.businesses FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "owner or admin delete" ON public.businesses FOR DELETE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));

-- prevent owners self-verifying
CREATE OR REPLACE FUNCTION public.guard_business_flags()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) AND auth.uid() IS NOT NULL THEN
    NEW.verified := OLD.verified; NEW.featured := OLD.featured; NEW.status := OLD.status;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_business BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.guard_business_flags();

CREATE OR REPLACE FUNCTION public.grant_owner_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.owner_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.owner_id, 'business_owner') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER business_owner_role AFTER INSERT ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.grant_owner_role();

CREATE TABLE public.enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  name text NOT NULL, email text NOT NULL, message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.enquiries TO authenticated;
GRANT ALL ON public.enquiries TO service_role;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "send enquiry" ON public.enquiries FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "read enquiry" ON public.enquiries FOR SELECT TO authenticated USING (
  auth.uid() = sender_id OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));

-- Watchlist
CREATE TABLE public.watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  movie_id text NOT NULL,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, movie_id)
);
GRANT SELECT, INSERT, DELETE ON public.watchlist TO authenticated;
GRANT ALL ON public.watchlist TO service_role;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own watchlist" ON public.watchlist FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Motivation content
CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL, author text NOT NULL DEFAULT 'Unknown',
  submitted_by uuid,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quotes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approved quotes" ON public.quotes FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "own or staff quotes" ON public.quotes FOR SELECT TO authenticated USING (auth.uid() = submitted_by OR public.is_staff(auth.uid()));
CREATE POLICY "submit quote" ON public.quotes FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitted_by AND status = 'pending');
CREATE POLICY "staff moderate quotes" ON public.quotes FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff delete quotes" ON public.quotes FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'article',
  title text NOT NULL, summary text NOT NULL DEFAULT '', body text NOT NULL DEFAULT '',
  author_id uuid,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.articles TO authenticated;
GRANT ALL ON public.articles TO service_role;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published articles" ON public.articles FOR SELECT TO anon, authenticated USING (published OR public.is_staff(auth.uid()));
CREATE POLICY "staff write articles" ON public.articles FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.challenges TO anon, authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read challenges" ON public.challenges FOR SELECT TO anon, authenticated USING (true);

-- Seed
INSERT INTO public.businesses (name, category, description, services, city, province, phone, email, website, verified, featured, status) VALUES
('Ubuntu Bakes', 'Food & Catering', 'Family bakery serving fresh bread, cakes and catering for events since 2015.', 'Wedding cakes, Corporate catering, Daily bread', 'Soweto', 'Gauteng', '011 555 0101', 'hello@ubuntubakes.co.za', 'https://example.com', true, true, 'approved'),
('Kasi Code Labs', 'Technology', 'Web and mobile development studio helping township businesses go digital.', 'Websites, Mobile apps, IT support', 'Khayelitsha', 'Western Cape', '021 555 0202', 'info@kasicode.co.za', 'https://example.com', true, true, 'approved'),
('Mama Thandi Fashion', 'Fashion', 'Handmade African print clothing and custom tailoring.', 'Custom tailoring, Traditional wear, Alterations', 'Durban', 'KwaZulu-Natal', '031 555 0303', 'orders@mamathandi.co.za', NULL, true, false, 'approved'),
('GreenLeaf Gardens', 'Home & Garden', 'Landscaping and indoor plant care for homes and offices.', 'Landscaping, Plant hire, Garden maintenance', 'Pretoria', 'Gauteng', '012 555 0404', 'grow@greenleaf.co.za', NULL, false, false, 'approved'),
('Sizwe Auto Repairs', 'Automotive', 'Trusted mechanics for services, diagnostics and panel beating.', 'Servicing, Diagnostics, Panel beating', 'Polokwane', 'Limpopo', '015 555 0505', 'bookings@sizweauto.co.za', NULL, true, true, 'approved'),
('Bright Minds Tutoring', 'Education', 'Maths and science tutoring for grades 8–12.', 'One-on-one tutoring, Exam prep, Online classes', 'Gqeberha', 'Eastern Cape', '041 555 0606', 'learn@brightminds.co.za', NULL, false, false, 'approved');

INSERT INTO public.quotes (text, author, status) VALUES
('It always seems impossible until it''s done.', 'Nelson Mandela', 'approved'),
('If you want to go fast, go alone. If you want to go far, go together.', 'African Proverb', 'approved'),
('Success is not final, failure is not fatal: it is the courage to continue that counts.', 'Winston Churchill', 'approved'),
('The secret of getting ahead is getting started.', 'Mark Twain', 'approved'),
('Do not wait to strike till the iron is hot; make it hot by striking.', 'W.B. Yeats', 'approved'),
('Small daily improvements are the key to staggering long-term results.', 'Unknown', 'approved'),
('Education is the most powerful weapon which you can use to change the world.', 'Nelson Mandela', 'approved');

INSERT INTO public.articles (kind, title, summary, body) VALUES
('story', 'From a street stall to three stores', 'How Lerato turned R500 into a thriving spaza franchise.', 'Lerato started selling sweets outside her school with R500 borrowed from her aunt. She reinvested every cent, learned bookkeeping from YouTube, and opened her first spaza at 22. Today she runs three stores and employs eleven people from her community. Her advice: track every rand, treat customers like family, and never stop learning.'),
('story', 'The coder from the rural Eastern Cape', 'Sipho learned to code on a borrowed phone.', 'With patchy signal and a second-hand phone, Sipho completed free online courses at night. Two years later he landed a remote developer job and now mentors 40 young people in his village. "Consistency beats talent when talent doesn''t show up," he says.'),
('article', 'Five habits of resilient entrepreneurs', 'Practical routines that keep you going when business is tough.', '1. Start the day with your top three priorities. 2. Review your cash flow weekly. 3. Build a network of peers. 4. Rest deliberately. 5. Celebrate small wins — momentum is built from them.'),
('article', 'Setting goals that actually stick', 'Why most goals fail and how to fix yours.', 'Make goals specific, measurable and tied to a daily action. Instead of "get fit", try "walk 30 minutes after lunch". Write it down, share it with someone, and review it every Sunday.');

INSERT INTO public.challenges (title, description) VALUES
('Gratitude list', 'Write down three things you are grateful for today.'),
('Reach out', 'Send a message of encouragement to someone in your network.'),
('Learn for 20 minutes', 'Spend 20 minutes learning a new skill related to your goals.'),
('Support local', 'Buy from or recommend a small local business today.'),
('Digital detox hour', 'Spend one hour without your phone and reflect on your week.'),
('Plan tomorrow', 'Before bed, write your top three tasks for tomorrow.'),
('Move your body', 'Take a 30-minute walk and think about one big idea.');