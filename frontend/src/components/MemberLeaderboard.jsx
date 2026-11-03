import { buildMemberLeaderboard } from '../lib/memberLeaderboard'

const money = (amount, currency = 'NGN') => new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency,
  maximumFractionDigits: 0,
}).format(Number(amount || 0))

function downloadCsv(members, grandTotal, currency) {
  const rows = [
    ['Rank', 'Contributor', 'Total contributed', 'Share of family contributions', 'Contribution count', 'Last contribution', 'Currency'],
    ...members.map((member) => [
      member.rank,
      member.name,
      member.total,
      `${member.share.toFixed(2)}%`,
      member.contributions,
      member.lastContribution,
      currency,
    ]),
    ['', 'Family total', grandTotal, '100.00%', members.reduce((sum, member) => sum + member.contributions, 0), '', currency],
  ]
  const escapeCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
  const csv = rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'tandem-family-contributions.csv'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function MemberLeaderboard({ entries = [], currency = 'NGN', compact = false, onViewAll }) {
  const members = buildMemberLeaderboard(entries)
  const grandTotal = members.reduce((sum, member) => sum + member.total, 0)
  const visibleMembers = compact ? members.slice(0, 3) : members
  const totalContributions = members.reduce((sum, member) => sum + member.contributions, 0)

  return (
    <section className={`panel member-leaderboard ${compact ? 'member-leaderboard-compact' : ''}`}>
      <div className="panel-heading leaderboard-heading">
        <div>
          <span className="eyebrow">THE FAMILY TEAM</span>
          <h3>Member leaderboard</h3>
          <p>See how every person is helping the family move forward.</p>
        </div>
        {!compact && members.length > 0 && (
          <button className="button button-secondary leaderboard-export" type="button" onClick={() => downloadCsv(members, grandTotal, currency)}>
            <span aria-hidden="true">↓</span> Export CSV
          </button>
        )}
      </div>

      {members.length ? (
        <>
          <div className="leaderboard-summary">
            <div><small>FAMILY CONTRIBUTIONS</small><b>{money(grandTotal, currency)}</b></div>
            <div><small>CONTRIBUTORS</small><b>{members.length}</b></div>
            <div><small>CONTRIBUTION ENTRIES</small><b>{totalContributions}</b></div>
          </div>

          <div className="leaderboard-list" aria-label="Contribution shares by family member">
            {visibleMembers.map((member) => (
              <article className="leaderboard-member" key={member.key}>
                <div className={`leaderboard-rank rank-${Math.min(member.rank, 4)}`} aria-label={`Rank ${member.rank}`}>
                  {member.rank <= 3 ? ['1st', '2nd', '3rd'][member.rank - 1] : `#${member.rank}`}
                </div>
                <div className="leaderboard-member-main">
                  <div className="leaderboard-member-meta">
                    <div className="leaderboard-person">
                      <span className={`leaderboard-avatar avatar-tone-${(member.rank - 1) % 4}`}>{member.name.slice(0, 1).toUpperCase()}</span>
                      <span><b>{member.name}</b><small>{member.contributions} {member.contributions === 1 ? 'contribution' : 'contributions'}</small></span>
                    </div>
                    <div className="leaderboard-value"><b>{money(member.total, currency)}</b><strong>{member.share.toFixed(1)}%</strong></div>
                  </div>
                  <div className="leaderboard-track" role="progressbar" aria-label={`${member.name}'s share of family contributions`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={Number(member.share.toFixed(1))}>
                    <span style={{ width: `${member.share}%` }} />
                  </div>
                  <div className="leaderboard-share-caption"><span>Share of family total</span><span>{member.lastContribution ? `Last added ${new Date(`${member.lastContribution}T12:00:00`).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}` : 'Date not recorded'}</span></div>
                </div>
              </article>
            ))}
          </div>

          {compact && members.length > 3 && (
            <button type="button" className="text-button leaderboard-view-all" onClick={onViewAll}>
              View all {members.length} contributors <span>→</span>
            </button>
          )}
          <p className="leaderboard-footnote">Percentages are calculated from named demo contributions only. They show each person's share of the recorded family total.</p>
        </>
      ) : (
        <div className="leaderboard-empty">
          <span aria-hidden="true">✧</span>
          <b>Your family leaderboard starts with the first contribution.</b>
          <p>Add a contribution with a person's name and their share will appear here automatically.</p>
        </div>
      )}
    </section>
  )
}
