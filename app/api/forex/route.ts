export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const base = searchParams.get("base") || "EUR"

  console.log(`💱 Fetching forex rates for base: ${base}`)

  // Try multiple forex APIs
  const forexAPIs = [
    {
      name: "ExchangeRate-API",
      fn: async () => {
        const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`, {
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        return {
          USD: data.rates.USD,
          GBP: data.rates.GBP,
          INR: data.rates.INR,
          source: "exchangerate-api.com",
        }
      },
    },
    {
      name: "Fixer.io",
      fn: async () => {
        const res = await fetch(`https://api.fixer.io/latest?base=${base}&symbols=USD,GBP,INR`, {
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        return {
          USD: data.rates.USD,
          GBP: data.rates.GBP,
          INR: data.rates.INR,
          source: "fixer.io",
        }
      },
    },
    {
      name: "CurrencyAPI",
      fn: async () => {
        const res = await fetch(
          `https://api.currencyapi.com/v3/latest?apikey=cur_live_demo&base_currency=${base}&currencies=USD,GBP,INR`,
          {
            cache: "no-store",
            signal: AbortSignal.timeout(8000),
          },
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        return {
          USD: data.data.USD.value,
          GBP: data.data.GBP.value,
          INR: data.data.INR.value,
          source: "currencyapi.com",
        }
      },
    },
  ]

  // Try each API
  for (const api of forexAPIs) {
    try {
      console.log(`🔄 Trying ${api.name}...`)
      const rates = await api.fn()

      if (rates.USD && rates.GBP && rates.INR) {
        const result = {
          base,
          rates: {
            USD: Number(rates.USD),
            GBP: Number(rates.GBP),
            INR: Number(rates.INR),
          },
          timestamp: Date.now(),
          source: rates.source,
        }

        console.log(`✅ ${api.name} forex success:`, result.rates)
        return Response.json(result)
      }
    } catch (error) {
      console.warn(`⚠️ ${api.name} failed:`, error)
      continue
    }
  }

  // All APIs failed, return realistic mock data
  console.log("🔄 All forex APIs failed, using mock data")
  const mockRates = {
    base: "EUR",
    rates: {
      USD: 1.08 + (Math.random() - 0.5) * 0.04, // 1.06 - 1.10
      GBP: 0.87 + (Math.random() - 0.5) * 0.02, // 0.86 - 0.88
      INR: 90 + (Math.random() - 0.5) * 3, // 88.5 - 91.5
    },
    timestamp: Date.now(),
    source: "mock",
  }

  return Response.json(mockRates)
}
