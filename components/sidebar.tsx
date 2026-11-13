"use client";

import * as React from "react";
import { useParams, usePathname } from "next/navigation";
import {
  Calendar,
  ChevronUp,
  Home,
  Inbox,
  LayoutDashboard,
  Megaphone,
  Search,
  Settings,
  Sparkles,
  User2,
  Users,
  Wrench,
} from "lucide-react";

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
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Sample navigation items
const navItems = [
  { title: "Home", url: "#", icon: Home },
  { title: "Inbox", url: "#", icon: Inbox },
  { title: "Calendar", url: "#", icon: Calendar },
  {
    title: "Maintenance",
    url: "/tenant-dashboard/efv/maintenance",
    icon: Search,
  },
  { title: "Settings", url: "#", icon: Settings },
];

function landlordNavItems(adminId: string) {
  const base = `/admin-dashboard/${adminId}`;
  return [
    { title: "Dashboard", url: base, icon: LayoutDashboard },
    { title: "Calendar", url: `${base}/calendar`, icon: Calendar },
    { title: "Cleaning schedule", url: `${base}/cleaning-schedule`, icon: Sparkles },
    { title: "Maintenance and repairs", url: `${base}/maintenence`, icon: Wrench },
    { title: "Announcements", url: `${base}/announcements`, icon: Megaphone },
    { title: "Tenants", url: `${base}/tenants`, icon: Users },
  ];
}

function tenantNavItems(houseId: string) {
  const base = `/tenant-dashboard/${houseId}`;
  return [
    { title: "Home", url: "#", icon: Home },
    { title: "Inbox", url: "#", icon: Inbox },
    { title: "Cleaning schedule", url: `${base}/cleaning-schedule`, icon: Sparkles },
    { title: "Maintenance", url: `${base}/maintenance`, icon: Wrench },
    { title: "Settings", url: "#", icon: Settings },
  ];
}

// Reading the URL must happen inside <Suspense> because cacheComponents is enabled.
function RoleLabel() {
  const adminId = useParams<{ "admin-id"?: string }>()["admin-id"];
  if (!adminId) return null;
  return <span className="text-xs text-muted-foreground">Landlord</span>;
}

function NavItems() {
  const pathname = usePathname();
  const params = useParams<{ "admin-id"?: string; house_id?: string }>();
  const adminId = params["admin-id"];
  const houseId = params.house_id;
  const items = adminId
    ? landlordNavItems(adminId)
    : houseId
      ? tenantNavItems(houseId)
      : navItems;

  return items.map((item) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton
        tooltip={item.title}
        isActive={
          pathname === item.url ||
          (item.url.split("/").length > 3 && pathname.startsWith(`${item.url}/`))
        }
        render={<a href={item.url} />}
      >
        <item.icon />
        <span>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  ));
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Top Header / Brand Logo */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Home className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">Student Housing BV</span>
                <React.Suspense fallback={null}>
                  <RoleLabel />
                </React.Suspense>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main Scrollable Content */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <React.Suspense fallback={null}>
                <NavItems />
              </React.Suspense>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Bottom Footer / User Menu */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton />}>
                <User2 />
                <span>Jane Doe</span>
                <ChevronUp className="ml-auto" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem>
                  <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Billing</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Rail allows clicking the edge of the sidebar to collapse/expand */}
      <SidebarRail />
    </Sidebar>
  );
}
