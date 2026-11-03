import { useEffect, useState } from 'react'
import { useWallet } from './hooks/useWallet'
import { useDashboardData } from './hooks/useDashboardData'
import Onboarding from './components/Onboarding'
import WalletBar from './components/WalletBar'
import { GoalPanel, ContributionsPanel } from './components/OffchainPanels'
import OnchainPanel from './components/OnchainPanel'
import AIPanel from './components/AIPanel'
import ContributionModal from './components/ContributionModal'
import ActivityPage from './components/ActivityPage'
import MemberLeaderboard from './components/MemberLeaderboard'
import { normalise } from './lib/api'
import { sampleRaw } from './lib/mockData'

const money = (n, currency = 'NGN') => new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(n || 0))
const PROFILE_KEY = 'tandem-family-profile-v2'
const DATA_KEY = 'tandem-family-dashboard-v2'

function readStorage(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null }
}

function createFamilyDashboard(base, profile) {
  const monthlyTarget = Math.ceil(profile.targetAmount / profile.months)
  return {
    ...base,
    customerId: `family-${String(profile.walletAddress || 'demo').slice(2, 10).toLowerCase()}`,
    source: 'new-family-demo',
    warnings: [],
    household: { ...base.household, name: profile.familyName, location: 'Shared family space', members: [], monthlyIncome: 0 },
    goal: {
      id: 'family-goal', name: profile.goalName, purpose: profile.goalPurpose,
      targetAmount: profile.targetAmount, currentBalance: 0, amountRemaining: profile.targetAmount,
      targetDate: profile.targetDate, monthsRemaining: profile.months,
      status: 'on_track', progress: 0, originalMonthly: monthlyTarget, requiredMonthly: monthlyTarget,
    },
    savings: {
      currentBalance: 0, totalContributed: 0, totalWithdrawn: 0,
      frequency: 'monthly', plannedMonthly: monthlyTarget, contributions: [],
    },
    transactions: [],
    contributionEntries: [],
  }
}

function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  const paths = {
    overview: <><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="10" width="8" height="11" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/></>,
    activity: <><path d="M3 12h4l3-8 4 16 3-8h4"/></>,
    insights: <><path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/></>,
    chain: <><path d="M10 13a5 5 0 0 0 7.1 0l2-2A5 5 0 0 0 12 4l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20l1.1-1.1"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  }
  return <svg {...common}>{paths[name] || paths.overview}</svg>
}

function NavItem({ id, active, icon, label, onClick }) {
  return <button type="button" className={`nav-item ${active === id ? 'active' : ''}`} onClick={() => onClick(id)}><Icon name={icon} /><span>{label}</span>{active === id && <i />}</button>
}

function Toast({ message, onClose, tone = 'success' }) {
  if (!message) return null
  return <div className={`toast toast-${tone}`} role="status"><span className="toast-check">{tone === 'success' ? '✓' : '✦'}</span><span>{message}</span><button className="icon-button" aria-label="Dismiss notification" onClick={onClose}>×</button></div>
}

function MetricCard({ label, value, caption, icon, tint }) {
  return <article className={`metric-card metric-${tint}`}><span className="metric-icon"><Icon name={icon} size={17}/></span><div><small>{label}</small><b>{value}</b><p>{caption}</p></div></article>
}

function HouseholdCard({ familyName, entries, walletAddress }) {
  const people = [...new Set(entries.map((entry) => entry.contributor).filter(Boolean))]
  return <section className="panel household-card"><div className="panel-heading"><div><span className="eyebrow">YOUR PEOPLE</span><h3>{familyName}</h3><p>Every person brings the goal a little closer.</p></div><span className="household-icon">⌂</span></div>
    {people.length ? <div className="contributor-chips">{people.slice(0, 5).map((person, index) => <span className="contributor-chip" key={person}><i className={`avatar avatar-${index % 3}`}>{person.slice(0, 1).toUpperCase()}</i>{person}</span>)}{people.length > 5 && <span className="more-people">+{people.length - 5}</span>}</div> : <div className="household-empty"><span>✦</span><p>Your family contributors will show up here. Add the first contribution to get started.</p></div>}
    <div className="household-wallet"><span>OWNER WALLET</span><b title={walletAddress}>{walletAddress ? `${walletAddress.slice(0, 7)}…${walletAddress.slice(-5)}` : 'Wallet not connected'}</b></div>
  </section>
}

