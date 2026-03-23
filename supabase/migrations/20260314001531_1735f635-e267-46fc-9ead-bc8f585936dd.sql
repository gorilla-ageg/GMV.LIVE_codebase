
-- Create a security definer function for safe role assignment during onboarding
CREATE OR REPLACE FUNCTION public.set_user_role(_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update or insert the user's role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), _role)
  ON CONFLICT (user_id, role) DO UPDATE SET role = _role;
  
  -- Also delete any other roles for this user (one role at a time)
  DELETE FROM public.user_roles
  WHERE user_id = auth.uid() AND role != _role;
END;
$$;
