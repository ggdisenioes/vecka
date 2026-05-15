-- LearnDash-style LMS structure
-- Adds: sections, topics, quizzes, assignments, certificates
-- Preserves existing modules/lessons for backward compatibility

-- ────────────────────────────────────────────
-- 1. Extend course_lessons for new structure
-- ────────────────────────────────────────────

-- Make module_id nullable so lessons can exist without a module (new-style)
ALTER TABLE public.course_lessons ALTER COLUMN module_id DROP NOT NULL;

-- Direct course link + sort_order for builder
ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Backfill course_id for existing lessons via their module
UPDATE public.course_lessons cl
SET course_id = cm.course_id
FROM public.course_modules cm
WHERE cl.module_id = cm.id AND cl.course_id IS NULL;

-- ────────────────────────────────────────────
-- 2. Sections (visual separators / labels)
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.course_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Nueva sección',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add section FK to lessons after sections table exists
ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES public.course_sections(id) ON DELETE SET NULL;

-- ────────────────────────────────────────────
-- 3. Topics (sub-lessons)
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.course_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL DEFAULT 'Nuevo tema',
  summary text,
  body text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order integer NOT NULL DEFAULT 0,
  is_preview boolean NOT NULL DEFAULT false,
  lesson_type text NOT NULL DEFAULT 'video' CHECK (lesson_type IN ('video', 'article', 'live_session', 'attachment')),
  video_provider text NOT NULL DEFAULT 'none' CHECK (video_provider IN ('vimeo', 'external', 'upload', 'none')),
  vimeo_url text,
  external_video_url text,
  video_storage_path text,
  video_bucket text NOT NULL DEFAULT 'course-videos',
  video_duration_seconds integer,
  live_session_url text,
  live_session_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS course_topics_lesson_slug_idx ON public.course_topics (lesson_id, slug);

-- ────────────────────────────────────────────
-- 4. Extend course_materials for topics
-- ────────────────────────────────────────────

ALTER TABLE public.course_materials
  ADD COLUMN IF NOT EXISTS topic_id uuid REFERENCES public.course_topics(id) ON DELETE CASCADE;

ALTER TABLE public.course_materials DROP CONSTRAINT IF EXISTS course_materials_exactly_one_parent;
ALTER TABLE public.course_materials ADD CONSTRAINT course_materials_exactly_one_parent CHECK (
  (CASE WHEN course_id IS NOT NULL THEN 1 ELSE 0 END)
  + (CASE WHEN module_id IS NOT NULL THEN 1 ELSE 0 END)
  + (CASE WHEN lesson_id IS NOT NULL THEN 1 ELSE 0 END)
  + (CASE WHEN topic_id IS NOT NULL THEN 1 ELSE 0 END) = 1
);

CREATE INDEX IF NOT EXISTS course_materials_topic_idx ON public.course_materials (topic_id);

-- ────────────────────────────────────────────
-- 5. Quizzes
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.course_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES public.course_topics(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Nuevo quiz',
  slug text NOT NULL,
  description text,
  pass_percentage integer NOT NULL DEFAULT 80,
  time_limit_minutes integer,
  show_correct_answers boolean NOT NULL DEFAULT true,
  randomize_questions boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.course_quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL DEFAULT '',
  question_type text NOT NULL DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice')),
  points integer NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  answer_text text NOT NULL DEFAULT '',
  is_correct boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES public.course_quizzes(id) ON DELETE CASCADE,
  score_points integer,
  total_points integer,
  passed boolean,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.quiz_attempt_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  answer_id uuid REFERENCES public.quiz_answers(id) ON DELETE CASCADE,
  is_correct boolean
);

-- ────────────────────────────────────────────
-- 6. Assignments
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.lesson_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES public.course_topics(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name text,
  storage_path text,
  bucket_name text DEFAULT 'lesson-assets',
  file_size_bytes bigint DEFAULT 0,
  mime_type text,
  notes text,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  graded_at timestamptz,
  grade text,
  feedback text
);

-- ────────────────────────────────────────────
-- 7. Certificates
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL UNIQUE REFERENCES public.courses(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Certificado de finalización',
  template_html text,
  background_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  certificate_id uuid NOT NULL REFERENCES public.certificates(id) ON DELETE CASCADE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- ────────────────────────────────────────────
-- 8. RLS
-- ────────────────────────────────────────────

ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certificates ENABLE ROW LEVEL SECURITY;

-- Sections
CREATE POLICY "staff_manage_sections" ON public.course_sections FOR ALL TO authenticated USING (public.has_staff_role(auth.uid()));
CREATE POLICY "public_read_sections" ON public.course_sections FOR SELECT TO anon, authenticated USING (
  EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_sections.course_id AND c.status = 'published' AND c.visibility IN ('public', 'catalog'))
);

