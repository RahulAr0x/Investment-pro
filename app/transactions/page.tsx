"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

function TransactionsInner() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-semibold">Transactions</h1>
        <Button variant="outline" onClick={() => alert("Import CSV prototype")}>
          Import CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Prototype — connect to your broker or back office</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No transactions yet. Use the Trade button from Holdings to simulate an order.
        </CardContent>
      </Card>
    </div>
  )
}

export default function TransactionsPage() {
  return <TransactionsInner />
}
