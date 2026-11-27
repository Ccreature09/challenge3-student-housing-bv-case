"use client";

import * as React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import {
  BedDouble,
  Building2,
  ChevronRight,
  ChevronsUpDown,
  Hammer,
  Home,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageSquareWarning,
  Sparkles,
  Users,
  Wrench,
  type LucideIcon,
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
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getMyProfile } from "@/app/actions/auth";
import { listHouses, type HouseRow } from "@/app/actions/houses";
import { Modal } from "@/components/admin/modal";
import { ChangePasswordForm } from "@/components/change-password-form";

type NavLink = { title: string; url: string; icon: LucideIcon };

function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? createBrowserClient(url, key) : null;
}

function NavLinks({ items }: { items: NavLink[] }) {
  const pathname = usePathname();
  return items.map((item) => (
    <SidebarMenuItem key={item.url}>
      <SidebarMenuButton tooltip={item.title} isActive={pathname === item.url} render={<Link href={item.url} />}>
        <item.icon />
        <span>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  ));
}

/** Every accommodation, each folding open to its modules; the one being viewed starts open. */
function AccommodationLinks({ adminId, currentHouseId }: { adminId: string; currentHouseId?: string }) {
  const pathname = usePathname();
  const [houses, setHouses] = React.useState<HouseRow[] | null>(null);
  // The sidebar stays mounted between pages, so the house being viewed is
  // opened here rather than with defaultOpen (which only counts on mount).
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set(currentHouseId ? [currentHouseId] : []));
  const [shownHouseId, setShownHouseId] = React.useState(currentHouseId);
  if (currentHouseId !== shownHouseId) {
    setShownHouseId(currentHouseId);
    if (currentHouseId && !expanded.has(currentHouseId)) setExpanded(new Set(expanded).add(currentHouseId));
  }

  React.useEffect(() => {
    let cancelled = false;
    void listHouses(adminId).then((result) => {
      if (!cancelled) setHouses(result.ok ? result.data : []);
    });
    return () => {
      cancelled = true;
    };
    // Refetch when the page changes, so a newly added accommodation shows up.
  }, [adminId, pathname]);

  if (!houses) {
    return [0, 1, 2].map((index) => (
      <SidebarMenuItem key={index}>
        <SidebarMenuSkeleton showIcon />
      </SidebarMenuItem>
    ));
  }
  if (houses.length === 0) {
    return <p className="px-2 text-xs text-sidebar-foreground/70">No accommodations yet.</p>;
  }

  return houses.map((house) => {
    const base = `/admin-dashboard/${adminId}/houses/${house.id}`;
    const modules = [
      { title: "Overview", url: base },
      { title: "Maintenance", url: `${base}/maintenance` },
      { title: "Cleaning schedule", url: `${base}/cleaning` },
    ];
    return (
      <Collapsible
        key={house.id}
        open={expanded.has(house.id)}
        onOpenChange={(open) => {
          const next = new Set(expanded);
          if (open) next.add(house.id);
          else next.delete(house.id);
          setExpanded(next);
        }}
        render={<SidebarMenuItem />}
      >
        <CollapsibleTrigger
          className="group/collapsible"
          render={
            <SidebarMenuButton tooltip={`${house.street} ${house.houseNumber}`} isActive={house.id === currentHouseId} />
          }
        >
          <Building2 />
          <span>
            {house.street} {house.houseNumber}
          </span>
          <ChevronRight className="ml-auto transition-transform group-data-[panel-open]/collapsible:rotate-90" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {modules.map((module) => (
              <SidebarMenuSubItem key={module.url}>
                <SidebarMenuSubButton isActive={pathname === module.url} render={<Link href={module.url} />}>
                  <span>{module.title}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    );
  });
}

function NavGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>{children}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

// Reading the URL must happen inside <Suspense> because cacheComponents is enabled.
function Navigation() {
  const params = useParams<{ "admin-id"?: string; "house-id"?: string; house_id?: string }>();
  const adminId = params["admin-id"];
  const tenantHouseId = params.house_id;

  if (adminId) {
    const base = `/admin-dashboard/${adminId}`;
    return (
      <>
        <NavGroup label="Overview">
          <NavLinks
            items={[
              { title: "Dashboard", url: `${base}/home`, icon: LayoutDashboard },
              { title: "Users", url: `${base}/users`, icon: Users },
              { title: "All maintenance", url: `${base}/maintenance`, icon: Wrench },
            ]}
          />
        </NavGroup>
        <NavGroup label="Accommodations">
          <AccommodationLinks adminId={adminId} currentHouseId={params["house-id"]} />
        </NavGroup>
      </>
    );
  }

  if (tenantHouseId) {
    const base = `/tenant-dashboard/${tenantHouseId}`;
    return (
      <>
        <NavGroup label="My home">
          <NavLinks
            items={[
              { title: "My house", url: `${base}/home`, icon: Home },
              { title: "My room", url: `${base}/room`, icon: BedDouble },
            ]}
          />
        </NavGroup>
        <NavGroup label="Common spaces">
          <NavLinks
            items={[
              { title: "Cleaning schedule", url: `${base}/cleaning`, icon: Sparkles },
              { title: "Shared-space repairs", url: `${base}/maintenance`, icon: Wrench },
            ]}
          />
        </NavGroup>
        <NavGroup label="Requests">
          <NavLinks
            items={[
              { title: "Room repairs", url: `${base}/room/maintenance`, icon: Hammer },
              { title: "Complaints", url: `${base}/complaints`, icon: MessageSquareWarning },
            ]}
          />
        </NavGroup>
      </>
    );
  }

  return null;
}

function BrandButton() {
  const params = useParams<{ "admin-id"?: string; house_id?: string }>();
  const adminId = params["admin-id"];
  const houseId = params.house_id;
  const href = adminId
    ? `/admin-dashboard/${adminId}/home`
    : houseId
      ? `/tenant-dashboard/${houseId}/home`
      : "/";
  return (
    <SidebarMenuButton size="lg" render={<Link href={href} />}>
      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <Home className="size-4" />
      </div>
      <div className="flex flex-col gap-0.5 leading-none">
        <span className="font-semibold">Student Housing BV</span>
        {(adminId || houseId) && (
          <span className="text-xs text-sidebar-foreground/70">{adminId ? "Landlord" : "Tenant"}</span>
        )}
      </div>
    </SidebarMenuButton>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const [authError, setAuthError] = React.useState("");
  const [profile, setProfile] = React.useState<{ name: string; email: string } | null>(null);
  const [passwordOpen, setPasswordOpen] = React.useState(false);
  // An account still on its temporary password must change it before using the app.
  const [mustChange, setMustChange] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void getMyProfile().then((result) => {
      if (!cancelled && result.ok) setProfile(result.data);
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
    const supabase = supabaseBrowser();
    if (!supabase) return setAuthError("Supabase Auth is not configured.");
    const { error } = await supabase.auth.signOut();
    if (error) return setAuthError(error.message);
    router.replace("/login");
    router.refresh();
  }

  const initials = profile?.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <React.Suspense fallback={null}>
              <BrandButton />
            </React.Suspense>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <React.Suspense fallback={null}>
          <Navigation />
        </React.Suspense>
      </SidebarContent>

      <SidebarFooter>
        {authError && <p role="alert" className="px-2 text-xs text-red-300">{authError}</p>}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent text-xs font-semibold">
                  {initials || "?"}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{profile?.name ?? "Account"}</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">{profile?.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="min-w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{profile?.email ?? "Account"}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setPasswordOpen(true)}>
                    <KeyRound />
                    Change password
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void signOut()}>
                  <LogOut />
                  Sign out
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
