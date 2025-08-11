# Build Instructions: Investment Dashboard Prototype (AI-Agent Ready)

This document describes how to enable accurate, real-time portfolio tracking and market updates for the UK-based investment dashboard for user Rahul Ravi.

Overview
- Framework: Next.js App Router (Next.js 15) with shadcn/ui and Recharts.
- Data:
  - Quotes: Yahoo Finance public endpoint (best-effort) OR Alpha Vantage (recommended for reliability).
  - FX Rates: exchangerate.host (no key required).
- Reporting currency: EUR.
- State: Settings persisted to localStorage; production deployments should use server routes and secrets.

Files to Review
- components/portfolio-provider.tsx: Shared settings, snapshot values, and default holdings.
- lib/finance.ts: Data providers, FX conversion, and adapters.
- lib/utils-calc.ts: Portfolio math and formatting.
- components/portfolio-summary.tsx: Main fetch loop and portfolio KPIs.
- components/visuals/*: Charts and ticker.
- components/tables/holdings-table.tsx: Interactive holdings table.

Data Providers
1) Yahoo Finance (default)
- Endpoint: https://query1.finance.yahoo.com/v7/finance/quote?symbols=AAPL,MSFT,VOD.L
- Pros: No API key; single batched request for multiple symbols.
- Cons: May be CORS-blocked or rate-limited; treat as best-effort.

2) Alpha Vantage (recommended)
- Endpoint: https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SYMBOL&apikey=KEY
- Pros: Reliable and documented.
- Cons: Free tier limited to 5 requests/min; single-symbol requests.
- How to enable:
  - Open Settings in the app.
  - Switch Provider to "Alpha Vantage".
  - Paste your API key. It’s stored in localStorage (prototype only).

3) FX Rates
- Endpoint: https://api.exchangerate.host/latest?base=EUR&symbols=USD,GBP
- No API key required; used to convert quote currencies (USD/GBP) to EUR.

Symbols Used
- US Stocks: AAPL, MSFT, AMZN
- UK Stocks: VOD.L, HSBA.L
- Real Estate (REIT ETF): VNQ
- Gold: XAUUSD

Accurate Calculations
- Compute current value in native currency: lastPrice * qty.
- Convert to EUR: amount_native / (EUR->native rate).
- Cost basis in EUR uses current FX for prototype; production should record historical FX at trade time.
- P/L (EUR) = valueEUR - costEUR; P/L % relative to costEUR.
- Allocation by category computed from valueEUR.

Auto-Refresh and Caching
- Auto-refresh interval is configurable in Settings (default 60s).
- FX rates cached in localStorage with timestamp; used as fallback.
- On errors or rate limits, the app shows a toast and continues with last known data.

Production Hardening
- Move API calls to Next.js Route Handlers or Server Actions to avoid CORS and hide keys.
- Store provider keys in environment variables:
  - ALPHA_VANTAGE_API_KEY
  - YAHOO proxy key if you deploy a proxy.
- Add request coalescing and symbol-level caching (e.g., Upstash or Edge Config).
- Record historical prices and FX at transaction time for precise P/L and tax lots.

Extending the Prototype
- Authentication: Add a real auth layer (e.g., Supabase or NextAuth).
- Orders: Integrate with a broker API; replace the Trade dialog with a real order ticket.
- Transactions: Connect to back office or CSV ingestion; compute realized/unrealized P/L and tax lots (FIFO/LIFO).
- Benchmarks: Add MSCI World or S&P 500 EUR hedged benchmarks for relative performance.
- Risk: Show volatility, max drawdown, Sharpe ratio on performance chart.

Testing
- Validate currency conversions — alter FX rates to ensure totals adjust.
- Simulate rate limits — Alpha Vantage adapter handles sequential fetches with minimal delays.
- Cross-browser CORS — if Yahoo is blocked, switch to Alpha Vantage in Settings.

Notes
- The dashboard shows a fixed snapshot value (€54,271.43) alongside a live estimate computed from current quotes. This ensures the snapshot requirement is met while providing real-time tracking capability.
