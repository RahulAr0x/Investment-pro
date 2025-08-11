export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get("symbol")
  const timeframe = searchParams.get("timeframe") || "1D"

  if (!symbol) {
    return new Response(JSON.stringify({ error: "Symbol required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  console.log(`📈 Fetching chart data for ${symbol} (${timeframe})`)

  try {
    // Try Yahoo Finance historical data
    const chartData = await fetchYahooChartData(symbol, timeframe)

    if (chartData && chartData.length > 0) {
      console.log(`✅ Chart data loaded: ${chartData.length} points`)
      return Response.json({ chartData, source: "yahoo" })
    }
  } catch (error) {
    console.warn("⚠️ Chart data failed:", error)
  }

  // Fallback to mock data
  console.log("🎲 Using mock chart data")
  const mockData = generateMockChartData(symbol, timeframe)
  return Response.json({ chartData: mockData, source: "mock" })
}

async function fetchYahooChartData(symbol: string, timeframe: string) {
  const now = Math.floor(Date.now() / 1000)
  let period1: number
  let interval: string

  switch (timeframe) {
    case "1D":
      period1 = now - 24 * 60 * 60
      interval = "5m"
      break
    case "1W":
      period1 = now - 7 * 24 * 60 * 60
      interval = "30m"
      break
    case "1M":
      period1 = now - 30 * 24 * 60 * 60
      interval = "1d"
      break
    case "3M":
      period1 = now - 90 * 24 * 60 * 60
      interval = "1d"
      break
    case "6M":
      period1 = now - 180 * 24 * 60 * 60
      interval = "1d"
      break
    case "1Y":
      period1 = now - 365 * 24 * 60 * 60
      interval = "1d"
      break
    case "ALL":
      period1 = now - 5 * 365 * 24 * 60 * 60 // 5 years
      interval = "1wk"
      break
    default:
      period1 = now - 24 * 60 * 60
      interval = "5m"
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${now}&interval=${interval}`

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    signal: AbortSignal.timeout(10000),
  })

  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const data = await response.json()
  const result = data?.chart?.result?.[0]

  if (!result) throw new Error("No chart data")

  const timestamps = result.timestamp || []
  const prices = result.indicators?.quote?.[0]?.close || []
  const volumes = result.indicators?.quote?.[0]?.volume || []

  const chartData = timestamps
    .map((timestamp: number, index: number) => ({
      timestamp: timestamp * 1000,
      date: new Date(timestamp * 1000).toISOString(),
      price: Number((prices[index] || 0).toFixed(2)),
      volume: volumes[index] || 0,
    }))
    .filter((point: any) => point.price > 0)

  return chartData
}

function generateMockChartData(symbol: string, timeframe: string) {
  const now = Date.now()
  const points: any[] = []

  let intervals: number
  let intervalMs: number

  switch (timeframe) {
    case "1D":
      intervals = 78 // 6.5 hours * 12 (5-minute intervals)
      intervalMs = 5 * 60 * 1000
      break
    case "1W":
      intervals = 35
      intervalMs = 30 * 60 * 1000
      break
    case "1M":
      intervals = 30
      intervalMs = 24 * 60 * 60 * 1000
      break
    case "3M":
      intervals = 90
      intervalMs = 24 * 60 * 60 * 1000
      break
    case "6M":
      intervals = 180
      intervalMs = 24 * 60 * 60 * 1000
      break
    case "1Y":
      intervals = 252
      intervalMs = 24 * 60 * 60 * 1000
      break
    case "ALL":
      intervals = 1260 // 5 years
      intervalMs = 24 * 60 * 60 * 1000
      break
    default:
      intervals = 100
      intervalMs = 60 * 60 * 1000
  }

  // Base prices for realistic mock data
  let basePrice = 100
  if (symbol.includes("AAPL")) basePrice = 190
  else if (symbol.includes("MSFT")) basePrice = 430
  else if (symbol.includes("GOOGL")) basePrice = 150
  else if (symbol.includes("TSLA")) basePrice = 250
  else if (symbol.includes("NVDA")) basePrice = 875

  let currentPrice = basePrice

  for (let i = intervals; i >= 0; i--) {
    const timestamp = now - i * intervalMs

    const volatility = timeframe === "1D" ? 0.003 : 0.01
    const trend = (Math.random() - 0.5) * 0.002
    const noise = (Math.random() - 0.5) * volatility

    currentPrice = currentPrice * (1 + trend + noise)
    currentPrice = Math.max(currentPrice, basePrice * 0.7)

    points.push({
      timestamp,
      date: new Date(timestamp).toISOString(),
      price: Number(currentPrice.toFixed(2)),
      volume: Math.floor(Math.random() * 5000000) + 500000,
    })
  }

  return points
}
