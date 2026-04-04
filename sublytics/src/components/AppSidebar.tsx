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
  ChevronsUpDown,
  Shield,
  DollarSign,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/actions/auth";
import type { UserProfile } from "@/lib/types/auth";
import { getUserInitials } from "@/components/AppHeader";

const mainNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Products", url: "/products", icon: Package },
  { title: "Subscription Plans", url: "/plans", icon: Layers },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Subscribers", url: "/subscriptions", icon: RefreshCw },
  { title: "Invoices", url: "/invoices", icon: FileText },
  { title: "Quotations", url: "/quotations", icon: FileCheck },
];

const secondaryNav = [
  { title: "Staff", url: "/staff", icon: UserCog, systemAdminOnly: true },
  { title: "Settings", url: "/settings", icon: Settings, systemAdminOnly: true },
  { title: "ROE Management", url: "/roe-management", icon: DollarSign, systemAdminOnly: true },
  { title: "API & Docs", url: "/api-docs", icon: Code, systemAdminOnly: true },
  { title: "Email Templates", url: "/email-templates", icon: Mail, systemAdminOnly: true },
];

interface AppSidebarProps {
  user: UserProfile;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;
  const initials = getUserInitials(user);

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
              {secondaryNav
                .filter((item) => !item.systemAdminOnly || user.role === 'SYSTEM_ADMIN')
                .map((item) => (
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

        {/* Security - Only for SYSTEM_ADMIN */}
        {user.role === 'SYSTEM_ADMIN' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">
              Security
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/security')}>
                    <Link href="/security" className="transition-colors">
                      <Shield className="h-4 w-4" />
                      {!collapsed && <span>Rate Limiting</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-auto py-2 cursor-pointer">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium truncate leading-tight">
                        {user.full_name || user.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-muted-foreground truncate leading-tight">
                        {user.email}
                      </p>
                    </div>
                  )}
                  {!collapsed && <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem className="cursor-pointer gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                  onClick={async () => await signOut()}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
