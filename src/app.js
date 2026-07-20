import { COST_BASIS } from "./basis.js";
import { DRAFT, SEASON } from "./draft.js";
import { isUsMarketOpen, rankPlayers, scorePlayer, seasonProgress } from "./calculations.js";

const formatPercent = (value) => value === null ? "—" : `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
const formatMoney = (value) => value === null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
const quoteState = { quotes: {}, basis: COST_BASIS, updatedAt: null, loading: false, provider: null };

function updateSeason() {
  const progress = seasonProgress(new Date(), SEASON);
  document.getElementById("days-remaining").textContent = progress.daysRemaining;
  document.getElementById("days-elapsed").textContent = progress.daysElapsed;
  document.getElementById("percent-complete").textContent = `${progress.percent.toFixed(1)}%`;
  document.getElementById("progress-fill").style.width = `${progress.percent}%`;
  document.querySelector("[role='progressbar']").setAttribute("aria-valuenow", progress.percent.toFixed(1));
}

function updateMarketStatus() {
  const open = isUsMarketOpen();
  const status = document.getElementById("market-status");
  status.classList.toggle("open", open);
  status.lastElementChild.textContent = open ? "Market open" : "Market closed";
  return open;
}

function render() {
  const players = rankPlayers(DRAFT.map((player) => scorePlayer(player, quoteState.basis, quoteState.quotes)));
  document.getElementById("standings").innerHTML = players.map((player, index) => `
    <article class="rank-card ${player.complete ? "" : "incomplete"}">
      <div>
        <div class="rank-card-top"><small>Rank ${index + 1}</small><span class="short-pill">Short ${player.short}</span></div>
        <h3>${player.name}</h3>
      </div>
      <div>
        <strong class="rank-return ${player.portfolioReturn >= 0 ? "positive" : "negative"}">${formatPercent(player.portfolioReturn)}</strong>
        <p>${player.complete ? "15 of 15 positions reporting" : `${player.positions.filter((position) => position.return !== null).length} of 15 positions reporting`}</p>
      </div>
    </article>
  `).join("");

  document.getElementById("portfolios").innerHTML = players.map((player, index) => `
    <details class="portfolio" ${index === 0 ? "open" : ""}>
      <summary>
        <h3>${player.name}</h3>
        <span class="short-pill">${player.short} short</span>
        <strong class="portfolio-total ${player.portfolioReturn >= 0 ? "positive" : "negative"}">${formatPercent(player.portfolioReturn)}</strong>
      </summary>
      <div class="portfolio-content">
        ${player.positions.some((position) => position.basis !== null) ? positionTable(player) : emptyState()}
      </div>
    </details>
  `).join("");
}

function positionTable(player) {
  return `<div class="table-scroll"><table class="positions-table">
    <thead><tr><th>Security</th><th>Side</th><th>Jul 17 basis</th><th>Current</th><th>Return</th><th>Portfolio impact</th></tr></thead>
    <tbody>${player.positions.map((position) => `
      <tr>
        <td class="position-symbol">${position.symbol}</td>
        <td><span class="${position.side === "short" ? "short-pill" : "long-pill"}">${position.side}</span></td>
        <td>${formatMoney(position.basis)}</td>
        <td>${formatMoney(position.current)}</td>
        <td class="${position.return >= 0 ? "positive" : "negative"}">${formatPercent(position.return)}</td>
        <td class="${position.contribution >= 0 ? "positive" : "negative"}">${formatPercent(position.contribution)}</td>
      </tr>`).join("")}</tbody>
  </table></div>`;
}

function emptyState() {
  return document.getElementById("empty-state-template").innerHTML;
}

async function loadQuotes() {
  if (quoteState.loading) return;
  quoteState.loading = true;
  try {
    const response = await fetch("/api/quotes", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Quote request failed (${response.status})`);
    const payload = await response.json();
    quoteState.quotes = payload.quotes ?? {};
    quoteState.basis = payload.basis ?? COST_BASIS;
    quoteState.provider = payload.provider;
    quoteState.updatedAt = payload.updatedAt;
    const sampleMode = payload.provider === "sample";
    document.getElementById("demo-banner").hidden = !sampleMode;
    document.getElementById("updated").textContent = `${sampleMode ? "Sample data" : "Updated"} ${new Date(payload.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    render();
  } catch (error) {
    document.getElementById("updated").textContent = "Quote feed unavailable";
    console.error(error);
  } finally {
    quoteState.loading = false;
  }
}

updateSeason();
updateMarketStatus();
render();
loadQuotes();

setInterval(() => {
  updateSeason();
  if (updateMarketStatus()) loadQuotes();
}, 120_000);
