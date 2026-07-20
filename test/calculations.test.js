import test from "node:test";
import assert from "node:assert/strict";
import { filterPlayersByTicker, isUsMarketOpen, normalizeTickerQuery, positionReturn, rankPlayers, scorePlayer, seasonProgress } from "../src/calculations.js";

test("long positions gain when price rises", () => {
  assert.equal(positionReturn("long", 100, 125), 0.25);
});

test("short positions gain when price falls", () => {
  assert.equal(positionReturn("short", 100, 75), 0.25);
  assert.equal(positionReturn("short", 100, 125), -0.25);
});

test("all positions receive equal weight", () => {
  const player = { name: "Test", short: "BBB", picks: ["AAA", "BBB"] };
  const result = scorePlayer(player, { AAA: 100, BBB: 100 }, { AAA: { price: 120 }, BBB: { price: 80 } });
  assert.equal(result.portfolioReturn, 0.2);
  assert.equal(result.positions[0].contribution, 0.1);
  assert.equal(result.positions[1].contribution, 0.1);
});

test("incomplete prices do not produce a misleading score", () => {
  const player = { name: "Test", short: "BBB", picks: ["AAA", "BBB"] };
  const result = scorePlayer(player, { AAA: 100, BBB: 100 }, { AAA: { price: 120 } });
  assert.equal(result.portfolioReturn, null);
  assert.equal(result.complete, false);
});

test("players rank by descending return", () => {
  const ranked = rankPlayers([{ name: "B", portfolioReturn: -0.1 }, { name: "A", portfolioReturn: 0.2 }]);
  assert.deepEqual(ranked.map((player) => player.name), ["A", "B"]);
});

test("season progress clamps before and after the season", () => {
  const season = { start: "2026-07-17T16:00:00-04:00", anniversary: "2027-07-17T16:00:00-04:00" };
  assert.equal(seasonProgress(new Date("2026-01-01"), season).percent, 0);
  assert.equal(seasonProgress(new Date("2028-01-01"), season).percent, 100);
});

test("market hours use the New York schedule", () => {
  assert.equal(isUsMarketOpen(new Date("2026-07-20T14:00:00Z")), true);
  assert.equal(isUsMarketOpen(new Date("2026-07-20T21:00:00Z")), false);
  assert.equal(isUsMarketOpen(new Date("2026-09-07T14:00:00Z")), false);
  assert.equal(isUsMarketOpen(new Date("2026-11-27T19:00:00Z")), false);
});

test("ticker search normalizes input and finds every holder", () => {
  const players = [
    { name: "One", picks: ["AXON", "MSFT"] },
    { name: "Two", picks: ["AXON", "NVDA"] },
    { name: "Three", picks: ["META"] }
  ];
  assert.equal(normalizeTickerQuery(" axon! "), "AXON");
  assert.deepEqual(filterPlayersByTicker(players, "axon").map((player) => player.name), ["One", "Two"]);
  assert.deepEqual(filterPlayersByTicker(players, "nv").map((player) => player.name), ["Two"]);
  assert.equal(filterPlayersByTicker(players, "zzz").length, 0);
  assert.equal(filterPlayersByTicker(players, "").length, 3);
});
