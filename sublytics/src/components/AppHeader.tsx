"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Search, Bell, LogOut, User, Settings, ChevronsUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/actions/auth";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import type { UserProfile } from "@/lib/types/auth";

interface AppHeaderProps {
  user: UserProfile;
}

export function getUserInitials(user: UserProfile): string {
  if (user.full_name) {
    const names = user.full_name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  }
  return user.email.substring(0, 2).toUpperCase();
}

function getBreadcrumb(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1] || 'dashboard';
  return last.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function AppHeader({ user }: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  const initials = getUserInitials(user);
  const pageTitle = getBreadcrumb(pathname);

  return (
    <header className="h-14 flex items-center justify-between border-b border-border/60 px-4 bg-background/80 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-5" />
        <h2 className="text-sm font-semibold text-foreground tracking-tight">
          {pageTitle}
        </h2>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="relative hidden md:block mr-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-8 w-52 h-8 text-xs bg-muted/50 border-border/50 rounded-lg focus-visible:ring-1 focus-visible:ring-primary/30"
          />
        </div>

        <ThemeToggle />

        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
        </Button>

        <Separator orientation="vertical" className="h-5 mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 gap-2 px-2 hover:bg-muted/60">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium hidden sm:inline-block max-w-[100px] truncate">
                {user.full_name || user.email.split('@')[0]}
              </span>
              <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  <p className="text-sm font-semibold leading-none truncate">
                    {user.full_name || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {user.email}
                  </p>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 w-fit mt-0.5 font-medium">
                    {user.role}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer gap-2 text-sm">
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2 text-sm">
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer gap-2 text-sm text-destructive focus:text-destructive focus:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
