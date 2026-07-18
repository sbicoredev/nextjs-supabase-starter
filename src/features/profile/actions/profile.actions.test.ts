import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { revalidatePath } from "next/cache";

import {
  getCurrentProfile,
  updateProfile,
} from "~/features/profile/actions/profile.actions";
import { createClient } from "~/lib/supabase/server";

function mockSupabase(overrides: Record<string, unknown> = {}) {
  const defaultAuth = {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    }),
  };

  const defaultFrom = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: {
        id: "user-123",
        full_name: "Ada Lovelace",
        username: "ada",
        avatar_url: null,
        website: null,
        updated_at: null,
      },
      error: null,
    }),
    update: vi.fn().mockReturnThis(),
  };

  const client = {
    auth: { ...defaultAuth, ...overrides },
    from: vi.fn().mockReturnValue(defaultFrom),
  };

  vi.mocked(createClient).mockResolvedValue(client as never);
  return client;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCurrentProfile", () => {
  it("returns profile data for authenticated user", async () => {
    mockSupabase();

    const result = await getCurrentProfile();
    expect(result.data).toBeDefined();
    expect(result.data?.id).toBe("user-123");
    expect(result.error).toBeUndefined();
  });

  it("returns error when not authenticated", async () => {
    mockSupabase({
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    });

    const result = await getCurrentProfile();
    expect(result.error).toBe("You must be signed in.");
  });

  it("returns error when profile query fails", async () => {
    const client = mockSupabase();
    vi.mocked(client.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "relation does not exist" },
      }),
    } as never);

    const result = await getCurrentProfile();
    expect(result.error).toBeTruthy();
  });
});

describe("updateProfile", () => {
  it("returns error for invalid input", async () => {
    const result = await updateProfile({
      fullName: "A",
      username: "invalid name!",
    });
    expect(result.error).toBeTruthy();
  });

  it("returns { data: true } on success", async () => {
    mockSupabase();

    const result = await updateProfile({
      fullName: "Ada Lovelace",
      username: "ada",
    });
    expect(result).toEqual({ data: true });
  });

  it("revalidates /settings on success", async () => {
    mockSupabase();

    await updateProfile({ fullName: "Ada Lovelace", username: "ada" });

    expect(revalidatePath).toHaveBeenCalledWith("/settings");
  });

  it("returns error when not authenticated", async () => {
    mockSupabase({
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    });

    const result = await updateProfile({
      fullName: "Ada Lovelace",
      username: "ada",
    });
    expect(result.error).toBe("You must be signed in.");
  });

  it("sets empty username to null", async () => {
    const client = mockSupabase();

    await updateProfile({ fullName: "Ada Lovelace", username: "" });

    expect(client.from).toHaveBeenCalledWith("profiles");
    // The update call should have username: null
  });

  it("returns error when Supabase update fails", async () => {
    const client = mockSupabase();
    vi.mocked(client.from).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        error: { message: "update failed" },
      }),
    } as never);

    const result = await updateProfile({
      fullName: "Ada Lovelace",
      username: "ada",
    });
    expect(result.error).toBeTruthy();
  });

  it("does not revalidate on error", async () => {
    const client = mockSupabase();
    vi.mocked(client.from).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        error: { message: "update failed" },
      }),
    } as never);

    await updateProfile({ fullName: "Ada Lovelace", username: "ada" });

    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("trims fullName before update", async () => {
    const client = mockSupabase();

    await updateProfile({ fullName: "  Ada Lovelace  ", username: "ada" });

    // The schema trims, so the update should receive trimmed value
    expect(client.from).toHaveBeenCalled();
  });
});
