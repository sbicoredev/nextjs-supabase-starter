import { describe, expect, it, vi } from "vitest";

vi.mock("~/env", () => ({
  env: {
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NEXT_PUBLIC_APP_NAME: "Starter Kit",
  },
}));

import { constructMetadata } from "~/lib/construct-metadata";

describe("constructMetadata", () => {
  it("uses siteConfig name as title when no title given", () => {
    const metadata = constructMetadata();
    expect(metadata.title).toBe("Starter Kit");
  });

  it("appends siteConfig name to custom title", () => {
    const metadata = constructMetadata({ title: "Dashboard" });
    expect(metadata.title).toBe("Dashboard | Starter Kit");
  });

  it("uses siteConfig description as default", () => {
    const metadata = constructMetadata();
    expect(metadata.description).toContain("production-ready");
  });

  it("allows custom description", () => {
    const metadata = constructMetadata({ description: "Custom desc" });
    expect(metadata.description).toBe("Custom desc");
  });

  it("uses siteConfig ogImage as default image", () => {
    const metadata = constructMetadata();
    expect(metadata.openGraph?.images).toEqual([{ url: "/og.png" }]);
  });

  it("allows custom image", () => {
    const metadata = constructMetadata({ image: "/custom.png" });
    expect(metadata.openGraph?.images).toEqual([{ url: "/custom.png" }]);
  });

  it("sets robots to follow + index by default", () => {
    const metadata = constructMetadata();
    expect(metadata.robots).toEqual({ follow: true, index: true });
  });

  it("sets robots to nofollow + noindex when noIndex is true", () => {
    const metadata = constructMetadata({ noIndex: true });
    expect(metadata.robots).toEqual({ follow: false, index: false });
  });

  it("uses path for canonical URL", () => {
    const metadata = constructMetadata({ path: "/dashboard" });
    expect(metadata.alternates?.canonical).toContain("/dashboard");
  });

  it("defaults canonical to root", () => {
    const metadata = constructMetadata();
    expect(metadata.alternates?.canonical).toBeDefined();
  });

  it("sets openGraph type to website", () => {
    const metadata = constructMetadata();
    expect(metadata.openGraph?.type).toBe("website");
  });

  it("sets twitter card to summary_large_image", () => {
    const metadata = constructMetadata();
    expect(metadata.twitter?.card).toBe("summary_large_image");
  });

  it("includes metadataBase", () => {
    const metadata = constructMetadata();
    expect(metadata.metadataBase).toBeInstanceOf(URL);
  });

  it("includes siteName in openGraph", () => {
    const metadata = constructMetadata();
    expect(metadata.openGraph?.siteName).toBe("Starter Kit");
  });
});
