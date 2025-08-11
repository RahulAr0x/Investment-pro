"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import InteractiveChart from "@/components/charts/interactive-chart"
import { realTimeDataManager, watchlistManager } from "@/lib/real-time-data"
import { cn } from "@/lib/utils"
import { Star, TrendingUp, TrendingDown, Bell, ShoppingCart, BarChart3, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AssetCardProps {
  symbol: string
  name: string
  price?: number
  change?: number
  changePercent?: number
  volume?: string
  marketCap?: string
  className?: string
  showChart?: boolean
}

export default function AssetCard({
  symbol,
  name,
  price = 0,
  change = 0,
  changePercent = 0,
  volume,
  marketCap,
  className,
  showChart = false,
}: AssetCardProps) {
  const { toast } = useToast()
  const [isInWatchlist, setIsInWatchlist] = React.useState(false)
  const [livePrice, setLivePrice] = React.useState(price)
  const [liveChange, setLiveChange] = React.useState(change)
  const [liveChangePercent, setLiveChangePercent] = React.useState(changePercent)
  const [alertPrice, setAlertPrice] = React.useState("")
  const [alertType, setAlertType] = React.useState<"above" | "below">("above")
  const [showAlertDialog, setShowAlertDialog] = React.useState(false)
  const [showChartDialog, setShowChartDialog] = React.useState(false)

  const isPositive = liveChangePercent >= 0

  React.useEffect(() => {
    setIsInWatchlist(watchlistManager.isInWatchlist("default", symbol))

    // Subscribe to real-time price updates
    const unsubscribe = realTimeDataManager.subscribe(`quotes_${symbol}`, (quotes) => {
      const quote = quotes[symbol]
      if (quote) {
        setLivePrice(quote.price)
        setLiveChange(quote.change || 0)
        setLiveChangePercent(quote.changePercent || 0)
      }
    })

    return unsubscribe
  }, [symbol])

  const toggleWatchlist = () => {
    if (isInWatchlist) {
      watchlistManager.removeFromWatchlist("default", symbol)
      setIsInWatchlist(false)
      toast({
        title: "Removed from watchlist",
        description: `${symbol} has been removed from your watchlist.`,
      })
    } else {
      watchlistManager.addToWatchlist("default", symbol)
      setIsInWatchlist(true)
      toast({
        title: "Added to watchlist",
        description: `${symbol} has been added to your watchlist.`,
      })
    }
  }

  const createAlert = () => {
    const price = Number.parseFloat(alertPrice)
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price for the alert.",
        variant: "destructive",
      })
      return
    }

    const alertId = watchlistManager.createAlert(
      symbol,
      alertType === "above" ? "price_above" : "price_below",
      price,
      `${symbol} ${alertType === "above" ? "reached" : "dropped to"} $${price}`,
    )

    setShowAlertDialog(false)
    setAlertPrice("")

    toast({
      title: "Alert created",
      description: `You'll be notified when ${symbol} goes ${alertType} $${price}.`,
    })
  }

  return (
    <>
      <Card className={cn("hover:shadow-md transition-all duration-200 group", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                {symbol}
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs text-muted-foreground">LIVE</span>
                </div>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{name}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleWatchlist}
                className="p-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Star className={cn("h-4 w-4", isInWatchlist && "fill-yellow-400 text-yellow-400")} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Price Information */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">${livePrice.toFixed(2)}</span>
              <div className={cn("flex items-center gap-1", isPositive ? "text-emerald-600" : "text-red-600")}>
                {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="font-semibold">
                  {isPositive ? "+" : ""}${liveChange.toFixed(2)} ({isPositive ? "+" : ""}
                  {liveChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              {volume && (
                <div>
                  <span className="text-muted-foreground">Volume: </span>
                  <span className="font-medium">{volume}</span>
                </div>
              )}
              {marketCap && (
                <div>
                  <span className="text-muted-foreground">Market Cap: </span>
                  <span className="font-medium">{marketCap}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mini Chart */}
          {showChart && (
            <div className="h-20 w-full">
              <InteractiveChart symbol={symbol} name={name} className="h-full border-0 shadow-none" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Dialog open={showChartDialog} onOpenChange={setShowChartDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="flex-1 gap-1 bg-transparent">
                  <BarChart3 className="h-3 w-3" />
                  Chart
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {symbol} - {name}
                  </DialogTitle>
                </DialogHeader>
                <InteractiveChart symbol={symbol} name={name} />
              </DialogContent>
            </Dialog>

            <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1 bg-transparent">
                  <Bell className="h-3 w-3" />
                  Alert
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Price Alert for {symbol}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Alert Type</Label>
                    <Select value={alertType} onValueChange={(value: "above" | "below") => setAlertType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="above">Price goes above</SelectItem>
                        <SelectItem value="below">Price goes below</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target Price ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter target price"
                      value={alertPrice}
                      onChange={(e) => setAlertPrice(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={createAlert} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                      Create Alert
                    </Button>
                    <Button variant="outline" onClick={() => setShowAlertDialog(false)} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700">
              <ShoppingCart className="h-3 w-3" />
              Trade
            </Button>
          </div>

          {/* Active Alerts */}
          {watchlistManager.getAlerts(symbol).length > 0 && (
            <div className="pt-2 border-t">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <AlertTriangle className="h-3 w-3" />
                Active Alerts ({watchlistManager.getAlerts(symbol).length})
              </div>
              <div className="space-y-1">
                {watchlistManager
                  .getAlerts(symbol)
                  .slice(0, 2)
                  .map((alert) => (
                    <div key={alert.id} className="text-xs p-2 bg-muted/50 rounded">
                      <span className={cn(alert.triggered ? "text-orange-600" : "text-muted-foreground")}>
                        {alert.message}
                        {alert.triggered && " ✓"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
