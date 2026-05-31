-- 添加考研真题出现频率字段
ALTER TABLE vocab_words ADD COLUMN IF NOT EXISTS exam_frequency INTEGER DEFAULT 0;
