"use client";

import { useEffect } from "react";

/**
 * Catches errors thrown by the root layout itself (`src/app/layout.tsx`),
 * which `error.tsx` cannot catch since it renders inside that layout.
 * Next.js requires this to render its own `<html>`/`<body>` — it replaces
 * the whole page, so it's kept deliberately dependency-free (no shared UI
 * components, no Tailwind theme) in case the layout failure is what broke
 * those in the first place.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          fontFamily: "system-ui, sans-serif",
          gap: "1rem",
          justifyContent: "center",
          minHeight: "100svh",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
          Something went wrong
        </h1>
        <p style={{ color: "#666" }}>
          A critical error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            border: "1px solid #ccc",
            borderRadius: "0.375rem",
            cursor: "pointer",
            padding: "0.5rem 1rem",
          }}
          type="button"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