function OverviewPage({ dashboard, profile, onAddContribution, onNavigate }) {
  const current = Number(dashboard.savings.currentBalance || 0)
  const target = Number(dashboard.goal.targetAmount || 0)
  const remaining = Math.max(0, target - current)
  const progress = target ? Math.min(100, current / target * 100) : 0
  return <div className="page-stack overview-stack">
    <section className="overview-welcome"><div><span className="eyebrow">YOUR FAMILY'S MONEY MOMENT</span><h2>One goal. A whole family. <em>Real progress.</em></h2><p>Welcome to {profile.familyName}. Here's where your shared goal stands today.</p></div><button className="button button-primary" onClick={onAddContribution}><span>＋</span> Add contribution</button></section>
    <section className="overview-hero-card"><div className="overview-hero-copy"><span className="hero-tag"><i/> CURRENT FAMILY GOAL</span><h3>{dashboard.goal.name}</h3><p>{dashboard.goal.purpose}</p><div className="hero-balance-row"><div><small>YOU'VE SAVED SO FAR</small><b>{money(current, dashboard.currency)}</b></div><div className="hero-target"><small>YOUR TARGET</small><b>{money(target, dashboard.currency)}</b></div></div><div className="hero-progress-track"><i style={{ width: `${progress}%` }}/></div><div className="hero-progress-meta"><b>{progress.toFixed(1)}% complete</b><span>{money(remaining, dashboard.currency)} to go</span></div></div><div className="hero-progress-art"><div className="hero-ring" style={{ '--progress': `${progress * 3.6}deg` }}><div><b>{Math.round(progress)}<small>%</small></b><span>of the way</span></div></div><div className="hero-art-caption">Small steps add up <span>✦</span></div></div></section>
    <section className="metric-grid"><MetricCard label="Still to save" value={money(remaining, dashboard.currency)} caption="The distance to your target" icon="overview" tint="mint"/><MetricCard label="Monthly family plan" value={money(dashboard.savings.plannedMonthly, dashboard.currency)} caption="Suggested pace for this goal" icon="activity" tint="peach"/><MetricCard label="Months to your goal" value={`${dashboard.goal.monthsRemaining} months`} caption={`Target date · ${new Date(`${dashboard.goal.targetDate}T12:00:00`).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })}`} icon="insights" tint="lavender"/></section>
    <div className="overview-lower-grid"><div className="overview-primary"><GoalPanel goal={dashboard.goal} savings={dashboard.savings} currency={dashboard.currency} onAddContribution={onAddContribution} onEditGoal={() => onNavigate('blockchain')}/><ContributionsPanel savings={dashboard.savings} goal={dashboard.goal} currency={dashboard.currency}/></div><div className="overview-secondary"><HouseholdCard familyName={profile.familyName} entries={dashboard.contributionEntries || []} walletAddress={profile.walletAddress}/><MemberLeaderboard entries={dashboard.contributionEntries || []} currency={dashboard.currency} compact onViewAll={() => onNavigate('activity')}/><section className="next-step-card"><div className="next-step-icon">✧</div><div><span className="eyebrow">YOUR NEXT STEP</span><b>Keep your family in the loop</b><p>Record contributions as they happen so everyone can see their part in the goal.</p><button className="text-button" onClick={() => onNavigate('activity')}>View family activity <span>→</span></button></div></section><button className="ai-shortcut" onClick={() => onNavigate('insights')}><span className="ai-shortcut-icon">✦</span><span><b>Need a little direction?</b><small>Get a fresh read from your AI coach.</small></span><span className="shortcut-arrow">↗</span></button></div></div>
  </div>
}

