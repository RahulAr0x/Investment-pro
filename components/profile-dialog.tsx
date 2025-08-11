"use client"

import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { usePortfolio } from "./portfolio-provider"
import { formatCurrencyEUR } from "@/lib/utils-calc"
import { User, Mail, Calendar, MapPin, Phone, Building, TrendingUp, PieChart, Target } from "lucide-react"
import Image from "next/image"

export function ProfileDialog({ children }: { children: React.ReactNode }) {
  const { user, snapshot, holdings } = usePortfolio()

  // Calculate portfolio stats
  const totalHoldings = holdings.length
  const categories = Array.from(new Set(holdings.map((h) => h.category)))
  const totalGrowth = snapshot.asOfTotalEUR - snapshot.initialDepositEUR
  const totalGrowthPercent = (totalGrowth / snapshot.initialDepositEUR) * 100

  // Mock investor details
  const investorDetails = {
    email: "iamrahul0@outlook.com",
    phone: "+44 7700 900123",
    location: "London, United Kingdom",
    joinDate: "January 15, 2021",
    investorType: "Private Investor",
    riskProfile: "Moderate Growth",
    experience: "4+ Years",
    preferredSectors: ["Technology", "Healthcare", "Financial Services"],
    investmentGoals: ["Long-term Growth", "Diversification", "Income Generation"],
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="h-6 w-6" />
            Investor Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-6">
                <div className="relative">
                  <Image
                    src="/rahul-profile.jpeg"
                    alt="Rahul Ravi"
                    width={120}
                    height={120}
                    className="rounded-full object-cover border-4 border-muted"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-2">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold">{user.name}</h2>
                    <p className="text-muted-foreground">{investorDetails.investorType}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{investorDetails.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{investorDetails.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{investorDetails.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Member since {investorDetails.joinDate}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Badge variant="secondary">{investorDetails.riskProfile}</Badge>
                    <Badge variant="outline">{investorDetails.experience}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrencyEUR(snapshot.asOfTotalEUR)}</div>
                <div className="text-sm text-emerald-600">+{totalGrowthPercent.toFixed(1)}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{formatCurrencyEUR(totalGrowth)}</div>
                <div className="text-sm text-muted-foreground">Since {snapshot.initialYear}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Holdings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalHoldings}</div>
                <div className="text-sm text-muted-foreground">{categories.length} categories</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Initial Investment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrencyEUR(snapshot.initialDepositEUR)}</div>
                <div className="text-sm text-muted-foreground">{investorDetails.joinDate}</div>
              </CardContent>
            </Card>
          </div>

          {/* Investment Profile */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Investment Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {investorDetails.investmentGoals.map((goal, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-sm">{goal}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Preferred Sectors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {investorDetails.preferredSectors.map((sector, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-sm">{sector}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Holdings Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Current Holdings ({totalHoldings})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 max-h-64 overflow-y-auto">
                {holdings.slice(0, 10).map((holding, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                        {holding.symbol.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{holding.symbol.replace(".L", "")}</div>
                        <div className="text-xs text-muted-foreground">{holding.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{holding.qty} shares</div>
                      <div className="text-xs text-muted-foreground">{holding.category}</div>
                    </div>
                  </div>
                ))}
                {holdings.length > 10 && (
                  <div className="text-center text-sm text-muted-foreground py-2">
                    +{holdings.length - 10} more holdings
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
