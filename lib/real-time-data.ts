"use client"

import type { Quote } from "./finance"

export type TimeFrame = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL"

export type ChartDataPoint = {
  timestamp: number
  date: string
  price: number
  volume?: number
}

export type AssetAlert = {
  id: string
  symbol: string
  type: "price_above" | "price_below" | "volume_spike" | "news"
  condition: number
  message: string
  triggered: boolean
  createdAt: number
}

export type WatchlistItem = {
  symbol: string
  addedAt: number
  alerts: AssetAlert[]
}

class RealTimeDataManager {
  private subscribers: Map<string, Set<(data: any) => void>> = new Map()
  private intervals: Map<string, NodeJS.Timeout> = new Map()
  private cache: Map<string, any> = new Map()

  subscribe(key: string, callback: (data: any) => void) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set())
    }
    this.subscribers.get(key)!.add(callback)

    // Start real-time updates for this key
    this.startUpdates(key)

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(key)
      if (subs) {
        subs.delete(callback)
        if (subs.size === 0) {
          this.stopUpdates(key)
          this.subscribers.delete(key)
        }
      }
    }
  }

  private startUpdates(key: string) {
    if (this.intervals.has(key)) return

    const updateInterval = key.startsWith("chart_") ? 60000 : 15000 // Charts: 1min, Quotes: 15sec

    const interval = setInterval(async () => {
      try {
        let data
        if (key.startsWith("quotes_")) {
          const symbols = key.replace("quotes_", "").split(",")
          data = await this.fetchQuotes(symbols)
        } else if (key.startsWith("chart_")) {
          const [, symbol, timeframe] = key.split("_")
          data = await this.fetchChartData(symbol, timeframe as TimeFrame)
        }

        if (data) {
          this.cache.set(key, data)
          this.notifySubscribers(key, data)
        }
      } catch (error) {
        console.error(`Real-time update failed for ${key}:`, error)
      }
    }, updateInterval)

    this.intervals.set(key, interval)
  }

  private stopUpdates(key: string) {
    const interval = this.intervals.get(key)
    if (interval) {
      clearInterval(interval)
      this.intervals.delete(key)
    }
  }

  private notifySubscribers(key: string, data: any) {
    const subscribers = this.subscribers.get(key)
    if (subscribers) {
      subscribers.forEach((callback) => callback(data))
    }
  }

  private async fetchQuotes(symbols: string[]): Promise<Record<string, Quote>> {
    try {
      const response = await fetch(`/api/quotes?symbols=${symbols.join(",")}`, {
        cache: "no-store",
      })
      const data = await response.json()

      const quotes: Record<string, Quote> = {}
      data.quotes?.forEach((q: Quote) => {
        if (q.symbol) {
          quotes[q.symbol] = {
            ...q,
            timestamp: Date.now(),
          }
        }
      })

      return quotes
    } catch (error) {
      console.error("Failed to fetch quotes:", error)
      return {}
    }
  }

  private async fetchChartData(symbol: string, timeframe: TimeFrame): Promise<ChartDataPoint[]> {
    try {
      const response = await fetch(`/api/chart?symbol=${symbol}&timeframe=${timeframe}`, {
        cache: "no-store",
      })
      const data = await response.json()
      return data.chartData || this.generateMockChartData(symbol, timeframe)
    } catch (error) {
      console.error(`Failed to fetch chart data for ${symbol}:`, error)
      return this.generateMockChartData(symbol, timeframe)
    }
  }

  private generateMockChartData(symbol: string, timeframe: TimeFrame): ChartDataPoint[] {
    const now = Date.now()
    const points: ChartDataPoint[] = []

    let intervals: number
    let intervalMs: number

    switch (timeframe) {
      case "1D":
        intervals = 390 // 6.5 hours * 60 minutes
        intervalMs = 60 * 1000 // 1 minute
        break
      case "1W":
        intervals = 35 // 7 days * 5 trading days
        intervalMs = 30 * 60 * 1000 // 30 minutes
        break
      case "1M":
        intervals = 22 // ~22 trading days
        intervalMs = 24 * 60 * 60 * 1000 // 1 day
        break
      case "3M":
        intervals = 65 // ~65 trading days
        intervalMs = 24 * 60 * 60 * 1000 // 1 day
        break
      case "6M":
        intervals = 130 // ~130 trading days
        intervalMs = 24 * 60 * 60 * 1000 // 1 day
        break
      case "1Y":
        intervals = 252 // ~252 trading days
        intervalMs = 24 * 60 * 60 * 1000 // 1 day
        break
      case "ALL":
        intervals = 1000 // 4+ years of data
        intervalMs = 24 * 60 * 60 * 1000 // 1 day
        break
      default:
        intervals = 100
        intervalMs = 60 * 60 * 1000 // 1 hour
    }

    // Base price for different symbols
    let basePrice = 100
    if (symbol.includes("AAPL")) basePrice = 190
    else if (symbol.includes("MSFT")) basePrice = 430
    else if (symbol.includes("GOOGL")) basePrice = 150
    else if (symbol.includes("TSLA")) basePrice = 250
    else if (symbol.includes("NVDA")) basePrice = 875
    else if (symbol.includes(".L")) basePrice = symbol.includes("SHEL") ? 26 : symbol.includes("HSBA") ? 6.8 : 25

    let currentPrice = basePrice

    for (let i = intervals; i >= 0; i--) {
      const timestamp = now - i * intervalMs

      // Generate realistic price movement
      const volatility = timeframe === "1D" ? 0.002 : timeframe === "1W" ? 0.005 : 0.01
      const trend = (Math.random() - 0.5) * 0.001
      const noise = (Math.random() - 0.5) * volatility

      currentPrice = currentPrice * (1 + trend + noise)
      currentPrice = Math.max(currentPrice, basePrice * 0.5) // Don't go below 50% of base

      points.push({
        timestamp,
        date: new Date(timestamp).toISOString(),
        price: Number(currentPrice.toFixed(2)),
        volume: Math.floor(Math.random() * 10000000) + 1000000,
      })
    }

    return points
  }

  getFromCache(key: string) {
    return this.cache.get(key)
  }
}

