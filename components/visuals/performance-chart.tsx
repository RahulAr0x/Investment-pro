"use client"

import React from "react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts"

function generateRealisticGrowthSeries(initialValue: number, finalValue: number) {
  const points = 180 // ~4 years of data points
  const data: { day: string; value: number; date: string }[] = []

  // Key milestones in the growth journey
  const milestones = [
    { point: 0, value: initialValue, label: "Jan 2021" }, // €12,184.06
    { point: 30, value: initialValue * 1.15, label: "Mar 2021" }, // Early growth
    { point: 60, value: initialValue * 1.35, label: "Jun 2021" }, // Bull market
    { point: 90, value: initialValue * 1.25, label: "Sep 2021" }, // Correction
    { point: 120, value: initialValue * 1.1, label: "Dec 2021" }, // Bear market start
    { point: 150, value: initialValue * 1.05, label: "Mar 2022" }, // Market bottom
    { point: 180, value: finalValue, label: "Aug 2025" }, // Current: €54,762.25
  ]

  for (let i = 0; i <= points; i++) {
    const progress = i / points

    // Find the two milestones to interpolate between
    let lowerMilestone = milestones[0]
    let upperMilestone = milestones[milestones.length - 1]

    for (let j = 0; j < milestones.length - 1; j++) {
      if (i >= milestones[j].point && i <= milestones[j + 1].point) {
        lowerMilestone = milestones[j]
        upperMilestone = milestones[j + 1]
        break
      }
    }

    // Interpolate between milestones
    const segmentProgress =
      upperMilestone.point === lowerMilestone.point
        ? 0
        : (i - lowerMilestone.point) / (upperMilestone.point - lowerMilestone.point)

    const baseValue = lowerMilestone.value + (upperMilestone.value - lowerMilestone.value) * segmentProgress

    // Add realistic market volatility
    const volatility = 0.02 // 2% daily volatility
    const trendNoise = (Math.sin(i * 0.1) + Math.cos(i * 0.15)) * 0.01
    const randomNoise = (Math.random() - 0.5) * volatility

    const finalValue = baseValue * (1 + trendNoise + randomNoise)

    // Ensure we don't go below 80% of initial value
    const clampedValue = Math.max(finalValue, initialValue * 0.8)

    // Create date labels
    const startDate = new Date("2021-01-15")
    const currentDate = new Date(startDate.getTime() + i * 8.5 * 24 * 60 * 60 * 1000) // ~8.5 days per point

    data.push({
      day: i.toString(),
      value: Math.round(clampedValue),
      date: currentDate
        .toLocaleDateString("en-US", {
          month: "short",
          year: i % 30 === 0 ? "numeric" : undefined,
        })
        .replace(" undefined", ""),
    })
  }

  return data
}

export default function PerformanceChart({ base }: { base: number }) {
  const finalValue = 54762.25 // Target value for August 2025
  const data = React.useMemo(() => generateRealisticGrowthSeries(base, finalValue), [base])

  const currentValue = data[data.length - 1]?.value || finalValue
  const totalGrowth = currentValue - base
  const totalGrowthPercent = (totalGrowth / base) * 100

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="50%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12 }}
            tickFormatter={(value, index) => {
              // Show labels every 30 points (roughly every 8 months)
              if (index % 30 === 0) {
                const point = data[index]
                return point?.date || ""
              }
              return ""
            }}
            interval={0}
          />
          <YAxis hide domain={["dataMin - 1000", "dataMax + 1000"]} />
          <Tooltip
            formatter={(v: any) => [
              `€${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
              "Portfolio Value",
            ]}
            labelFormatter={(label) => {
              const point = data[Number(label)]
              if (point) {
                const startDate = new Date("2021-01-15")
                const currentDate = new Date(startDate.getTime() + Number(label) * 8.5 * 24 * 60 * 60 * 1000)
                return currentDate.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              }
              return label
            }}
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
            }}
          />
          <ReferenceLine
            y={base}
            stroke="#64748b"
            strokeDasharray="3 3"
            label={{
              value: "Initial Investment",
              position: "insideTopLeft",
              style: { fontSize: "12px", fill: "#64748b" },
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#059669"
            fill="url(#growthGradient)"
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
