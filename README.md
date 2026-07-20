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

### Validate with sample data

Sample mode exercises all 70 symbols, portfolio calculations, short positions, ranking, tables, and the local API without consuming provider credits. Run:

```bash
npm run dev:sample
```

Open `http://localhost:3000`. A yellow **Sample data mode** banner must be visible, all five standings must have returns, and every expanded portfolio must show 15 priced positions. Test mobile sizing with browser responsive mode. Sample mode is never enabled unless `USE_MOCK_DATA=true` is explicitly configured.

### Validate with Market Data

1. Replace the sample setting in `.env.local` with:

   ```text
   MARKETDATA_API_TOKEN=your_token
   ```

2. Populate the immutable July 17 cost basis. This reads the token from `.env.local`:

   ```bash
   npm run basis
   ```

3. Start the complete local app:

   ```bash
   npm run dev:vercel
   ```

4. Check the normalized API response directly at `http://localhost:3000/api/quotes`. It should report `"provider":"marketdata"`, `"requested":70`, and `"received":70` before the UI is considered ready to deploy.

Finnhub can be used instead by setting:

```text
FINNHUB_API_KEY=your_key
```

Then run `npm run basis`. If both provider variables are set, Market Data takes precedence. Review `src/basis.js` after either basis command because new, delisted, or unsupported symbols may require manual closing prices.

For static UI work without API functions, use `npm run dev`. The commands are separate because a `dev` script that invokes `vercel dev` causes Vercel CLI to recursively invoke itself.

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
