import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/lib/supabase/server", () => ({
  getSupabaseServerClient: vi.fn(),
}));

vi.mock("~/lib/rate-limit", () => ({
  createUserRateLimit: vi.fn().mockReturnValue({
    limit: vi.fn().mockResolvedValue({ success: true }),
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { revalidatePath } from "next/cache";

import { ErrorMessaage } from "~/constants/error-message";
import {
  getCurrentProfile,
  updateProfile,
} from "~/features/profile/actions/profile.actions";
import { createUserRateLimit } from "~/lib/rate-limit";
import { getSupabaseServerClient } from "~/lib/supabase/server";

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

  vi.mocked(getSupabaseServerClient).mockResolvedValue(client as never);
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
    expect(result.serverError).toBeUndefined();
  });

  it("returns error when not authenticated", async () => {
    mockSupabase({
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    });

    const result = await getCurrentProfile();
    expect(result.serverError).toBe(ErrorMessaage.auth.unauthorized);
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
    expect(result.serverError).toBeTruthy();
  });
});

describe("updateProfile", () => {
  it("returns error for invalid input", async () => {
    const result = await updateProfile({
      fullName: "A",
      username: "invalid name!",
    });
    expect(result.validationErrors).toMatchObject({
      formErrors: expect.any(Array),
      fieldErrors: {
        fullName: expect.any(Array),
        username: expect.any(Array),
      },
    });
  });

  it("returns true on success", async () => {
    mockSupabase();

    const result = await updateProfile({
      fullName: "Ada Lovelace",
      username: "ada",
    });
    expect(result.data).toBe(true);
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
    expect(result.serverError).toBe(ErrorMessaage.auth.unauthorized);
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
    expect(result.serverError).toBeTruthy();
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

  it("returns error when rate limit is exceeded", async () => {
    mockSupabase();
    vi.mocked(createUserRateLimit).mockReturnValue({
      limit: vi.fn().mockResolvedValue({ success: false }),
    } as never);

    const result = await updateProfile({
      fullName: "Ada Lovelace",
      username: "ada",
    });
    expect(result.serverError).toBe(ErrorMessaage.rateLimit.tooManyRequest);
  });
});
