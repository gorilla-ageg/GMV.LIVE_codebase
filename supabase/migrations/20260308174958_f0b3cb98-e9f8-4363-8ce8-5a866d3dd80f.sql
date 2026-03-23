
-- Update handle_new_user to handle missing role (set during onboarding now)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, role, display_name, onboarding_completed)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'creator'),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', ''),
    false
  );
  -- Only insert user_role if role is provided in metadata
  IF NEW.raw_user_meta_data ->> 'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data ->> 'role')::app_role
    );
  END IF;
  RETURN NEW;
END;
$function$;
