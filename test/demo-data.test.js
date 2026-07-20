import test from "node:test";
import assert from "node:assert/strict";
import { makeDemoMarketData } from "../src/demo-data.js";
import { SYMBOLS } from "../src/draft.js";

test("sample market data covers every unique draft symbol", () => {
  const sample = makeDemoMarketData();
  assert.equal(Object.keys(sample.basis).length, SYMBOLS.length);
  assert.equal(Object.keys(sample.quotes).length, SYMBOLS.length);
  for (const symbol of SYMBOLS) {
    assert.ok(sample.basis[symbol] > 0);
    assert.ok(sample.quotes[symbol].price > 0);
  }
});
