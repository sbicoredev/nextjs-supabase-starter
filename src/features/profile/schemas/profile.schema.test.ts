import { describe, expect, it } from "vitest";

import { updateProfileSchema } from "~/features/profile/schemas/profile.schema";

describe("updateProfileSchema", () => {
  it("accepts a valid full name and username", () => {
    const result = updateProfileSchema.safeParse({
      fullName: "Ada Lovelace",
      username: "ada_lovelace-1",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty username (optional)", () => {
    const result = updateProfileSchema.safeParse({
      fullName: "Ada Lovelace",
      username: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a full name shorter than 2 characters", () => {
    const result = updateProfileSchema.safeParse({
      fullName: "A",
      username: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a full name longer than 80 characters", () => {
    const result = updateProfileSchema.safeParse({
      fullName: "A".repeat(81),
      username: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a username with disallowed characters", () => {
    const result = updateProfileSchema.safeParse({
      fullName: "Ada Lovelace",
      username: "ada lovelace!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a username longer than 30 characters", () => {
    const result = updateProfileSchema.safeParse({
      fullName: "Ada Lovelace",
      username: "a".repeat(31),
    });
    expect(result.success).toBe(false);
  });

  it("accepts a full name at exactly 2 characters", () => {
    const result = updateProfileSchema.safeParse({
      fullName: "AB",
      username: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a full name at exactly 80 characters", () => {
    const result = updateProfileSchema.safeParse({
      fullName: "A".repeat(80),
      username: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts username with underscores", () => {
    const result = updateProfileSchema.safeParse({
      fullName: "Ada Lovelace",
      username: "user_name",
    });
    expect(result.success).toBe(true);
  });

  it("accepts username with hyphens", () => {
    const result = updateProfileSchema.safeParse({
      fullName: "Ada Lovelace",
      username: "user-name",
    });
    expect(result.success).toBe(true);
  });

  it("rejects username with dots", () => {
    const result = updateProfileSchema.safeParse({
      fullName: "Ada Lovelace",
      username: "user.name",
    });
    expect(result.success).toBe(false);
  });

  it("rejects username with spaces", () => {
    const result = updateProfileSchema.safeParse({
      fullName: "Ada Lovelace",
      username: "user name",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a whitespace-only full name", () => {
    const result = updateProfileSchema.safeParse({
      fullName: "   ",
      username: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts username at exactly 30 characters", () => {
    const result = updateProfileSchema.safeParse({
      fullName: "Ada Lovelace",
      username: "a".repeat(30),
    });
    expect(result.success).toBe(true);
  });
});
