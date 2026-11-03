import { useEffect, useMemo, useState } from 'react'
import { createGoal, friendlyError, txLink } from '../lib/savingsContract'

const PRESETS = [
  { id: 'emergency', icon: '✳', title: 'Emergency fund', description: 'Build a cushion for life’s surprises.', amount: 1500000 },
  { id: 'home', icon: '⌂', title: 'A home together', description: 'Save towards rent, a deposit or a home.', amount: 5000000 },
  { id: 'education', icon: '✎', title: 'Education', description: 'Plan ahead for school and learning.', amount: 2000000 },
  { id: 'family', icon: '✧', title: 'Family plans', description: 'Make a trip or shared experience happen.', amount: 1000000 },
  { id: 'custom', icon: '＋', title: 'Something else', description: 'Set a goal that is personal to your family.', amount: 2000000 },
]

const money = (value) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(value || 0))
const addMonths = (count) => {
  const date = new Date()
  date.setMonth(date.getMonth() + Number(count))
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const shortAddress = (value = '') => value ? `${value.slice(0, 6)}…${value.slice(-4)}` : ''

function Brand() {
  return <a className="brand-mark-lockup" href="#top" aria-label="Tandem home"><span className="brand-symbol">t</span><span>tandem<span className="brand-dot">.</span></span></a>
}

export default function Onboarding({ wallet, onComplete }) {
  const [step, setStep] = useState(0)
  const [familyName, setFamilyName] = useState('')
  const [selectedGoal, setSelectedGoal] = useState('emergency')
  const [targetAmount, setTargetAmount] = useState('1500000')
  const [months, setMonths] = useState('12')
  const [goalName, setGoalName] = useState('Emergency fund')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [txHash, setTxHash] = useState('')

  useEffect(() => {
    if (wallet.status === 'connected' && !wallet.wrongNetwork && step === 0) setStep(1)
  }, [wallet.status, wallet.wrongNetwork, step])

  const selected = useMemo(() => PRESETS.find((goal) => goal.id === selectedGoal) || PRESETS[0], [selectedGoal])
  const targetDate = useMemo(() => addMonths(months), [months])
  const ready = wallet.status === 'connected' && !wallet.wrongNetwork
  const amountNumber = Number(targetAmount)

  const chooseGoal = (goal) => {
    setSelectedGoal(goal.id)
    setTargetAmount(String(goal.amount))
    setGoalName(goal.title)
    setError('')
  }

  const submit = async () => {
    if (!familyName.trim()) return setError('Add your family name to continue.')
    if (!Number.isSafeInteger(amountNumber) || amountNumber <= 0) return setError('Enter a valid savings target.')
    if (!ready || !wallet.signer) return setError(wallet.wrongNetwork ? 'Switch to Celo Sepolia before creating your goal.' : 'Connect your wallet before creating your goal.')
    setBusy(true)
    setError('')
    setTxHash('')
    try {
      const unixDate = Math.floor(new Date(`${targetDate}T12:00:00`).getTime() / 1000)
      const hash = await createGoal(wallet.signer, String(amountNumber), unixDate, setTxHash)
      onComplete({
        familyName: familyName.trim(),
        goalId: selectedGoal,
        goalName: goalName.trim() || selected.title,
        goalPurpose: selected.description,
        targetAmount: amountNumber,
        targetDate,
        months: Number(months),
        walletAddress: wallet.address,
        txHash: hash,
        createdAt: new Date().toISOString(),
      })
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="onboarding-shell" id="top">
      <header className="onboarding-topbar"><Brand /><div className="onboarding-top-note"><span className="secure-dot" /> A shared space for your next big thing</div></header>
      <div className="onboarding-grid">
        <section className="onboarding-story">
          <div className="story-kicker"><span className="story-kicker-line" /> SAVE BETTER, TOGETHER</div>
          <h1>Big plans feel lighter when you make them <em>together.</em></h1>
          <p className="story-copy">Tandem gives your family one clear place to set a goal, celebrate every contribution and see how far you’ve come.</p>
          <div className="story-visual" aria-hidden="true">
            <div className="visual-glow" />
            <div className="visual-card visual-card-back"><span>YOUR NEXT MILESTONE</span><b>One step closer</b><i>✦</i></div>
            <div className="visual-card visual-card-main"><div className="visual-card-head"><span className="visual-small-logo">t.</span><span>FAMILY SAVINGS</span><span className="visual-live"><i /> PREVIEW</span></div><div className="visual-amount">₦1,250,000</div><div className="visual-progress"><i /></div><div className="visual-card-bottom"><span>YOUR SHARED GOAL</span><b>Growing together <span>↗</span></b></div></div>
            <div className="visual-coin coin-one">✳</div><div className="visual-coin coin-two">₦</div>
          </div>
          <div className="story-foot"><span>✦</span> Progress over perfection. Every contribution counts.</div>
        </section>

        <section className="onboarding-card">
          <div className="onboarding-card-head"><div><span className="step-kicker">YOUR FAMILY'S SAVINGS SPACE</span><h2>{step === 0 ? 'Start with your wallet' : step === 1 ? 'Who are we saving with?' : 'What are you saving for?'}</h2><p>{step === 0 ? 'Your wallet is your secure sign-in. We never ask for your recovery phrase.' : step === 1 ? 'Give your shared savings space a name. You can invite or add contributors later.' : 'Choose a goal and set a target that feels right for your family.'}</p></div><span className="step-count">0{Math.min(step + 1, 3)} <i>/ 03</i></span></div>
          <div className="step-progress"><i className={step >= 0 ? 'filled' : ''} /><i className={step >= 1 ? 'filled' : ''} /><i className={step >= 2 ? 'filled' : ''} /></div>

          {step === 0 && <div className="onboarding-step wallet-step">
            <div className="wallet-illustration"><div className="wallet-illustration-mark">◈</div><span>YOUR WALLET, YOUR KEY</span></div>
            {wallet.status === 'connected' ? <div className="connected-wallet-card"><span className="connected-check">✓</span><div><b>Wallet connected</b><small>{shortAddress(wallet.address)}</small></div><span className="wallet-network-tag">{wallet.wrongNetwork ? 'Wrong network' : 'Ready'}</span></div> : <div className="wallet-connect-box"><b>Connect a wallet to create your family space</b><p>Use MetaMask or WalletConnect. Your public wallet address will be linked to the savings goal.</p><button className="button button-primary button-wide" disabled={wallet.status === 'connecting'} onClick={() => wallet.connect('injected')}>{wallet.status === 'connecting' ? 'Opening wallet…' : 'Connect MetaMask'} <span>↗</span></button><button className="button button-outline button-wide" disabled={wallet.status === 'connecting'} onClick={() => wallet.connect('walletconnect')}>Connect with WalletConnect</button></div>}
            {wallet.wrongNetwork && <div className="inline-warning"><b>One quick switch.</b> Connect to Celo Sepolia to create your savings goal on the demo contract.<button type="button" className="text-button" onClick={wallet.switchNetwork}>Switch network ↗</button></div>}
            {wallet.error && <p className="form-error" role="alert">{wallet.error}</p>}
            <div className="security-note"><span>⌑</span><p><b>Wallet safety</b><small>Tandem never asks for your seed phrase or private key. You approve every blockchain transaction in your wallet.</small></p></div>
            <button className="button button-dark button-wide onboarding-next" disabled={!ready} onClick={() => { setError(''); setStep(1) }}>Continue <span>→</span></button>
          </div>}

          {step === 1 && <div className="onboarding-step">
            <div className="field-stack"><label className="form-field"><span>Family or household name</span><input autoFocus value={familyName} onChange={(event) => setFamilyName(event.target.value)} maxLength={48} placeholder="e.g. The Okafor Family" /><small>This is how your shared savings space will appear.</small></label><div className="family-preview"><div className="family-avatar">{(familyName.trim()[0] || 'F').toUpperCase()}</div><div><small>YOUR SPACE WILL BE CALLED</small><b>{familyName.trim() || 'Your family name'}</b></div><span>✦</span></div></div>
            <div className="step-actions"><button className="button button-outline" onClick={() => setStep(0)}>Back</button><button className="button button-dark" disabled={!familyName.trim()} onClick={() => { setError(''); setStep(2) }}>Choose a goal <span>→</span></button></div>
          </div>}

          {step === 2 && <div className="onboarding-step goal-step">
            <div className="goal-choice-grid">{PRESETS.map((goal) => <button type="button" key={goal.id} onClick={() => chooseGoal(goal)} className={`goal-choice ${selectedGoal === goal.id ? 'selected' : ''}`}><span className="goal-choice-icon">{goal.icon}</span><span className="goal-choice-copy"><b>{goal.title}</b><small>{goal.description}</small></span><i className="goal-choice-radio">{selectedGoal === goal.id ? '✓' : ''}</i></button>)}</div>
            <label className="form-field goal-title-field"><span>Give your goal a name</span><input value={goalName} onChange={(event) => setGoalName(event.target.value)} maxLength={54} placeholder="e.g. Our rainy-day fund" /></label>
            <div className="goal-setup-fields"><label className="form-field"><span>Target amount</span><div className="currency-input"><span>₦</span><input type="number" min="1" step="1000" value={targetAmount} onChange={(event) => setTargetAmount(event.target.value)} /></div></label><label className="form-field"><span>Save over</span><select value={months} onChange={(event) => setMonths(event.target.value)}><option value="3">3 months</option><option value="6">6 months</option><option value="9">9 months</option><option value="12">12 months</option><option value="18">18 months</option><option value="24">24 months</option></select></label></div>
            <div className="plan-preview"><div><small>YOUR MONTHLY TARGET</small><b>{money(Math.ceil((Number(targetAmount) || 0) / Number(months)))}</b></div><div><small>GOAL DATE</small><b>{new Date(`${targetDate}T12:00:00`).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</b></div></div>
            <div className="chain-create-note"><span>◈</span><p><b>Create your goal on Celo Sepolia</b><small>Your wallet will ask you to approve a testnet transaction. The contract records the target amount and date; it does not hold money.</small></p></div>
            {error && <p className="form-error" role="alert">{error}</p>}
            {txHash && <p className="transaction-note">Transaction submitted. <a href={txLink(txHash)} target="_blank" rel="noreferrer">View on explorer ↗</a></p>}
            <div className="step-actions"><button className="button button-outline" disabled={busy} onClick={() => setStep(1)}>Back</button><button className="button button-primary" disabled={busy || !ready || !familyName.trim() || !Number.isSafeInteger(amountNumber) || amountNumber <= 0} onClick={submit}>{busy ? <><span className="mini-spinner" /> Confirm in wallet…</> : 'Create family savings space'} <span>↗</span></button></div>
            {wallet.wrongNetwork && <button className="text-button network-inline-button" onClick={wallet.switchNetwork}>Switch to Celo Sepolia first ↗</button>}
          </div>}
          <p className="onboarding-legal">By continuing, you agree this is a demonstration experience. <span>Demo funds only · No real deposits</span></p>
        </section>
      </div>
      <footer className="onboarding-footer"><span>© 2026 Tandem</span><span>Made for families building something together</span><span><i /> Celo Sepolia testnet</span></footer>
    </main>
  )
}
