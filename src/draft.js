export const SEASON = Object.freeze({
  start: "2026-07-17T16:00:00-04:00",
  anniversary: "2027-07-17T16:00:00-04:00",
  finalMarketClose: "2027-07-16T16:00:00-04:00"
});

export const DRAFT = Object.freeze([
  { name: "Nate", short: "SKHY", picks: ["NBIS", "ZETA", "GOOG", "AVGO", "MRVL", "AMD", "MU", "CRDO", "LITE", "CEG", "TSM", "SHOP", "SKHY", "NUAI", "BYND"] },
  { name: "Manuel", short: "LMND", picks: ["CRWV", "ASTS", "MELI", "WIX", "HROW", "FPS", "SEDG", "ACMR", "MP", "CLPT", "ELVA", "OMDA", "LMND", "NRXS", "SPCX"] },
  { name: "Dr. Roy", short: "AXON", picks: ["META", "NVDA", "MSFT", "ORCL", "APP", "GLW", "AAOI", "NOK", "AMKR", "AEHR", "VG", "NVTS", "AXON", "AMPG", "BMBL"] },
  { name: "Neil", short: "ELVA", picks: ["SOFI", "DLO", "NU", "RDDT", "AMZN", "UBER", "PENG", "INTC", "NFLX", "VOYG", "AXON", "LMND", "ELVA", "OWLT", "OPEN"] },
  { name: "Tevis", short: "PENG", picks: ["HOOD", "RKLB", "NOW", "PLTR", "BE", "SNDK", "TE", "FIGR", "SKHY", "SMCI", "ONDS", "IREN", "PENG", "PDYN", "POET"] }
]);

export const SYMBOLS = Object.freeze([...new Set(DRAFT.flatMap((player) => player.picks))].sort());
