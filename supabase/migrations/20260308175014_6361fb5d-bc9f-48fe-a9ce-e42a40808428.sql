
-- Allow authenticated users to insert their own role
CREATE POLICY "Users can insert own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own role (for role changes during onboarding)
CREATE POLICY "Users can update own role"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
