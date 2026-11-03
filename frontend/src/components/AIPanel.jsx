import { useEffect, useMemo, useState } from 'react'
import { analyseSavings, buildPayload, localInsight } from '../lib/ai'

const SOURCE_LABELS = {
  live: 'Mistral AI · live analysis',
  mockapi: 'Apidog · sample response',
  backendmock: 'Tandem backend · demo analysis',
  mock: 'Local · rule-based preview',
  fallback: 'Local · fallback insights',
}
const TYPE_LABELS = { consistency: 'Saving habit', spending: 'Spending pattern', progress: 'Goal progress' }

export default function AIPanel({ data }) {
  const [loading, setLoading] = useState(false)
  const [insight, setInsight] = useState(null)
  const [lastRun, setLastRun] = useState(null)
  const preview = useMemo(() => localInsight(buildPayload(data)), [data])
  const shown = insight || preview
  const sourceLabel = SOURCE_LABELS[insight?.source || preview.source] || 'Savings analysis'

  useEffect(() => { setInsight(null); setLastRun(null) }, [data])

  const run = async () => {
    setLoading(true)
    try {
      const result = await analyseSavings(data)
      setInsight(result)
      setLastRun(new Date())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="insights-page-content">
      <section className="insights-hero">
        <div className="insights-hero-copy"><span className="eyebrow light-eyebrow"><span>✦</span> TANDEM AI COACH</span><h2>A clearer view of your family's savings.</h2><p>Get a practical read on your progress, contribution habits and what might help you reach the goal.</p><button className="button button-lime" onClick={run} disabled={loading}>{loading ? <><span className="mini-spinner dark-spinner" /> Analysing your plan…</> : insight ? 'Refresh family insights' : 'Generate family insights'} <span>↗</span></button></div>
        <div className="insights-hero-art" aria-hidden="true"><div className="insight-orbit orbit-one"/><div className="insight-orbit orbit-two"/><div className="insight-spark">✦</div><div className="insight-orb">t.</div><span className="orbit-dot dot-one"/><span className="orbit-dot dot-two"/></div>
      </section>

      <div className="insights-result-head"><div><span className="eyebrow">YOUR FAMILY PLAN</span><h3>{insight ? 'Your latest insights' : 'A preview of your savings picture'}</h3></div><span className="ai-source-pill"><i /> {sourceLabel}</span></div>
      <section className="insight-summary-card"><div className="insight-summary-icon">✧</div><div><span className="eyebrow">THE BIG PICTURE</span><p>{shown.summary}</p>{lastRun && <small className="analysis-timestamp">Generated {lastRun.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })}</small>}</div></section>
      <div className="insight-detail-grid">
        <section className="panel insight-detail-panel"><div className="panel-heading"><div><span className="eyebrow">WHAT STANDS OUT</span><h3>Observations</h3></div><span className="panel-icon-soft">◎</span></div>{shown.observations?.length ? <div className="insight-list">{shown.observations.map((item, index) => <article className="insight-list-item" key={`${item.type}-${index}`}><span className="insight-list-number">0{index + 1}</span><div><b>{TYPE_LABELS[item.type] || item.type || 'Observation'}</b><p>{item.message}</p></div></article>)}</div> : <p className="empty-message">Run the analysis to see what stands out in your household data.</p>}</section>
        <section className="panel insight-detail-panel"><div className="panel-heading"><div><span className="eyebrow">SMALL STEPS, REAL MOMENTUM</span><h3>Things to try</h3></div><span className="panel-icon-soft">✦</span></div>{shown.recommendations?.length ? <div className="recommendation-list">{shown.recommendations.map((item, index) => <article className="recommendation-item" key={`${item.title}-${index}`}><span>✧</span><div><b>{item.title}</b><p>{item.description}</p></div></article>)}</div> : <p className="empty-message">Your recommendations will appear here after analysis.</p>}</section>
      </div>
      <div className="ai-trust-note"><span>ⓘ</span><p><b>How to read these insights</b> Tandem analyses the financial figures and activity recorded in this demo. Recommendations are guidance, not financial advice. When the backend is in mock mode, the response is generated from the supplied deterministic sample rules rather than a live AI model.</p></div>
      {insight?.meta?.disclaimer && <p className="tiny-note">{insight.meta.disclaimer}</p>}
    </div>
  )
}
