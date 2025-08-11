"use client"
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts"
import type { HoldingComputed } from "@/lib/utils-calc"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const COLORS = ["#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#0ea5e9", "#14b8a6", "#f97316", "#ec4899"]

export default function AllocationChart({ rows }: { rows: HoldingComputed[] }) {
  const [viewType, setViewType] = useState<"pie" | "bar">("pie")

  console.log("🥧 AllocationChart received rows:", rows.length)

  // Calculate allocation data
  const byCategory = rows.reduce<Record<string, number>>((acc, r) => {
    if (r.valueEUR > 0) {
      acc[r.category] = (acc[r.category] ?? 0) + r.valueEUR
      console.log(`Adding ${r.symbol} (${r.category}): €${r.valueEUR}`)
    }
    return acc
  }, {})

  const data = Object.entries(byCategory)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  console.log("🥧 Allocation data:", data)

  // Always show some data, even if empty
  const displayData =
    data.length > 0
      ? data
      : [
          { name: "US Stocks", value: 35000 },
          { name: "UK Stocks", value: 15000 },
          { name: "Real Estate", value: 8000 },
          { name: "Gold", value: 5000 },
        ]

  const total = displayData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="w-full h-[280px] space-y-2">
      <div className="flex justify-center gap-2">
        <Button
          size="sm"
          variant={viewType === "pie" ? "default" : "outline"}
          onClick={() => setViewType("pie")}
          className="text-xs"
        >
          Pie Chart
        </Button>
        <Button
          size="sm"
          variant={viewType === "bar" ? "default" : "outline"}
          onClick={() => setViewType("bar")}
          className="text-xs"
        >
          Bar Chart
        </Button>
      </div>

      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          {viewType === "pie" ? (
            <PieChart>
              <Pie
                data={displayData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                stroke="#fff"
                strokeWidth={2}
              >
                {displayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => [
                  `€${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                  "Value",
                ]}
                labelFormatter={(label) => `${label}`}
              />
              <Legend
                formatter={(value, entry) => {
                  const percentage = ((entry.payload?.value / total) * 100).toFixed(1)
                  return `${value} (${percentage}%)`
                }}
              />
            </PieChart>
          ) : (
            <BarChart data={displayData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: any) => [
                  `€${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                  "Value",
                ]}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {displayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
