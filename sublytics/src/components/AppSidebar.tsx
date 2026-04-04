"use client";

import {
  LayoutDashboard,
  Package,
  Layers,
  Users,
  RefreshCw,
  FileText,
  FileCheck,
  Settings,
  Code,
  Mail,
  LogOut,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { signOut } from "@/lib/actions/auth";

const mainNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Products", url: "/products", icon: Package },
  { title: "Plans", url: "/plans", icon: Layers },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Subscriptions", url: "/subscriptions", icon: RefreshCw },
  { title: "Invoices", url: "/invoices", icon: FileText },
  { title: "Quotations", url: "/quotations", icon: FileCheck },
];

const secondaryNav = [
  { title: "Staff", url: "/staff", icon: UserCog },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "API & Docs", url: "/api-docs", icon: Code },
  { title: "Email Templates", url: "/email-templates", icon: Mail },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div className={collapsed ? "p-4 flex items-center justify-center" : "p-4 flex items-center gap-2.5"}>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-bold text-sm">S</span>
        </div>
        {!collapsed && (
          <span className="font-semibold text-foreground text-lg tracking-tight">
            Sublytics
          </span>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url} className="transition-colors">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">
            Configuration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url} className="transition-colors">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button 
                onClick={async () => await signOut()}
                className="flex w-full items-center gap-2 text-muted-foreground hover:text-destructive cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                {!collapsed && <span>Sign out</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
