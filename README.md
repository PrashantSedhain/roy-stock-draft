# Market League Review

A lightweight, responsive stock-draft leaderboard using the Executive Broadsheet design. The frontend is static HTML/CSS/JavaScript and the quote proxy is a Vercel serverless function.

## Rules

- Five participants with fifteen equal-weight positions each.
- One short position per participant.
- Cost basis is the Friday, July 17, 2026 closing price.
- The anniversary is July 17, 2027. Because that date is Saturday, final tradable prices come from Friday, July 16 at market close.
- Long return: `(current - basis) / basis`.
- Short return: `(basis - current) / basis`.
- Portfolio return: arithmetic mean of all fifteen returns.

## Local setup

1. Create `.env.local` with one quote provider:

   ```text
   FINNHUB_API_KEY=your_key
   ```

   Or, for a single batch quote request:

   ```text
   MARKETDATA_API_TOKEN=your_token
   ```

2. Populate the immutable July 17 cost basis using the configured provider:

   ```bash
   MARKETDATA_API_TOKEN=your_token npm run basis
   ```

   If both provider variables are set, Market Data takes precedence. Finnhub can instead be used with `FINNHUB_API_KEY=your_key npm run basis`.

3. Review `src/basis.js`. New, delisted, or unsupported symbols may need manual closing prices.

4. Run through Vercel:

   ```bash
   npm run dev
   ```

Static UI work can use `npm run serve`, but `/api/quotes` requires Vercel dev or deployment.

## Provider note

There are more unique symbols than Finnhub's typical free limit of 60 calls per minute, and Finnhub quotes are fetched one symbol per request. Vercel caches the combined response for two minutes during market hours, but the first uncached request may still be partially rate-limited. Market Data's batch endpoint is supported to avoid that limitation; set `MARKETDATA_API_TOKEN` and it takes precedence.

The API cache is two minutes while the market is open and one hour while closed. The browser only polls during regular US market hours after its initial load; NYSE holidays and scheduled early closes during the draft season are accounted for.

## Deploy

1. Push this directory to GitHub.
2. Import the repository in Vercel.
3. Add `FINNHUB_API_KEY` or `MARKETDATA_API_TOKEN` under Project Settings → Environment Variables.
4. Deploy. No build command or framework preset is required.

## Verification

```bash
npm test
```
