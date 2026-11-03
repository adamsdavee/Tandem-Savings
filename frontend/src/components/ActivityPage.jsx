import MemberLeaderboard from './MemberLeaderboard'

const fmt = (n, cur = 'NGN') => new Intl.NumberFormat('en-NG', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(Number(n || 0))

export default function ActivityPage({ entries = [], transactions = [], currency = 'NGN', onAddContribution }) {
  const ledger = entries.length ? [...entries].sort((a, b) => String(b.date).localeCompare(String(a.date))) : []
  const otherTransactions = [...transactions].filter((item) => item.category !== 'savings').sort((a, b) => String(b.date).localeCompare(String(a.date)))
  const total = ledger.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  return (
    <div className="page-stack">
      <section className="page-intro-row"><div><span className="eyebrow">THE FAMILY TIMELINE</span><h2>Every contribution has a name.</h2><p>Keep track of who showed up, how much they added and the progress you are making together.</p></div><button className="button button-primary" onClick={onAddContribution}><span>＋</span> Add contribution</button></section>
      <div className="activity-stats"><article><small>CONTRIBUTIONS RECORDED</small><b>{ledger.length}</b><span>Named demo entries</span></article><article><small>TOTAL DEMO SAVED</small><b>{fmt(total, currency)}</b><span>From the family ledger</span></article><article><small>PEOPLE WHO CONTRIBUTED</small><b>{new Set(ledger.map((item) => item.contributor?.trim()).filter(Boolean)).size}</b><span>Unique contributors</span></article></div>
      <MemberLeaderboard entries={ledger} currency={currency} />
      <section className="panel ledger-panel"><div className="panel-heading"><div><span className="eyebrow">SAVINGS LEDGER</span><h3>Who contributed?</h3></div><span className="soft-badge">{ledger.length} entries</span></div>
        {ledger.length ? <div className="ledger-list">{ledger.map((item) => <article className="ledger-row" key={item.id}><span className="ledger-avatar">{(item.contributor || '?').trim().slice(0, 1).toUpperCase()}</span><div className="ledger-person"><b>{item.contributor}</b><small>{item.note || 'Family savings contribution'} · {new Date(`${item.date}T12:00:00`).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</small></div><div className="ledger-amount"><b>+{fmt(item.amount, currency)}</b><small>Demo entry</small></div></article>)}</div> : <div className="ledger-empty"><span>✧</span><h4>Your first family contribution starts here.</h4><p>When someone adds to the goal, record their name and amount. The family ledger will grow here.</p><button className="button button-primary" onClick={onAddContribution}>Add the first contribution</button></div>}
      </section>
      <section className="panel ledger-panel"><div className="panel-heading"><div><span className="eyebrow">OTHER SAMPLE RECORDS</span><h3>Household transactions</h3></div><span className="soft-badge">{otherTransactions.length} records</span></div>
        {otherTransactions.length ? <div className="other-transaction-list">{otherTransactions.map((item) => <article className="other-transaction-row" key={item.id}><span className="transaction-category-icon">{item.type === 'expense' || item.type === 'debit' ? '↘' : '↗'}</span><div><b>{item.description || 'Household transaction'}</b><small>{item.date} · {item.category || 'General'}</small></div><strong className={item.type === 'expense' || item.type === 'debit' ? 'expense-value' : 'saving-value'}>{item.type === 'expense' || item.type === 'debit' ? '−' : '+'}{fmt(item.amount, currency)}</strong></article>)}</div> : <p className="empty-message">No additional transactions are available for this new family space yet.</p>}
      </section>
      <div className="ai-trust-note"><span>ⓘ</span><p>Entries on this page are stored in this browser for the prototype. Adding a demo contribution does not move money or create a blockchain transaction.</p></div>
    </div>
  )
}
