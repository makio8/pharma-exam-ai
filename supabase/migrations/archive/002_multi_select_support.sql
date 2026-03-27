-- 複数選択問題対応: correct_answer と selected_answer を配列対応に拡張
-- int → jsonb に変更して number | number[] を格納可能にする

-- questions テーブル
ALTER TABLE questions
  DROP CONSTRAINT IF EXISTS questions_correct_answer_check,
  ALTER COLUMN correct_answer TYPE jsonb USING to_jsonb(correct_answer);

-- answer_history テーブル
ALTER TABLE answer_history
  DROP CONSTRAINT IF EXISTS answer_history_selected_answer_check,
  ALTER COLUMN selected_answer TYPE jsonb USING to_jsonb(selected_answer);

-- コメント追加
COMMENT ON COLUMN questions.correct_answer IS '正解: 単一選択はnumber(例: 3), 複数選択はarray(例: [1,3])';
COMMENT ON COLUMN answer_history.selected_answer IS '選択した回答: 単一はnumber, 複数はarray';
