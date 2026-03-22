// scripts/lib/paths.ts
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const PROJECT_ROOT = path.join(__dirname, '..', '..')
export const DATA_DIR = path.join(PROJECT_ROOT, 'data')
export const PDF_DIR = path.join(DATA_DIR, 'pdfs')
export const PAGES_DIR = path.join(DATA_DIR, 'exam-pages')
export const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'images', 'questions')
export const REAL_QUESTIONS_DIR = path.join(PROJECT_ROOT, 'src', 'data', 'real-questions')
