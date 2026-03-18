// 問題データ（厚労省実データ 第100〜110回 全3,795問）
// 実データ: 厚労省 第100〜110回薬剤師国家試験より取得（id: r100-xxx 〜 r110-xxx）

import type { Question } from '../types/question'
import { EXAM_100_QUESTIONS } from './real-questions/exam-100'
import { EXAM_101_QUESTIONS } from './real-questions/exam-101'
import { EXAM_102_QUESTIONS } from './real-questions/exam-102'
import { EXAM_103_QUESTIONS } from './real-questions/exam-103'
import { EXAM_104_QUESTIONS } from './real-questions/exam-104'
import { EXAM_105_QUESTIONS } from './real-questions/exam-105'
import { EXAM_106_QUESTIONS } from './real-questions/exam-106'
import { EXAM_107_QUESTIONS } from './real-questions/exam-107'
import { EXAM_108_QUESTIONS } from './real-questions/exam-108'
import { EXAM_109_QUESTIONS } from './real-questions/exam-109'
import { EXAM_110_QUESTIONS } from './real-questions/exam-110'

/** 全問題データ（第100〜110回） */
export const ALL_QUESTIONS: Question[] = [
  ...EXAM_100_QUESTIONS,
  ...EXAM_101_QUESTIONS,
  ...EXAM_102_QUESTIONS,
  ...EXAM_103_QUESTIONS,
  ...EXAM_104_QUESTIONS,
  ...EXAM_105_QUESTIONS,
  ...EXAM_106_QUESTIONS,
  ...EXAM_107_QUESTIONS,
  ...EXAM_108_QUESTIONS,
  ...EXAM_109_QUESTIONS,
  ...EXAM_110_QUESTIONS,
]

// 後方互換: 旧名称でもアクセス可能
export const DUMMY_QUESTIONS = ALL_QUESTIONS
