"use client"
import type { Quote } from "@/lib/finance"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

export default function MarketTicker({
  symbols,
  quotes,
  loading,
}: { symbols: string[]; quotes: Record<string, Quote>; loading?: boolean }) {
  if (loading) {
    return (
      <div className="bg-muted/60 rounded-md border overflow-hidden">
        <div className="flex gap-6 overflow-x-auto whitespace-nowrap px-3 py-2">
          {symbols.slice(0, 6).map((s) => (
            <div key={s} className="flex items-center gap-2 text-sm animate-pulse">
              <div className="h-4 w-12 bg-muted-foreground/20 rounded"></div>
              <div className="h-4 w-16 bg-muted-foreground/20 rounded"></div>
              <div className="h-4 w-12 bg-muted-foreground/20 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const displaySymbols = symbols
    .filter((s) => {
      const q = quotes[s]
      return q && q.price > 0
    })
    .slice(0, 8)

  return (
    <div className="bg-muted/60 rounded-md border overflow-hidden hover:bg-muted/80 transition-colors">
      <div className="flex items-center justify-between px-3 py-1 border-b bg-muted/40">
        <span className="text-xs font-medium text-muted-foreground">Live Market Data</span>
        {loading && (
          <div className="flex items-center gap-1 text-xs text-emerald-600">
            <div className="animate-spin rounded-full h-3 w-3 border-b border-emerald-600"></div>
            <span>Updating...</span>
          </div>
        )}
      </div>
      <div className="flex gap-6 overflow-x-auto whitespace-nowrap px-3 py-3">
        {displaySymbols.map((s) => {
          const q = quotes[s]
          const price = q?.price ?? 0
          const cp = q?.changePercent ?? 0
          const change = q?.change ?? 0
          const pos = cp >= 0

          return (
            <div
              key={s}
              className="flex items-center gap-2 text-sm hover:bg-background/50 px-2 py-1 rounded transition-colors cursor-pointer"
            >
              <span className="font-semibold text-foreground">{s.replace(".L", "")}</span>
              <span className="text-muted-foreground text-xs">{q?.currency ?? "USD"}</span>
              <span className="font-bold">{price > 0 ? price.toFixed(2) : "—"}</span>
              <div className="flex items-center gap-1">
                {pos ? (
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={cn("text-xs font-medium", pos ? "text-emerald-600" : "text-red-600")}>
                  {pos ? "+" : ""}
                  {cp?.toFixed(2)}%
                </span>
              </div>
            </div>
          )
        })}
        {displaySymbols.length === 0 && (
          <div className="text-sm text-muted-foreground py-1">Loading market data...</div>
        )}
      </div>
    </div>
  )
}
