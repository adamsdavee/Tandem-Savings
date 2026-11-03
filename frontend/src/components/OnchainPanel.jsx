import { useState, useCallback, useEffect } from 'react'
import { readGoal, createGoal, recordContribution, txLink, addressLink, friendlyError } from '../lib/savingsContract'
import { CONTRACT_ADDRESS } from '../lib/config'

const fmt = (value) => `₦${Number(value || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`

export default function OnchainPanel({ wallet, defaults }) {
  const { signer, status, wrongNetwork } = wallet
  const [goal, setGoal] = useState(null)
  const [busy, setBusy] = useState(false)
  const [reading, setReading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [target, setTarget] = useState(String(defaults.targetAmount || 2000000))
  const [date, setDate] = useState(defaults.targetDate || '2027-10-01')
  const [amount, setAmount] = useState('25000')
  const ready = status === 'connected' && !wrongNetwork
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    setTarget(String(defaults.targetAmount || 2000000))
    setDate(defaults.targetDate || '2027-10-01')
  }, [defaults.targetAmount, defaults.targetDate])

  const refresh = useCallback(async () => {
    if (!signer) return
    setReading(true)
    try {
      setGoal(await readGoal(signer))
      setMsg(null)
    } catch (error) {
      setMsg({ kind: 'err', text: friendlyError(error) })
    } finally {
      setReading(false)
    }
  }, [signer])

  useEffect(() => {
    if (ready) refresh()
    else setGoal(null)
  }, [ready, refresh])

  const run = async (label, fn) => {
    setBusy(true)
    setMsg({ kind: 'pending', text: `${label}: confirm the transaction in your wallet…` })
    try {
      const hash = await fn((submittedHash) => setMsg({ kind: 'pending', text: `${label}: waiting for testnet confirmation…`, hash: submittedHash }))
      await refresh()
      setMsg({ kind: 'ok', text: `${label} confirmed on Celo Sepolia.`, hash })
    } catch (error) {
      setMsg({ kind: 'err', text: friendlyError(error) })
    } finally {
      setBusy(false)
    }
  }

  const validGoal = Number.isSafeInteger(Number(target)) && Number(target) > 0 && date > today
  const validContribution = Number.isSafeInteger(Number(amount)) && Number(amount) > 0

  return (
    <section className="panel onchain-panel">
      <div className="onchain-heading"><span className="chain-icon">⌘</span><div><span className="eyebrow">WEB3 TRANSPARENCY</span><h2>On-chain commitment</h2></div><span className="testnet-badge"><i /> TESTNET</span></div>
      <p className="onchain-intro">Keep a public, wallet-linked record of your savings goal and the contributions you choose to record.</p>
      <div className="chain-disclaimer"><span>i</span><p><b>Testnet demonstration.</b> This contract stores numerical values only. It does not hold, transfer or verify money or bank deposits.</p></div>

      {status !== 'connected' ? (
        <div className="wallet-empty"><span className="wallet-empty-icon">◈</span><div><b>Connect your wallet to begin</b><p>Use MetaMask or WalletConnect on Celo Sepolia to create or read your demo record.</p></div></div>
      ) : wrongNetwork ? (
        <div className="wallet-empty warning-empty"><span className="wallet-empty-icon">!</span><div><b>Switch to Celo Sepolia</b><p>Your wallet is connected to another network. Switch networks above to continue.</p></div></div>
      ) : (
        <>
          <div className="contract-summary"><div className="contract-summary-head"><b>Your contract record</b><button className="text-button" disabled={busy || reading} onClick={refresh}>{reading ? 'Reading…' : '↻ Refresh'}</button></div>
            {goal ? goal.active ? <div className="contract-values"><div><small>Goal target</small><b>{fmt(goal.targetAmount)}</b></div><div><small>Total recorded</small><b>{fmt(goal.totalContributed)}</b></div><div><small>Target date</small><b>{new Date(goal.targetDate * 1000).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</b></div></div> : <p className="contract-empty">No active goal is recorded for this wallet yet.</p> : <p className="contract-empty">{reading ? 'Reading your goal from the contract…' : 'Your contract details will appear here after a successful read.'}</p>}
          </div>
          <div className="chain-form-block"><div className="form-block-title"><span>01</span><div><b>{goal?.active ? 'Update on-chain goal' : 'Create on-chain goal'}</b><small>Store the target amount and date in the contract.</small></div></div>
            <div className="chain-form-grid"><label className="field-label">Target amount (₦)<input type="number" min="1" step="1" value={target} onChange={(event) => setTarget(event.target.value)} /></label><label className="field-label">Target date<input type="date" min={today} value={date} onChange={(event) => setDate(event.target.value)} /></label></div>
            <button className="button button-dark full-button" disabled={busy || !validGoal} onClick={() => run(goal?.active ? 'Replace goal' : 'Create goal', (callback) => createGoal(signer, target, Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 1000), callback))}>{busy ? 'Waiting for wallet…' : goal?.active ? 'Replace goal on-chain' : 'Create goal on-chain'} <span>→</span></button>
            {goal?.active && <p className="tiny-note chain-note">Replacing the goal resets the contract's recorded contribution total to zero.</p>}
          </div>
          {goal?.active && <div className="chain-form-block contribution-chain"><div className="form-block-title"><span>02</span><div><b>Record a contribution</b><small>Add a numerical value to the contract record. The contributor name stays in your family activity ledger.</small></div></div><label className="field-label">Contribution amount (₦)<input type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} /></label><button className="button button-light full-button" disabled={busy || !validContribution} onClick={() => run('Record contribution', (callback) => recordContribution(signer, amount, callback))}>{busy ? 'Waiting for wallet…' : 'Record contribution on-chain'} <span>↗</span></button></div>}
        </>
      )}
      {msg && <div className={`chain-status ${msg.kind}`} role={msg.kind === 'err' ? 'alert' : 'status'}><span>{msg.kind === 'ok' ? '✓' : msg.kind === 'err' ? '!' : '◷'}</span><p>{msg.text}{msg.hash && <> <a href={txLink(msg.hash)} target="_blank" rel="noreferrer">View transaction ↗</a></>}</p></div>}
      <div className="contract-address-row"><span>Contract</span><a href={addressLink(CONTRACT_ADDRESS)} target="_blank" rel="noreferrer">0xf3bF…8f5DE ↗</a></div>
    </section>
  )
}