export const realTimeDataManager = new RealTimeDataManager()

// Watchlist management
export class WatchlistManager {
  private watchlists: Map<string, WatchlistItem[]> = new Map()
  private alerts: Map<string, AssetAlert[]> = new Map()

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return

    try {
      const stored = localStorage.getItem("investment_watchlists")
      if (stored) {
        const data = JSON.parse(stored)
        this.watchlists = new Map(Object.entries(data.watchlists || {}))
        this.alerts = new Map(Object.entries(data.alerts || {}))
      }
    } catch (error) {
      console.error("Failed to load watchlists:", error)
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return

    try {
      const data = {
        watchlists: Object.fromEntries(this.watchlists),
        alerts: Object.fromEntries(this.alerts),
      }
      localStorage.setItem("investment_watchlists", JSON.stringify(data))
    } catch (error) {
      console.error("Failed to save watchlists:", error)
    }
  }

  addToWatchlist(listName: string, symbol: string): void {
    if (!this.watchlists.has(listName)) {
      this.watchlists.set(listName, [])
    }

    const list = this.watchlists.get(listName)!
    if (!list.find((item) => item.symbol === symbol)) {
      list.push({
        symbol,
        addedAt: Date.now(),
        alerts: [],
      })
      this.saveToStorage()
    }
  }

  removeFromWatchlist(listName: string, symbol: string): void {
    const list = this.watchlists.get(listName)
    if (list) {
      const index = list.findIndex((item) => item.symbol === symbol)
      if (index !== -1) {
        list.splice(index, 1)
        this.saveToStorage()
      }
    }
  }

  getWatchlist(listName: string): WatchlistItem[] {
    return this.watchlists.get(listName) || []
  }

  isInWatchlist(listName: string, symbol: string): boolean {
    const list = this.watchlists.get(listName)
    return list ? list.some((item) => item.symbol === symbol) : false
  }

  createAlert(symbol: string, type: AssetAlert["type"], condition: number, message: string): string {
    const alert: AssetAlert = {
      id: `${symbol}_${Date.now()}`,
      symbol,
      type,
      condition,
      message,
      triggered: false,
      createdAt: Date.now(),
    }

    if (!this.alerts.has(symbol)) {
      this.alerts.set(symbol, [])
    }

    this.alerts.get(symbol)!.push(alert)
    this.saveToStorage()

    return alert.id
  }

  checkAlerts(quotes: Record<string, Quote>): AssetAlert[] {
    const triggeredAlerts: AssetAlert[] = []

    this.alerts.forEach((alerts, symbol) => {
      const quote = quotes[symbol]
      if (!quote) return

      alerts.forEach((alert) => {
        if (alert.triggered) return

        let shouldTrigger = false

        switch (alert.type) {
          case "price_above":
            shouldTrigger = quote.price >= alert.condition
            break
          case "price_below":
            shouldTrigger = quote.price <= alert.condition
            break
          case "volume_spike":
            // Mock volume spike detection
            shouldTrigger = Math.random() < 0.1 // 10% chance for demo
            break
        }

        if (shouldTrigger) {
          alert.triggered = true
          triggeredAlerts.push(alert)
        }
      })
    })

    if (triggeredAlerts.length > 0) {
      this.saveToStorage()
    }

    return triggeredAlerts
  }

  getAlerts(symbol?: string): AssetAlert[] {
    if (symbol) {
      return this.alerts.get(symbol) || []
    }

    const allAlerts: AssetAlert[] = []
    this.alerts.forEach((alerts) => allAlerts.push(...alerts))
    return allAlerts
  }
}

export const watchlistManager = new WatchlistManager()
