export function FlashCardSection() {
  return (
    <section>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
        暗記カード
      </h3>
      <div style={{
        padding: '16px',
        background: 'var(--card)',
        borderRadius: 'var(--r)',
        textAlign: 'center',
        color: 'var(--text-2)',
        fontSize: 14,
      }}>
        準備中
      </div>
    </section>
  )
}
