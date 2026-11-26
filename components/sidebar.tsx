"use client";

import * as React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import {
  BedDouble,
  Building2,
  Calendar,
  ChevronUp,
  Hammer,
  Home,
  Inbox,
  LayoutDashboard,
  MessageSquareWarning,
  Search,
  Settings,
  Sparkles,
  User2,
  Users,
  Wrench,
} from "lucide-react";
import { getMyProfile } from "@/app/actions/auth";
import { Modal } from "@/components/admin/modal";
import { ChangePasswordForm } from "@/components/change-password-form";

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

function landlordNavItems(adminId: string, houseId?: string) {
  const base = `/admin-dashboard/${adminId}`;
  const items = [
    { title: "Dashboard", url: `${base}/home`, icon: LayoutDashboard },
    { title: "Users", url: `${base}/users`, icon: Users },
  ];
  if (houseId) {
    const house = `${base}/houses/${houseId}`;
    items.push(
      { title: "Accommodation", url: house, icon: Building2 },
      { title: "Maintenance", url: `${house}/maintenance`, icon: Wrench },
      { title: "Cleaning schedule", url: `${house}/cleaning`, icon: Sparkles },
    );
  }
  return items;
}

function tenantNavItems(houseId: string) {
  const base = `/tenant-dashboard/${houseId}`;
  return [
    { title: "My house", url: `${base}/home`, icon: Home },
    { title: "My room", url: `${base}/room`, icon: BedDouble },
    { title: "House maintenance", url: `${base}/maintenance`, icon: Wrench },
    { title: "Room repairs", url: `${base}/room/maintenance`, icon: Hammer },
    { title: "Complaints", url: `${base}/complaints`, icon: MessageSquareWarning },
  ];
}

// Reading the URL must happen inside <Suspense> because cacheComponents is enabled.
function RoleLabel() {
  const params = useParams<{ "admin-id"?: string; house_id?: string }>();
  if (params["admin-id"]) return <span className="text-xs text-muted-foreground">Landlord</span>;
  if (params.house_id) return <span className="text-xs text-muted-foreground">Tenant</span>;
  return null;
}

function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? createBrowserClient(url, key) : null;
}

function NavItems() {
  const pathname = usePathname();
  const params = useParams<{ "admin-id"?: string; "house-id"?: string; house_id?: string }>();
  const adminId = params["admin-id"];
  const houseId = params.house_id;
  const items = adminId
    ? landlordNavItems(adminId, params["house-id"])
    : houseId
      ? tenantNavItems(houseId)
      : navItems;

  return items.map((item) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton
        tooltip={item.title}
        isActive={pathname === item.url}
        render={<a href={item.url} />}
      >
        <item.icon />
        <span>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  ));
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const [authError, setAuthError] = React.useState("");
  const [name, setName] = React.useState("");
  const [passwordOpen, setPasswordOpen] = React.useState(false);
  // An account still on its temporary password must change it before using the app.
  const [mustChange, setMustChange] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void getMyProfile().then((result) => {
      if (!cancelled && result.ok) setName(result.data.name);
    });
    void supabaseBrowser()
      ?.auth.getUser()
      .then(({ data }) => {
        if (!cancelled && data.user?.user_metadata?.must_change_password) setMustChange(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function signOut() {
    setAuthError("");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabasePublishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabasePublishableKey) {
      setAuthError("Supabase Auth is not configured.");
      return;
    }

    const supabase = createBrowserClient(supabaseUrl, supabasePublishableKey);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error.message);
      return;
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Top Header / Brand Logo */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
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
                <span className="truncate">{name || "Account"}</span>
                <ChevronUp className="ml-auto" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                {authError && <p role="alert" className="px-2 py-1 text-xs text-red-700">{authError}</p>}
                <DropdownMenuItem onClick={() => setPasswordOpen(true)}>
                  <span>Change password</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void signOut()}>
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Rail allows clicking the edge of the sidebar to collapse/expand */}
      <SidebarRail />

      <Modal
        open={passwordOpen || mustChange}
        onClose={() => setPasswordOpen(false)}
        dismissible={!mustChange}
        title={mustChange ? "Choose your own password" : "Change password"}
        description={
          mustChange
            ? "You are using a temporary password from the housing office. Replace it to continue."
            : undefined
        }
        size="md"
      >
        <ChangePasswordForm
          onDone={() => {
            setMustChange(false);
            setPasswordOpen(false);
          }}
        />
      </Modal>
    </Sidebar>
  );
}

export default AppSidebar;