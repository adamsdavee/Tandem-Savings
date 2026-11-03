import { useEffect, useState } from 'react'

const money = (amount, currency) => new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount || 0))

export default function ContributionModal({ open, currency = 'NGN', familyName = 'your family', onClose, onSubmit }) {
  const [amount, setAmount] = useState('25000')
  const [contributor, setContributor] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) { setAmount('25000'); setContributor(''); setNote(''); setError('') }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const submit = (event) => {
    event.preventDefault()
    const value = Number(amount)
    if (!contributor.trim()) return setError('Add the name of the person who contributed.')
    if (!Number.isSafeInteger(value) || value <= 0) return setError('Enter an amount greater than zero.')
    onSubmit({ amount: value, contributor: contributor.trim(), note: note.trim() })
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="modal-card contribution-dialog" role="dialog" aria-modal="true" aria-labelledby="contribution-title">
        <div className="modal-head"><div><span className="modal-kicker">CELEBRATE EVERY STEP</span><h2 id="contribution-title">Add a contribution</h2><p>Record who added to {familyName}'s savings goal.</p></div><button className="icon-button modal-close" onClick={onClose} aria-label="Close">×</button></div>
        <form onSubmit={submit}>
          <label className="field-label">Who contributed?<input autoFocus type="text" maxLength="48" value={contributor} onChange={(event) => setContributor(event.target.value)} placeholder="e.g. David, Mum, Uncle Chidi" /></label>
          <label className="field-label">How much did they add?<div className="amount-field"><span>₦</span><input type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="25000" /></div></label>
          <div className="quick-amounts"><span>Quick add</span>{[5000, 10000, 25000, 50000, 100000].map((value) => <button type="button" key={value} className={Number(amount) === value ? 'quick-amount selected' : 'quick-amount'} onClick={() => setAmount(String(value))}>{money(value, currency)}</button>)}</div>
          <label className="field-label">Add a note <small className="optional-label">Optional</small><input type="text" maxLength="90" value={note} onChange={(event) => setNote(event.target.value)} placeholder="e.g. November salary contribution" /></label>
          <div className="demo-warning"><span>i</span><p><b>Demo contribution.</b> This updates your household's demo balance and activity only. No money is transferred, deposited or verified on-chain.</p></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions"><button className="button button-secondary" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit">Add to family savings <span>→</span></button></div>
        </form>
      </section>
    </div>
  )
}
