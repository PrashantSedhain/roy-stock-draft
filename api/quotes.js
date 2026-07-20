import { isUsMarketOpen } from "../src/calculations.js";
import { SYMBOLS } from "../src/draft.js";

const FINNHUB_URL = "https://finnhub.io/api/v1/quote";
const MARKETDATA_URL = "https://api.marketdata.app/v1/stocks/quotes";

async function fetchMarketDataQuotes(token) {
  const response = await fetch(`${MARKETDATA_URL}/${SYMBOLS.join(",")}/`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
  });
  if (!response.ok) throw new Error(`Market Data returned ${response.status}`);
  const payload = await response.json();
  if (payload.s !== "ok" || !Array.isArray(payload.symbol)) throw new Error("Market Data returned an invalid quote payload");
  return Object.fromEntries(payload.symbol.map((symbol, index) => [symbol, {
    price: payload.last[index],
    previousClose: payload.prevClose?.[index] ?? null,
    timestamp: payload.updated?.[index] ?? null
  }]));
}

async function fetchFinnhubQuotes(token) {
  const results = await Promise.allSettled(SYMBOLS.map(async (symbol) => {
    const response = await fetch(`${FINNHUB_URL}?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error(`${symbol}: ${response.status}`);
    const payload = await response.json();
    if (!Number.isFinite(payload.c) || payload.c <= 0) throw new Error(`${symbol}: no quote`);
    return [symbol, { price: payload.c, previousClose: payload.pc ?? null, timestamp: payload.t ?? null }];
  }));
  const quotes = Object.fromEntries(results.filter((result) => result.status === "fulfilled").map((result) => result.value));
  if (Object.keys(quotes).length === 0) throw new Error("Finnhub returned no usable quotes");
  return quotes;
}

export default async function handler(_request, response) {
  const open = isUsMarketOpen();
  const maxAge = open ? 120 : 3600;
  response.setHeader("Cache-Control", `public, s-maxage=${maxAge}, stale-while-revalidate=${open ? 300 : 43200}`);
  response.setHeader("Content-Type", "application/json; charset=utf-8");

  try {
    let quotes;
    let provider;
    if (process.env.MARKETDATA_API_TOKEN) {
      quotes = await fetchMarketDataQuotes(process.env.MARKETDATA_API_TOKEN);
      provider = "marketdata";
    } else if (process.env.FINNHUB_API_KEY) {
      quotes = await fetchFinnhubQuotes(process.env.FINNHUB_API_KEY);
      provider = "finnhub";
    } else {
      return response.status(503).json({ error: "No quote provider configured" });
    }
    return response.status(200).json({
      quotes,
      provider,
      marketOpen: open,
      updatedAt: new Date().toISOString(),
      requested: SYMBOLS.length,
      received: Object.keys(quotes).length
    });
  } catch (error) {
    console.error("Quote fetch failed", error);
    return response.status(502).json({ error: "Quote provider unavailable" });
  }
}
