"use client"

import React from "react"
import { usePortfolio } from "@/components/portfolio-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import MarketTicker from "@/components/visuals/market-ticker"
import AssetCard from "@/components/cards/asset-card"
import AlertCenter from "@/components/alerts/alert-center"
import { realTimeDataManager, watchlistManager } from "@/lib/real-time-data"
import { Search, RefreshCw, Star, Activity, BarChart3, Newspaper, Target, Bookmark } from "lucide-react"
import { cn } from "@/lib/utils"

function MarketsInner() {
  const { holdings, settings } = usePortfolio()
  const baseSymbols = React.useMemo(() => Array.from(new Set(holdings.map((h) => h.symbol))), [holdings])
  const [query, setQuery] = React.useState("")
  const [quotes, setQuotes] = React.useState<Record<string, any>>({})
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = React.useState<number>(0)
  const [watchlist, setWatchlist] = React.useState<string[]>([])
  const [activeTab, setActiveTab] = React.useState("overview")

  // Enhanced mock data for busy trading interface
  const trendingStocks = [
    {
      symbol: "NVDA",
      name: "NVIDIA Corp",
      price: 875.5,
      change: +45.2,
      changePct: +5.45,
      volume: "125M",
      marketCap: "$2.1T",
    },
    {
      symbol: "TSLA",
      name: "Tesla Inc",
      price: 248.9,
      change: -12.3,
      changePct: -4.71,
      volume: "89M",
      marketCap: "$790B",
    },
    {
      symbol: "META",
      name: "Meta Platforms",
      price: 485.2,
      change: +18.75,
      changePct: +4.02,
      volume: "67M",
      marketCap: "$1.2T",
    },
    {
      symbol: "AMD",
      name: "Advanced Micro",
      price: 142.8,
      change: +8.9,
      changePct: +6.65,
      volume: "78M",
      marketCap: "$230B",
    },
    {
      symbol: "PLTR",
      name: "Palantir Technologies",
      price: 28.4,
      change: +2.1,
      changePct: +7.98,
      volume: "45M",
      marketCap: "$62B",
    },
    {
      symbol: "CRWD",
      name: "CrowdStrike Holdings",
      price: 312.7,
      change: -8.4,
      changePct: -2.61,
      volume: "23M",
      marketCap: "$75B",
    },
  ]

  const marketNews = [
    { title: "Fed signals potential rate cuts in 2024", time: "2 min ago", urgent: true },
    { title: "Tech earnings season kicks off with strong results", time: "15 min ago", urgent: false },
    { title: "Oil prices surge on geopolitical tensions", time: "32 min ago", urgent: true },
    { title: "European markets open higher on ECB optimism", time: "1 hour ago", urgent: false },
    { title: "Crypto market shows signs of recovery", time: "2 hours ago", urgent: false },
    { title: "AI stocks rally on breakthrough announcement", time: "3 hours ago", urgent: false },
  ]

  const suggestedStocks = [
    { symbol: "PLTR", name: "Palantir Technologies", reason: "AI Growth", score: 8.5, price: 28.4, change: +7.98 },
    {
      symbol: "CRWD",
      name: "CrowdStrike Holdings",
      reason: "Cybersecurity Leader",
      score: 8.2,
      price: 312.7,
      change: -2.61,
    },
    { symbol: "SNOW", name: "Snowflake Inc", reason: "Cloud Data Platform", score: 7.8, price: 165.3, change: +3.45 },
    { symbol: "NET", name: "Cloudflare Inc", reason: "Edge Computing", score: 7.5, price: 78.9, change: +1.23 },
  ]

  React.useEffect(() => {
    // Load watchlist
    const defaultWatchlist = watchlistManager.getWatchlist("default").map((item) => item.symbol)
    setWatchlist(defaultWatchlist)

    // Subscribe to real-time data
    const allSymbols = [...baseSymbols, ...trendingStocks.map((s) => s.symbol), ...defaultWatchlist]
    const uniqueSymbols = Array.from(new Set(allSymbols))

    if (uniqueSymbols.length > 0) {
      const unsubscribe = realTimeDataManager.subscribe(`quotes_${uniqueSymbols.join(",")}`, (newQuotes) => {
        setQuotes(newQuotes)
        setLastUpdate(Date.now())
        setLoading(false)
      })

      return unsubscribe
    } else {
      setLoading(false)
    }
  }, [baseSymbols])

  const toggleWatchlist = (symbol: string) => {
    if (watchlist.includes(symbol)) {
      watchlistManager.removeFromWatchlist("default", symbol)
      setWatchlist((prev) => prev.filter((s) => s !== symbol))
    } else {
      watchlistManager.addToWatchlist("default", symbol)
      setWatchlist((prev) => [...prev, symbol])
    }
  }

  const filteredTrending = trendingStocks.filter(
    (stock) =>
      !query ||
      stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Live Markets</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Real-time trading data and market insights
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs">LIVE</span>
            </div>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stocks, ETFs, crypto..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <AlertCenter />
          <Button variant="outline" className="gap-2 bg-transparent">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Live Market Ticker */}
      <MarketTicker
        symbols={[...baseSymbols, ...trendingStocks.map((s) => s.symbol)]}
        quotes={quotes}
        loading={loading}
      />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist ({watchlist.length})</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="news">News</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-4">
            {/* Quick Stats */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Market Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">S&P 500</span>
                    <span className="font-semibold text-emerald-600">+1.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">NASDAQ</span>
                    <span className="font-semibold text-emerald-600">+2.1%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">FTSE 100</span>
                    <span className="font-semibold text-red-600">-0.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">VIX</span>
                    <span className="font-semibold">18.5</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trending Stocks Grid */}
            <div className="lg:col-span-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTrending.slice(0, 6).map((stock) => (
                <AssetCard
                  key={stock.symbol}
                  symbol={stock.symbol}
                  name={stock.name}
                  price={quotes[stock.symbol]?.price || stock.price}
                  change={quotes[stock.symbol]?.change || stock.change}
                  changePercent={quotes[stock.symbol]?.changePercent || stock.changePct}
                  volume={stock.volume}
                  marketCap={stock.marketCap}
                  showChart={false}
                />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="watchlist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5" />
                Your Watchlist ({watchlist.length})
              </CardTitle>
              <CardDescription>Stocks you're tracking with real-time updates</CardDescription>
            </CardHeader>
            <CardContent>
              {watchlist.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No stocks in your watchlist yet</p>
                  <p className="text-sm">Click the star icon next to any stock to add it</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {watchlist.map((symbol) => {
                    const quote = quotes[symbol]
                    const stockInfo =
                      trendingStocks.find((s) => s.symbol === symbol) || holdings.find((h) => h.symbol === symbol)

                    return (
                      <AssetCard
                        key={symbol}
                        symbol={symbol}
                        name={stockInfo?.name || quote?.name || "Loading..."}
                        price={quote?.price || 0}
                        change={quote?.change || 0}
                        changePercent={quote?.changePercent || 0}
                        volume={stockInfo?.volume}
                        marketCap={stockInfo?.marketCap}
                        showChart={true}
                      />
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trending" className="space-y-4">
          <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  AI Stock Suggestions
                </CardTitle>
                <CardDescription>Personalized recommendations with real-time data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suggestedStocks.map((stock, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                          {stock.score}
                        </div>
                        <div>
                          <div className="font-semibold">{stock.symbol}</div>
                          <div className="text-sm text-muted-foreground">{stock.name}</div>
                          <div className="text-xs text-blue-600">{stock.reason}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${stock.price}</div>
                        <div className={cn("text-sm", stock.change >= 0 ? "text-emerald-600" : "text-red-600")}>
                          {stock.change >= 0 ? "+" : ""}
                          {stock.change}%
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleWatchlist(stock.symbol)}
                          className="p-1 h-6 w-6"
                        >
                          <Star
                            className={cn(
                              "h-3 w-3",
                              watchlist.includes(stock.symbol) && "fill-yellow-400 text-yellow-400",
                            )}
                          />
                        </Button>
                        <Button size="sm" variant="outline">
                          Research
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Sector Performance
                </CardTitle>
                <CardDescription>Real-time sector movements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { sector: "Technology", change: +2.4, color: "bg-emerald-500" },
                    { sector: "Healthcare", change: +1.8, color: "bg-blue-500" },
                    { sector: "Financial", change: +0.9, color: "bg-green-500" },
                    { sector: "Energy", change: -0.5, color: "bg-red-500" },
                    { sector: "Consumer", change: -1.2, color: "bg-orange-500" },
                  ].map((sector, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-3 h-3 rounded-full", sector.color)}></div>
                        <span className="font-medium">{sector.sector}</span>
                      </div>
                      <div className={cn("font-semibold", sector.change >= 0 ? "text-emerald-600" : "text-red-600")}>
                        {sector.change >= 0 ? "+" : ""}
                        {sector.change}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="news" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                Live Market News
              </CardTitle>
              <CardDescription>Real-time financial news and market updates</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {marketNews.map((news, i) => (
                    <div
                      key={i}
                      className={cn(
                        "p-4 rounded-lg border-l-4 hover:bg-muted/50 transition-colors cursor-pointer",
                        news.urgent ? "border-l-orange-500 bg-orange-50" : "border-l-blue-500 bg-blue-50",
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{news.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{news.time}</span>
                            {news.urgent && (
                              <Badge variant="destructive" className="text-xs">
                                BREAKING
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          Read More
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Market Sentiment</CardTitle>
                <CardDescription>Real-time market indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Fear & Greed Index</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"></div>
                      <span className="font-bold text-green-600">72 (Greed)</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>VIX (Volatility)</span>
                    <span className="font-bold">18.5 (-2.1%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Put/Call Ratio</span>
                    <span className="font-bold">0.85</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Market Breadth</span>
                    <span className="font-bold text-emerald-600">Positive</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Economic Calendar</CardTitle>
                <CardDescription>Upcoming market-moving events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { event: "Fed Interest Rate Decision", time: "Tomorrow 2:00 PM", impact: "High" },
                    { event: "Non-Farm Payrolls", time: "Friday 8:30 AM", impact: "High" },
                    { event: "Tesla Earnings", time: "Next Week", impact: "Medium" },
                    { event: "CPI Inflation Data", time: "Next Week", impact: "High" },
                    { event: "Apple Earnings", time: "Next Week", impact: "Medium" },
                  ].map((event, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50">
                      <div>
                        <div className="font-medium">{event.event}</div>
                        <div className="text-sm text-muted-foreground">{event.time}</div>
                      </div>
                      <Badge variant={event.impact === "High" ? "destructive" : "secondary"}>{event.impact}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function MarketsPage() {
  return <MarketsInner />
}
