export function repeatMemberMetrics(attendance: { userId: string; tripId: string }[]) {
  const visits = new Map<string, Set<string>>();
  for (const row of attendance) { const set = visits.get(row.userId) ?? new Set<string>(); set.add(row.tripId); visits.set(row.userId, set); }
  const repeat = [...visits.values()].filter(v => v.size >= 2).length;
  return { members: visits.size, repeat, rate: visits.size ? repeat / visits.size * 100 : 0 };
}
export function cancellationRate(active: number, cancellations: number) {
  return active + cancellations ? cancellations / (active + cancellations) * 100 : 0;
}
