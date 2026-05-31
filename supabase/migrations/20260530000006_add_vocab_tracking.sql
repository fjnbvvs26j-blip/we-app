-- 添加单词背诵追踪字段
ALTER TABLE vocab_progress ADD COLUMN IF NOT EXISTS times_known INTEGER DEFAULT 0;
ALTER TABLE vocab_progress ADD COLUMN IF NOT EXISTS times_unknown INTEGER DEFAULT 0;
