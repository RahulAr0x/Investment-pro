"use client"

import React from "react"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area } from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { realTimeDataManager, type TimeFrame, type ChartDataPoint } from "@/lib/real-time-data"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"

type ChartType = "line" | "area"

interface InteractiveChartProps {
  symbol: string
  name?: string
  className?: string
}

export default function InteractiveChart({ symbol, name, className }: InteractiveChartProps) {
  const [timeframe, setTimeframe] = React.useState<TimeFrame>("1D")
  const [chartType, setChartType] = React.useState<ChartType>("area")
  const [chartData, setChartData] = React.useState<ChartDataPoint[]>([])
  const [loading, setLoading] = React.useState(true)
  const [lastUpdate, setLastUpdate] = React.useState<number>(0)

  React.useEffect(() => {
    setLoading(true)

    const unsubscribe = realTimeDataManager.subscribe(`chart_${symbol}_${timeframe}`, (data: ChartDataPoint[]) => {
      setChartData(data)
      setLastUpdate(Date.now())
      setLoading(false)
    })

    return unsubscribe
  }, [symbol, timeframe])

  const timeframes: { value: TimeFrame; label: string }[] = [
    { value: "1D", label: "1D" },
    { value: "1W", label: "1W" },
    { value: "1M", label: "1M" },
    { value: "3M", label: "3M" },
    { value: "6M", label: "6M" },
    { value: "1Y", label: "1Y" },
    { value: "ALL", label: "ALL" },
  ]

  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1]?.price : 0
  const firstPrice = chartData.length > 0 ? chartData[0]?.price : 0
  const priceChange = currentPrice - firstPrice
  const priceChangePercent = firstPrice !== 0 ? (priceChange / firstPrice) * 100 : 0
  const isPositive = priceChange >= 0

  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp)
    switch (timeframe) {
      case "1D":
        return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      case "1W":
        return date.toLocaleDateString("en-US", { weekday: "short" })
      case "1M":
      case "3M":
      case "6M":
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      case "1Y":
      case "ALL":
        return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
      default:
        return date.toLocaleDateString()
    }
  }

  const formatTooltip = (value: any, name: any, props: any) => {
    if (name === "price") {
      return [`$${Number(value).toFixed(2)}`, "Price"]
    }
    return [value, name]
  }

  const formatTooltipLabel = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {symbol}
              {name && <span className="text-sm font-normal text-muted-foreground">({name})</span>}
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-muted-foreground">LIVE</span>
              </div>
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold">${currentPrice.toFixed(2)}</span>
              <div className={cn("flex items-center gap-1", isPositive ? "text-emerald-600" : "text-red-600")}>
                {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="font-semibold">
                  {isPositive ? "+" : ""}${priceChange.toFixed(2)} ({isPositive ? "+" : ""}
                  {priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Activity className="h-3 w-3" />
              {timeframe}
            </Badge>
            {lastUpdate > 0 && (
              <span className="text-xs text-muted-foreground">
                Updated: {new Date(lastUpdate).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timeframe Selector */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {timeframes.map((tf) => (
              <Button
                key={tf.value}
                size="sm"
                variant={timeframe === tf.value ? "default" : "outline"}
                onClick={() => setTimeframe(tf.value)}
                className="text-xs px-2 py-1 h-7"
              >
                {tf.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={chartType === "line" ? "default" : "outline"}
              onClick={() => setChartType("line")}
              className="text-xs px-2 py-1 h-7"
            >
              Line
            </Button>
            <Button
              size="sm"
              variant={chartType === "area" ? "default" : "outline"}
              onClick={() => setChartType("area")}
              className="text-xs px-2 py-1 h-7"
            >
              Area
            </Button>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[300px] w-full">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "area" ? (
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatXAxis}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={["dataMin - 1", "dataMax + 1"]}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <Tooltip
                    formatter={formatTooltip}
                    labelFormatter={formatTooltipLabel}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={isPositive ? "#059669" : "#dc2626"}
                    fill={`url(#gradient-${symbol})`}
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatXAxis}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={["dataMin - 1", "dataMax + 1"]}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <Tooltip
                    formatter={formatTooltip}
                    labelFormatter={formatTooltipLabel}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={isPositive ? "#059669" : "#dc2626"}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart Stats */}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">High</div>
            <div className="font-semibold">
              ${chartData.length > 0 ? Math.max(...chartData.map((d) => d.price)).toFixed(2) : "0.00"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Low</div>
            <div className="font-semibold">
              ${chartData.length > 0 ? Math.min(...chartData.map((d) => d.price)).toFixed(2) : "0.00"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Volume</div>
            <div className="font-semibold">
              {chartData.length > 0 ? (chartData[chartData.length - 1]?.volume || 0).toLocaleString() : "0"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
