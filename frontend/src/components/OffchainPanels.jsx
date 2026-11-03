const fmt = (n, cur = 'NGN') => new Intl.NumberFormat('en-NG', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(Number(n || 0))
const monthLabel = (value) => {
  const date = new Date(`${value}-01T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-NG', { month: 'short' })
}

function ProgressRing({ value }) {
  const pct = Math.max(0, Math.min(100, Number(value || 0)))
  const radius = 45
  const circumference = 2 * Math.PI * radius
  return (
    <div className="progress-ring-wrap" aria-label={`${Math.round(pct)} percent complete`}>
      <svg className="progress-ring" viewBox="0 0 110 110" role="img" aria-hidden="true">
        <circle className="ring-track" cx="55" cy="55" r={radius} />
        <circle className="ring-value" cx="55" cy="55" r={radius} strokeDasharray={circumference} strokeDashoffset={circumference * (1 - pct / 100)} />
      </svg>
      <div className="ring-copy"><strong>{Math.round(pct)}%</strong><span>complete</span></div>
    </div>
  )
}

export function GoalPanel({ goal, savings, currency, onAddContribution, onEditGoal }) {
  const pct = Math.max(0, Math.min(100, Number(goal.progress ?? (goal.targetAmount ? (savings.currentBalance / goal.targetAmount) * 100 : 0))))
  const remaining = Math.max(0, Number(goal.targetAmount || 0) - Number(savings.currentBalance || 0))
  const history = savings.contributions || []
  const averageContribution = history.length ? history.reduce((sum, item) => sum + Number(item.amount || 0), 0) / history.length : Number(savings.plannedMonthly || 0)
  const projectedBalance = Number(savings.currentBalance || 0) + averageContribution * Number(goal.monthsRemaining || 0)
  return (
    <section className="panel goal-panel">
      <div className="panel-heading"><div><span className="eyebrow">THE BIG PICTURE</span><h2>{goal.name || 'Our shared savings goal'}</h2><p>{goal.purpose || 'Building a stronger financial cushion, together.'}</p></div><button className="text-button" onClick={onEditGoal}>Manage on-chain <span>↗</span></button></div>
      <div className="goal-main">
        <div className="goal-amounts"><span className="eyebrow">YOU HAVE SAVED</span><strong>{fmt(savings.currentBalance, currency)}</strong><span className="goal-target">of {fmt(goal.targetAmount, currency)}</span><div className="goal-progress-track"><span style={{ width: `${pct}%` }} /></div><div className="goal-progress-meta"><b>{pct.toFixed(1)}% there</b><span>{fmt(remaining, currency)} left to go</span></div></div>
        <ProgressRing value={pct} />
      </div>
      <div className="goal-foot">
        <div><span className="foot-icon">◎</span><span><small>Target date</small><b>{new Date(`${goal.targetDate}T00:00:00`).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</b></span></div>
        <div><span className="foot-icon">↗</span><span><small>Needed each month</small><b>{fmt(goal.requiredMonthly, currency)}</b></span></div>
        <div><span className="foot-icon">◷</span><span><small>Time remaining</small><b>{goal.monthsRemaining} months</b></span></div>
        <div><span className="foot-icon">↗</span><span><small>Projected at recent pace · no yield</small><b>{fmt(projectedBalance, currency)}</b></span></div>
        <button className="button button-primary goal-cta" onClick={onAddContribution}><span>+</span> Add to savings</button>
      </div>
    </section>
  )
}

export function HouseholdPanel({ household, currency, monthlyExpenses, monthlyRoom }) {
  return (
    <section className="panel household-panel">
      <div className="panel-heading compact"><div><span className="eyebrow">YOUR TEAM</span><h2>Household snapshot</h2></div><span className="soft-badge">{household.location || 'Shared plan'}</span></div>
      <div className="member-list">{household.members.map((member, index) => <div className="member-row" key={member.id || member.name}><span className={`avatar avatar-${index % 2}`}>{(member.name || 'M').split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><span className="member-info"><b>{member.name}</b><small>Monthly income</small></span><strong>{fmt(member.monthly_income, currency)}</strong></div>)}</div>
      <div className="cashflow-summary"><div><span>Estimated monthly spend</span><b>{fmt(monthlyExpenses, currency)}</b></div><div><span>Room after spend &amp; latest save</span><b className={monthlyRoom < 0 ? 'negative-value' : 'positive-value'}>{fmt(monthlyRoom, currency)}</b></div></div>
      <p className="tiny-note">Spending is estimated from the available transaction sample; it may not represent a full month.</p>
    </section>
  )
}

export function ContributionsPanel({ savings, goal, currency }) {
  const list = [...(savings.contributions || [])].sort((a, b) => a.month.localeCompare(b.month)).slice(-6)
  const highest = Math.max(1, ...list.map((item) => Number(item.amount || 0)), Number(savings.plannedMonthly || 0))
  let streak = 0
  let newerMonth = null
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const item = list[i]
    if (Number(item.amount || 0) <= 0) break
    if (newerMonth) {
      const [newerYear, newerIndex] = newerMonth.split('-').map(Number)
      const [year, monthIndex] = item.month.split('-').map(Number)
      const monthGap = (newerYear * 12 + newerIndex) - (year * 12 + monthIndex)
      if (monthGap !== 1) break
    }
    streak += 1
    newerMonth = item.month
  }
  const pct = savings.currentBalance && savings.plannedMonthly ? Math.min(100, Math.round((Number(list.at(-1)?.amount || 0) / Number(savings.plannedMonthly)) * 100)) : 0
  const goalProgress = goal?.targetAmount ? Math.min(100, (Number(savings.currentBalance || 0) / Number(goal.targetAmount)) * 100) : 0
  const milestones = [
    { label: 'First save', active: Number(savings.totalContributed || savings.currentBalance) > 0 },
    { label: '25% club', active: goalProgress >= 25 },
    { label: 'Halfway', active: goalProgress >= 50 },
    { label: 'Goal getter', active: goalProgress >= 100 },
  ]
  return (
    <section className="panel rhythm-panel">
      <div className="panel-heading compact"><div><span className="eyebrow">SHOWING UP COUNTS</span><h2>Savings rhythm</h2></div><span className="streak-badge">✦ {streak} mo streak</span></div>
      <div className="chart-area" role="img" aria-label="Monthly savings contributions compared with the monthly target">
        {list.length === 0 ? <p className="empty-chart">Your first contribution will appear here.</p> : list.map((item) => {
          const amount = Number(item.amount || 0)
          const height = Math.max(4, (amount / highest) * 100)
          const planned = Number(item.planned || savings.plannedMonthly || 0)
          return <div className="chart-column" key={item.month}><div className="chart-bar-wrap"><span className="chart-bar" style={{ height: `${height}%` }} title={fmt(amount, currency)} /><span className="chart-target" style={{ bottom: `${Math.min(100, (planned / highest) * 100)}%` }} /></div><small>{monthLabel(item.month)}</small></div>
        })}
      </div>
      <div className="chart-legend"><span><i className="legend-actual" /> Actual contribution</span><span><i className="legend-target" /> Monthly plan</span></div>
      <div className="consistency-callout"><span className="consistency-icon">✦</span><p><b>{pct >= 100 ? 'Plan met this month!' : 'Every month is a fresh start.'}</b><small>Latest contribution: {fmt(list.at(-1)?.amount || 0, currency)} · {pct}% of monthly plan</small></p></div>
      <div className="milestones"><span className="eyebrow">MILESTONES</span><div>{milestones.map((item, index) => <span key={item.label} className={item.active ? 'milestone unlocked' : 'milestone'}><i>{item.active ? '✓' : ['✦', '25', '½', '★'][index]}</i>{item.label}</span>)}</div></div>
    </section>
  )
}

export function TransactionsPanel({ transactions, currency = 'NGN' }) {
  const rows = [...transactions].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 6)
  return (
    <section className="panel transactions-panel">
      <div className="panel-heading compact"><div><span className="eyebrow">WHERE IT GOES</span><h2>Recent activity</h2></div><span className="soft-badge">{transactions.length} records</span></div>
      {rows.length === 0 ? <div className="empty-activity">Nothing here yet. Log a contribution to start your household timeline.</div> : <div className="activity-list">{rows.map((item) => {
        const out = item.type === 'expense' || item.type === 'debit'
        const symbol = out ? '−' : '+'
        return <div className="activity-row" key={item.id}><span className={`activity-icon ${out ? 'expense-icon' : 'saving-icon'}`}>{out ? '↘' : '↗'}</span><span className="activity-detail"><b>{item.description || 'Household activity'}</b><small>{item.date} · {(item.category || 'general').replace(/_/g, ' ')}</small></span><strong className={out ? 'expense-amount' : 'saving-amount'}>{symbol}{fmt(item.amount, currency)}</strong></div>
      })}</div>}
      <p className="tiny-note">Transactions shown are synthetic records provided for this challenge demo.</p>
    </section>
  )
}
