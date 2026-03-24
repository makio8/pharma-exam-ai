/**
 * 年度・区分 → PDFファイル名のマッピング
 * キー形式: '{回次}-{区分}' (例: '100-必須')
 */
export const PDF_FILE_MAP: Record<string, string[]> = {
  '100-必須': ['q100-hissu.pdf'],
  '100-理論': ['q100-riron1.pdf', 'q100-riron2.pdf'],
  '100-実践': ['q100-jissen1.pdf', 'q100-jissen2.pdf', 'q100-jissen3.pdf'],
  '101-必須': ['q101-hissu.pdf'],
  '101-理論': ['q101-riron1.pdf', 'q101-riron2.pdf'],
  '101-実践': ['q101-jissen1.pdf', 'q101-jissen2.pdf', 'q101-jissen3.pdf'],
  '102-必須': ['q102-hissu.pdf'],
  '102-理論': ['q102-riron1.pdf', 'q102-riron2.pdf'],
  '102-実践': ['q102-jissen1.pdf', 'q102-jissen2.pdf', 'q102-jissen3.pdf'],
  '103-必須': ['q103-hissu.pdf'],
  '103-理論': ['q103-riron1.pdf', 'q103-riron2.pdf'],
  '103-実践': ['q103-jissen1.pdf', 'q103-jissen2.pdf', 'q103-jissen3.pdf'],
  '104-必須': ['q104-hissu.pdf'],
  '104-理論': ['q104-riron1.pdf', 'q104-riron2.pdf'],
  '104-実践': ['q104-jissen1.pdf', 'q104-jissen2.pdf', 'q104-jissen3.pdf'],
  '105-必須': ['q105-hissu.pdf'],
  '105-理論': ['q105-riron1.pdf', 'q105-riron2.pdf'],
  '105-実践': ['q105-jissen1.pdf', 'q105-jissen2.pdf', 'q105-jissen3.pdf'],
  '106-必須': ['q106-hissu.pdf'],
  '106-理論': ['q106-riron1.pdf', 'q106-riron2.pdf'],
  '106-実践': ['q106-jissen1.pdf', 'q106-jissen2.pdf', 'q106-jissen3.pdf'],
  '107-必須': ['q107-hissu.pdf'],
  '107-理論': ['q107-riron1.pdf', 'q107-riron2.pdf'],
  '107-実践': ['q107-jissen1.pdf', 'q107-jissen2.pdf', 'q107-jissen3.pdf'],
  '108-必須': ['q108-hissu.pdf'],
  '108-理論': ['q108-riron1.pdf', 'q108-riron2.pdf'],
  '108-実践': ['q108-jissen1.pdf', 'q108-jissen2.pdf', 'q108-jissen3.pdf'],
  '109-必須': ['q109-hissu.pdf'],
  '109-理論': ['q109-riron1.pdf', 'q109-riron2.pdf'],
  '109-実践': ['q109-jissen1.pdf', 'q109-jissen2.pdf', 'q109-jissen3.pdf'],
  '110-必須': ['q110-hissu.pdf'],
  '110-理論': ['q110-riron1.pdf', 'q110-riron2.pdf'],
  '110-実践': ['q110-jissen1.pdf', 'q110-jissen2.pdf', 'q110-jissen3.pdf'],
}

/** PDFファイルの絶対URLを返す（Vite dev server用） */
export function getPdfUrl(filename: string): string {
  return `/@fs${import.meta.env.VITE_PROJECT_ROOT ?? ''}/data/pdfs/${filename}`
}
