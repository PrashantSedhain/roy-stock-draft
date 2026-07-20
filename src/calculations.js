const DAY_MS = 86_400_000;

export function positionReturn(side, basis, current) {
  if (!Number.isFinite(basis) || basis <= 0 || !Number.isFinite(current)) return null;
  return side === "short" ? (basis - current) / basis : (current - basis) / basis;
}

export function scorePlayer(player, basisBySymbol, quotesBySymbol) {
  const positions = player.picks.map((symbol) => {
    const side = symbol === player.short ? "short" : "long";
    const basis = basisBySymbol[symbol] ?? null;
    const current = quotesBySymbol[symbol]?.price ?? null;
    const returnValue = positionReturn(side, basis, current);
    return { symbol, side, basis, current, return: returnValue, contribution: returnValue === null ? null : returnValue / player.picks.length };
  });
  const valid = positions.filter((position) => position.return !== null);
  const portfolioReturn = valid.length === positions.length
    ? valid.reduce((sum, position) => sum + position.return, 0) / positions.length
    : null;
  return { ...player, positions, portfolioReturn, complete: valid.length === positions.length };
}

export function rankPlayers(players) {
  return [...players].sort((a, b) => {
    if (a.portfolioReturn === null && b.portfolioReturn === null) return 0;
    if (a.portfolioReturn === null) return 1;
    if (b.portfolioReturn === null) return -1;
    return b.portfolioReturn - a.portfolioReturn;
  });
}

export function normalizeTickerQuery(query) {
  return query.toUpperCase().replace(/[^A-Z0-9.-]/g, "").slice(0, 8);
}

export function filterPlayersByTicker(players, query) {
  const normalized = normalizeTickerQuery(query);
  if (!normalized) return players;
  return players.filter((player) => player.picks.some((symbol) => symbol.includes(normalized)));
}

export function seasonProgress(now, season) {
  const start = new Date(season.start);
  const end = new Date(season.anniversary);
  const elapsedMs = Math.min(Math.max(now - start, 0), end - start);
  const remainingMs = Math.max(end - now, 0);
  return {
    daysElapsed: Math.floor(elapsedMs / DAY_MS),
    daysRemaining: Math.ceil(remainingMs / DAY_MS),
    percent: ((elapsedMs / (end - start)) * 100)
  };
}

export function isUsMarketOpen(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(now).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
  if (["Sat", "Sun"].includes(parts.weekday)) return false;
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const closures = new Set([
    "2026-09-07", "2026-11-26", "2026-12-25",
    "2027-01-01", "2027-01-18", "2027-02-15", "2027-03-26",
    "2027-05-31", "2027-06-18", "2027-07-05"
  ]);
  if (closures.has(date)) return false;
  const earlyCloses = new Set(["2026-11-27", "2026-12-24", "2027-07-02"]);
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  return minutes >= 570 && minutes < (earlyCloses.has(date) ? 780 : 960);
}
