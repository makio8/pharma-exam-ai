/**
 * Tier1レビューページ v3 を生成
 * - 連問シナリオ表示
 * - 明確な判定基準
 * - セクション分け
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, '..', 'src', 'data', 'real-questions')
const outPath = path.join(__dirname, '..', 'public', 'review-tier1.html')

const review = JSON.parse(fs.readFileSync(path.join(dataDir, 'tier1-review-results.json'), 'utf-8'))
const allIds: string[] = [...review.ng_critical_ids, ...review.ng_improve_ids, ...review.ok_ids]

interface Choice {
  key: number
  text: string
}

interface Item {
  id: string; year: number; qnum: number; text: string; image_url: string
  keyword: string; linked_scenario: string | null; linked_group: string | null
  choices_empty: boolean; choices: Choice[]; prev: string
  display_mode: string
}

const items: Item[] = []
for (const id of allIds) {
  const m = id.match(/r(\d+)-(\d+)/)
  if (!m) continue
  const year = parseInt(m[1]), numStr = m[2]
  const content = fs.readFileSync(path.join(dataDir, `exam-${year}.ts`), 'utf-8')
  const questions = JSON.parse(content.substring(content.indexOf('[\n')).trimEnd())
  const q = questions.find((q: any) => q.id === id)
  if (!q) continue
  // display_mode判定（text-normalizer.tsのロジックを再現）
  const choicesEmpty = !q.choices || q.choices.length === 0
    || q.choices.every((c: any) => (c.text || '').trim() === '')
  let displayMode = 'text'
  if (q.display_mode_override) displayMode = q.display_mode_override
  else if (!q.image_url) displayMode = 'text'
  else if (choicesEmpty) displayMode = (q.question_text?.trim().length ?? 0) > 30 ? 'both' : 'image'
  else if (q.visual_content_type === 'text_only') displayMode = 'text'
  else displayMode = 'both'

  items.push({
    id, year, qnum: q.question_number,
    text: q.question_text || '',
    image_url: q.image_url || `/images/questions/${year}/q${numStr}.png`,
    keyword: (q.question_text || '').match(/下図|この図|次の図|構造式|模式図|グラフ|図に示/)?.[0] || '',
    linked_scenario: q.linked_scenario || null,
    linked_group: q.linked_group || null,
    choices_empty: !q.choices || q.choices.length === 0,
    choices: (q.choices || []).map((c: any) => ({ key: c.key, text: c.text || '' })),
    prev: review.ng_critical_ids.includes(id) ? 'ng-critical'
      : review.ng_improve_ids.includes(id) ? 'ng-improve' : 'ok',
    display_mode: displayMode,
  })
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
const prevLabel: Record<string, string> = { 'ng-critical': 'v1: 🔴致命的', 'ng-improve': 'v1: 🟡改善', ok: 'v1: ✅OK' }
const prevBg: Record<string, string> = { 'ng-critical': '#f4433620', 'ng-improve': '#ff980020', ok: '#4caf5020' }
const prevFg: Record<string, string> = { 'ng-critical': '#f44336', 'ng-improve': '#ff9800', ok: '#4caf50' }

function renderCard(d: Item, idx: number): string {
  const scenarioHtml = d.linked_scenario
    ? `<div class="scenario-box">
        <div class="scenario-label">📋 連問シナリオ（アプリで別途テキスト表示される内容）</div>
        <div class="scenario-text">${esc(d.linked_scenario)}</div>
       </div>` : ''

  const modeLabel = d.choices_empty
    ? '<span class="badge mode-img">image mode</span>'
    : '<span class="badge mode-both">both mode</span>'

  return `
    <div class="card" id="card-${d.id}" data-prev="${d.prev}" data-idx="${idx}">
      <div class="card-header">
        <div class="card-info">
          <span class="badge year">第${d.year}回</span>
          <span class="badge qnum">問${d.qnum}</span>
          <span class="badge id">${d.id}</span>
          ${d.keyword ? `<span class="badge keyword">${esc(d.keyword)}</span>` : ''}
          ${d.linked_scenario ? '<span class="badge linked">連問</span>' : ''}
          ${modeLabel}
          <span class="badge prev" style="background:${prevBg[d.prev]};color:${prevFg[d.prev]}">${prevLabel[d.prev]}</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-ok" onclick="mark('${d.id}','ok')">✅ OK</button>
          <button class="btn btn-ng-critical" onclick="mark('${d.id}','ng-critical')">🔴 致命的</button>
          <button class="btn btn-ng-improve" onclick="mark('${d.id}','ng-improve')">🟡 改善</button>
          <button class="btn btn-reset" onclick="mark('${d.id}',null)">リセット</button>
          <button class="btn crop-btn" onclick="startCrop('${d.id}')" id="crop-btn-${d.id}">✂ クロップ</button>
        </div>
      </div>
      <div class="card-body">
        <div class="app-preview">
          <div class="app-preview-label">📱 アプリ表示プレビュー（${d.display_mode} mode）</div>
          ${scenarioHtml}
          ${d.display_mode !== 'image' ? `<div class="question-text">${esc(d.text.substring(0, 300))}${d.text.length > 300 ? '...' : ''}</div>` : ''}
          ${d.image_url && d.display_mode !== 'text' ? `<div class="image-container">
            <img src="${d.image_url}" alt="問${d.qnum}の画像" loading="lazy"
                 onerror="this.parentElement.innerHTML='<div class=img-error>画像エラー: '+this.src+'</div>'" />
          </div>` : d.display_mode === 'text' ? '<div class="no-image-note">（画像なし — テキストのみ表示）</div>' : ''}
          ${d.choices.length > 0 ? `<div class="choices-preview">
            ${d.choices.map(c => `<div class="choice-item"><span class="choice-key">${c.key}</span><span class="choice-text">${esc(c.text)}</span></div>`).join('')}
          </div>` : '<div class="choices-preview"><div class="choice-item" style="color:#999">（選択肢なし — 番号ボタンUI）</div></div>'}
        </div>
        <div class="reason-area" id="reason-${d.id}" style="display:none;margin-top:8px">
          <div class="reason-chips">
            <button class="reason-chip" onclick="toggleReason('${d.id}','問題文重複')">問題文重複</button>
            <button class="reason-chip" onclick="toggleReason('${d.id}','シナリオ重複')">シナリオ重複</button>
            <button class="reason-chip" onclick="toggleReason('${d.id}','シナリオ画像を問題に誤配置')">シナリオ画像を問題に誤配置</button>
            <button class="reason-chip" onclick="toggleReason('${d.id}','次の問題が混入')">次の問題が混入</button>
            <button class="reason-chip" onclick="toggleReason('${d.id}','空白過多')">空白過多</button>
            <button class="reason-chip" onclick="toggleReason('${d.id}','図が見えない')">図が見えない</button>
            <button class="reason-chip" onclick="toggleReason('${d.id}','選択肢途切れ')">選択肢途切れ</button>
          </div>
          <input type="text" class="reason-comment" id="comment-${d.id}" placeholder="その他コメント..."
                 onchange="saveComment('${d.id}', this.value)" />
        </div>
      </div>
    </div>`
}

const ngCritical = items.filter(d => d.prev === 'ng-critical')
const ngImprove = items.filter(d => d.prev === 'ng-improve')
const ok = items.filter(d => d.prev === 'ok')
let idx = 0

const cardsHtml =
  `<div class="section-divider red">🔴 前回致命的（${ngCritical.length}問）— 修復確認</div>\n` +
  ngCritical.map(d => renderCard(d, idx++)).join('\n') +
  `\n<div class="section-divider orange">🟡 前回改善（${ngImprove.length}問）— トリミング確認</div>\n` +
  ngImprove.map(d => renderCard(d, idx++)).join('\n') +
  `\n<div class="section-divider green">✅ 前回OK（${ok.length}問）— 変更なし確認</div>\n` +
  ok.map(d => renderCard(d, idx++)).join('\n')

const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tier 1 画像レビュー v3（${items.length}問）</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Hiragino Kaku Gothic ProN","Noto Sans JP",sans-serif;background:#f5f5f5;color:#333;padding-top:210px;padding-bottom:40px}
.sticky-header{position:fixed;top:0;left:0;right:0;z-index:1000;background:#fff;border-bottom:2px solid #e0e0e0;box-shadow:0 2px 8px rgba(0,0,0,.08);padding:10px 20px}
.header-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:6px}
.header-top h1{font-size:15px;font-weight:700}
.criteria-box{background:#f0f7ff;border:1px solid #bbdefb;border-radius:6px;padding:6px 10px;margin-bottom:6px;font-size:11px;line-height:1.7}
.criteria-box strong{color:#1565c0}
.criteria-box .c-item{display:block}
.filter-tabs{display:flex;gap:3px;flex-wrap:wrap}
.filter-tab{padding:2px 8px;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer;font-size:11px}
.filter-tab.active{background:#1976d2;color:#fff;border-color:#1976d2}
.counters{display:flex;gap:10px;align-items:center;font-size:12px;margin-bottom:3px}
.counter-dot{width:9px;height:9px;border-radius:50%;display:inline-block}
.counter-dot.ok{background:#4caf50}.counter-dot.ng-critical{background:#f44336}.counter-dot.ng-improve{background:#ff9800}.counter-dot.pending{background:#bbb}
.progress-bar{height:4px;background:#e0e0e0;border-radius:2px;overflow:hidden}
.progress-fill{height:100%;display:flex}.progress-ok{background:#4caf50}.progress-ng-critical{background:#f44336}.progress-ng-improve{background:#ff9800}
.header-actions{display:flex;gap:4px}
.header-actions button{padding:2px 8px;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer;font-size:11px}

.container{max-width:900px;margin:0 auto;padding:0 16px}
.section-divider{padding:6px 14px;margin:16px 0 8px;border-radius:6px;font-size:12px;font-weight:600}
.section-divider.red{background:#ffebee;color:#c62828}.section-divider.orange{background:#fff3e0;color:#e65100}.section-divider.green{background:#e8f5e9;color:#2e7d32}

.card{background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.08);margin-bottom:14px;overflow:hidden;border-left:4px solid #bbb;transition:border-color .2s}
.card.status-ok{border-left-color:#4caf50}.card.status-ng-critical{border-left-color:#f44336;background:#fff5f5}.card.status-ng-improve{border-left-color:#ff9800;background:#fff8e1}

.card-header{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#fafafa;border-bottom:1px solid #eee;flex-wrap:wrap;gap:4px}
.card-info{display:flex;gap:3px;flex-wrap:wrap}
.badge{padding:1px 6px;border-radius:3px;font-size:10px;font-weight:600}
.badge.year{background:#e3f2fd;color:#1565c0}.badge.qnum{background:#fff3e0;color:#e65100}.badge.id{background:#f3e5f5;color:#7b1fa2}
.badge.keyword{background:#e8f5e9;color:#2e7d32}.badge.linked{background:#fce4ec;color:#c62828}
.badge.mode-both{background:#e0f2f1;color:#00695c}.badge.mode-img{background:#ede7f6;color:#4527a0}
.badge.prev{font-size:9px;border:1px solid currentColor}

.card-actions{display:flex;gap:2px}
.btn{padding:2px 8px;border:1px solid #ccc;border-radius:3px;cursor:pointer;font-size:11px;font-weight:600;transition:all .15s}
.btn-ok{background:#e8f5e9;color:#2e7d32;border-color:#a5d6a7}.btn-ok:hover,.btn-ok.active{background:#4caf50;color:#fff}
.btn-ng-critical{background:#ffebee;color:#c62828;border-color:#ef9a9a}.btn-ng-critical:hover,.btn-ng-critical.active{background:#f44336;color:#fff}
.btn-ng-improve{background:#fff3e0;color:#e65100;border-color:#ffcc80}.btn-ng-improve:hover,.btn-ng-improve.active{background:#ff9800;color:#fff}
.btn-reset{background:#f5f5f5;color:#666}.btn-reset:hover{background:#e0e0e0}

.card-body{padding:12px}
.app-preview{border:1px solid #e0e0e0;border-radius:8px;padding:12px;background:#fafafa;margin-bottom:8px}
.app-preview-label{font-size:10px;color:#999;margin-bottom:8px;padding-bottom:4px;border-bottom:1px dashed #e0e0e0}
.no-image-note{padding:12px;text-align:center;color:#999;font-size:11px;background:#f5f5f5;border-radius:4px;margin:8px 0}
.choices-preview{margin-top:10px;border-top:1px solid #e0e0e0;padding-top:8px}
.choice-item{display:flex;gap:8px;padding:4px 8px;margin-bottom:3px;border-radius:4px;font-size:12px;border:1px solid #e0e0e0;background:#fff}
.choice-item:hover{background:#f5f5f5}
.choice-key{font-weight:700;color:#1976d2;min-width:16px}
.choice-text{flex:1;line-height:1.4}
.scenario-box{background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:8px 10px;margin-bottom:8px}
.scenario-label{font-size:10px;font-weight:700;color:#f57f17;margin-bottom:3px}
.scenario-text{font-size:12px;line-height:1.5;color:#555;white-space:pre-wrap}
.question-text{font-size:12px;line-height:1.5;margin-bottom:8px;padding:6px 10px;background:#f9f9f9;border-radius:4px;border-left:3px solid #1976d2}
.image-container{text-align:center}
.image-container img{max-width:600px;width:100%;height:auto;border:1px solid #ddd;border-radius:4px}
.img-error{padding:20px;background:#fff3e0;color:#e65100;border-radius:4px;border:2px dashed #ffcc02;font-size:12px}

.reason-area{border-top:1px solid #eee;padding-top:8px}
.reason-chips{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px}
.reason-chip{padding:2px 8px;border:1px solid #ccc;border-radius:12px;background:#fff;cursor:pointer;font-size:10px;transition:all .15s}
.reason-chip.selected{background:#ff9800;color:#fff;border-color:#ff9800}
.reason-chip.selected-critical{background:#f44336;color:#fff;border-color:#f44336}
.reason-comment{width:100%;padding:4px 8px;border:1px solid #ddd;border-radius:4px;font-size:11px;outline:none}
.reason-comment:focus{border-color:#1976d2}

.crop-btn{background:#e3f2fd;color:#1565c0;border-color:#90caf9}
.crop-btn:hover{background:#1976d2;color:#fff}
.crop-btn.has-crop{background:#1565c0;color:#fff}
.image-container.crop-mode{cursor:crosshair;position:relative;user-select:none}
.crop-overlay{position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.3);pointer-events:none}
.crop-selection{position:absolute;border:2px dashed #1976d2;background:rgba(25,118,210,0.1);pointer-events:none;z-index:10}
.crop-saved-indicator{position:absolute;border:2px solid #4caf50;background:rgba(76,175,80,0.1);pointer-events:none;z-index:5}
.crop-preview{margin-top:8px;text-align:center}
.crop-preview img{max-width:400px;border:2px solid #1976d2;border-radius:4px}
.crop-actions{display:flex;gap:4px;margin-top:6px;justify-content:center}
.crop-actions button{padding:3px 12px;border:1px solid #ccc;border-radius:4px;cursor:pointer;font-size:11px}
.crop-save-btn{background:#4caf50;color:#fff;border-color:#4caf50}
.crop-save-btn:hover{background:#388e3c}
.crop-cancel-btn{background:#f5f5f5}
.crop-cancel-btn:hover{background:#e0e0e0}
.crop-clear-btn{background:#ff9800;color:#fff;border-color:#ff9800}
.crop-clear-btn:hover{background:#f57c00}

.modal-overlay{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:2000;justify-content:center;align-items:center}
.modal-overlay.show{display:flex}
.modal{background:#fff;border-radius:8px;padding:20px;max-width:600px;width:90%;max-height:80vh;overflow-y:auto}
.modal pre{background:#f5f5f5;padding:10px;border-radius:4px;font-size:11px;overflow-x:auto;white-space:pre-wrap}
.modal button{margin-top:8px;padding:6px 12px;border:none;border-radius:4px;background:#1976d2;color:#fff;cursor:pointer;font-size:12px;margin-right:6px}

@media(max-width:640px){body{padding-top:240px}.card-header{flex-direction:column;align-items:flex-start}.image-container img{max-width:100%}}
</style>
</head>
<body>

<div class="sticky-header">
  <div class="header-top">
    <h1>Tier 1 画像レビュー v3（全${items.length}問）</h1>
    <div style="display:flex;align-items:center;gap:6px">
      <div class="filter-tabs">
        <button class="filter-tab active" onclick="filterCards('all')">すべて</button>
        <button class="filter-tab" onclick="filterCards('pending')">未判定</button>
        <button class="filter-tab" onclick="filterCards('ok')">OK</button>
        <button class="filter-tab" onclick="filterCards('ng-critical')">🔴致命的</button>
        <button class="filter-tab" onclick="filterCards('ng-improve')">🟡改善</button>
        <button class="filter-tab" onclick="filterCards('prev-ng')">前回NG</button>
      </div>
      <div class="header-actions">
        <button onclick="exportResults()">エクスポート</button>
        <button onclick="resetAll()">全リセット</button>
      </div>
    </div>
  </div>
  <div class="criteria-box">
    <strong>判定基準（bothモード = テキスト選択肢あり）:</strong>
    <span class="c-item">✅ OK = 図・グラフ・構造式が見える（問題文テキストの重複は許容）</span>
    <span class="c-item">🔴 致命的 = 肝心の図が見えない / 別問題の図 / シナリオだけで問題本体がない</span>
    <span class="c-item">🟡 改善 = 図は見えるが余分な内容あり（次の問題文、大きな空白等）</span>
    <span class="c-item">📋 連問 = シナリオが黄色ボックスに表示。画像は問題固有の図のみ必要</span>
  </div>
  <div class="counters">
    <span><span class="counter-dot ok"></span> OK: <strong id="count-ok">0</strong></span>
    <span><span class="counter-dot ng-critical"></span> 致命的: <strong id="count-ng-critical">0</strong></span>
    <span><span class="counter-dot ng-improve"></span> 改善: <strong id="count-ng-improve">0</strong></span>
    <span><span class="counter-dot pending"></span> 未判定: <strong id="count-pending">${items.length}</strong></span>
    <span style="margin-left:auto;font-size:11px;color:#888">進捗: <strong id="count-pct">0</strong>%</span>
  </div>
  <div class="progress-bar"><div class="progress-fill" id="progress-fill"></div></div>
</div>

<div class="container" id="cards-container">
${cardsHtml}
</div>

<div class="modal-overlay" id="export-modal">
  <div class="modal">
    <h3>レビュー結果</h3>
    <pre id="export-content"></pre>
    <button onclick="navigator.clipboard.writeText(document.getElementById('export-content').textContent).then(()=>alert('コピーしました'))">コピー</button>
    <button onclick="document.getElementById('export-modal').classList.remove('show')">閉じる</button>
  </div>
</div>

<script>
const TOTAL = ${items.length};
const DATA = ${JSON.stringify(items)};
const state = {};    // { id: 'ok'|'ng-critical'|'ng-improve' }
const reasons = {};  // { id: string[] }  理由チップ
const comments = {}; // { id: string }    コメント
const crops = {};    // { id: { x, y, w, h } }  クロップ座標（%）
let activeCrop = null; // { id, startX, startY, rect, dragging }
try {
  const saved = JSON.parse(localStorage.getItem('tier1-review-v3') || '{}');
  Object.assign(state, saved.state || saved);  // v3前半互換
  Object.assign(reasons, saved.reasons || {});
  Object.assign(comments, saved.comments || {});
  Object.assign(crops, saved.crops || {});
} catch(e) {}
for (const [id, s] of Object.entries(state)) applyCardStatus(id, s);
// Restore reasons/comments UI
for (const [id, rs] of Object.entries(reasons)) {
  rs.forEach(r => { const chip = findChip(id, r); if (chip) chip.classList.add(state[id]==='ng-critical'?'selected-critical':'selected'); });
}
for (const [id, c] of Object.entries(comments)) {
  const el = document.getElementById('comment-' + id);
  if (el) el.value = c;
}
// Restore crop indicators
for (const id of Object.keys(crops)) {
  showSavedCropIndicator(id);
  const btn = document.getElementById('crop-btn-' + id);
  if (btn) btn.classList.add('has-crop');
}
updateCounters();

function saveAll() {
  try { localStorage.setItem('tier1-review-v3', JSON.stringify({ state, reasons, comments, crops })); } catch(e) {}
}
function findChip(id, label) {
  const area = document.getElementById('reason-' + id);
  if (!area) return null;
  return [...area.querySelectorAll('.reason-chip')].find(c => c.textContent === label);
}
function mark(id, status) {
  if (status === null) {
    delete state[id]; delete reasons[id]; delete comments[id];
    const commentEl = document.getElementById('comment-' + id);
    if (commentEl) commentEl.value = '';
    const area = document.getElementById('reason-' + id);
    if (area) area.querySelectorAll('.reason-chip').forEach(c => c.classList.remove('selected','selected-critical'));
  } else {
    state[id] = status;
  }
  applyCardStatus(id, status);
  updateCounters();
  saveAll();
}
function toggleReason(id, label) {
  if (!reasons[id]) reasons[id] = [];
  const idx = reasons[id].indexOf(label);
  const chip = findChip(id, label);
  const cls = state[id] === 'ng-critical' ? 'selected-critical' : 'selected';
  if (idx >= 0) { reasons[id].splice(idx, 1); if (chip) chip.classList.remove('selected','selected-critical'); }
  else { reasons[id].push(label); if (chip) chip.classList.add(cls); }
  saveAll();
}
function saveComment(id, value) {
  if (value.trim()) comments[id] = value.trim(); else delete comments[id];
  saveAll();
}
function applyCardStatus(id, status) {
  const card = document.getElementById('card-' + id);
  if (!card) return;
  card.classList.remove('status-ok','status-ng-critical','status-ng-improve');
  const reasonArea = document.getElementById('reason-' + id);
  if (status === 'ok') { card.classList.add('status-ok'); if (reasonArea) reasonArea.style.display = 'none'; }
  if (status === 'ng-critical') { card.classList.add('status-ng-critical'); if (reasonArea) reasonArea.style.display = ''; }
  if (status === 'ng-improve') { card.classList.add('status-ng-improve'); if (reasonArea) reasonArea.style.display = ''; }
  if (!status && reasonArea) reasonArea.style.display = 'none';
  const btns = card.querySelectorAll('.btn');
  btns.forEach(b => b.classList.remove('active'));
  if (status === 'ok') btns[0].classList.add('active');
  if (status === 'ng-critical') btns[1].classList.add('active');
  if (status === 'ng-improve') btns[2].classList.add('active');
}
function updateCounters() {
  const ok = Object.values(state).filter(v => v === 'ok').length;
  const ngC = Object.values(state).filter(v => v === 'ng-critical').length;
  const ngI = Object.values(state).filter(v => v === 'ng-improve').length;
  const pending = TOTAL - ok - ngC - ngI;
  document.getElementById('count-ok').textContent = ok;
  document.getElementById('count-ng-critical').textContent = ngC;
  document.getElementById('count-ng-improve').textContent = ngI;
  document.getElementById('count-pending').textContent = pending;
  document.getElementById('count-pct').textContent = Math.round((ok+ngC+ngI)/TOTAL*100);
  const fill = document.getElementById('progress-fill');
  fill.innerHTML = '<div class="progress-ok" style="width:'+(ok/TOTAL*100).toFixed(1)+'%"></div><div class="progress-ng-critical" style="width:'+(ngC/TOTAL*100).toFixed(1)+'%"></div><div class="progress-ng-improve" style="width:'+(ngI/TOTAL*100).toFixed(1)+'%"></div>';
}
function filterCards(filter) {
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  document.querySelectorAll('.card').forEach(card => {
    const id = card.id.replace('card-','');
    const s = state[id] || 'pending';
    const prev = card.dataset.prev;
    let show = false;
    if (filter === 'all') show = true;
    else if (filter === 'prev-ng') show = (prev === 'ng-critical' || prev === 'ng-improve');
    else if (filter === s) show = true;
    else if (filter === 'pending' && !state[id]) show = true;
    card.style.display = show ? '' : 'none';
  });
  document.querySelectorAll('.section-divider').forEach(d => { d.style.display = (filter === 'all') ? '' : 'none'; });
}
function exportResults() {
  const ok = DATA.filter(d => state[d.id] === 'ok').map(d => d.id);
  const ngC = DATA.filter(d => state[d.id] === 'ng-critical').map(d => d.id);
  const ngI = DATA.filter(d => state[d.id] === 'ng-improve').map(d => d.id);
  const pending = DATA.filter(d => !state[d.id]).map(d => d.id);
  // 理由・コメント付きの詳細
  const details = {};
  for (const id of [...ngC, ...ngI]) {
    const entry = {};
    if (reasons[id] && reasons[id].length > 0) entry.reasons = reasons[id];
    if (comments[id]) entry.comment = comments[id];
    if (Object.keys(entry).length > 0) details[id] = entry;
  }
  const cropData = Object.keys(crops).length > 0 ? crops : undefined;
  document.getElementById('export-content').textContent = JSON.stringify({
    version:'v3', date:new Date().toISOString(), total:TOTAL,
    summary:{ok:ok.length,ng_critical:ngC.length,ng_improve:ngI.length,pending:pending.length},
    ok_ids:ok, ng_critical_ids:ngC, ng_improve_ids:ngI, pending_ids:pending,
    details: details,
    crops: cropData
  }, null, 2);
  document.getElementById('export-modal').classList.add('show');
}
function resetAll() {
  if (!confirm('すべての判定をリセットしますか？')) return;
  for (const key of Object.keys(state)) delete state[key];
  for (const key of Object.keys(reasons)) delete reasons[key];
  for (const key of Object.keys(comments)) delete comments[key];
  for (const key of Object.keys(crops)) delete crops[key];
  if (activeCrop) cancelCrop();
  document.querySelectorAll('.card').forEach(card => {
    card.classList.remove('status-ok','status-ng-critical','status-ng-improve');
    card.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
    const indicator = card.querySelector('.crop-saved-indicator');
    if (indicator) indicator.remove();
    const cropBtn = card.querySelector('.crop-btn');
    if (cropBtn) cropBtn.classList.remove('has-crop');
    const reasonArea = card.querySelector('.reason-area');
    if (reasonArea) { reasonArea.style.display = 'none'; reasonArea.querySelectorAll('.reason-chip').forEach(c => c.classList.remove('selected','selected-critical')); }
    const commentEl = card.querySelector('.reason-comment');
    if (commentEl) commentEl.value = '';
  });
  updateCounters();
  try { localStorage.setItem('tier1-review-v3','{}'); } catch(e) {}
}

// ---- クロップ機能 ----
function startCrop(id) {
  if (activeCrop) cancelCrop();
  activeCrop = { id, startX: 0, startY: 0, rect: null, dragging: false };

  const container = document.querySelector('#card-' + id + ' .image-container');
  container.classList.add('crop-mode');
  container.style.position = 'relative';

  // オーバーレイ（半透明の暗いレイヤー）
  const overlay = document.createElement('div');
  overlay.className = 'crop-overlay';
  overlay.id = 'crop-overlay-' + id;
  container.appendChild(overlay);

  // 選択矩形（ドラッグで描画する枠）
  const sel = document.createElement('div');
  sel.className = 'crop-selection';
  sel.id = 'crop-sel-' + id;
  container.appendChild(sel);

  // マウス操作は画像要素で受け取る
  const img = container.querySelector('img');
  img.style.pointerEvents = 'auto';
  img.style.position = 'relative';
  img.style.zIndex = '20';
  img.style.cursor = 'crosshair';

  img.onmousedown = function(e) {
    e.preventDefault();
    const rect = img.getBoundingClientRect();
    activeCrop.startX = (e.clientX - rect.left) / rect.width;
    activeCrop.startY = (e.clientY - rect.top) / rect.height;
    activeCrop.dragging = true;
  };

  img.onmousemove = function(e) {
    if (!activeCrop || !activeCrop.dragging) return;
    e.preventDefault();
    const rect = img.getBoundingClientRect();
    const endX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const endY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const x = Math.min(activeCrop.startX, endX);
    const y = Math.min(activeCrop.startY, endY);
    const w = Math.abs(endX - activeCrop.startX);
    const h = Math.abs(endY - activeCrop.startY);

    activeCrop.rect = { x: x, y: y, w: w, h: h };

    const sel = document.getElementById('crop-sel-' + activeCrop.id);
    sel.style.left = (x * 100) + '%';
    sel.style.top = (y * 100) + '%';
    sel.style.width = (w * 100) + '%';
    sel.style.height = (h * 100) + '%';
  };

  img.onmouseup = function(e) {
    if (!activeCrop || !activeCrop.dragging) return;
    activeCrop.dragging = false;
    // 最小サイズチェック（2%以上）
    if (activeCrop.rect && activeCrop.rect.w > 0.02 && activeCrop.rect.h > 0.02) {
      showCropPreview(activeCrop.id, activeCrop.rect);
    }
  };
}

function showCropPreview(id, rect) {
  const container = document.querySelector('#card-' + id + ' .image-container');
  const img = container.querySelector('img');

  // 既存のプレビューを除去
  const oldPreview = container.querySelector('.crop-preview');
  if (oldPreview) oldPreview.remove();

  // Canvas でクロップ領域をプレビュー描画
  const preview = document.createElement('div');
  preview.className = 'crop-preview';

  const canvas = document.createElement('canvas');
  const naturalW = img.naturalWidth;
  const naturalH = img.naturalHeight;
  const sx = Math.round(rect.x * naturalW);
  const sy = Math.round(rect.y * naturalH);
  const sw = Math.round(rect.w * naturalW);
  const sh = Math.round(rect.h * naturalH);
  canvas.width = sw;
  canvas.height = sh;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

  const previewImg = document.createElement('img');
  previewImg.src = canvas.toDataURL();
  preview.appendChild(previewImg);

  // サイズ情報
  const info = document.createElement('div');
  info.style.fontSize = '10px';
  info.style.color = '#666';
  info.style.marginTop = '4px';
  info.textContent = 'クロップ: ' + sw + 'x' + sh + 'px (' + Math.round(rect.x*100) + '%, ' + Math.round(rect.y*100) + '%, ' + Math.round(rect.w*100) + '%, ' + Math.round(rect.h*100) + '%)';
  preview.appendChild(info);

  // 操作ボタン
  const actions = document.createElement('div');
  actions.className = 'crop-actions';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'crop-save-btn';
  saveBtn.textContent = '✅ 保存';
  saveBtn.onclick = function() { saveCrop(id, rect); };

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'crop-cancel-btn';
  cancelBtn.textContent = 'キャンセル';
  cancelBtn.onclick = function() { cancelCrop(); };

  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);
  preview.appendChild(actions);

  container.appendChild(preview);
}

function saveCrop(id, rect) {
  crops[id] = {
    x: Math.round(rect.x * 1000) / 1000,
    y: Math.round(rect.y * 1000) / 1000,
    w: Math.round(rect.w * 1000) / 1000,
    h: Math.round(rect.h * 1000) / 1000
  };

  cancelCrop();

  // 保存済みインジケーター表示
  showSavedCropIndicator(id);

  // ボタンスタイル更新
  const btn = document.getElementById('crop-btn-' + id);
  if (btn) btn.classList.add('has-crop');

  saveAll();
}

function showSavedCropIndicator(id) {
  const container = document.querySelector('#card-' + id + ' .image-container');
  if (!container) return;

  // 古いインジケーターを除去
  const old = container.querySelector('.crop-saved-indicator');
  if (old) old.remove();

  const crop = crops[id];
  if (!crop) return;

  container.style.position = 'relative';
  const indicator = document.createElement('div');
  indicator.className = 'crop-saved-indicator';
  indicator.style.left = (crop.x * 100) + '%';
  indicator.style.top = (crop.y * 100) + '%';
  indicator.style.width = (crop.w * 100) + '%';
  indicator.style.height = (crop.h * 100) + '%';
  container.appendChild(indicator);
}

function cancelCrop() {
  if (!activeCrop) return;
  const id = activeCrop.id;
  const container = document.querySelector('#card-' + id + ' .image-container');
  if (container) {
    container.classList.remove('crop-mode');
    const overlay = document.getElementById('crop-overlay-' + id);
    if (overlay) overlay.remove();
    const sel = document.getElementById('crop-sel-' + id);
    if (sel) sel.remove();
    const preview = container.querySelector('.crop-preview');
    if (preview) preview.remove();

    const img = container.querySelector('img');
    if (img) {
      img.onmousedown = null;
      img.onmousemove = null;
      img.onmouseup = null;
      img.style.pointerEvents = '';
      img.style.position = '';
      img.style.zIndex = '';
      img.style.cursor = '';
    }
  }
  activeCrop = null;
}

function clearCrop(id) {
  delete crops[id];
  const container = document.querySelector('#card-' + id + ' .image-container');
  if (container) {
    const indicator = container.querySelector('.crop-saved-indicator');
    if (indicator) indicator.remove();
  }
  const btn = document.getElementById('crop-btn-' + id);
  if (btn) btn.classList.remove('has-crop');
  saveAll();
}
</script>
</body></html>`

fs.writeFileSync(outPath, html, 'utf-8')
console.log(`✅ ${outPath} (${items.length}問, ${Math.round(html.length/1024)}KB)`)
console.log(`  連問: ${items.filter(d => d.linked_scenario).length}問`)
console.log(`  セクション: 🔴${ngCritical.length} / 🟡${ngImprove.length} / ✅${ok.length}`)
