-- Allow admins and staff to delete reports
CREATE POLICY IF NOT EXISTS "Admins or staff can delete reports"
ON public.reports
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin','staff')
  )
);
