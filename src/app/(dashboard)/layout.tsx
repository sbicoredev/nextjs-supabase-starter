import Link from "next/link";
import type { ReactNode } from "react";

import { siteConfig } from "~/configs/site-config";
import { UserMenu } from "~/features/auth/components/user-menu";

const NAV_LINKS = [{ href: "/dashboard", label: "Dashboard" }] as const;

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:px-6">
          <nav className="flex items-center gap-6">
            <Link className="font-semibold" href="/dashboard">
              {siteConfig.name}
            </Link>
            <div className="hidden items-center gap-4 sm:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
          <UserMenu />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-6">
        {children}
      </main>
    </div>
  );
}
