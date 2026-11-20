import Link from "next/link";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar";

export default function Home() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />

        {/* Main content */}
        <main className="min-w-0 flex-1 p-8">

          {/* Header */}
          <header className="mb-8 text-center">
            <img
              src="/images/lightlogo.png"
              alt="Student Housing logo"
              width="400"
              height="300"
              className="mx-auto"
            />

            <p className="text-3xl font-medium text-gray-700">
              Student Housing Management Platform
            </p>
          </header>

          {/* Homepage cards */}
          <div className="flex flex-wrap justify-center gap-4">

            {/* Repairs box */}
            <Link
              href="/admin-dashboard/1/maintenance"
              className="group relative block h-60 w-60 overflow-hidden rounded-lg border-3 border-blue-900 bg-blue-400"
            >
              <img
                src="/images/repairs.png"
                alt="Repairs and maintenance"
                className="absolute inset-0 top-25 mx-auto h-25 w-25 object-contain opacity-75 transition-opacity group-hover:opacity-50"
              />

              <div className="relative p-4">
                <p className="text-sm font-medium tracking-widest text-blue-800 uppercase">
                  Repairs
                </p>

                <p className="text-xl text-white">
                  Maintenance and Repairs
                </p>

                <p className="mt-4 translate-y-8 text-sm text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                  Fill in the form to report any maintenance requests or repairs which need to be addressed, and our team will promptly respond.
                </p>
              </div>
            </Link>

            {/* Cleaning box */}
            <Link
              href="/admin-dashboard/1/cleaning-schedule"
              className="group relative block h-60 w-60 overflow-hidden rounded-lg border-3 border-blue-900 bg-blue-400"
            >
              <img
                src="/images/cleaning.png"
                alt="Cleaning schedule"
                className="absolute inset-0 top-25 mx-auto h-30 w-30 object-contain opacity-75 transition-opacity group-hover:opacity-50"
              />

              <div className="relative p-4">
                <p className="text-sm font-medium tracking-widest text-blue-800 uppercase">
                  Cleaning
                </p>

                <p className="text-xl text-white">
                  Cleaning Schedule
                </p>

                <p className="mt-4 translate-y-8 text-sm text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                  Schedule which flatmates are responsible for cleaning common areas and when.
                </p>
              </div>
            </Link>

            {/* Announcements box */}
            <Link
              href="/admin-dashboard/1/announcements"
              className="group relative block h-60 w-60 overflow-hidden rounded-lg border-3 border-blue-900 bg-blue-400"
            >
              <img
                src="/images/announcements.png"
                alt="Announcements and events"
                className="absolute inset-0 top-25 mx-auto h-30 w-30 object-contain opacity-75 transition-opacity group-hover:opacity-50"
              />

              <div className="relative p-4">
                <p className="text-sm font-medium tracking-widest text-blue-800 uppercase">
                  Information
                </p>

                <p className="text-xl text-white">
                  Announcements and Events
                </p>

                <p className="mt-4 translate-y-8 text-sm text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                  View upcoming inspections, events, and important
                  announcements related to your housing.
                </p>
              </div>
            </Link>

            {/* Shared Inventory box */}
            <Link
              href="/admin-dashboard/1/shared-inventory"
              className="group relative block h-60 w-60 overflow-hidden rounded-lg border-3 border-blue-900 bg-blue-400"
            >
              <img
                src="/images/inventory.png"
                alt="Shared inventory"
                className="absolute inset-0 top-25 mx-auto h-25 w-25 object-contain opacity-75 transition-opacity group-hover:opacity-50"
              />

              <div className="relative p-4">
                <p className="text-sm font-medium tracking-widest text-blue-800 uppercase">
                  Item management
                </p>

                <p className="text-xl text-white">
                  Shared Inventory
                </p>

                <p className="mt-4 translate-y-8 text-sm text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                  View stock levels of shared items and add items to the
                  shopping list if supplies are running low.
                </p>
              </div>
            </Link>

            {/* Shopping List box */}
            <Link
              href="/admin-dashboard/1/shopping-list"
              className="group relative block h-60 w-60 overflow-hidden rounded-lg border-3 border-blue-900 bg-blue-400"
            >
              <img
                src="/images/shopping.png"
                alt="Shopping list"
                className="absolute inset-0 top-25 mx-auto h-30 w-30 object-contain opacity-75 transition-opacity group-hover:opacity-50"
              />

              <div className="relative p-4">
                <p className="text-sm font-medium tracking-widest text-blue-800 uppercase">
                  Refurbishing supplies
                </p>

                <p className="text-xl text-white">
                  Shopping List
                </p>

                <p className="mt-4 translate-y-8 text-sm text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                  View items that need replenishing and add new items
                  to the shared shopping list.
                </p>
              </div>
            </Link>

            {/* Complaints box */}
            <Link
              href="/admin-dashboard/1/complaints"
              className="group relative block h-60 w-60 overflow-hidden rounded-lg border-3 border-blue-900 bg-blue-400"
            >
              <img
                src="/images/complaints.svg"
                alt="Complaints"
                className="absolute inset-0 top-25 mx-auto h-25 w-25 object-contain opacity-75 transition-opacity group-hover:opacity-50"
              />

              <div className="relative p-4">
                <p className="text-sm font-medium tracking-widest text-blue-800 uppercase">
                  Issues
                </p>

                <p className="text-xl text-white">
                  Complaints
                </p>

                <p className="mt-4 translate-y-8 text-sm text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                  Report any issues with your flatmates or property.
                </p>
              </div>
            </Link>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
