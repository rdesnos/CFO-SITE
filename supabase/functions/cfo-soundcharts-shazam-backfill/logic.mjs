export function chooseIdentifier(items, preferred = null) {
  const dated = items.filter(x => typeof x?.date === "string" && Array.isArray(x.plots))
    .sort((a,b) => b.date.localeCompare(a.date));
  if (preferred && dated.some(x => x.plots.some(p => String(p.identifier) === preferred))) return preferred;
  for (const day of dated) {
    const plots = day.plots.filter(x => x.identifier && x.value != null && Number.isFinite(Number(x.value)) && Number(x.value) >= 0)
      .sort((a,b) => Number(b.value)-Number(a.value) || String(a.identifier).localeCompare(String(b.identifier)));
    if (plots[0]) return String(plots[0].identifier);
  }
  return null;
}
export function normalize(items, identifier, start, end) {
  return items.flatMap(item => {
    const date = String(item.date || "").slice(0,10);
    const plot = item.plots?.find(x => String(x.identifier) === identifier);
    if (date < start || date > end || !plot || plot.value == null || !Number.isFinite(Number(plot.value)) || Number(plot.value) < 0) return [];
    return [{date, value:Number(plot.value), identifier}];
  });
}
