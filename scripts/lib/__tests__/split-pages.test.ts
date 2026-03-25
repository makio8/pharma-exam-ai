import { parsePageFiles, generatePageIds } from '../split-pages-core'

describe('split-pages-core', () => {
  describe('parsePageFiles', () => {
    it('page-NNN.pngのみを抽出する（left/right/api/smallは除外）', () => {
      const files = [
        'page-001.png', 'page-001-left.png', 'page-001-right.png',
        'page-001-api.png', 'page-001-left-small.png',
        'page-002.png', 'page-003.png',
      ]
      const result = parsePageFiles(files)
      expect(result).toEqual(['page-001.png', 'page-002.png', 'page-003.png'])
    })
  })

  describe('generatePageIds', () => {
    it('spreadPage数からleft/rightのページIDリストを生成する', () => {
      const ids = generatePageIds(2)
      expect(ids).toEqual([
        'page-001-left', 'page-001-right',
        'page-002-left', 'page-002-right',
      ])
    })
  })
})
