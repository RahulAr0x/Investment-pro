"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePortfolio } from "@/hooks/usePortfolio" // Declare the usePortfolio hook

function SettingsInner() {
  const { settings, setSettings } = usePortfolio()
  const [draft, setDraft] = React.useState(settings)

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-semibold">Settings</h1>
        <Button
          onClick={() => {
            setSettings(draft)
          }}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          Save
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Branding and refresh behavior</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Dashboard Name</Label>
            <Input
              value={draft.dashboardName}
              onChange={(e) => setDraft({ ...draft, dashboardName: e.target.value })}
              placeholder="[Add Dashboard Name]"
            />
          </div>
          <div className="grid gap-2">
            <Label>Auto-Refresh Interval (seconds)</Label>
            <Input
              type="number"
              min={10}
              value={draft.refreshIntervalSec}
              onChange={(e) => setDraft({ ...draft, refreshIntervalSec: Number(e.target.value || 60) })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentation</CardTitle>
          <CardDescription>Build instructions for AI agents and engineers</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          See docs/build-instructions.md in this project for setup and integration steps.{" "}
          <Link href="/docs/build-instructions.md">Open file</Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SettingsPage() {
  return <SettingsInner />
}
