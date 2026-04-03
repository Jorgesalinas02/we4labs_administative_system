-- Docker local: rol `we4labs`. En Neon / hosting gestionado ese rol no existe → se omite.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'we4labs') THEN
    ALTER ROLE we4labs BYPASSRLS;
  END IF;
END $$;
