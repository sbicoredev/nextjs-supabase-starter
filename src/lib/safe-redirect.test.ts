import { describe, expect, it } from "vitest";

import { getSafeRedirectPath } from "~/lib/safe-redirect";

describe("getSafeRedirectPath", () => {
  it("returns the fallback when candidate is missing", () => {
    expect(getSafeRedirectPath(undefined, "/dashboard")).toBe("/dashboard");
    expect(getSafeRedirectPath(null, "/dashboard")).toBe("/dashboard");
    expect(getSafeRedirectPath("", "/dashboard")).toBe("/dashboard");
  });

  it("allows a plain relative path", () => {
    expect(getSafeRedirectPath("/settings", "/dashboard")).toBe("/settings");
    expect(getSafeRedirectPath("/projects/123", "/dashboard")).toBe(
      "/projects/123"
    );
  });

  it("allows a relative path with a query string", () => {
    expect(getSafeRedirectPath("/settings?tab=billing", "/dashboard")).toBe(
      "/settings?tab=billing"
    );
  });

  it("rejects absolute URLs", () => {
    expect(getSafeRedirectPath("https://evil.example.com", "/dashboard")).toBe(
      "/dashboard"
    );
    expect(getSafeRedirectPath("http://evil.example.com", "/dashboard")).toBe(
      "/dashboard"
    );
  });

  it("rejects protocol-relative URLs", () => {
    expect(getSafeRedirectPath("//evil.example.com", "/dashboard")).toBe(
      "/dashboard"
    );
  });

  it("rejects a bare hostname without a leading slash", () => {
    expect(getSafeRedirectPath("evil.example.com", "/dashboard")).toBe(
      "/dashboard"
    );
  });

  it("rejects other URL schemes", () => {
    expect(getSafeRedirectPath("javascript:alert(1)", "/dashboard")).toBe(
      "/dashboard"
    );
  });

  it("rejects percent-encoded protocol-relative payloads", () => {
    expect(getSafeRedirectPath("/%2F%2Fevil.example.com", "/dashboard")).toBe(
      "/dashboard"
    );
  });

  it("rejects backslash payloads some browsers treat as protocol-relative", () => {
    expect(getSafeRedirectPath("/\\evil.example.com", "/dashboard")).toBe(
      "/dashboard"
    );
  });

  it("rejects a candidate with leading/trailing whitespace", () => {
    expect(getSafeRedirectPath(" /dashboard", "/fallback")).toBe("/fallback");
    expect(getSafeRedirectPath("/dashboard ", "/fallback")).toBe("/fallback");
  });
});
