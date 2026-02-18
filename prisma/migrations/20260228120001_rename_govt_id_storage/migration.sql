-- Rename GovIdStorage to govt_id_storage if the old table exists (fixes "table does not exist" / case issues)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'GovIdStorage'
  ) THEN
    ALTER TABLE "GovIdStorage" RENAME TO "govt_id_storage";
  END IF;
END $$;
