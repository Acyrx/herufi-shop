"use client";

import { ShopProvider } from "@/lib/context/shop";
import { Toaster } from "sonner";
import { Header } from "./header";
import { PermissionGuard } from "./permission-guard";
import { MobileNav, Sidebar } from "./sidebar";

interface DashboardShellProps {
  children: React.ReactNode;
  user: { full_name: string; avatar_url?: string };
  notificationCount: number;
}

export function DashboardShell({ children, user, notificationCount }: DashboardShellProps) {
  return (
    <ShopProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header user={user} notificationCount={notificationCount} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
            <PermissionGuard>
              {children}
            </PermissionGuard>
          </main>
          <MobileNav />
        </div>
      </div>
      <Toaster richColors position="top-right" />
    </ShopProvider>
  );
}
