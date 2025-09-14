-- Keep votes_count in sync globally
CREATE TRIGGER trg_report_votes_count
AFTER INSERT OR DELETE ON public.report_votes
FOR EACH ROW EXECUTE FUNCTION public.update_report_votes_count();

-- Auto-update updated_at for reports
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reports_updated_at'
  ) THEN
    CREATE TRIGGER trg_reports_updated_at
    BEFORE UPDATE ON public.reports
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Cascade delete related rows when a report is deleted
CREATE OR REPLACE FUNCTION public.cascade_delete_report_children()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.report_votes WHERE report_id = OLD.id;
  DELETE FROM public.report_updates WHERE report_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reports_cascade_children'
  ) THEN
    CREATE TRIGGER trg_reports_cascade_children
    AFTER DELETE ON public.reports
    FOR EACH ROW EXECUTE FUNCTION public.cascade_delete_report_children();
  END IF;
END $$;