export default function App() {
  const wallet = useWallet()
  const { loading, data } = useDashboardData()
  const [profile, setProfile] = useState(() => readStorage(PROFILE_KEY))
  const [dashboard, setDashboard] = useState(() => readStorage(DATA_KEY))
  const [activeView, setActiveView] = useState('overview')
  const [contributionOpen, setContributionOpen] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (profile && !dashboard && !loading) setDashboard(createFamilyDashboard(data || normalise(sampleRaw), profile))
  }, [data, profile, dashboard, loading])

  useEffect(() => {
    if (profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    if (dashboard) localStorage.setItem(DATA_KEY, JSON.stringify(dashboard))
  }, [profile, dashboard])

  const notify = (message, tone = 'success') => {
    setToast({ message, tone })
    window.clearTimeout(notify.timer)
    notify.timer = window.setTimeout(() => setToast(''), 4500)
  }

  const completeOnboarding = (nextProfile) => {
    const base = data || normalise(sampleRaw)
    const nextDashboard = createFamilyDashboard(base, nextProfile)
    setProfile(nextProfile)
    setDashboard(nextDashboard)
    localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile))
    localStorage.setItem(DATA_KEY, JSON.stringify(nextDashboard))
    setActiveView('overview')
    notify('Your family savings space is ready. Your goal was created on Celo Sepolia.')
  }

  const addContribution = ({ amount, contributor, note }) => {
    if (!dashboard) return
    const now = new Date()
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const month = date.slice(0, 7)
    setDashboard((current) => {
      const balance = Number(current.savings.currentBalance || 0) + amount
      const contributions = [...(current.savings.contributions || [])]
      const existingIndex = contributions.findIndex((item) => item.month === month)
      if (existingIndex >= 0) {
        contributions[existingIndex] = { ...contributions[existingIndex], amount: Number(contributions[existingIndex].amount || 0) + amount, balanceAfter: balance }
      } else {
        contributions.push({ month, planned: current.savings.plannedMonthly, amount, balanceAfter: balance })
      }
      const target = Number(current.goal.targetAmount || 0)
      const remaining = Math.max(0, target - balance)
      const requiredMonthly = Math.ceil(remaining / Math.max(1, Number(current.goal.monthsRemaining || 1)))
      const entry = { id: `demo-${Date.now()}`, date, contributor, amount, note: note || `${contributor}'s family contribution`, source: 'demo' }
      const transaction = { id: entry.id, date, type: 'income', category: 'savings', description: `${contributor} contributed to ${current.goal.name}`, contributor, amount }
      return {
        ...current,
        savings: { ...current.savings, currentBalance: balance, totalContributed: Number(current.savings.totalContributed || 0) + amount, contributions: contributions.sort((a, b) => a.month.localeCompare(b.month)) },
        goal: { ...current.goal, currentBalance: balance, amountRemaining: remaining, progress: target ? Math.min(100, balance / target * 100) : 0, requiredMonthly, status: remaining === 0 ? 'completed' : 'on_track' },
        contributionEntries: [entry, ...(current.contributionEntries || [])],
        transactions: [transaction, ...(current.transactions || [])],
        source: 'new-family-demo-with-local-contributions',
      }
    })
    setContributionOpen(false)
    setActiveView('activity')
    notify(`${contributor}’s ${money(amount)} contribution was added to the demo ledger.`)
  }

  if (!profile) return <Onboarding wallet={wallet} onComplete={completeOnboarding}/>
  if (!dashboard) return <div className="app-loading"><span className="loading-mark">t.</span><b>Opening your family space</b><p>Getting your savings view ready…</p></div>

  const viewTitles = { overview: 'Overview', activity: 'Family activity', insights: 'AI insights', blockchain: 'Blockchain record' }
  return <div className="app-shell">
    <aside className="app-sidebar">
      <a className="brand-mark-lockup app-brand" href="#top"><span className="brand-symbol">t</span><span>tandem<span className="brand-dot">.</span></span></a>
      <div className="sidebar-family-card"><span className="sidebar-family-avatar">{profile.familyName.slice(0, 1).toUpperCase()}</span><div><small>YOUR FAMILY SPACE</small><b>{profile.familyName}</b></div><span className="family-menu-dot">•••</span></div>
      <span className="sidebar-section-label">WORKSPACE</span>
      <nav className="app-nav" aria-label="Main navigation"><NavItem id="overview" active={activeView} icon="overview" label="Overview" onClick={setActiveView}/><NavItem id="activity" active={activeView} icon="activity" label="Family activity" onClick={setActiveView}/><NavItem id="insights" active={activeView} icon="insights" label="AI insights" onClick={setActiveView}/></nav>
      <span className="sidebar-section-label blockchain-label">YOUR RECORDS</span><nav className="app-nav"><NavItem id="blockchain" active={activeView} icon="chain" label="Blockchain record" onClick={setActiveView}/></nav>
      <div className="sidebar-bottom"><div className="sidebar-encouragement"><span>✦</span><b>You're building something meaningful.</b><p>Progress is made one contribution at a time.</p></div><div className="sidebar-testnet"><i/> Celo Sepolia testnet</div><small className="sidebar-footer-label">TANDEM · FAMILY SAVINGS DEMO</small></div>
    </aside>
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><NavItem id="overview" active={activeView} icon="overview" label="Home" onClick={setActiveView}/><NavItem id="activity" active={activeView} icon="activity" label="Activity" onClick={setActiveView}/><NavItem id="insights" active={activeView} icon="insights" label="Insights" onClick={setActiveView}/><NavItem id="blockchain" active={activeView} icon="chain" label="On-chain" onClick={setActiveView}/></nav>

    <main className="app-main" id="top">
      <header className="app-topbar"><div className="mobile-brand"><span className="brand-symbol">t</span> tandem<span className="brand-dot">.</span></div><div className="page-breadcrumb">Your family space <span>/</span> <b>{viewTitles[activeView]}</b></div><div className="topbar-tools"><span className="demo-pill"><i/> DEMO MODE</span><WalletBar wallet={wallet}/></div></header>
      <div className="app-page-content">
        {activeView === 'overview' && <OverviewPage dashboard={dashboard} profile={profile} onAddContribution={() => setContributionOpen(true)} onNavigate={setActiveView}/>}
        {activeView === 'activity' && <ActivityPage entries={dashboard.contributionEntries || []} transactions={dashboard.transactions || []} currency={dashboard.currency} onAddContribution={() => setContributionOpen(true)}/>}
        {activeView === 'insights' && <div className="page-stack"><section className="page-intro-row"><div><span className="eyebrow">SMARTER SAVING, TOGETHER</span><h2>Your family’s AI coach.</h2><p>Insights based on your goal, contribution history and the activity you record.</p></div></section><AIPanel data={dashboard}/></div>}
        {activeView === 'blockchain' && <div className="page-stack"><section className="page-intro-row"><div><span className="eyebrow">TRANSPARENT BY DESIGN</span><h2>Your on-chain record.</h2><p>Read your family goal and record demo contribution values on Celo Sepolia.</p></div></section><div className="blockchain-layout"><OnchainPanel wallet={wallet} defaults={{ targetAmount: dashboard.goal.targetAmount, targetDate: dashboard.goal.targetDate }}/><aside className="blockchain-explainer"><div className="blockchain-explainer-icon">◈</div><span className="eyebrow">WHAT THE BLOCKCHAIN DOES</span><h3>A public record of your commitment.</h3><p>The savings contract stores the goal target, goal date and numerical contribution records linked to the connected wallet.</p><div className="blockchain-feature"><i>✓</i><span><b>Wallet verified</b><small>Transactions are approved by your connected wallet.</small></span></div><div className="blockchain-feature"><i>✓</i><span><b>Publicly readable</b><small>Confirmed testnet transactions can be viewed in Blockscout.</small></span></div><div className="blockchain-feature"><i>!</i><span><b>Not a bank balance</b><small>The contract does not hold, transfer or verify actual money.</small></span></div></aside></div></div>}
      </div>
      <footer className="app-footer"><span>Built for families building something together.</span><span>Demo funds only · No real deposits or guaranteed yield</span></footer>
    </main>
    <ContributionModal open={contributionOpen} currency={dashboard.currency || 'NGN'} familyName={profile.familyName} onClose={() => setContributionOpen(false)} onSubmit={addContribution}/>
    <Toast message={toast?.message} tone={toast?.tone} onClose={() => setToast('')}/>
  </div>
}
