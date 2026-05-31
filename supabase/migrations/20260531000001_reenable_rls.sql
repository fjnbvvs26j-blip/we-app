-- ============================================
-- 008_reenable_rls.sql — 多用户数据隔离
-- migration 00005 把 UUID 列改成了 TEXT，所以用 auth.uid()::text 匹配
-- ============================================

-- ═══ vocab_progress: 关键数据隔离 ═══
ALTER TABLE vocab_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS progress_read_own ON vocab_progress;
CREATE POLICY progress_read_own ON vocab_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS progress_insert_own ON vocab_progress;
CREATE POLICY progress_insert_own ON vocab_progress
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS progress_update_own ON vocab_progress;
CREATE POLICY progress_update_own ON vocab_progress
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text);

-- ═══ vocab_quizzes: 收发双方可见 ═══
ALTER TABLE vocab_quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quizzes_read_own ON vocab_quizzes;
CREATE POLICY quizzes_read_own ON vocab_quizzes
  FOR SELECT TO authenticated
  USING (from_user_id = auth.uid()::text OR to_user_id = auth.uid()::text);

DROP POLICY IF EXISTS quizzes_insert_own ON vocab_quizzes;
CREATE POLICY quizzes_insert_own ON vocab_quizzes
  FOR INSERT TO authenticated
  WITH CHECK (from_user_id = auth.uid()::text);

DROP POLICY IF EXISTS quizzes_update_own ON vocab_quizzes;
CREATE POLICY quizzes_update_own ON vocab_quizzes
  FOR UPDATE TO authenticated
  USING (to_user_id = auth.uid()::text);

-- ═══ profiles: 自己可见可写 ═══
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_read_own ON profiles;
CREATE POLICY profiles_read_own ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid()::text);

DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid()::text);

-- 允许 auth trigger 插入 (SECURITY DEFINER 函数不受 RLS 限制，但写个显式策略更安全)
DROP POLICY IF EXISTS profiles_insert_own ON profiles;
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid()::text);

-- ═══ wall_notes: 自己可见 ═══
ALTER TABLE wall_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS wall_read_own ON wall_notes;
CREATE POLICY wall_read_own ON wall_notes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS wall_insert_own ON wall_notes;
CREATE POLICY wall_insert_own ON wall_notes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS wall_delete_own ON wall_notes;
CREATE POLICY wall_delete_own ON wall_notes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text);

-- ═══ topic_answers: 自己可见 ═══
ALTER TABLE topic_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS answers_read_own ON topic_answers;
CREATE POLICY answers_read_own ON topic_answers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS answers_insert_own ON topic_answers;
CREATE POLICY answers_insert_own ON topic_answers
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

-- ═══ statuses: 自己可见 ═══
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS statuses_read_own ON statuses;
CREATE POLICY statuses_read_own ON statuses
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS statuses_insert_own ON statuses;
CREATE POLICY statuses_insert_own ON statuses
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

-- ═══ math_problems: 自己可见 ═══
ALTER TABLE math_problems ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS math_read_own ON math_problems;
CREATE POLICY math_read_own ON math_problems
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

-- ═══ 共享表：所有已认证用户只读 ═══
ALTER TABLE vocab_words ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vocab_read_all ON vocab_words;
CREATE POLICY vocab_read_all ON vocab_words
  FOR SELECT TO authenticated USING (true);

ALTER TABLE math_formulas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS formulas_read_all ON math_formulas;
CREATE POLICY formulas_read_all ON math_formulas
  FOR SELECT TO authenticated USING (true);

ALTER TABLE daily_topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS topics_read_all ON daily_topics;
CREATE POLICY topics_read_all ON daily_topics
  FOR SELECT TO authenticated USING (true);

ALTER TABLE meet_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS meet_read_all ON meet_plans;
CREATE POLICY meet_read_all ON meet_plans
  FOR SELECT TO authenticated USING (true);

ALTER TABLE meet_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS meet_tasks_read_all ON meet_tasks;
CREATE POLICY meet_tasks_read_all ON meet_tasks
  FOR SELECT TO authenticated USING (true);
