import { describe, expect, it } from "vitest";

import { formatDate, getInitials } from "~/lib/utils";

describe("formatDate", () => {
  it("formats an ISO date string", () => {
    expect(formatDate("2025-03-15")).toBe("March 15, 2025");
  });

  it("formats a Date object", () => {
    expect(formatDate(new Date("2025-01-01T00:00:00Z"))).toBe(
      "January 1, 2025"
    );
  });

  it("formats a timestamp number", () => {
    expect(formatDate(0)).toBe("January 1, 1970");
  });

  it("formats end of year", () => {
    expect(formatDate("2025-12-31")).toBe("December 31, 2025");
  });

  it("formats a leap year date", () => {
    expect(formatDate("2024-02-29")).toBe("February 29, 2024");
  });

  it("formats a single-digit day", () => {
    expect(formatDate("2025-07-05")).toBe("July 5, 2025");
  });
});

describe("getInitials", () => {
  it("returns first + last initial for a full name", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("returns single initial for a one-word name", () => {
    expect(getInitials("John")).toBe("J");
  });

  it("uses first and last name from three+ words", () => {
    expect(getInitials("John Michael Doe")).toBe("JD");
  });

  it("trims leading and trailing whitespace", () => {
    expect(getInitials("  John Doe  ")).toBe("JD");
  });

  it("handles multiple spaces between words", () => {
    expect(getInitials("John   Doe")).toBe("JD");
  });

  it("returns '?' for null", () => {
    expect(getInitials(null)).toBe("?");
  });

  it("returns '?' for undefined", () => {
    expect(getInitials(undefined)).toBe("?");
  });

  it("returns '?' for empty string", () => {
    expect(getInitials("")).toBe("?");
  });

  it("returns '?' for whitespace-only string", () => {
    expect(getInitials("   ")).toBe("?");
  });

  it("returns uppercase initials", () => {
    expect(getInitials("john doe")).toBe("JD");
  });

  it("handles single character name", () => {
    expect(getInitials("A")).toBe("A");
  });

  it("handles numeric characters", () => {
    expect(getInitials("123")).toBe("1");
  });
});
