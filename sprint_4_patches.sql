-- SPRINT 4 PATCHES: CLINICAL ISOLATION & RLS AUDIT
-- This migration enforces medical-grade data separation for external stakeholders.

-- 1. Create Stakeholder Project Access Table
CREATE TABLE IF NOT EXISTS public.stakeholder_project_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, project_id)
);

-- 2. Create Published Reports Table (Isolated from Documents)
CREATE TABLE IF NOT EXISTS public.published_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    version INT NOT NULL,
    name TEXT NOT NULL,
    content JSONB NOT NULL, -- Curated fields ONLY
    file_url TEXT NOT NULL,
    published_at TIMESTAMPTZ DEFAULT now(),
    published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 3. Create Stakeholder Feedback Table (Isolated from Comments)
CREATE TABLE IF NOT EXISTS public.stakeholder_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.published_reports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Bypass @nt.gmail.com for stakeholders
CREATE OR REPLACE FUNCTION public.validate_nt_email()
RETURNS trigger AS $$
BEGIN
  -- We check the profile role if already existing, or the raw_user_meta_data for new signups
  IF new.email NOT LIKE '%nt@gmail.com' 
     AND COALESCE(new.raw_user_meta_data->>'role', 'member') != 'stakeholder' THEN
    RAISE EXCEPTION 'Only @nt.gmail.com emails are permitted in the Synapse clinical environment.';
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. APPLY STRICT RLS AUDIT (Blocker)

-- Ensure RLS is enabled
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

-- RE-APPLY INTERNAL POLICIES with Stakeholder exclusion
-- NOTE: We explicitly block 'stakeholder' role from SELECTing any internal laboratory data.

DROP POLICY IF EXISTS "Internal Access Restricted" ON public.projects;
CREATE POLICY "Internal Access Restricted" ON public.projects
    FOR SELECT USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'stakeholder'
    );

DROP POLICY IF EXISTS "Internal Access Only" ON public.tasks;
CREATE POLICY "Internal Access Only" ON public.tasks
    FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) != 'stakeholder');

DROP POLICY IF EXISTS "Internal Access Only" ON public.task_logs;
CREATE POLICY "Internal Access Only" ON public.task_logs
    FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) != 'stakeholder');

DROP POLICY IF EXISTS "Internal Access Only" ON public.documents;
CREATE POLICY "Internal Access Only" ON public.documents
    FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) != 'stakeholder');

DROP POLICY IF EXISTS "Internal Access Only" ON public.audit_logs;
CREATE POLICY "Internal Access Only" ON public.audit_logs
    FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) != 'stakeholder');

DROP POLICY IF EXISTS "Internal Access Only" ON public.comments;
CREATE POLICY "Internal Access Only" ON public.comments
    FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) != 'stakeholder');

DROP POLICY IF EXISTS "Internal Access Only" ON public.workflows;
CREATE POLICY "Internal Access Only" ON public.workflows
    FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) != 'stakeholder');

DROP POLICY IF EXISTS "Internal Access Only" ON public.approval_requests;
CREATE POLICY "Internal Access Only" ON public.approval_requests
    FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) != 'stakeholder');

-- PORTAL ACCESS POLICIES

-- Published Reports RLS
ALTER TABLE public.published_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Stakeholders View Accessible Reports" ON public.published_reports;
CREATE POLICY "Stakeholders View Accessible Reports" ON public.published_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stakeholder_project_access spa
            WHERE spa.project_id = published_reports.project_id
            AND spa.user_id = auth.uid()
        )
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'lead')
    );

-- Stakeholder Feedback RLS
ALTER TABLE public.stakeholder_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Stakeholders View Accessible Feedback" ON public.stakeholder_feedback;
CREATE POLICY "Stakeholders View Accessible Feedback" ON public.stakeholder_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.published_reports pr
            JOIN public.stakeholder_project_access spa ON pr.project_id = spa.project_id
            WHERE pr.id = stakeholder_feedback.report_id
            AND spa.user_id = auth.uid()
        )
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'lead')
    );

DROP POLICY IF EXISTS "Stakeholders Insert Feedback" ON public.stakeholder_feedback;
CREATE POLICY "Stakeholders Insert Feedback" ON public.stakeholder_feedback
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'stakeholder'
        AND EXISTS (
             SELECT 1 FROM public.published_reports pr
             JOIN public.stakeholder_project_access spa ON pr.project_id = spa.project_id
             WHERE pr.id = report_id
             AND spa.user_id = auth.uid()
        )
    );
