import { describe, expect, it } from "vitest";

import {
  forgotPasswordSchema,
  magicLinkSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "~/features/auth/schemas/auth.schema";

describe("signInSchema", () => {
  it("accepts a valid email and non-empty password", () => {
    const result = signInSchema.safeParse({
      email: "user@example.com",
      password: "anything",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = signInSchema.safeParse({
      email: "not-an-email",
      password: "anything",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = signInSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts email with plus addressing", () => {
    const result = signInSchema.safeParse({
      email: "user+tag@example.com",
      password: "anything",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a single-character password", () => {
    const result = signInSchema.safeParse({
      email: "user@example.com",
      password: "a",
    });
    expect(result.success).toBe(true);
  });
});

describe("signUpSchema", () => {
  const validInput = {
    fullName: "Ada Lovelace",
    email: "user@example.com",
    password: "Password1",
    confirmPassword: "Password1",
  };

  it("accepts valid input", () => {
    expect(signUpSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects a password without an uppercase letter", () => {
    const result = signUpSchema.safeParse({
      ...validInput,
      password: "password1",
      confirmPassword: "password1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password without a number", () => {
    const result = signUpSchema.safeParse({
      ...validInput,
      password: "Password",
      confirmPassword: "Password",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = signUpSchema.safeParse({
      ...validInput,
      password: "Pass1",
      confirmPassword: "Pass1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password longer than 30 characters", () => {
    const result = signUpSchema.safeParse({
      ...validInput,
      password: ",G.&G:(,UtB{@7g;0q8eR1Jd!Pvs6K/b", // 32 char
      confirmPassword: ",G.&G:(,UtB{@7g;0q8eR1Jd!Pvs6K/b", // 32 char
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = signUpSchema.safeParse({
      ...validInput,
      confirmPassword: "Password2",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
    }
  });

  it("rejects a full name that's too short", () => {
    const result = signUpSchema.safeParse({ ...validInput, fullName: "A" });
    expect(result.success).toBe(false);
  });

  it("accepts a password at exactly 8 characters", () => {
    const result = signUpSchema.safeParse({
      ...validInput,
      password: "Passw0rd",
      confirmPassword: "Passw0rd",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a password at exactly 30 characters", () => {
    const result = signUpSchema.safeParse({
      ...validInput,
      password: `${"A".repeat(29)}1`,
      confirmPassword: `${"A".repeat(29)}1`,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a password with special characters", () => {
    const result = signUpSchema.safeParse({
      ...validInput,
      password: "P@ssw0rd!",
      confirmPassword: "P@ssw0rd!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a whitespace-only full name", () => {
    const result = signUpSchema.safeParse({
      ...validInput,
      fullName: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty confirmPassword", () => {
    const result = signUpSchema.safeParse({
      ...validInput,
      confirmPassword: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts a valid email", () => {
    expect(
      forgotPasswordSchema.safeParse({ email: "user@example.com" }).success
    ).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(
      false
    );
  });
});

describe("magicLinkSchema", () => {
  it("accepts a valid email", () => {
    expect(
      magicLinkSchema.safeParse({ email: "user@example.com" }).success
    ).toBe(true);
  });

  it("rejects an empty email", () => {
    expect(magicLinkSchema.safeParse({ email: "" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts matching strong passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "Password1",
      confirmPassword: "Password1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "Password1",
      confirmPassword: "Password2",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password without uppercase", () => {
    const result = resetPasswordSchema.safeParse({
      password: "password1",
      confirmPassword: "password1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password without a number", () => {
    const result = resetPasswordSchema.safeParse({
      password: "Password",
      confirmPassword: "Password",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = resetPasswordSchema.safeParse({
      password: "Pass1",
      confirmPassword: "Pass1",
    });
    expect(result.success).toBe(false);
  });
});
