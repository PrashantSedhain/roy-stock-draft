import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { SYMBOLS } from "../src/draft.js";

const marketDataToken = process.env.MARKETDATA_API_TOKEN;
const finnhubToken = process.env.FINNHUB_API_KEY;
if (!marketDataToken && !finnhubToken) {
  console.error("MARKETDATA_API_TOKEN or FINNHUB_API_KEY is required.");
  process.exit(1);
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const from = Math.floor(new Date("2026-07-17T00:00:00-04:00").getTime() / 1000);
const to = Math.floor(new Date("2026-07-18T00:00:00-04:00").getTime() / 1000);
const prices = {};
const missing = [];

for (const [index, symbol] of SYMBOLS.entries()) {
  const usingMarketData = Boolean(marketDataToken);
  const url = usingMarketData
    ? `https://api.marketdata.app/v1/stocks/candles/D/${encodeURIComponent(symbol)}/?from=2026-07-17&to=2026-07-17`
    : `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${to}&token=${encodeURIComponent(finnhubToken)}`;
  const response = await fetch(url, usingMarketData ? {
    headers: { Authorization: `Bearer ${marketDataToken}`, Accept: "application/json" }
  } : undefined);
  if (!response.ok) throw new Error(`${symbol}: provider returned ${response.status}`);
  const payload = await response.json();
  if (payload.s === "ok" && Array.isArray(payload.c) && Number.isFinite(payload.c.at(-1))) {
    prices[symbol] = payload.c.at(-1);
    console.log(`${index + 1}/${SYMBOLS.length} ${symbol}: ${prices[symbol]}`);
  } else {
    missing.push(symbol);
    console.warn(`${index + 1}/${SYMBOLS.length} ${symbol}: no July 17 close`);
  }
  if (index < SYMBOLS.length - 1) await wait(usingMarketData ? 100 : 1100);
}

const output = `// Fixed closing prices from Friday, July 17, 2026.\nexport const COST_BASIS = Object.freeze(${JSON.stringify(prices, null, 2)});\n`;
const outputPath = fileURLToPath(new URL("../src/basis.js", import.meta.url));
await writeFile(outputPath, output, "utf8");
console.log(`Wrote ${Object.keys(prices).length} prices to src/basis.js`);
if (missing.length) console.warn(`Missing symbols require manual review: ${missing.join(", ")}`);
