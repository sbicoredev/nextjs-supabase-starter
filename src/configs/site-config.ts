import { env } from "~/env";

export const siteConfig = {
  author: {
    name: "Your Name",
    url: "https://your-domain.com",
  },
  name: "Starter Kit",
  description:
    "A production-ready Next.js + Supabase starter with auth, TanStack Query, TanStack Form, Zod, and Zustand.",
  links: {
    github: "https://github.com/your-org/your-repo",
  },
  ogImage: "/og.png",
  url: env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;
