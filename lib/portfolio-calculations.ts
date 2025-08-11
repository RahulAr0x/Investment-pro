"use client"

import type { Holding } from "@/components/portfolio-provider"
import type { Quote, FxRates } from "./finance"

export interface PortfolioMetrics {
  totalValue: number
  totalCost: number
  totalPnL: number
  totalPnLPercent: number
  dayChange: number
  dayChangePercent: number
  assetWeights: Record<string, number>
  sectorWeights: Record<string, number>
  geographicWeights: Record<string, number>
  volatility: number
  sharpeRatio: number
  maxDrawdown: number
  beta: number
}

export interface AssetMetrics {
  symbol: string
  name: string
  currentValue: number
  costBasis: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  dayChange: number
  dayChangePercent: number
  weight: number
  volatility: number
  beta: number
  sharpeRatio: number
  dividendYield: number
}

export class PortfolioCalculator {
  private holdings: Holding[]
  private quotes: Record<string, Quote>
  private fxRates: FxRates
  private benchmarkReturn = 0.1 // 10% annual benchmark
  private riskFreeRate = 0.04 // 4% risk-free rate

  constructor(holdings: Holding[], quotes: Record<string, Quote>, fxRates: FxRates) {
    this.holdings = holdings
    this.quotes = quotes
    this.fxRates = fxRates
  }

  calculatePortfolioMetrics(): PortfolioMetrics {
    const assetMetrics = this.calculateAssetMetrics()
    const totalValue = assetMetrics.reduce((sum, asset) => sum + asset.currentValue, 0)
    const totalCost = assetMetrics.reduce((sum, asset) => sum + asset.costBasis, 0)
    const totalPnL = totalValue - totalCost
    const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0

    // Calculate day change
    const dayChange = assetMetrics.reduce((sum, asset) => sum + asset.dayChange, 0)
    const dayChangePercent = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0

    // Calculate weights
    const assetWeights: Record<string, number> = {}
    const sectorWeights: Record<string, number> = {}
    const geographicWeights: Record<string, number> = {}

    assetMetrics.forEach((asset) => {
      assetWeights[asset.symbol] = asset.weight

      // Sector allocation
      const sector = this.getSector(asset.symbol)
      sectorWeights[sector] = (sectorWeights[sector] || 0) + asset.weight

      // Geographic allocation
      const region = this.getRegion(asset.symbol)
      geographicWeights[region] = (geographicWeights[region] || 0) + asset.weight
    })

    // Calculate portfolio-level risk metrics
    const volatility = this.calculatePortfolioVolatility(assetMetrics)
    const sharpeRatio = this.calculatePortfolioSharpeRatio(totalPnLPercent / 100, volatility)
    const maxDrawdown = this.calculateMaxDrawdown(assetMetrics)
    const beta = this.calculatePortfolioBeta(assetMetrics)

    return {
      totalValue,
      totalCost,
      totalPnL,
      totalPnLPercent,
      dayChange,
      dayChangePercent,
      assetWeights,
      sectorWeights,
      geographicWeights,
      volatility,
      sharpeRatio,
      maxDrawdown,
      beta,
    }
  }

  calculateAssetMetrics(): AssetMetrics[] {
    return this.holdings
      .map((holding) => {
        const quote = this.quotes[holding.symbol]
        const currentPrice = quote?.price || 0
        const previousClose = quote?.previousClose || currentPrice

        // Convert to EUR
        const currentValue = this.convertToEUR(currentPrice * holding.qty, holding.currency)
        const costBasis = this.convertToEUR(holding.avgPrice * holding.qty, holding.currency)

        const unrealizedPnL = currentValue - costBasis
        const unrealizedPnLPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0

        // Day change calculation
        const dayChangePerShare = currentPrice - previousClose
        const dayChange = this.convertToEUR(dayChangePerShare * holding.qty, holding.currency)
        const dayChangePercent = previousClose > 0 ? (dayChangePerShare / previousClose) * 100 : 0

        // Calculate individual asset metrics
        const volatility = this.calculateAssetVolatility(holding.symbol)
        const beta = this.calculateAssetBeta(holding.symbol)
        const sharpeRatio = this.calculateAssetSharpeRatio(unrealizedPnLPercent / 100, volatility)
        const dividendYield = this.getDividendYield(holding.symbol)

        return {
          symbol: holding.symbol,
          name: holding.name,
          currentValue,
          costBasis,
          unrealizedPnL,
          unrealizedPnLPercent,
          dayChange,
          dayChangePercent,
          weight: 0, // Will be calculated after we have total value
          volatility,
          beta,
          sharpeRatio,
          dividendYield,
        }
      })
      .map((asset) => {
        const totalValue = this.holdings.reduce((sum, holding) => {
          const quote = this.quotes[holding.symbol]
          const currentPrice = quote?.price || 0
          return sum + this.convertToEUR(currentPrice * holding.qty, holding.currency)
        }, 0)

        return {
          ...asset,
          weight: totalValue > 0 ? (asset.currentValue / totalValue) * 100 : 0,
        }
      })
  }

