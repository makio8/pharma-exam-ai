/**
 * pdfjs-dist Worker ラッパー（Safari 互換用）
 *
 * pdfjs-dist v5.5+ は Map.prototype.getOrInsertComputed（TC39 Stage 3）を使用するが
 * Safari 18.x 以前では未サポート。Worker は独立スレッドのためメインスレッドの
 * ポリフィルが適用されない。このラッパーでポリフィル後に本体を読み込む。
 */

// eslint-disable-next-line no-extend-native
if (typeof Map.prototype.getOrInsertComputed !== 'function') {
  Map.prototype.getOrInsertComputed = function (key, callbackFn) {
    if (this.has(key)) return this.get(key)
    const value = callbackFn(key)
    this.set(key, value)
    return value
  }
}

// 本体の Worker を動的にインポート（Vite が bare specifier を解決してくれる）
import('pdfjs-dist/build/pdf.worker.mjs')
