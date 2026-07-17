import Link from "next/link";
import type { ReactNode } from "react";

import { siteConfig } from "~/configs/site-config";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          className="flex items-center gap-2 self-center font-medium"
          href="/"
        >
          {siteConfig.name}
        </Link>
        {children}
      </div>
    </div>
  );
}