  private convertToEUR(amount: number, currency: "USD" | "GBP"): number {
    if (currency === "USD") {
      return this.fxRates.rates.USD > 0 ? amount / this.fxRates.rates.USD : amount / 1.08
    }
    if (currency === "GBP") {
      return this.fxRates.rates.GBP > 0 ? amount / this.fxRates.rates.GBP : amount / 0.87
    }
    return amount
  }

  private getSector(symbol: string): string {
    if (
      symbol.includes("AAPL") ||
      symbol.includes("MSFT") ||
      symbol.includes("GOOGL") ||
      symbol.includes("TSLA") ||
      symbol.includes("NVDA")
    ) {
      return "Technology"
    }
    if (symbol.includes("JPM") || symbol.includes("HSBA") || symbol.includes("LLOY")) {
      return "Financial Services"
    }
    if (symbol.includes("JNJ") || symbol.includes("PFE") || symbol.includes("AZN")) {
      return "Healthcare"
    }
    if (symbol.includes("SHEL") || symbol.includes("BP")) {
      return "Energy"
    }
    if (symbol.includes("VNQ")) {
      return "Real Estate"
    }
    if (symbol.includes("XAU")) {
      return "Commodities"
    }
    return "Other"
  }

  private getRegion(symbol: string): string {
    if (symbol.includes(".L")) {
      return "United Kingdom"
    }
    if (symbol.includes("XAU")) {
      return "Commodities"
    }
    return "United States"
  }

  private calculateAssetVolatility(symbol: string): number {
    // Mock volatility calculation - in real implementation, use historical price data
    const baseVolatility: Record<string, number> = {
      AAPL: 0.25,
      MSFT: 0.22,
      GOOGL: 0.28,
      TSLA: 0.45,
      NVDA: 0.35,
      JPM: 0.3,
      JNJ: 0.18,
      PFE: 0.2,
      VNQ: 0.25,
      "XAUUSD=X": 0.2,
    }

    return baseVolatility[symbol] || 0.25
  }

  private calculateAssetBeta(symbol: string): number {
    // Mock beta calculation - in real implementation, calculate correlation with market
    const baseBeta: Record<string, number> = {
      AAPL: 1.2,
      MSFT: 0.9,
      GOOGL: 1.1,
      TSLA: 1.8,
      NVDA: 1.5,
      JPM: 1.3,
      JNJ: 0.7,
      PFE: 0.8,
      VNQ: 1.1,
      "XAUUSD=X": 0.1,
    }

    return baseBeta[symbol] || 1.0
  }

  private calculateAssetSharpeRatio(returnRate: number, volatility: number): number {
    if (volatility === 0) return 0
    return (returnRate - this.riskFreeRate) / volatility
  }

  private getDividendYield(symbol: string): number {
    // Mock dividend yields
    const dividendYields: Record<string, number> = {
      AAPL: 0.5,
      MSFT: 0.7,
      GOOGL: 0.0,
      TSLA: 0.0,
      NVDA: 0.1,
      JPM: 2.8,
      JNJ: 2.9,
      PFE: 5.1,
      VNQ: 3.2,
      "SHEL.L": 5.8,
      "HSBA.L": 4.2,
    }

    return dividendYields[symbol] || 0.0
  }

  private calculatePortfolioVolatility(assets: AssetMetrics[]): number {
    // Simplified portfolio volatility calculation
    // In reality, this would require correlation matrix
    const weightedVolatility = assets.reduce((sum, asset) => {
      return sum + Math.pow(asset.weight / 100, 2) * Math.pow(asset.volatility, 2)
    }, 0)

    return Math.sqrt(weightedVolatility)
  }

  private calculatePortfolioSharpeRatio(portfolioReturn: number, portfolioVolatility: number): number {
    if (portfolioVolatility === 0) return 0
    return (portfolioReturn - this.riskFreeRate) / portfolioVolatility
  }

  private calculateMaxDrawdown(assets: AssetMetrics[]): number {
    // Mock max drawdown calculation
    // In reality, this would use historical portfolio values
    const worstPerformer = Math.min(...assets.map((asset) => asset.unrealizedPnLPercent))
    return Math.abs(Math.min(worstPerformer, 0)) / 100
  }

  private calculatePortfolioBeta(assets: AssetMetrics[]): number {
    return assets.reduce((sum, asset) => {
      return sum + (asset.weight / 100) * asset.beta
    }, 0)
  }

  // Growth calculation methods
  calculateGrowthMetrics(initialValue: number, timeHorizonYears: number) {
    const currentMetrics = this.calculatePortfolioMetrics()
    const currentValue = currentMetrics.totalValue

    const totalReturn = currentValue - initialValue
    const totalReturnPercent = initialValue > 0 ? (totalReturn / initialValue) * 100 : 0

    // Annualized return
    const annualizedReturn = timeHorizonYears > 0 ? Math.pow(currentValue / initialValue, 1 / timeHorizonYears) - 1 : 0

    // Compound Annual Growth Rate (CAGR)
    const cagr = annualizedReturn * 100

    return {
      initialValue,
      currentValue,
      totalReturn,
      totalReturnPercent,
      annualizedReturn: annualizedReturn * 100,
      cagr,
      timeHorizonYears,
      averageAnnualGrowth: totalReturnPercent / Math.max(timeHorizonYears, 1),
    }
  }
}
