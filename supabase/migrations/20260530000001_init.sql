-- ============================================
-- 001_init.sql — 初始化全部表结构
-- ============================================

-- 1. 用户信息
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  target_school TEXT,
  partner_id UUID REFERENCES profiles(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 用户状态
CREATE TABLE IF NOT EXISTS statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'studying' CHECK (status IN ('studying', 'resting', 'missing_you', 'free_to_chat', 'custom')),
  custom_text TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id)
);

-- 3. 每日话题库
CREATE TABLE IF NOT EXISTS daily_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  used_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 话题回答
CREATE TABLE IF NOT EXISTS topic_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES daily_topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answer_text TEXT,
  answer_image_url TEXT,
  answer_audio_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (topic_id, user_id)
);

-- 5. 时光便签
CREATE TABLE IF NOT EXISTS wall_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_text TEXT,
  content_image_url TEXT,
  content_audio_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. 见面计划
CREATE TABLE IF NOT EXISTS meet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meet_date DATE,
  start_time TEXT,
  end_time TEXT,
  total_hours NUMERIC(4,1),
  study_hours NUMERIC(4,1),
  date_hours NUMERIC(4,1),
  from_city TEXT,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'confirmed', 'completed', 'cancelled')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. 见面任务（学习/约会）
CREATE TABLE IF NOT EXISTS meet_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES meet_plans(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN ('study', 'date', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. 数学错题
CREATE TABLE IF NOT EXISTS math_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chapter TEXT NOT NULL,
  topic TEXT,
  image_url TEXT,
  error_reason TEXT,
  correct_solution TEXT,
  difficulty INTEGER DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. 数学公式
CREATE TABLE IF NOT EXISTS math_formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('advanced_math', 'linear_algebra', 'probability')),
  title TEXT NOT NULL,
  formula_text TEXT NOT NULL,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

-- 10. 考研词汇
CREATE TABLE IF NOT EXISTS vocab_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  phonetic TEXT,
  meaning TEXT NOT NULL,
  example TEXT,
  list_number INTEGER DEFAULT 0,
  frequency TEXT CHECK (frequency IN ('high', 'medium', 'low')),
  metadata JSONB DEFAULT '{}'
);

-- 11. 单词学习进度
CREATE TABLE IF NOT EXISTS vocab_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES vocab_words(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'learning', 'known', 'review')),
  last_reviewed TIMESTAMPTZ,
  next_review TIMESTAMPTZ,
  review_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  UNIQUE (user_id, word_id)
);

-- 12. 互动出题
CREATE TABLE IF NOT EXISTS vocab_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quiz_type TEXT NOT NULL CHECK (quiz_type IN ('en_to_cn', 'cn_to_en', 'spelling')),
  words JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'reviewed')),
  score INTEGER,
  total INTEGER,
  encouragement TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- 索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_statuses_user ON statuses(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_answers_topic ON topic_answers(topic_id, user_id);
CREATE INDEX IF NOT EXISTS idx_wall_notes_user_created ON wall_notes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wall_notes_created ON wall_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meet_plans_date ON meet_plans(meet_date);
CREATE INDEX IF NOT EXISTS idx_meet_tasks_plan ON meet_tasks(plan_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_math_problems_user ON math_problems(user_id, chapter);
CREATE INDEX IF NOT EXISTS idx_math_formulas_category ON math_formulas(category, sort_order);
CREATE INDEX IF NOT EXISTS idx_vocab_words_list ON vocab_words(list_number);
CREATE INDEX IF NOT EXISTS idx_vocab_words_frequency ON vocab_words(frequency);
CREATE INDEX IF NOT EXISTS idx_vocab_progress_user ON vocab_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_vocab_progress_review ON vocab_progress(user_id, next_review);
CREATE INDEX IF NOT EXISTS idx_vocab_quizzes_from ON vocab_quizzes(from_user_id);
CREATE INDEX IF NOT EXISTS idx_vocab_quizzes_to ON vocab_quizzes(to_user_id);

-- ============================================
-- Row Level Security — 默认关闭，仅两人可见
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE wall_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meet_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE math_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE math_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_quizzes ENABLE ROW LEVEL SECURITY;

-- RLS 策略：只允许认证用户读/写自己或伴侣的数据
-- profiles 策略
CREATE POLICY "Users can view own and partner profile" ON profiles
  FOR SELECT TO authenticated USING (
    id = auth.uid() OR id = (SELECT partner_id FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- statuses 策略
CREATE POLICY "Users can view own and partner status" ON statuses
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR user_id = (SELECT partner_id FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY "Users can insert own status" ON statuses
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own status" ON statuses
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- wall_notes 策略
CREATE POLICY "Users can view own and partner notes" ON wall_notes
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR user_id = (SELECT partner_id FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY "Users can insert own notes" ON wall_notes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own notes" ON wall_notes
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- topic_answers 策略
CREATE POLICY "Users can view own and partner answers" ON topic_answers
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR user_id = (SELECT partner_id FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY "Users can insert own answers" ON topic_answers
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- meet_plans 策略
CREATE POLICY "Users can view meet plans" ON meet_plans
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage meet plans" ON meet_plans
  FOR ALL TO authenticated USING (true);

-- meet_tasks 策略
CREATE POLICY "Users can view meet tasks" ON meet_tasks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage meet tasks" ON meet_tasks
  FOR ALL TO authenticated USING (true);

-- math_problems 策略
CREATE POLICY "Users can view own math problems" ON math_problems
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR user_id = (SELECT partner_id FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY "Users can manage own math problems" ON math_problems
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- math_formulas 策略（所有人可读）
CREATE POLICY "Anyone can view formulas" ON math_formulas
  FOR SELECT TO authenticated USING (true);

-- vocab_words 策略（所有人可读）
CREATE POLICY "Anyone can view vocab words" ON vocab_words
  FOR SELECT TO authenticated USING (true);

-- vocab_progress 策略
CREATE POLICY "Users can view own vocab progress" ON vocab_progress
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR user_id = (SELECT partner_id FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY "Users can manage own vocab progress" ON vocab_progress
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- vocab_quizzes 策略
CREATE POLICY "Users can view related quizzes" ON vocab_quizzes
  FOR SELECT TO authenticated USING (
    from_user_id = auth.uid() OR to_user_id = auth.uid()
  );
CREATE POLICY "Users can insert quizzes" ON vocab_quizzes
  FOR INSERT TO authenticated WITH CHECK (from_user_id = auth.uid());
CREATE POLICY "Users can update own received quizzes" ON vocab_quizzes
  FOR UPDATE TO authenticated USING (to_user_id = auth.uid());

-- daily_topics 策略（所有人可读）
CREATE POLICY "Anyone can view daily topics" ON daily_topics
  FOR SELECT TO authenticated USING (true);
