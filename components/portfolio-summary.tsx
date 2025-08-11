"use client"

import { cn } from "@/lib/utils"

import React from "react"
import { usePortfolio } from "./portfolio-provider"
import { getFxRatesEUR, getQuotes, type Quote, getEurToInrRate } from "@/lib/finance"
import { computeHoldings, formatCurrencyEUR, formatCurrencyINR } from "@/lib/utils-calc"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, RefreshCw, Download, AlertCircle, CheckCircle, Clock, Activity, Wifi } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import AllocationChart from "./visuals/allocation-chart"
import PortfolioGrowthChart from "./visuals/portfolio-growth-chart"
import MarketTicker from "./visuals/market-ticker"
import HoldingsTable from "./tables/holdings-table"
import { useToast } from "@/hooks/use-toast"

type LiveState = {
  quotes: Record<string, Quote>
  fxFetchedAt?: number
  lastUpdate?: number
  error?: string
  dataSource?: string
}

export default function PortfolioSummary() {
  const { user, snapshot, settings, holdings } = usePortfolio()
  const { toast } = useToast()
  const symbols = React.useMemo(() => Array.from(new Set(holdings.map((h) => h.symbol))), [holdings])
  const [fx, setFx] = React.useState<{ USD: number; GBP: number }>({ USD: 1.08, GBP: 0.87 })
  const [eurInr, setEurInr] = React.useState<number>(90)
  const [live, setLive] = React.useState<LiveState>({ quotes: {} })
  const [loading, setLoading] = React.useState(true)
  const [refreshCountdown, setRefreshCountdown] = React.useState(60)
  const [isAutoRefreshing, setIsAutoRefreshing] = React.useState(false)

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true)
      setLive((prev) => ({ ...prev, error: undefined }))

      console.log("🔄 Starting data load for symbols:", symbols)

      const startTime = Date.now()

      const [fxRes, eurInrRes, quotesArr] = await Promise.allSettled([
        getFxRatesEUR(),
        getEurToInrRate(),
        getQuotes(symbols, settings.dataProvider, settings.alphavantageKey),
      ])

      const loadTime = Date.now() - startTime
      console.log(`⏱️ Data load completed in ${loadTime}ms`)

      // Handle FX rates
      if (fxRes.status === "fulfilled") {
        setFx(fxRes.value.rates)
        console.log("✅ FX rates updated:", fxRes.value.rates)
      } else {
        console.warn("⚠️ FX rates failed:", fxRes.reason)
      }

      // Handle EUR->INR rate
      if (eurInrRes.status === "fulfilled") {
        setEurInr(eurInrRes.value.rate)
        console.log("✅ EUR->INR rate updated:", eurInrRes.value.rate)
      } else {
        console.warn("⚠️ EUR->INR rate failed:", eurInrRes.reason)
      }

      // Handle quotes
      if (quotesArr.status === "fulfilled") {
        const quotes: Record<string, Quote> = {}
        let validQuotes = 0

        for (const q of quotesArr.value) {
          if (q?.symbol) {
            quotes[q.symbol] = q
            if (q.price > 0) validQuotes++
          }
        }

        console.log(`✅ Processed ${validQuotes} valid quotes out of ${quotesArr.value.length}`)

        setLive({
          quotes,
          fxFetchedAt: fxRes.status === "fulfilled" ? fxRes.value.fetchedAt : Date.now(),
          lastUpdate: Date.now(),
          error: validQuotes === 0 ? "No valid price data received" : undefined,
          dataSource: settings.dataProvider,
        })

        if (validQuotes > 0) {
          toast({
            title: isAutoRefreshing ? "Auto-refresh complete" : "Data loaded successfully",
            description: `Updated ${validQuotes} stock prices in ${loadTime}ms using ${settings.dataProvider}.`,
            variant: "default",
          })
        } else {
          toast({
            title: "Using demo data",
            description: "Live data unavailable, showing realistic demo prices.",
            variant: "default",
          })
        }
      } else {
        console.error("❌ Quotes failed:", quotesArr.reason)
        setLive((prev) => ({
          ...prev,
          error: "Failed to load market data",
          lastUpdate: Date.now(),
          dataSource: "fallback",
        }))

        toast({
          title: "Using demo data",
          description: "Live market data unavailable, showing demo portfolio.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("❌ Critical data loading error:", error)
      setLive((prev) => ({
        ...prev,
        error: "Network error loading data",
        lastUpdate: Date.now(),
        dataSource: "error",
      }))

      toast({
        title: "Demo mode active",
        description: "Network issues detected, showing demo data.",
        variant: "default",
      })
    } finally {
      setLoading(false)
      setIsAutoRefreshing(false)
      setRefreshCountdown(60) // Reset countdown
    }
  }, [settings.dataProvider, settings.alphavantageKey, symbols, toast, isAutoRefreshing])

  React.useEffect(() => {
    console.log("🚀 Initializing portfolio dashboard...")
    loadData()

    // Set up countdown timer
    const countdownInterval = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          setIsAutoRefreshing(true)
          return 60
        }
        return prev - 1
      })
    }, 1000)

    // Set up data refresh
    const refreshInterval = setInterval(() => {
      console.log("⏰ Auto-refresh triggered")
      setIsAutoRefreshing(true)
      loadData()
    }, 60_000) // 60 seconds

    return () => {
      clearInterval(countdownInterval)
      clearInterval(refreshInterval)
    }
  }, [loadData])

  const fxPack = React.useMemo(
    () => ({ base: "EUR" as const, rates: { USD: fx.USD, GBP: fx.GBP }, fetchedAt: live.fxFetchedAt ?? Date.now() }),
    [fx, live.fxFetchedAt],
  )

  const calc = computeHoldings(holdings, live.quotes, fxPack)
  const hasValidData = calc.totals.valueEUR > 0

  console.log("📊 Portfolio calculation:", {
    totalValue: calc.totals.valueEUR,
    validHoldings: calc.rows.filter((r) => r.valueEUR > 0).length,
    hasValidData,
  })

  // Calculate real-time values
  const currentValueEUR = hasValidData ? calc.totals.valueEUR : snapshot.asOfTotalEUR
  const currentValueINR = currentValueEUR * eurInr
  const totalGrowthEUR = currentValueEUR - snapshot.initialDepositEUR
  const totalGrowthINR = totalGrowthEUR * eurInr
  const totalGrowthPercent = (totalGrowthEUR / snapshot.initialDepositEUR) * 100

  // Calculate today's change (mock realistic daily fluctuation)
  const todayChangePercent = hasValidData ? calc.totals.pnlPct * 0.1 : 0.11 // Scale down for daily change
  const todayChangeEUR = (currentValueEUR * todayChangePercent) / 100
  const todayChangeINR = todayChangeEUR * eurInr

  const exportCsv = () => {
    const headers = [
      "Symbol",
      "Name",
      "Category",
      "Qty",
      "Avg Price",
      "Last Price",
      "Value EUR",
      "Cost EUR",
      "PnL EUR",
      "PnL %",
    ]
    const lines = calc.rows.map((r) =>
      [r.symbol, r.name, r.category, r.qty, r.avgPrice, r.lastPrice, r.valueEUR, r.costEUR, r.pnlEUR, r.pnlPct]
        .map((v) => String(v))
        .join(","),
    )
    const blob = new Blob([headers.join(",") + "\n" + lines.join("\n")], { type: "text/csv" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `portfolio-${new Date().toISOString().split("T")[0]}.csv`
    a.click()

    toast({
      title: "Export complete",
      description: "Portfolio data exported to CSV file.",
      variant: "default",
    })
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Diversified Portfolio Overview</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
              <Activity className="h-3 w-3" />
              Today: {todayChangePercent >= 0 ? "+" : ""}
              {todayChangePercent.toFixed(2)}%
            </Badge>
            <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
              <ArrowUpRight className="h-3 w-3" />
              Total: +{totalGrowthPercent.toFixed(2)}%
            </Badge>
            <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
              <Wifi className="h-3 w-3" />
              Live
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Last updated: {live.lastUpdate ? new Date(live.lastUpdate).toLocaleTimeString() : "Loading..."}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            Live updates active
          </div>
          <div className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            {holdings.length} positions
          </div>
        </div>
      </div>

      {live.error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{live.error}. Showing demo data for testing purposes.</AlertDescription>
        </Alert>
      )}

      <MarketTicker symbols={symbols} quotes={live.quotes} loading={loading} />

      {/* Main Portfolio Values Section */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* EUR Value */}
            <div>
              <h3 className="text-lg font-medium text-slate-300 mb-2">Total Portfolio Value (EUR)</h3>
              <div className="text-4xl md:text-5xl font-bold">
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    <span className="text-2xl">Loading...</span>
                  </div>
                ) : (
                  formatCurrencyEUR(currentValueEUR)
                )}
              </div>
            </div>

            {/* INR Value */}
            <div>
              <h3 className="text-lg font-medium text-slate-300 mb-2">Total Portfolio Value (INR)</h3>
              <div className="text-4xl md:text-5xl font-bold text-blue-400">
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                    <span className="text-2xl">Loading...</span>
                  </div>
                ) : (
                  formatCurrencyINR(currentValueINR)
                )}
              </div>
              <p className="text-sm text-slate-400 mt-1">Rate: 1 EUR = ₹{eurInr.toFixed(2)}</p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Growth */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                <ArrowUpRight className="h-4 w-4" />
                Total Growth
              </div>
              <div className="text-2xl font-bold text-emerald-400">{formatCurrencyEUR(totalGrowthEUR)}</div>
              <div className="text-sm text-slate-400">{formatCurrencyINR(totalGrowthINR)}</div>
            </div>

            {/* Growth Percentage */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                <Activity className="h-4 w-4" />
                Growth %
              </div>
              <div className="text-2xl font-bold text-emerald-400">+{totalGrowthPercent.toFixed(2)}%</div>
            </div>

            {/* Today's Change */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                <Clock className="h-4 w-4" />
                Today's Change
              </div>
              <div className={cn("text-2xl font-bold", todayChangeEUR >= 0 ? "text-emerald-400" : "text-red-400")}>
                {formatCurrencyEUR(todayChangeEUR)}
              </div>
              <div className={cn("text-sm", todayChangeEUR >= 0 ? "text-emerald-400" : "text-red-400")}>
                {todayChangePercent >= 0 ? "+" : ""}
                {todayChangePercent.toFixed(2)}%
              </div>
            </div>

            {/* Initial Deposit */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                <CheckCircle className="h-4 w-4" />
                Initial Deposit
              </div>
              <div className="text-2xl font-bold">{formatCurrencyEUR(snapshot.initialDepositEUR)}</div>
              <div className="text-sm text-slate-400">15 January 2021</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={loadData} disabled={loading} className="gap-1 bg-transparent hover:bg-muted">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button variant="outline" onClick={exportCsv} className="gap-1 bg-transparent hover:bg-muted">
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button
          onClick={() => alert("Order management system (prototype)")}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          Trade
        </Button>
        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <div
            className={cn(
              "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
              isAutoRefreshing ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground",
            )}
          >
            {isAutoRefreshing ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b border-emerald-600"></div>
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span>Next: {refreshCountdown}s</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-1 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
            <CardDescription>Portfolio diversification by category</CardDescription>
          </CardHeader>
          <CardContent>
            <AllocationChart
              rows={
                calc.rows.length > 0
                  ? calc.rows
                  : [
                      {
                        symbol: "AAPL",
                        name: "Apple Inc.",
                        category: "US Stocks",
                        currency: "USD",
                        qty: 25,
                        avgPrice: 145.5,
                        lastPrice: 190,
                        valueEUR: 4500,
                        costEUR: 3500,
                        pnlEUR: 1000,
                        pnlPct: 28.57,
                        changePct: 2.1,
                      },
                      {
                        symbol: "SHEL.L",
                        name: "Shell PLC",
                        category: "UK Stocks",
                        currency: "GBP",
                        qty: 150,
                        avgPrice: 24.5,
                        lastPrice: 26,
                        valueEUR: 3200,
                        costEUR: 3000,
                        pnlEUR: 200,
                        pnlPct: 6.67,
                        changePct: -0.8,
                      },
                      {
                        symbol: "VNQ",
                        name: "Vanguard REIT ETF",
                        category: "Real Estate",
                        currency: "USD",
                        qty: 45,
                        avgPrice: 88.3,
                        lastPrice: 95,
                        valueEUR: 3800,
                        costEUR: 3600,
                        pnlEUR: 200,
                        pnlPct: 5.56,
                        changePct: 1.2,
                      },
                      {
                        symbol: "XAUUSD=X",
                        name: "Gold Spot",
                        category: "Gold",
                        currency: "USD",
                        qty: 2.5,
                        avgPrice: 1950,
                        lastPrice: 2080,
                        valueEUR: 4800,
                        costEUR: 4500,
                        pnlEUR: 300,
                        pnlPct: 6.67,
                        changePct: 0.5,
                      },
                    ]
              }
            />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Portfolio Growth</CardTitle>
            <CardDescription>Value progression from {snapshot.initialYear} to present</CardDescription>
          </CardHeader>
          <CardContent>
            <PortfolioGrowthChart
              initialEUR={snapshot.initialDepositEUR || 12184}
              initialYear={snapshot.initialYear || 2021}
              currentEUR={
                hasValidData && calc.totals.valueEUR > 0 ? calc.totals.valueEUR : 54762.25 // Updated to match user's request
              }
            />
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
          <CardDescription>
            {hasValidData ? "Live prices and performance metrics" : "Demo portfolio data"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HoldingsTable rows={calc.rows} />
        </CardContent>
      </Card>
    </div>
  )
}
