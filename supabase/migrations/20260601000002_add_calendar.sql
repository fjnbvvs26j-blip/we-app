-- ============================================
-- 010_add_calendar.sql — 日历 + 见面规划增强
-- ============================================

-- ═══ 1. 新建 calendar_entries 表 ═══
CREATE TABLE IF NOT EXISTS calendar_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  content TEXT,                              -- "今天做了什么"
  is_available BOOLEAN DEFAULT false,        -- "这天有空"
  is_meeting_day BOOLEAN DEFAULT false,      -- "见面日 ★"
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_calendar_user_date
  ON calendar_entries(user_id, date);

-- ═══ 2. 扩展 meet_plans 表 ═══
ALTER TABLE meet_plans ADD COLUMN IF NOT EXISTS destination TEXT;
ALTER TABLE meet_plans ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE meet_plans ADD COLUMN IF NOT EXISTS hotel TEXT;
ALTER TABLE meet_plans ADD COLUMN IF NOT EXISTS transport TEXT;
ALTER TABLE meet_plans ADD COLUMN IF NOT EXISTS budget NUMERIC(10,2);

-- ═══ 3. calendar_entries RLS ═══
ALTER TABLE calendar_entries ENABLE ROW LEVEL SECURITY;

-- 自己 + 伴侣可读
DROP POLICY IF EXISTS calendar_read_own ON calendar_entries;
CREATE POLICY calendar_read_own ON calendar_entries
  FOR SELECT TO authenticated
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = (SELECT partner_id::text FROM profiles WHERE id::text = auth.uid()::text)
  );

-- 自己可写
DROP POLICY IF EXISTS calendar_insert_own ON calendar_entries;
CREATE POLICY calendar_insert_own ON calendar_entries
  FOR INSERT TO authenticated
  WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS calendar_update_own ON calendar_entries;
CREATE POLICY calendar_update_own ON calendar_entries
  FOR UPDATE TO authenticated
  USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS calendar_delete_own ON calendar_entries;
CREATE POLICY calendar_delete_own ON calendar_entries
  FOR DELETE TO authenticated
  USING (user_id::text = auth.uid()::text);

-- ═══ 4. 补充 meet_plans / meet_tasks 写入 RLS ═══
-- （当前只有 SELECT 策略，需要 INSERT/UPDATE/DELETE 才能通过 API 写入）

DROP POLICY IF EXISTS meet_insert_all ON meet_plans;
CREATE POLICY meet_insert_all ON meet_plans
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS meet_update_all ON meet_plans;
CREATE POLICY meet_update_all ON meet_plans
  FOR UPDATE TO authenticated
  USING (true);

DROP POLICY IF EXISTS meet_delete_all ON meet_plans;
CREATE POLICY meet_delete_all ON meet_plans
  FOR DELETE TO authenticated
  USING (true);

-- meet_tasks 写入策略
DROP POLICY IF EXISTS meet_tasks_insert_all ON meet_tasks;
CREATE POLICY meet_tasks_insert_all ON meet_tasks
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS meet_tasks_update_all ON meet_tasks;
CREATE POLICY meet_tasks_update_all ON meet_tasks
  FOR UPDATE TO authenticated
  USING (true);

DROP POLICY IF EXISTS meet_tasks_delete_all ON meet_tasks;
CREATE POLICY meet_tasks_delete_all ON meet_tasks
  FOR DELETE TO authenticated
  USING (true);
