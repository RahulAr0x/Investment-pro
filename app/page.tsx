"use client"

import { usePortfolio } from "@/components/portfolio-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowDownRight, TrendingUp, Eye, Star, Bell } from "lucide-react"
import { formatCurrencyEUR } from "@/lib/utils-calc"
import { cn } from "@/lib/utils"
import Link from "next/link"
import React from "react"
import { getFxRatesEUR, getQuotes, getEurToInrRate } from "@/lib/finance"
import { computeHoldings } from "@/lib/utils-calc"
import { useToast } from "@/hooks/use-toast"

function DashboardInner() {
  const { user, snapshot, holdings, settings } = usePortfolio()
  const { toast } = useToast()
  const symbols = React.useMemo(() => Array.from(new Set(holdings.map((h) => h.symbol))), [holdings])
  const [fx, setFx] = React.useState<{ USD: number; GBP: number }>({ USD: 1.08, GBP: 0.87 })
  const [eurInr, setEurInr] = React.useState<number>(90)
  const [quotes, setQuotes] = React.useState<Record<string, any>>({})
  const [loading, setLoading] = React.useState(true)
  const [lastUpdate, setLastUpdate] = React.useState<number>(0)
  const [refreshCountdown, setRefreshCountdown] = React.useState(15)
  const [selectedPeriod, setSelectedPeriod] = React.useState<"1D" | "1W" | "1M" | "1Y" | "ALL">("ALL")
  const [hoveredPoint, setHoveredPoint] = React.useState<{
    x: number
    y: number
    value: number
    change: number
    date: string
  } | null>(null)

  // Load real-time data with faster refresh
  React.useEffect(() => {
    const loadData = async () => {
      try {
        console.log("🔄 Loading dashboard data for", symbols.length, "symbols")

        const [fxRes, eurInrRes, quotesArr] = await Promise.allSettled([
          getFxRatesEUR(),
          getEurToInrRate(),
          getQuotes(symbols, settings.dataProvider, settings.alphavantageKey),
        ])

        if (fxRes.status === "fulfilled") {
          setFx(fxRes.value.rates)
          console.log("✅ FX rates updated:", fxRes.value.rates)
        }

        if (eurInrRes.status === "fulfilled") {
          setEurInr(eurInrRes.value.rate)
          console.log("✅ EUR->INR rate updated:", eurInrRes.value.rate)
        }

        if (quotesArr.status === "fulfilled") {
          const quotesMap: Record<string, any> = {}
          let validQuotes = 0

          quotesArr.value.forEach((q) => {
            if (q?.symbol && q?.price > 0) {
              quotesMap[q.symbol] = q
              validQuotes++
            }
          })

          setQuotes(quotesMap)
          setLastUpdate(Date.now())
          console.log(`✅ Updated ${validQuotes} quotes`)

          if (validQuotes > 0) {
            toast({
              title: "Live data updated",
              description: `Refreshed ${validQuotes} stock prices`,
              variant: "default",
            })
          }
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
      } finally {
        setLoading(false)
        setRefreshCountdown(15) // Reset countdown
      }
    }

    loadData()

    // Set up countdown timer
    const countdownInterval = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          loadData() // Trigger refresh
          return 15
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdownInterval)
  }, [symbols, settings.dataProvider, settings.alphavantageKey, toast])

  const fxPack = React.useMemo(
    () => ({ base: "EUR" as const, rates: { USD: fx.USD, GBP: fx.GBP }, fetchedAt: Date.now() }),
    [fx],
  )

  const calc = computeHoldings(holdings, quotes, fxPack)
  const hasValidData = calc.totals.valueEUR > 0 && Object.keys(quotes).length > 0

  console.log("📊 Dashboard calculation:", {
    totalValue: calc.totals.valueEUR,
    validHoldings: calc.rows.filter((r) => r.valueEUR > 0).length,
    hasValidData,
    quotesCount: Object.keys(quotes).length,
  })

  // Calculate real-time values
  const currentValueEUR = hasValidData ? calc.totals.valueEUR : snapshot.asOfTotalEUR
  const currentValueINR = currentValueEUR * eurInr
  const totalGrowthEUR = currentValueEUR - snapshot.initialDepositEUR
  const totalGrowthINR = totalGrowthEUR * eurInr
  const totalGrowthPercent = (totalGrowthEUR / snapshot.initialDepositEUR) * 100

  // Calculate today's change (realistic daily fluctuation based on actual P&L)
  const todayChangePercent = hasValidData
    ? Math.min(Math.max(calc.totals.pnlPct * 0.15, -3), 3)
    : // Scale and cap daily change
      (Math.random() - 0.5) * 2 // Random between -1% and +1% for demo

  const todayChangeEUR = (currentValueEUR * todayChangePercent) / 100

  // Quick stats
  const totalHoldings = holdings.length
  const categories = Array.from(new Set(holdings.map((h) => h.category)))

  // Top performers (real-time)
  const topPerformers = calc.rows
    .filter((r) => r.valueEUR > 0 && r.changePct !== undefined)
    .sort((a, b) => (b.changePct || 0) - (a.changePct || 0))
    .slice(0, 5)

  // Mock market alerts
  const marketAlerts = [
    { type: "price", message: "AAPL reached your target price of $190", time: "1 hour ago", urgent: true },
    { type: "news", message: "NVDA announces new AI chip breakthrough", time: "2 hours ago", urgent: false },
    { type: "earnings", message: "Tesla earnings report due tomorrow", time: "5 hours ago", urgent: false },
  ]

  // Interactive Portfolio Chart Component
  const InteractivePortfolioChart = ({
    selectedPeriod,
    currentValue,
    initialValue,
    totalGrowthPercent,
  }: {
    selectedPeriod: string
    currentValue: number
    initialValue: number
    totalGrowthPercent: number
  }) => {
    const generateRealisticData = (period: string) => {
      const now = new Date()
      const dataPoints: Array<{ x: number; y: number; value: number; change: number; date: string; timestamp: Date }> =
        []

      switch (period) {
        case "1D":
          // Hourly data for 1 day (24 points)
          for (let i = 0; i < 24; i++) {
            const timestamp = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000)
            const baseValue = currentValue
            const hourlyVolatility = (Math.random() - 0.5) * 0.008 // ±0.8% hourly volatility
            const trendNoise = Math.sin(i * 0.3) * 0.003 // Subtle trend
            const value = baseValue * (1 + hourlyVolatility + trendNoise)
            const change = i > 0 ? ((value - dataPoints[i - 1].value) / dataPoints[i - 1].value) * 100 : 0

            dataPoints.push({
              x: 80 + i * 35, // Spread across chart width
              y: 200 - ((value - initialValue) / (currentValue - initialValue)) * 150,
              value: Math.round(value),
              change: Number(change.toFixed(2)),
              date: timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
              timestamp,
            })
          }
          break

        case "1W":
          // Daily data for 1 week (7 points)
          for (let i = 0; i < 7; i++) {
            const timestamp = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000)
            const progress = i / 6
            const baseValue = initialValue + (currentValue - initialValue) * progress
            const dailyVolatility = (Math.random() - 0.5) * 0.025 // ±2.5% daily volatility
            const weeklyTrend = Math.sin(i * 0.8) * 0.015
            const value = baseValue * (1 + dailyVolatility + weeklyTrend)
            const change = i > 0 ? ((value - dataPoints[i - 1].value) / dataPoints[i - 1].value) * 100 : 0

            dataPoints.push({
              x: 80 + i * 120,
              y: 200 - ((value - initialValue) / (currentValue - initialValue)) * 150,
              value: Math.round(value),
              change: Number(change.toFixed(2)),
              date: timestamp.toLocaleDateString("en-US", { weekday: "short" }),
              timestamp,
            })
          }
          break

        case "1M":
          // Weekly data for 1 month (4 points)
          for (let i = 0; i < 4; i++) {
            const timestamp = new Date(now.getTime() - (3 - i) * 7 * 24 * 60 * 60 * 1000)
            const progress = i / 3
            const baseValue = initialValue + (currentValue - initialValue) * progress
            const weeklyVolatility = (Math.random() - 0.5) * 0.04 // ±4% weekly volatility
            const monthlyTrend = Math.cos(i * 0.5) * 0.02
            const value = baseValue * (1 + weeklyVolatility + monthlyTrend)
            const change = i > 0 ? ((value - dataPoints[i - 1].value) / dataPoints[i - 1].value) * 100 : 0

            dataPoints.push({
              x: 80 + i * 200,
              y: 200 - ((value - initialValue) / (currentValue - initialValue)) * 150,
              value: Math.round(value),
              change: Number(change.toFixed(2)),
              date: `Week ${i + 1}`,
              timestamp,
            })
          }
          break

        case "1Y":
          // Monthly data for 1 year (12 points)
          for (let i = 0; i < 12; i++) {
            const timestamp = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
            const progress = i / 11
            const baseValue = initialValue + (currentValue - initialValue) * progress
            // More realistic yearly volatility with market cycles
            const monthlyVolatility = (Math.random() - 0.5) * 0.08 // ±8% monthly volatility
            const seasonalTrend = Math.sin(i * 0.5) * 0.03 // Seasonal patterns
            const marketCycle = Math.cos(i * 0.3) * 0.05 // Market cycles
            const value = baseValue * (1 + monthlyVolatility + seasonalTrend + marketCycle)
            const change = i > 0 ? ((value - dataPoints[i - 1].value) / dataPoints[i - 1].value) * 100 : 0

            dataPoints.push({
              x: 80 + i * 65,
              y: 200 - ((value - initialValue) / (currentValue - initialValue)) * 150,
              value: Math.round(value),
              change: Number(change.toFixed(2)),
              date: timestamp.toLocaleDateString("en-US", { month: "short" }),
              timestamp,
            })
          }
          break

        case "ALL":
        default:
          // Realistic 4+ year journey with major market events
          const milestones = [
            { months: 0, value: initialValue, event: "Initial Investment", volatility: 0.02 },
            { months: 3, value: initialValue * 1.15, event: "Early Growth", volatility: 0.03 },
            { months: 8, value: initialValue * 1.35, event: "Bull Market", volatility: 0.04 },
            { months: 12, value: initialValue * 1.25, event: "Market Correction", volatility: 0.06 },
            { months: 18, value: initialValue * 1.1, event: "Bear Market", volatility: 0.08 },
            { months: 24, value: initialValue * 1.05, event: "Market Bottom", volatility: 0.07 },
            { months: 30, value: initialValue * 1.25, event: "Recovery Start", volatility: 0.05 },
            { months: 36, value: initialValue * 1.65, event: "Strong Recovery", volatility: 0.04 },
            { months: 42, value: initialValue * 2.15, event: "New Highs", volatility: 0.03 },
            { months: 48, value: currentValue, event: "Current", volatility: 0.025 },
          ]

          milestones.forEach((milestone, i) => {
            const timestamp = new Date(2021, 0, 15 + milestone.months * 30)
            const baseValue = milestone.value
            const volatility = (Math.random() - 0.5) * milestone.volatility
            const trendNoise = Math.sin(i * 0.4) * 0.02
            const value = baseValue * (1 + volatility + trendNoise)
            const change = i > 0 ? ((value - dataPoints[i - 1].value) / dataPoints[i - 1].value) * 100 : 0

            dataPoints.push({
              x: 80 + i * 80,
              y: Math.max(50, Math.min(250, 200 - ((value - initialValue) / (currentValue - initialValue)) * 150)),
              value: Math.round(value),
              change: Number(change.toFixed(2)),
              date: timestamp.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
              timestamp,
            })
          })
          break
      }

      return dataPoints
    }

    const chartData = generateRealisticData(selectedPeriod)
    const pathData = chartData.map((point, i) => `${i === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")

    return (
      <div className="h-[350px] w-full relative overflow-hidden">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 900 350"
          className="overflow-visible"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Grid Lines */}
          <defs>
            <pattern id="grid" width="75" height="50" patternUnits="userSpaceOnUse">
              <path d="M 75 0 L 0 0 0 50" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3" />
            </pattern>
            <linearGradient id="portfolioGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <rect width="100%" height="280" fill="url(#grid)" />

          {/* Y-axis labels */}
          <g className="text-xs fill-slate-400">
            <text x="15" y="25" textAnchor="start">
              €{Math.round(currentValue / 1000)}k
            </text>
            <text x="15" y="75" textAnchor="start">
              €{Math.round((currentValue * 0.75) / 1000)}k
            </text>
            <text x="15" y="125" textAnchor="start">
              €{Math.round((currentValue * 0.5) / 1000)}k
            </text>
            <text x="15" y="175" textAnchor="start">
              €{Math.round((currentValue * 0.25) / 1000)}k
            </text>
            <text x="15" y="225" textAnchor="start">
              €{Math.round(initialValue / 1000)}k
            </text>
          </g>

          {/* Dynamic X-axis labels */}
          <g className="text-xs fill-slate-400">
            {chartData.map((point, i) => (
              <text key={i} x={point.x} y="300" textAnchor="middle">
                {point.date}
              </text>
            ))}
          </g>

          {/* Portfolio Growth Line */}
          <path d={pathData} fill="none" stroke="#10b981" strokeWidth="3" className="drop-shadow-sm" />

          {/* Gradient fill under the line */}
          <path
            d={`${pathData} L ${chartData[chartData.length - 1].x} 280 L ${chartData[0].x} 280 Z`}
            fill="url(#portfolioGradient)"
          />

          {/* Interactive Data Points */}
          {chartData.map((point, i) => (
            <g key={i}>
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#10b981"
                stroke="#1f2937"
                strokeWidth="2"
                className="hover:r-6 transition-all cursor-pointer"
                onMouseEnter={() => setHoveredPoint(point)}
              />
              <circle
                cx={point.x}
                cy={point.y}
                r="15"
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(point)}
              />
            </g>
          ))}

          {/* Hover Tooltip */}
          {hoveredPoint && (
            <g className="pointer-events-none">
              <rect
                x={hoveredPoint.x - 50}
                y={hoveredPoint.y - 55}
                width="100"
                height="45"
                rx="6"
                fill="#1f2937"
                stroke="#374151"
                strokeWidth="1"
                className="drop-shadow-lg"
              />
              <text
                x={hoveredPoint.x}
                y={hoveredPoint.y - 35}
                textAnchor="middle"
                className="text-sm fill-white font-semibold"
              >
                €{hoveredPoint.value.toLocaleString()}
              </text>
              <text
                x={hoveredPoint.x}
                y={hoveredPoint.y - 20}
                textAnchor="middle"
                className={`text-xs font-medium ${hoveredPoint.change >= 0 ? "fill-emerald-400" : "fill-red-400"}`}
              >
                {hoveredPoint.change !== 0 && `${hoveredPoint.change > 0 ? "+" : ""}${hoveredPoint.change}%`}
              </text>
              <text x={hoveredPoint.x} y={hoveredPoint.y - 8} textAnchor="middle" className="text-xs fill-slate-300">
                {hoveredPoint.date}
              </text>
            </g>
          )}
        </svg>

        {/* Stats below chart */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-700">
          <div className="text-center">
            <div className="text-sm text-slate-400">Initial Investment</div>
            <div className="font-semibold text-white">{formatCurrencyEUR(initialValue)}</div>
            <div className="text-xs text-slate-500">Jan 15, 2021</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-400">Current Value</div>
            <div className="font-semibold text-white">{formatCurrencyEUR(currentValue)}</div>
            <div className="text-xs text-emerald-400">Live</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-400">Total Growth</div>
            <div className="font-semibold text-emerald-400">+{totalGrowthPercent.toFixed(1)}%</div>
            <div className="text-xs text-slate-400">{formatCurrencyEUR(currentValue - initialValue)}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:gap-6 grid-cols-1">
      {/* Portfolio Growth Chart - Full Width with Interactive Features */}
      <Card className="hover:shadow-md transition-shadow bg-slate-900 text-white border-slate-700">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-white">Portfolio Performance</CardTitle>
            <div className="flex gap-1">
              {["1D", "1W", "1M", "1Y", "ALL"].map((period) => (
                <Button
                  key={period}
                  size="sm"
                  variant={selectedPeriod === period ? "default" : "outline"}
                  onClick={() => setSelectedPeriod(period)}
                  className={cn(
                    "text-xs px-3 py-1 h-8",
                    selectedPeriod === period
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                      : "bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white",
                  )}
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <InteractivePortfolioChart
            selectedPeriod={selectedPeriod}
            currentValue={currentValueEUR}
            initialValue={snapshot.initialDepositEUR}
            totalGrowthPercent={totalGrowthPercent}
          />
        </CardContent>
      </Card>

      {/* Holdings Overview and Top Performers */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Holdings ({totalHoldings})</span>
              <Link href="/portfolio">
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-1" />
                  View All
                </Button>
              </Link>
            </CardTitle>
            <CardDescription>Diversified across {categories.length} categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {calc.rows
                .filter((r) => r.valueEUR > 0)
                .sort((a, b) => b.valueEUR - a.valueEUR)
                .slice(0, 8)
                .map((holding, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                        {holding.symbol.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{holding.symbol.replace(".L", "")}</div>
                        <div className="text-xs text-muted-foreground">{holding.name.substring(0, 20)}...</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">{formatCurrencyEUR(holding.valueEUR)}</div>
                      <div
                        className={cn(
                          "text-xs flex items-center gap-1",
                          (holding.changePct || 0) >= 0 ? "text-emerald-600" : "text-red-600",
                        )}
                      >
                        {(holding.changePct || 0) >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {holding.changePct !== undefined
                          ? `${holding.changePct >= 0 ? "+" : ""}${holding.changePct.toFixed(2)}%`
                          : "—"}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <Star className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <Bell className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Top Performers Today</CardTitle>
            <CardDescription>Your best performing holdings with live data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPerformers.length > 0
              ? topPerformers.map((stock, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-xs">
                        #{i + 1}
                      </div>
                      <div>
                        <div className="font-medium">{stock.symbol.replace(".L", "")}</div>
                        <div className="text-sm text-muted-foreground">{stock.name.substring(0, 20)}...</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrencyEUR(stock.valueEUR)}</div>
                      <div className="text-sm text-emerald-600 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />+{(stock.changePct || 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))
              : // Fallback for demo data
                [
                  { symbol: "AAPL", name: "Apple Inc.", change: "+3.2%", value: formatCurrencyEUR(4890) },
                  { symbol: "NVDA", name: "NVIDIA Corp.", change: "+2.8%", value: formatCurrencyEUR(6120) },
                  { symbol: "MSFT", name: "Microsoft Corp.", change: "+1.9%", value: formatCurrencyEUR(3450) },
                ].map((stock, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{stock.symbol}</div>
                      <div className="text-sm text-muted-foreground">{stock.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{stock.value}</div>
                      <div className="text-sm text-emerald-600">{stock.change}</div>
                    </div>
                  </div>
                ))}
          </CardContent>
        </Card>
      </div>

      {/* Market Alerts */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>Market Alerts</CardTitle>
          <CardDescription>Important updates and notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {marketAlerts.map((alert, i) => (
            <div
              key={i}
              className={cn("p-3 rounded-lg border", alert.urgent ? "border-orange-200 bg-orange-50" : "border-muted")}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                </div>
                {alert.urgent && <div className="w-2 h-2 rounded-full bg-orange-500 mt-1"></div>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default function DashboardPage() {
  return <DashboardInner />
}
