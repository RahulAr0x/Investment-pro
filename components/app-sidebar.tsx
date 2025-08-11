"use client"

import Link from "next/link"
import Image from "next/image"
import {
  BarChart3,
  LineChart,
  LayoutDashboard,
  LandPlot,
  Landmark,
  Settings,
  Table2,
  TrendingUp,
  Wallet,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ProfileDialog } from "./profile-dialog"

const primaryNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Markets", url: "/markets", icon: LineChart },
  { title: "Portfolio", url: "/portfolio", icon: Wallet }, // Changed from "/" to "/portfolio"
  { title: "Transactions", url: "/transactions", icon: Table2 },
  { title: "Real Estate", url: "/markets?tab=real-estate", icon: LandPlot },
  { title: "Commodities", url: "/markets?tab=commodities", icon: Landmark },
]

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <ProfileDialog>
          <div className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors">
            <Image src="/rahul-profile.jpeg" width={32} height={32} alt="User avatar" className="rounded-full" />
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-tight">Rahul Ravi</span>
              <span className="text-xs text-muted-foreground leading-tight">iamrahul0@outlook.com</span>
            </div>
          </div>
        </ProfileDialog>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Insights</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Performance">
                  <Link href="/?section=performance">
                    <TrendingUp />
                    <span>Performance</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Allocations">
                  <Link href="/?section=allocations">
                    <BarChart3 />
                    <span>Allocations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
