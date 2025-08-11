"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { watchlistManager, realTimeDataManager, type AssetAlert } from "@/lib/real-time-data"
import { Bell, AlertTriangle, TrendingUp, TrendingDown, X, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function AlertCenter() {
  const { toast } = useToast()
  const [alerts, setAlerts] = React.useState<AssetAlert[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [showDialog, setShowDialog] = React.useState(false)

  React.useEffect(() => {
    // Load existing alerts
    const allAlerts = watchlistManager.getAlerts()
    setAlerts(allAlerts)
    setUnreadCount(allAlerts.filter((alert) => alert.triggered && !alert.id.includes("_read")).length)

    // Subscribe to quote updates to check alerts
    const watchlistSymbols = watchlistManager.getWatchlist("default").map((item) => item.symbol)

    if (watchlistSymbols.length > 0) {
      const unsubscribe = realTimeDataManager.subscribe(`quotes_${watchlistSymbols.join(",")}`, (quotes) => {
        const triggeredAlerts = watchlistManager.checkAlerts(quotes)

        if (triggeredAlerts.length > 0) {
          // Update alerts state
          const updatedAlerts = watchlistManager.getAlerts()
          setAlerts(updatedAlerts)
          setUnreadCount((prev) => prev + triggeredAlerts.length)

          // Show toast notifications
          triggeredAlerts.forEach((alert) => {
            toast({
              title: "Price Alert Triggered!",
              description: alert.message,
              variant: "default",
            })
          })
        }
      })

      return unsubscribe
    }
  }, [toast])

  const markAsRead = (alertId: string) => {
    // Simple read tracking by modifying the alert ID
    setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, id: `${alert.id}_read` } : alert)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const dismissAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
    if (!alertId.includes("_read")) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  const getAlertIcon = (type: AssetAlert["type"]) => {
    switch (type) {
      case "price_above":
        return <TrendingUp className="h-4 w-4 text-emerald-600" />
      case "price_below":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case "volume_spike":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getAlertColor = (alert: AssetAlert) => {
    if (!alert.triggered) return "bg-muted/50"

    switch (alert.type) {
      case "price_above":
        return "bg-emerald-50 border-emerald-200"
      case "price_below":
        return "bg-red-50 border-red-200"
      case "volume_spike":
        return "bg-orange-50 border-orange-200"
      default:
        return "bg-blue-50 border-blue-200"
    }
  }

  const activeAlerts = alerts.filter((alert) => !alert.triggered)
  const triggeredAlerts = alerts.filter((alert) => alert.triggered)

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative gap-2 bg-transparent">
          <Bell className="h-4 w-4" />
          Alerts
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alert Center
            {unreadCount > 0 && <Badge variant="destructive">{unreadCount} new</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Triggered Alerts */}
          {triggeredAlerts.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                Triggered Alerts ({triggeredAlerts.length})
              </h3>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {triggeredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        "p-3 rounded-lg border transition-colors",
                        getAlertColor(alert),
                        !alert.id.includes("_read") && "ring-2 ring-orange-200",
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2 flex-1">
                          {getAlertIcon(alert.type)}
                          <div className="flex-1">
                            <div className="font-medium text-sm">{alert.symbol}</div>
                            <div className="text-sm text-muted-foreground">{alert.message}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(alert.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {!alert.id.includes("_read") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(alert.id)}
                              className="h-6 w-6 p-0"
                            >
                              ✓
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => dismissAlert(alert.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Active Alerts */}
          {activeAlerts.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Active Alerts ({activeAlerts.length})
              </h3>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {activeAlerts.map((alert) => (
                    <div key={alert.id} className="p-3 rounded-lg border bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2 flex-1">
                          {getAlertIcon(alert.type)}
                          <div className="flex-1">
                            <div className="font-medium text-sm">{alert.symbol}</div>
                            <div className="text-sm text-muted-foreground">
                              Alert when price goes {alert.type === "price_above" ? "above" : "below"} $
                              {alert.condition}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Created: {new Date(alert.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => dismissAlert(alert.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Empty State */}
          {alerts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No alerts set up yet</p>
              <p className="text-sm">Create price alerts from any asset card</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
