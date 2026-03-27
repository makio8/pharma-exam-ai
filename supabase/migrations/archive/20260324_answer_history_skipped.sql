-- QuestionPage リデザイン: スキップ機能 + 自信度廃止の後方互換対応
ALTER TABLE answer_history ALTER COLUMN confidence_level DROP NOT NULL;
ALTER TABLE answer_history ALTER COLUMN selected_answer DROP NOT NULL;
ALTER TABLE answer_history ADD COLUMN IF NOT EXISTS skipped boolean DEFAULT false;
