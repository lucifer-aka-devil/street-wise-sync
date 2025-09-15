-- Enable realtime for report_votes table
ALTER TABLE public.report_votes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.report_votes;

-- Ensure the votes count trigger is properly set up
DROP TRIGGER IF EXISTS update_votes_count ON public.report_votes;
DROP TRIGGER IF EXISTS trg_report_votes_count ON public.report_votes;

CREATE TRIGGER update_votes_count
  AFTER INSERT OR DELETE ON public.report_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_report_votes_count();
