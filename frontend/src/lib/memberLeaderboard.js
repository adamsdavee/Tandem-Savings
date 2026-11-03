/**
 * Aggregate named demo contributions into per-member totals and family shares.
 * Names are merged case-insensitively after trimming whitespace.
 */
export function buildMemberLeaderboard(entries = []) {
  const grouped = new Map()

  for (const entry of entries) {
    const name = String(entry.contributor || '').trim()
    const amount = Number(entry.amount || 0)
    if (!name || !Number.isFinite(amount) || amount <= 0) continue

    const key = name.toLocaleLowerCase('en')
    const member = grouped.get(key) || {
      key,
      name,
      total: 0,
      contributions: 0,
      lastContribution: '',
    }

    member.total += amount
    member.contributions += 1
    if (String(entry.date || '') > member.lastContribution) {
      member.lastContribution = String(entry.date || '')
    }
    grouped.set(key, member)
  }

  const members = [...grouped.values()].sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total
    return a.name.localeCompare(b.name)
  })
  const grandTotal = members.reduce((sum, member) => sum + member.total, 0)

  return members.map((member, index) => ({
    ...member,
    rank: index + 1,
    share: grandTotal > 0 ? member.total / grandTotal * 100 : 0,
  }))
}
