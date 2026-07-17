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
