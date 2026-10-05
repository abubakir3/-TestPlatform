-- ============================================================================
-- SUPABASE POSTGRESQL SCHEMA FOR ONLINE TEST PLATFORM (500+ CONCURRENT USERS)
-- Optimized for high concurrent read/writes, connection pooling & anti-cheat
-- ============================================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. GROUPS TABLE (Guruhlar va fanlar)
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    book_or_module VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for group listing & search
CREATE INDEX IF NOT EXISTS idx_groups_subject ON public.groups(subject);
CREATE INDEX IF NOT EXISTS idx_groups_created_at ON public.groups(created_at DESC);

-- 2. USERS / STUDENTS TABLE (O'quvchilar)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    telegram_chat_id BIGINT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crucial indexes for 500+ concurrent student lookups
CREATE INDEX IF NOT EXISTS idx_students_phone ON public.students(phone);
CREATE INDEX IF NOT EXISTS idx_students_group_id ON public.students(group_id);
CREATE INDEX IF NOT EXISTS idx_students_telegram_chat_id ON public.students(telegram_chat_id);

-- 3. OTP CODES TABLE (Telegram Bot OTP autentifikatsiyasi)
CREATE TABLE IF NOT EXISTS public.otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    telegram_chat_id BIGINT,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast OTP verification (<5ms response time under peak load)
CREATE INDEX IF NOT EXISTS idx_otp_phone_code ON public.otp_codes(phone, code) WHERE is_used = FALSE;
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON public.otp_codes(expires_at);

-- 4. TESTS TABLE (Testlar va sozlamalar)
CREATE TABLE IF NOT EXISTS public.tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    
    -- Settings stored as JSONB for rapid retrieval and zero-join execution
    settings JSONB NOT NULL DEFAULT '{
        "timerMinutes": 15,
        "maxAttempts": 1,
        "passingPercentage": 60,
        "shuffleQuestions": true,
        "shuffleOptions": true,
        "showExplanationsAfterTest": true,
        "startDate": null,
        "endDate": null
    }'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tests_group_id ON public.tests(group_id);
CREATE INDEX IF NOT EXISTS idx_tests_status ON public.tests(status);

-- 5. QUESTIONS TABLE (Savollar, variantlar va to'g'ri javoblar)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    order_number INT NOT NULL DEFAULT 1,
    question_text TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'multiple_choice' CHECK (type IN ('multiple_choice', 'true_false')),
    options JSONB NOT NULL, -- e.g. [{"id":"A","text":"Variant 1"}, {"id":"B","text":"Variant 2"}]
    correct_option_id VARCHAR(10) NOT NULL, -- SERVERDA SAQLANADI, O'QUVCHIGA BERILMAYDI!
    points NUMERIC(5,2) DEFAULT 1.0,
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- High-speed composite index for test questions
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON public.questions(test_id, order_number ASC);

-- 6. TEST ATTEMPTS TABLE (Natijalar, anti-cheat va sarflangan vaqt)
CREATE TABLE IF NOT EXISTS public.test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    time_spent_seconds INT NOT NULL DEFAULT 0,
    window_blur_violations INT NOT NULL DEFAULT 0, -- Anti-cheat oynadan chiqishlar soni
    total_questions INT NOT NULL,
    correct_answers_count INT NOT NULL,
    total_points_earned NUMERIC(6,2) NOT NULL,
    max_points_possible NUMERIC(6,2) NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb, -- {"q_uuid": "A"}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Critical composite indexes for fast teacher filtering and uncompleted student checks
CREATE INDEX IF NOT EXISTS idx_attempts_test_student ON public.test_attempts(test_id, student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_test_id ON public.test_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student_id ON public.test_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_completed_at ON public.test_attempts(completed_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Anonymous users (students with session token or public) can read active tests
CREATE POLICY "Public read groups" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Public read active tests" ON public.tests FOR SELECT USING (status = 'active');

-- SECURITY: O'quvchilarga to'g'ri javobni (correct_option_id) beruvchi savollar view'si
CREATE OR REPLACE VIEW public.student_questions_view AS
SELECT 
    id,
    test_id,
    order_number,
    question_text,
    type,
    options,
    points
FROM public.questions;

-- ============================================================================
-- SERVER-SIDE GRADING DATABASE FUNCTION (Xavfsiz hisoblash va tekshirish)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.submit_test_and_grade(
    p_test_id UUID,
    p_student_id UUID,
    p_answers JSONB,
    p_time_spent_seconds INT,
    p_window_blur_violations INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_test RECORD;
    v_q RECORD;
    v_correct_count INT := 0;
    v_total_questions INT := 0;
    v_earned_points NUMERIC(6,2) := 0;
    v_max_points NUMERIC(6,2) := 0;
    v_percentage NUMERIC(5,2) := 0;
    v_passed BOOLEAN := FALSE;
    v_attempt_id UUID;
    v_student_answer TEXT;
    v_passing_percentage NUMERIC(5,2);
BEGIN
    -- 1. Test ma'lumotlarini olish
    SELECT * INTO v_test FROM public.tests WHERE id = p_test_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Test topilmadi';
    END IF;

    v_passing_percentage := COALESCE((v_test.settings->>'passingPercentage')::NUMERIC, 60.0);

    -- 2. Har bir savol bo'yicha to'g'ri javobni faqat serverda solishtirish
    FOR v_q IN SELECT id, correct_option_id, points FROM public.questions WHERE test_id = p_test_id LOOP
        v_total_questions := v_total_questions + 1;
        v_max_points := v_max_points + COALESCE(v_q.points, 1.0);
        
        v_student_answer := p_answers->>v_q.id::TEXT;
        
        IF v_student_answer IS NOT NULL AND UPPER(TRIM(v_student_answer)) = UPPER(TRIM(v_q.correct_option_id)) THEN
            v_correct_count := v_correct_count + 1;
            v_earned_points := v_earned_points + COALESCE(v_q.points, 1.0);
        END IF;
    END LOOP;

    -- 3. Foiz va o'tish holati
    IF v_max_points > 0 THEN
        v_percentage := ROUND((v_earned_points / v_max_points) * 100.0, 2);
    ELSE
        v_percentage := 0;
    END IF;

    v_passed := v_percentage >= v_passing_percentage;

    -- 4. Natijani yozish
    INSERT INTO public.test_attempts (
        test_id,
        student_id,
        started_at,
        completed_at,
        time_spent_seconds,
        window_blur_violations,
        total_questions,
        correct_answers_count,
        total_points_earned,
        max_points_possible,
        percentage,
        passed,
        answers
    ) VALUES (
        p_test_id,
        p_student_id,
        NOW() - (p_time_spent_seconds || ' seconds')::INTERVAL,
        NOW(),
        p_time_spent_seconds,
        p_window_blur_violations,
        v_total_questions,
        v_correct_count,
        v_earned_points,
        v_max_points,
        v_percentage,
        v_passed,
        p_answers
    ) RETURNING id INTO v_attempt_id;

    -- 5. Natijani qaytarish
    RETURN jsonb_build_object(
        'attempt_id', v_attempt_id,
        'correct_count', v_correct_count,
        'total_questions', v_total_questions,
        'earned_points', v_earned_points,
        'max_points', v_max_points,
        'percentage', v_percentage,
        'passed', v_passed
    );
END;
$$;
