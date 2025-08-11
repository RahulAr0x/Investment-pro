"use client"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { HoldingComputed } from "@/lib/utils-calc"
import { formatCurrencyEUR, sig } from "@/lib/utils-calc"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Eye, ShoppingCart, Building, MapPin, Calendar, DollarSign } from "lucide-react"
import React from "react"

export default function HoldingsTable({ rows }: { rows: HoldingComputed[] }) {
  const validRows = rows.filter((r) => r.valueEUR > 0)
  const totals = validRows.reduce(
    (acc, r) => {
      acc.value += r.valueEUR
      acc.cost += r.costEUR
      return acc
    },
    { value: 0, cost: 0 },
  )
  const pnl = totals.value - totals.cost
  const pnlPct = totals.cost ? (pnl / totals.cost) * 100 : 0

  if (validRows.length === 0) {
    return (
      <div className="w-full text-center py-8 text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <div>Loading portfolio data...</div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-muted/50">
            <TableHead>Asset</TableHead>
            <TableHead className="hidden md:table-cell">Name</TableHead>
            <TableHead className="text-right">Holdings</TableHead>
            <TableHead className="text-right">Avg Cost</TableHead>
            <TableHead className="text-right">Current Price</TableHead>
            <TableHead className="text-right">Day Change</TableHead>
            <TableHead className="text-right">Market Value</TableHead>
            <TableHead className="text-right">Total Return</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {validRows.map((r) => (
            <TableRow key={r.symbol} className="hover:bg-muted/40 transition-colors">
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{r.symbol.replace(".L", "")}</span>
                  <Badge variant="outline" className="text-xs">
                    {r.category.split(" ")[0]}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell max-w-[200px] truncate" title={r.name}>
                {r.name}
              </TableCell>
              <TableCell className="text-right">
                <div className="font-medium">{sig(r.qty)}</div>
                {r.unit && <div className="text-xs text-muted-foreground">{r.unit}</div>}
              </TableCell>
              <TableCell className="text-right">
                <div className="font-medium">
                  {r.currency} {r.avgPrice.toFixed(2)}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="font-medium">
                  {r.currency} {r.lastPrice > 0 ? r.lastPrice.toFixed(2) : "—"}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div
                  className={cn(
                    "flex items-center justify-end gap-1",
                    (r.changePct ?? 0) >= 0 ? "text-emerald-600" : "text-red-600",
                  )}
                >
                  {(r.changePct ?? 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span className="font-medium">
                    {r.changePct !== undefined ? `${(r.changePct >= 0 ? "+" : "") + r.changePct.toFixed(2)}%` : "—"}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="font-semibold">{formatCurrencyEUR(r.valueEUR)}</div>
              </TableCell>
              <TableCell className="text-right">
                <div className={cn("font-semibold", r.pnlEUR >= 0 ? "text-emerald-600" : "text-red-600")}>
                  {formatCurrencyEUR(r.pnlEUR)}
                </div>
                <div className={cn("text-xs", r.pnlEUR >= 0 ? "text-emerald-600" : "text-red-600")}>
                  ({(r.pnlPct >= 0 ? "+" : "") + r.pnlPct.toFixed(2)}%)
                </div>
              </TableCell>
              <TableCell className="text-right">
                <RowActions holding={r} />
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="border-t-2 bg-muted/20 hover:bg-muted/30">
            <TableCell colSpan={6} className="text-right font-semibold">
              Portfolio Totals:
            </TableCell>
            <TableCell className="text-right font-bold text-lg">{formatCurrencyEUR(totals.value)}</TableCell>
            <TableCell className="text-right">
              <div className={cn("font-bold text-lg", pnl >= 0 ? "text-emerald-700" : "text-red-700")}>
                {formatCurrencyEUR(pnl)}
              </div>
              <div className={cn("text-sm font-medium", pnl >= 0 ? "text-emerald-700" : "text-red-700")}>
                ({(pnlPct >= 0 ? "+" : "") + pnlPct.toFixed(2)}%)
              </div>
            </TableCell>
            <TableCell />
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

function RowActions({ holding }: { holding: HoldingComputed }) {
  const [orderType, setOrderType] = React.useState<"buy" | "sell">("buy")
  const [quantity, setQuantity] = React.useState("")
  const [orderPrice, setOrderPrice] = React.useState("")

  // Generate detailed company information
  const getCompanyDetails = (symbol: string) => {
    const details = {
      sector: "Technology",
      industry: "Software",
      employees: "100,000+",
      headquarters: "Cupertino, CA",
      founded: "1976",
      marketCap: "$2.8T",
      peRatio: "28.5",
      dividend: "0.24%",
      beta: "1.2",
      description: "Leading technology company focused on consumer electronics and software.",
    }

    if (symbol.includes("AAPL")) {
      return {
        ...details,
        sector: "Technology",
        industry: "Consumer Electronics",
        headquarters: "Cupertino, CA",
        founded: "1976",
        marketCap: "$2.8T",
        description:
          "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.",
      }
    } else if (symbol.includes("MSFT")) {
      return {
        ...details,
        sector: "Technology",
        industry: "Software",
        headquarters: "Redmond, WA",
        founded: "1975",
        marketCap: "$2.5T",
        description:
          "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.",
      }
    } else if (symbol.includes("GOOGL")) {
      return {
        ...details,
        sector: "Technology",
        industry: "Internet Services",
        headquarters: "Mountain View, CA",
        founded: "1998",
        marketCap: "$1.8T",
        description:
          "Alphabet Inc. provides online advertising services in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.",
      }
    } else if (symbol.includes(".L")) {
      return {
        ...details,
        sector: symbol.includes("SHEL") ? "Energy" : symbol.includes("AZN") ? "Healthcare" : "Financial Services",
        industry: symbol.includes("SHEL") ? "Oil & Gas" : symbol.includes("AZN") ? "Pharmaceuticals" : "Banking",
        headquarters: "London, UK",
        founded: symbol.includes("HSBA") ? "1865" : "1907",
        marketCap: "£50B",
        description: `${holding.name} is a leading UK-based company in the ${symbol.includes("SHEL") ? "energy" : symbol.includes("AZN") ? "pharmaceutical" : "financial services"} sector.`,
      }
    }

    return details
  }

  const companyDetails = getCompanyDetails(holding.symbol)

  return (
    <div className="flex justify-end gap-1">
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="hover:bg-emerald-50 hover:border-emerald-200 bg-transparent">
            <ShoppingCart className="h-3 w-3 mr-1" />
            Trade
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Trade {holding.symbol}</DialogTitle>
            <DialogDescription>{holding.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={orderType === "buy" ? "default" : "outline"}
                onClick={() => setOrderType("buy")}
                className={orderType === "buy" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              >
                Buy
              </Button>
              <Button variant={orderType === "sell" ? "destructive" : "outline"} onClick={() => setOrderType("sell")}>
                Sell
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Order Type</Label>
              <Select defaultValue="market">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market Order</SelectItem>
                  <SelectItem value="limit">Limit Order</SelectItem>
                  <SelectItem value="stop">Stop Loss</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={() =>
                alert(`${orderType.toUpperCase()} order for ${quantity} shares of ${holding.symbol} (prototype)`)
              }
            >
              Place {orderType.toUpperCase()} Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="hover:bg-blue-50 hover:border-blue-200 bg-transparent">
            <Eye className="h-3 w-3 mr-1" />
            Details
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {holding.name}
            </DialogTitle>
            <DialogDescription>
              {holding.symbol} • {holding.currency} • {companyDetails.sector}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Price Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-4 w-4" />
                  Price Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Current Price</div>
                  <div className="text-xl font-bold">
                    {holding.currency} {holding.lastPrice.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Day Change</div>
                  <div
                    className={cn(
                      "text-xl font-bold",
                      (holding.changePct ?? 0) >= 0 ? "text-emerald-600" : "text-red-600",
                    )}
                  >
                    {holding.changePct !== undefined
                      ? `${(holding.changePct >= 0 ? "+" : "") + holding.changePct.toFixed(2)}%`
                      : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Your Avg Cost</div>
                  <div className="text-lg font-semibold">
                    {holding.currency} {holding.avgPrice.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Market Value</div>
                  <div className="text-lg font-semibold">{formatCurrencyEUR(holding.valueEUR)}</div>
                </div>
              </CardContent>
            </Card>

            {/* Your Position */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Position</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Quantity</div>
                  <div className="text-lg font-semibold">
                    {sig(holding.qty)} {holding.unit || "shares"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Return</div>
                  <div
                    className={cn("text-lg font-semibold", holding.pnlEUR >= 0 ? "text-emerald-600" : "text-red-600")}
                  >
                    {formatCurrencyEUR(holding.pnlEUR)} ({(holding.pnlPct >= 0 ? "+" : "") + holding.pnlPct.toFixed(2)}
                    %)
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Cost Basis</div>
                  <div className="text-lg font-semibold">{formatCurrencyEUR(holding.costEUR)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Category</div>
                  <div className="text-lg font-semibold">{holding.category}</div>
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="h-4 w-4" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{companyDetails.description}</p>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Sector</div>
                    <div className="font-medium">{companyDetails.sector}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Industry</div>
                    <div className="font-medium">{companyDetails.industry}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Headquarters
                    </div>
                    <div className="font-medium">{companyDetails.headquarters}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Founded
                    </div>
                    <div className="font-medium">{companyDetails.founded}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Market Cap</div>
                    <div className="font-medium">{companyDetails.marketCap}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">P/E Ratio</div>
                    <div className="font-medium">{companyDetails.peRatio}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
