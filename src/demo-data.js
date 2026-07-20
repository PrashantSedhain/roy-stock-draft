import { SYMBOLS } from "./draft.js";

function symbolScore(symbol) {
  return [...symbol].reduce((total, character) => total + character.charCodeAt(0), 0);
}

export function makeDemoMarketData() {
  const basis = {};
  const quotes = {};
  for (const [index, symbol] of SYMBOLS.entries()) {
    const score = symbolScore(symbol);
    const cost = Number((12 + ((score * 1.73 + index * 5.2) % 280)).toFixed(2));
    const move = (((score + index * 19) % 420) - 160) / 1000;
    basis[symbol] = cost;
    quotes[symbol] = {
      price: Number((cost * (1 + move)).toFixed(2)),
      previousClose: Number((cost * (1 + move - 0.006)).toFixed(2)),
      timestamp: Math.floor(Date.now() / 1000)
    };
  }
  return { basis, quotes };
}