-- Topics
CREATE POLICY "staff_manage_topics" ON public.course_topics FOR ALL TO authenticated USING (public.has_staff_role(auth.uid()));
CREATE POLICY "enrolled_read_topics" ON public.course_topics FOR SELECT TO authenticated USING (
  public.has_staff_role(auth.uid())
  OR is_preview = true
  OR public.has_active_course_access(course_id, auth.uid())
);

-- Quizzes
CREATE POLICY "staff_manage_quizzes" ON public.course_quizzes FOR ALL TO authenticated USING (public.has_staff_role(auth.uid()));
CREATE POLICY "enrolled_read_quizzes" ON public.course_quizzes FOR SELECT TO authenticated USING (
  public.has_staff_role(auth.uid()) OR public.has_active_course_access(course_id, auth.uid())
);

-- Questions
CREATE POLICY "staff_manage_questions" ON public.quiz_questions FOR ALL TO authenticated USING (public.has_staff_role(auth.uid()));
CREATE POLICY "enrolled_read_questions" ON public.quiz_questions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.course_quizzes q WHERE q.id = quiz_questions.quiz_id AND (public.has_staff_role(auth.uid()) OR public.has_active_course_access(q.course_id, auth.uid())))
);

-- Answers
CREATE POLICY "staff_manage_answers" ON public.quiz_answers FOR ALL TO authenticated USING (public.has_staff_role(auth.uid()));
CREATE POLICY "enrolled_read_answers" ON public.quiz_answers FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.quiz_questions qq
    JOIN public.course_quizzes q ON q.id = qq.quiz_id
    WHERE qq.id = quiz_answers.question_id
    AND (public.has_staff_role(auth.uid()) OR public.has_active_course_access(q.course_id, auth.uid()))
  )
);

-- Attempts
CREATE POLICY "users_manage_own_attempts" ON public.quiz_attempts FOR ALL TO authenticated USING (user_id = auth.uid() OR public.has_staff_role(auth.uid()));
CREATE POLICY "users_manage_own_attempt_answers" ON public.quiz_attempt_answers FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.quiz_attempts a WHERE a.id = quiz_attempt_answers.attempt_id AND (a.user_id = auth.uid() OR public.has_staff_role(auth.uid())))
);

-- Assignments
CREATE POLICY "users_manage_own_assignments" ON public.lesson_assignments FOR ALL TO authenticated USING (user_id = auth.uid() OR public.has_staff_role(auth.uid()));

-- Certificates
CREATE POLICY "staff_manage_certificates" ON public.certificates FOR ALL TO authenticated USING (public.has_staff_role(auth.uid()));
CREATE POLICY "enrolled_read_certificates" ON public.certificates FOR SELECT TO authenticated USING (
  public.has_active_course_access(course_id, auth.uid()) OR public.has_staff_role(auth.uid())
);
CREATE POLICY "users_see_own_user_certs" ON public.user_certificates FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_staff_role(auth.uid()));
CREATE POLICY "staff_issue_certificates" ON public.user_certificates FOR INSERT TO authenticated WITH CHECK (public.has_staff_role(auth.uid()));

-- ────────────────────────────────────────────
-- 9. Triggers
-- ────────────────────────────────────────────

CREATE TRIGGER course_topics_set_updated_at
  BEFORE UPDATE ON public.course_topics
  FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();

CREATE TRIGGER course_quizzes_set_updated_at
  BEFORE UPDATE ON public.course_quizzes
  FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();

CREATE TRIGGER certificates_set_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();

-- ────────────────────────────────────────────
-- 10. Update resolve_material_course_id for topics
-- ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.resolve_material_course_id(
  p_course_id uuid,
  p_module_id uuid,
  p_lesson_id uuid,
  p_topic_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    p_course_id,
    (SELECT course_id FROM public.course_modules WHERE id = p_module_id),
    (SELECT course_id FROM public.course_lessons WHERE id = p_lesson_id),
    (SELECT course_id FROM public.course_topics WHERE id = p_topic_id)
  );
$$;
