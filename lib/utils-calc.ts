"use client"

import type { Holding } from "@/components/portfolio-provider"
import type { FxRates, Quote } from "./finance"
import { convertToEUR } from "./finance"

export type HoldingComputed = {
  symbol: string
  name: string
  category: string
  currency: string
  qty: number
  unit?: string
  avgPrice: number
  lastPrice: number
  valueEUR: number
  costEUR: number
  pnlEUR: number
  pnlPct: number
  changePct?: number
}

export function computeHoldings(
  holdings: Holding[],
  quotes: Record<string, Quote>,
  fx: FxRates,
): { rows: HoldingComputed[]; totals: { valueEUR: number; costEUR: number; pnlEUR: number; pnlPct: number } } {
  const rows: HoldingComputed[] = holdings.map((h) => {
    const q = quotes[h.symbol]
    const lastPrice = q?.price ?? 0
    const valueNative = lastPrice * h.qty
    const costNative = h.avgPrice * h.qty
    const valueEUR = convertToEUR(valueNative, h.currency, fx)
    const costEUR = convertToEUR(costNative, h.currency, fx)
    const pnlEUR = valueEUR - costEUR
    const pnlPct = costEUR !== 0 ? (pnlEUR / costEUR) * 100 : 0
    return {
      symbol: h.symbol,
      name: h.name,
      category: h.category,
      currency: h.currency,
      qty: h.qty,
      unit: h.unit,
      avgPrice: h.avgPrice,
      lastPrice,
      valueEUR,
      costEUR,
      pnlEUR,
      pnlPct,
      changePct: q?.changePercent,
    }
  })

  const valueEUR = rows.reduce((s, r) => s + r.valueEUR, 0)
  const costEUR = rows.reduce((s, r) => s + r.costEUR, 0)
  const pnlEUR = valueEUR - costEUR
  const pnlPct = costEUR !== 0 ? (pnlEUR / costEUR) * 100 : 0

  return { rows, totals: { valueEUR, costEUR, pnlEUR, pnlPct } }
}

export function formatCurrencyEUR(n: number): string {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n)
}

export function formatCurrencyINR(n: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)
}

export function sig(n: number, digits = 2): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: digits })
}
