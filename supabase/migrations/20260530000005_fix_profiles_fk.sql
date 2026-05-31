-- 1. 删除所有 RLS 策略
DROP POLICY IF EXISTS "Users can view own and partner profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own and partner status" ON statuses;
DROP POLICY IF EXISTS "Users can insert own status" ON statuses;
DROP POLICY IF EXISTS "Users can update own status" ON statuses;
DROP POLICY IF EXISTS "Users can view own and partner notes" ON wall_notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON wall_notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON wall_notes;
DROP POLICY IF EXISTS "Users can view own and partner answers" ON topic_answers;
DROP POLICY IF EXISTS "Users can insert own answers" ON topic_answers;
DROP POLICY IF EXISTS "Users can view meet plans" ON meet_plans;
DROP POLICY IF EXISTS "Users can manage meet plans" ON meet_plans;
DROP POLICY IF EXISTS "Users can view meet tasks" ON meet_tasks;
DROP POLICY IF EXISTS "Users can manage meet tasks" ON meet_tasks;
DROP POLICY IF EXISTS "Users can view own math problems" ON math_problems;
DROP POLICY IF EXISTS "Users can manage own math problems" ON math_problems;
DROP POLICY IF EXISTS "Anyone can view formulas" ON math_formulas;
DROP POLICY IF EXISTS "Anyone can view vocab words" ON vocab_words;
DROP POLICY IF EXISTS "Users can view own vocab progress" ON vocab_progress;
DROP POLICY IF EXISTS "Users can manage own vocab progress" ON vocab_progress;
DROP POLICY IF EXISTS "Users can view related quizzes" ON vocab_quizzes;
DROP POLICY IF EXISTS "Users can insert quizzes" ON vocab_quizzes;
DROP POLICY IF EXISTS "Users can update own received quizzes" ON vocab_quizzes;
DROP POLICY IF EXISTS "Anyone can view daily topics" ON daily_topics;

-- 2. 删除所有公共表的外键约束
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_partner_id_fkey;
ALTER TABLE statuses DROP CONSTRAINT IF EXISTS statuses_user_id_fkey;
ALTER TABLE wall_notes DROP CONSTRAINT IF EXISTS wall_notes_user_id_fkey;
ALTER TABLE topic_answers DROP CONSTRAINT IF EXISTS topic_answers_user_id_fkey;
ALTER TABLE topic_answers DROP CONSTRAINT IF EXISTS topic_answers_topic_id_fkey;
ALTER TABLE math_problems DROP CONSTRAINT IF EXISTS math_problems_user_id_fkey;
ALTER TABLE vocab_progress DROP CONSTRAINT IF EXISTS vocab_progress_user_id_fkey;
ALTER TABLE vocab_progress DROP CONSTRAINT IF EXISTS vocab_progress_word_id_fkey;
ALTER TABLE vocab_quizzes DROP CONSTRAINT IF EXISTS vocab_quizzes_from_user_id_fkey;
ALTER TABLE vocab_quizzes DROP CONSTRAINT IF EXISTS vocab_quizzes_to_user_id_fkey;
ALTER TABLE meet_tasks DROP CONSTRAINT IF EXISTS meet_tasks_plan_id_fkey;

-- 3. 修改列类型为 TEXT
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;
ALTER TABLE statuses ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE wall_notes ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE topic_answers ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE topic_answers ALTER COLUMN topic_id TYPE TEXT;
ALTER TABLE math_problems ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE vocab_progress ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE vocab_progress ALTER COLUMN word_id TYPE TEXT;
ALTER TABLE vocab_quizzes ALTER COLUMN from_user_id TYPE TEXT;
ALTER TABLE vocab_quizzes ALTER COLUMN to_user_id TYPE TEXT;
ALTER TABLE meet_tasks ALTER COLUMN plan_id TYPE TEXT;
ALTER TABLE vocab_words ALTER COLUMN id TYPE TEXT;
ALTER TABLE daily_topics ALTER COLUMN id TYPE TEXT;
ALTER TABLE meet_plans ALTER COLUMN id TYPE TEXT;

-- 4. 确认 RLS 全部关闭
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE statuses DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_topics DISABLE ROW LEVEL SECURITY;
ALTER TABLE topic_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE wall_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE meet_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE meet_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE math_problems DISABLE ROW LEVEL SECURITY;
ALTER TABLE math_formulas DISABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_words DISABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_quizzes DISABLE ROW LEVEL SECURITY;
