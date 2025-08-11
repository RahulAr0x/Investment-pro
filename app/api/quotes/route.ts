export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const symbols = searchParams.get("symbols")?.split(",") || []

  if (symbols.length === 0) {
    return new Response(JSON.stringify({ error: "No symbols provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  console.log(`📊 Fetching quotes for: ${symbols.join(", ")}`)

  // Try multiple APIs in sequence
  const apis = [
    { name: "Yahoo Finance", fn: tryYahooFinance },
    { name: "Financial Modeling Prep", fn: tryFMP },
    { name: "Alpha Vantage Demo", fn: tryAlphaVantageDemo },
  ]

  for (const api of apis) {
    try {
      console.log(`🔄 Trying ${api.name}...`)
      const result = await api.fn(symbols)
      if (result && result.length > 0) {
        console.log(`✅ ${api.name} success: ${result.length} quotes`)
        return Response.json({ quotes: result, source: api.name.toLowerCase() })
      }
    } catch (error) {
      console.warn(`⚠️ ${api.name} failed:`, error)
      continue
    }
  }

  // All APIs failed, return realistic mock data
  console.log("🎲 All APIs failed, generating mock data")
  const mockQuotes = symbols.map((symbol) => generateMockQuote(symbol))
  return Response.json({ quotes: mockQuotes, source: "mock" })
}

async function tryYahooFinance(symbols: string[]) {
  const urls = [
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`,
    `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`,
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        cache: "no-store",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "application/json",
          "Accept-Language": "en-US,en;q=0.9",
          Referer: "https://finance.yahoo.com/",
        },
        signal: AbortSignal.timeout(8000),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      const results = data?.quoteResponse?.result || []

      if (results.length === 0) throw new Error("No results")

      return results.map((r: any) => ({
        symbol: r.symbol,
        name: r.shortName || r.longName || r.symbol,
        price: Number(r.regularMarketPrice ?? r.postMarketPrice ?? r.preMarketPrice ?? 0),
        previousClose: Number(r.regularMarketPreviousClose ?? 0),
        change: Number(r.regularMarketChange ?? 0),
        changePercent: Number(r.regularMarketChangePercent ?? 0),
        currency: r.currency || "USD",
        exchange: r.fullExchangeName,
        marketState: r.marketState,
      }))
    } catch (error) {
      console.warn(`Yahoo endpoint failed:`, error)
      continue
    }
  }

  throw new Error("All Yahoo endpoints failed")
}

async function tryFMP(symbols: string[]) {
  // Financial Modeling Prep has a free tier
  const apiKey = "demo" // Using demo key for testing
  const url = `https://financialmodelingprep.com/api/v3/quote/${symbols.join(",")}?apikey=${apiKey}`

  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const data = await res.json()
  if (!Array.isArray(data) || data.length === 0) throw new Error("No data")

  return data.map((r: any) => ({
    symbol: r.symbol,
    name: r.name || r.symbol,
    price: Number(r.price ?? 0),
    previousClose: Number(r.previousClose ?? 0),
    change: Number(r.change ?? 0),
    changePercent: Number(r.changesPercentage ?? 0),
    currency: "USD",
    exchange: r.exchange,
    marketState: "REGULAR",
  }))
}

async function tryAlphaVantageDemo(symbols: string[]) {
  // Use Alpha Vantage demo key for a few symbols
  const demoKey = "demo"
  const results = []

  // Only try first 3 symbols to avoid rate limits
  for (const symbol of symbols.slice(0, 3)) {
    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${demoKey}`

      const res = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      const quote = data["Global Quote"]

      if (!quote) continue

      results.push({
        symbol: symbol,
        name: symbol,
        price: Number(quote["05. price"] ?? 0),
        previousClose: Number(quote["08. previous close"] ?? 0),
        change: Number(quote["09. change"] ?? 0),
        changePercent: Number(quote["10. change percent"]?.replace("%", "") ?? 0),
        currency: "USD",
        exchange: "NASDAQ",
        marketState: "REGULAR",
      })

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500))
    } catch (error) {
      console.warn(`Alpha Vantage failed for ${symbol}:`, error)
      continue
    }
  }

  if (results.length === 0) throw new Error("No Alpha Vantage data")
  return results
}

function generateMockQuote(symbol: string) {
  // Generate realistic prices based on symbol with current market context
  let basePrice = 100
  let currency = "USD"
  let name = symbol

  // Realistic pricing based on actual market values
  if (symbol.includes("AAPL")) {
    basePrice = 190
    name = "Apple Inc."
  } else if (symbol.includes("MSFT")) {
    basePrice = 430
    name = "Microsoft Corporation"
  } else if (symbol.includes("GOOGL")) {
    basePrice = 150
    name = "Alphabet Inc."
  } else if (symbol.includes("AMZN")) {
    basePrice = 160
    name = "Amazon.com Inc."
  } else if (symbol.includes("TSLA")) {
    basePrice = 250
    name = "Tesla Inc."
  } else if (symbol.includes("JPM")) {
    basePrice = 180
    name = "JPMorgan Chase & Co."
  } else if (symbol.includes("JNJ")) {
    basePrice = 170
    name = "Johnson & Johnson"
  } else if (symbol.includes("PFE")) {
    basePrice = 43
    name = "Pfizer Inc."
  } else if (symbol.includes("VNQ")) {
    basePrice = 95
    name = "Vanguard REIT ETF"
  } else if (symbol.includes("XAU")) {
    basePrice = 2080
    name = "Gold Spot"
  } else if (symbol.includes(".L")) {
    currency = "GBP"
    if (symbol.includes("SHEL")) {
      basePrice = 26
      name = "Shell PLC"
    } else if (symbol.includes("AZN")) {
      basePrice = 110
      name = "AstraZeneca PLC"
    } else if (symbol.includes("HSBA")) {
      basePrice = 6.8
      name = "HSBC Holdings PLC"
    } else if (symbol.includes("VOD")) {
      basePrice = 0.9
      name = "Vodafone Group PLC"
    } else if (symbol.includes("BP")) {
      basePrice = 5.2
      name = "BP PLC"
    } else if (symbol.includes("LLOY")) {
      basePrice = 0.55
      name = "Lloyds Banking Group"
    } else {
      basePrice = Math.random() * 20 + 5
      name = symbol.replace(".L", "") + " PLC"
    }
  }

  // Add realistic market volatility
  const price = basePrice + (Math.random() - 0.5) * basePrice * 0.06 // ±3% variation
  const changePercent = (Math.random() - 0.5) * 3 // ±1.5% daily change
  const previousClose = price / (1 + changePercent / 100)
  const change = price - previousClose

  return {
    symbol,
    name,
    price: Math.max(0.01, Number(price.toFixed(2))),
    previousClose: Math.max(0.01, Number(previousClose.toFixed(2))),
    change: Number(change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    currency,
    exchange: symbol.includes(".L") ? "LSE" : "NASDAQ",
    marketState: "REGULAR",
  }
}
