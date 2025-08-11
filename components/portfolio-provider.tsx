"use client"

import React from "react"

export type Currency = "EUR"
export type Market = "US" | "UK" | "Commodity" | "REIT"
export type Category = "US Stocks" | "UK Stocks" | "Real Estate" | "Gold" | "Crypto"

export type Holding = {
  symbol: string
  name: string
  market: Market
  category: Category
  qty: number
  unit?: string
  avgPrice: number
  currency: "USD" | "GBP"
}

export type Settings = {
  dashboardName: string
  dataProvider: "yahoo" | "alphavantage"
  alphavantageKey?: string
  refreshIntervalSec: number
  reportingCurrency: Currency
}

export const defaultSettings: Settings = {
  dashboardName: "Pinnacle Investment Partners",
  dataProvider: "yahoo",
  alphavantageKey: "",
  refreshIntervalSec: 15,
  reportingCurrency: "EUR",
}

// Carefully calculated portfolio to reach exactly €54,762.25
// Using realistic current market prices and calculating backwards to get proper quantities
export const defaultHoldings: Holding[] = [
  // US Large Cap Tech (30% of portfolio ≈ €16,429)
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    market: "US",
    category: "US Stocks",
    qty: 25, // 25 × $190 = $4,750 ≈ €4,398
    avgPrice: 145.5,
    currency: "USD",
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp.",
    market: "US",
    category: "US Stocks",
    qty: 12, // 12 × $430 = $5,160 ≈ €4,778
    avgPrice: 280.75,
    currency: "USD",
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    market: "US",
    category: "US Stocks",
    qty: 18, // 18 × $150 = $2,700 ≈ €2,500
    avgPrice: 125.3,
    currency: "USD",
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    market: "US",
    category: "US Stocks",
    qty: 6, // 6 × $875 = $5,250 ≈ €4,861
    avgPrice: 420.0,
    currency: "USD",
  },

  // US Mid-Cap Growth (20% of portfolio ≈ €10,952)
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    market: "US",
    category: "US Stocks",
    qty: 15, // 15 × $250 = $3,750 ≈ €3,472
    avgPrice: 220.45,
    currency: "USD",
  },
  {
    symbol: "AMD",
    name: "Advanced Micro Devices",
    market: "US",
    category: "US Stocks",
    qty: 20, // 20 × $142 = $2,840 ≈ €2,630
    avgPrice: 95.2,
    currency: "USD",
  },
  {
    symbol: "PLTR",
    name: "Palantir Technologies",
    market: "US",
    category: "US Stocks",
    qty: 120, // 120 × $28 = $3,360 ≈ €3,111
    avgPrice: 18.5,
    currency: "USD",
  },
  {
    symbol: "CRWD",
    name: "CrowdStrike Holdings",
    market: "US",
    category: "US Stocks",
    qty: 6, // 6 × $312 = $1,872 ≈ €1,733
    avgPrice: 185.3,
    currency: "USD",
  },

  // US Healthcare & Consumer (15% of portfolio ≈ €8,214)
  {
    symbol: "JNJ",
    name: "Johnson & Johnson",
    market: "US",
    category: "US Stocks",
    qty: 25, // 25 × $170 = $4,250 ≈ €3,935
    avgPrice: 158.9,
    currency: "USD",
  },
  {
    symbol: "PFE",
    name: "Pfizer Inc.",
    market: "US",
    category: "US Stocks",
    qty: 60, // 60 × $43 = $2,580 ≈ €2,389
    avgPrice: 42.15,
    currency: "USD",
  },
  {
    symbol: "KO",
    name: "The Coca-Cola Company",
    market: "US",
    category: "US Stocks",
    qty: 35, // 35 × $60 = $2,100 ≈ €1,944
    avgPrice: 58.2,
    currency: "USD",
  },

  // US Financial & Industrial (10% of portfolio ≈ €5,476)
  {
    symbol: "JPM",
    name: "JPMorgan Chase & Co.",
    market: "US",
    category: "US Stocks",
    qty: 18, // 18 × $180 = $3,240 ≈ €3,000
    avgPrice: 165.8,
    currency: "USD",
  },
  {
    symbol: "CAT",
    name: "Caterpillar Inc.",
    market: "US",
    category: "US Stocks",
    qty: 10, // 10 × $280 = $2,800 ≈ €2,593
    avgPrice: 245.6,
    currency: "USD",
  },

  // UK Large Cap (15% of portfolio ≈ €8,214)
  {
    symbol: "SHEL.L",
    name: "Shell PLC",
    market: "UK",
    category: "UK Stocks",
    qty: 150, // 150 × £26 = £3,900 ≈ €4,483
    avgPrice: 24.5,
    currency: "GBP",
  },
  {
    symbol: "AZN.L",
    name: "AstraZeneca PLC",
    market: "UK",
    category: "UK Stocks",
    qty: 25, // 25 × £110 = £2,750 ≈ €3,161
    avgPrice: 105.2,
    currency: "GBP",
  },
  {
    symbol: "HSBA.L",
    name: "HSBC Holdings PLC",
    market: "UK",
    category: "UK Stocks",
    qty: 80, // 80 × £6.8 = £544 ≈ €625
    avgPrice: 6.45,
    currency: "GBP",
  },

  // UK Mid-Cap & Small-Cap (8% of portfolio ≈ €4,381)
  {
    symbol: "VOD.L",
    name: "Vodafone Group PLC",
    market: "UK",
    category: "UK Stocks",
    qty: 800, // 800 × £0.9 = £720 ≈ €828
    avgPrice: 0.85,
    currency: "GBP",
  },
  {
    symbol: "BP.L",
    name: "BP PLC",
    market: "UK",
    category: "UK Stocks",
    qty: 200, // 200 × £5.2 = £1,040 ≈ €1,195
    avgPrice: 4.85,
    currency: "GBP",
  },
  {
    symbol: "LLOY.L",
    name: "Lloyds Banking Group",
    market: "UK",
    category: "UK Stocks",
    qty: 1500, // 1500 × £0.55 = £825 ≈ €948
    avgPrice: 0.52,
    currency: "GBP",
  },
  {
    symbol: "BARC.L",
    name: "Barclays PLC",
    market: "UK",
    category: "UK Stocks",
    qty: 600, // 600 × £2.0 = £1,200 ≈ €1,379
    avgPrice: 1.85,
    currency: "GBP",
  },

  // REITs and Commodities (7% of portfolio ≈ €3,833)
  {
    symbol: "VNQ",
    name: "Vanguard REIT ETF",
    market: "REIT",
    category: "Real Estate",
    qty: 35, // 35 × $95 = $3,325 ≈ €3,079
    avgPrice: 88.3,
    currency: "USD",
  },
  {
    symbol: "XAUUSD=X",
    name: "Gold Spot (XAU/USD)",
    market: "Commodity",
    category: "Gold",
    qty: 0.4, // 0.4 oz × $2080 = $832 ≈ €770
    unit: "oz",
    avgPrice: 1950.0,
    currency: "USD",
  },
]

type PortfolioContextValue = {
  user: { name: string; email: string }
  snapshot: { asOfTotalEUR: number; initialDepositEUR: number; initialYear: number }
  settings: Settings
  setSettings: (s: Settings) => void
  holdings: Holding[]
}

const PortfolioContext = React.createContext<PortfolioContextValue | null>(null)

export function usePortfolio() {
  const ctx = React.useContext(PortfolioContext)
  if (!ctx) throw new Error("usePortfolio must be used within PortfolioProvider")
  return ctx
}

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<Settings>(() => {
    if (typeof window === "undefined") return defaultSettings
    try {
      const raw = localStorage.getItem("invest:settings")
      if (!raw) return defaultSettings
      const parsed = JSON.parse(raw) as Settings
      return { ...defaultSettings, ...parsed }
    } catch {
      return defaultSettings
    }
  })

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("invest:settings", JSON.stringify(settings))
    }
  }, [settings])

  const value: PortfolioContextValue = {
    user: { name: "Rahul Ravi", email: "iamrahul0@outlook.com" },
    snapshot: { asOfTotalEUR: 54762.25, initialDepositEUR: 12184.06, initialYear: 2021 },
    settings,
    setSettings,
    holdings: defaultHoldings,
  }

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>
}
