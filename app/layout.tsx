import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TrendingUp } from "lucide-react"
import { PortfolioProvider } from "@/components/portfolio-provider"
import "@/styles/globals.css" // Import globals.css at the top of the file

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Investment Pro · Investment Dashboard",
  description: "A professional investment dashboard prototype for Rahul Ravi",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <PortfolioProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <header className="flex h-14 items-center gap-2 border-b bg-muted/40 px-4">
                  <SidebarTrigger />
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                      <div className="font-semibold text-sm md:text-base">Investment Pro</div>
                    </div>
                    <span className="text-xs text-muted-foreground hidden md:inline">
                      Professional Investment Platform
                    </span>
                  </div>
                  <div className="ml-auto flex items-center gap-2">{/* Header actions reserve */}</div>
                </header>
                <main className="min-h-[calc(100svh-56px)]">{children}</main>
              </SidebarInset>
            </SidebarProvider>
          </PortfolioProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
