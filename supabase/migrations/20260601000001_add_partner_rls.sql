-- ============================================
-- 009_add_partner_rls.sql — 伴侣关联 + 伙伴可见 RLS
-- ============================================

-- ═══ 1. profiles 增加邀请码列 ═══
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invite_code TEXT;

-- 为现有用户生成 6 位随机邀请码
UPDATE profiles SET invite_code = LOWER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6))
  WHERE invite_code IS NULL;

-- 唯一索引（防止重复邀请码）
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_invite_code ON profiles(invite_code);

-- ═══ 2. profiles RLS：自己和伴侣+所有人可读（邀请码查找需要） ═══
DROP POLICY IF EXISTS profiles_read_own ON profiles;
CREATE POLICY profiles_read_own ON profiles
  FOR SELECT TO authenticated
  USING (true);  -- profiles 信息不敏感，所有已认证用户可读

-- ═══ 4. statuses RLS：允许读取自己 + 伴侣的状态 ═══
DROP POLICY IF EXISTS statuses_read_own ON statuses;
CREATE POLICY statuses_read_own ON statuses
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()::text
    OR user_id = (SELECT partner_id FROM profiles WHERE id = auth.uid()::text)
  );

-- ═══ 5. statuses 补充 UPDATE 策略（目前缺失） ═══
DROP POLICY IF EXISTS statuses_update_own ON statuses;
CREATE POLICY statuses_update_own ON statuses
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text);

-- ═══ 6. wall_notes RLS：允许读取自己 + 伴侣的便签 ═══
DROP POLICY IF EXISTS wall_read_own ON wall_notes;
CREATE POLICY wall_read_own ON wall_notes
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()::text
    OR user_id = (SELECT partner_id FROM profiles WHERE id = auth.uid()::text)
  );

-- ═══ 7. topic_answers RLS：允许读取自己 + 伴侣的回答 ═══
DROP POLICY IF EXISTS answers_read_own ON topic_answers;
CREATE POLICY answers_read_own ON topic_answers
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()::text
    OR user_id = (SELECT partner_id FROM profiles WHERE id = auth.uid()::text)
  );
