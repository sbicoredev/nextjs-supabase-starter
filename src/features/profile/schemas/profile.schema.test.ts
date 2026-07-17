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
});
