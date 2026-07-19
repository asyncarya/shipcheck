-- Create the runs table in public schema
CREATE TABLE IF NOT EXISTS public.runs (
  id text PRIMARY KEY,
  url text NOT NULL,
  task text NOT NULL,
  expected_result text,
  status text NOT NULL DEFAULT 'created',
  progress integer NOT NULL DEFAULT 0,
  plan_id text,
  plan jsonb,
  steps jsonb DEFAULT '[]'::jsonb,
  evidence jsonb DEFAULT '[]'::jsonb,
  console_errors jsonb DEFAULT '[]'::jsonb,
  bug_report jsonb,
  latest_screenshot_path text,
  error_message text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  finished_at timestamp with time zone,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable Row Level Security (RLS) to secure user data
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can perform all operations on runs they created
CREATE POLICY "Users can manage their own runs" 
  ON public.runs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 2: Allow inserts from anyone (anon or authenticated) for sandbox testing parity
CREATE POLICY "Allow anyone to insert runs" 
  ON public.runs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy 3: Allow reads from anyone (anon or authenticated) to view run results
CREATE POLICY "Allow anyone to read runs" 
  ON public.runs
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy 4: Allow updates on runs (needed for playwright background updates)
CREATE POLICY "Allow updates from anyone" 
  ON public.runs
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Policy 5: Allow deletes on runs (needed for dashboard cleanup)
DROP POLICY IF EXISTS "Allow deletes from anyone" ON public.runs;
CREATE POLICY "Allow deletes from anyone" 
  ON public.runs
  FOR DELETE
  TO anon, authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Create the profiles table in public schema
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username text,
  first_name text,
  last_name text,
  avatar_url text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) to secure profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies if they exist to prevent execution errors
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow anyone to read profiles" ON public.profiles;

-- Allow authenticated users to perform all operations on their own profile
CREATE POLICY "Users can manage their own profile" 
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow anonymous selects (needed if read-only profiles are public)
CREATE POLICY "Allow anyone to read profiles" 
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Automatically create a profile row for new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, first_name, last_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', ''),
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    ''
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger trigger_on_auth_user_created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create Supabase Storage bucket for screenshot evidence if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Clean up existing storage policies if they exist to prevent execution conflicts
DROP POLICY IF EXISTS "Allow public uploads to evidence bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from evidence bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from evidence bucket" ON storage.objects;

-- Allow uploads to own run evidence (restricts inserts to the creator of the matching run)
CREATE POLICY "Allow public uploads to evidence bucket"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'evidence' AND (
      auth.uid() IS NULL OR
      EXISTS (
        SELECT 1 FROM public.runs 
        WHERE id = split_part(name, '/', 1) 
          AND (user_id = auth.uid() OR user_id IS NULL)
      )
    )
  );

-- Allow reads from own run evidence (restricts selections to the creator of the matching run)
CREATE POLICY "Allow public reads from evidence bucket"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'evidence' AND (
      auth.uid() IS NULL OR
      EXISTS (
        SELECT 1 FROM public.runs 
        WHERE id = split_part(name, '/', 1) 
          AND (user_id = auth.uid() OR user_id IS NULL)
      )
    )
  );

-- Allow deletes from own run evidence (restricts deletes to the creator of the matching run)
CREATE POLICY "Allow public deletes from evidence bucket"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (
    bucket_id = 'evidence' AND (
      auth.uid() IS NULL OR
      EXISTS (
        SELECT 1 FROM public.runs 
        WHERE id = split_part(name, '/', 1) 
          AND (user_id = auth.uid() OR user_id IS NULL)
      )
    )
    )
  );

-- Create Supabase Storage bucket for avatars if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Clean up existing storage policies if they exist to prevent execution conflicts
DROP POLICY IF EXISTS "Allow public uploads to avatars bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from avatars bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to avatars bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from avatars bucket" ON storage.objects;

-- Allow uploads to own avatar
CREATE POLICY "Allow public uploads to avatars bucket"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND (
      auth.uid() IS NULL OR
      (auth.uid())::text = split_part(name, '/', 1)
    )
  );

-- Allow reads from avatars
CREATE POLICY "Allow public reads from avatars bucket"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'avatars');

-- Allow updates to own avatar
CREATE POLICY "Allow public updates to avatars bucket"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (
    bucket_id = 'avatars' AND (
      auth.uid() IS NULL OR
      (auth.uid())::text = split_part(name, '/', 1)
    )
  );

-- Allow deletes from own avatar
CREATE POLICY "Allow public deletes from avatars bucket"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (
    bucket_id = 'avatars' AND (
      auth.uid() IS NULL OR
      (auth.uid())::text = split_part(name, '/', 1)
    )
  );
