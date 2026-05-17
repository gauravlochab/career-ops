"use client"

import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconFileTypePdf,
  IconMicroscope,
  IconSearch,
  IconClipboardList,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Your Name",
    email: "your@email.com",
    avatar: "",
  },
  navMain: [
    { title: "Dashboard",    url: "/dashboard",              icon: IconDashboard },
    { title: "Find Jobs",    url: "/dashboard/find",         icon: IconSearch },
    { title: "Tracker",      url: "/dashboard/tracker",      icon: IconClipboardList },
    { title: "Intelligence", url: "/dashboard/intel",        icon: IconChartBar },
    { title: "Interview Prep", url: "/dashboard/prep",       icon: IconMicroscope },
    { title: "Generate PDFs", url: "/dashboard/pdf",         icon: IconFileTypePdf },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="/dashboard">
                <div className="flex size-6 items-center justify-center rounded bg-foreground text-background text-xs font-bold">C</div>
                <span className="text-base font-semibold">career-ops</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
