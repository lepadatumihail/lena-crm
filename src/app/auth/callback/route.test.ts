// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const USER_ID = "11111111-1111-4111-8111-111111111111";

type Profile = { id: string; locale: string; created_at: string; signup_source: unknown };

const state = vi.hoisted(() => ({
  profile: null as unknown as Profile,
  cookies: new Map<string, string>(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    set: (name: string, value: string) => state.cookies.set(name, value),
  }),
}));

vi.mock("@/lib/site-events-server", () => ({ recordSiteEvent: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      exchangeCodeForSession: async () => ({ data: { user: { id: USER_ID } }, error: null }),
    },
    from: () => {
      const query = {
        select: () => query,
        eq: () => query,
        maybeSingle: async () => ({ data: { locale: state.profile.locale }, error: null }),
      };
      return query;
    },
  }),
}));

// An update lands on the one profile only when every filter matches it, as it
// would in the database.
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      update: (patch: Partial<Profile>) => {
        const matches: ((p: Profile) => boolean)[] = [];
        const chain = {
          eq: (column: keyof Profile, value: unknown) => {
            matches.push((p) => p[column] === value);
            return chain;
          },
          is: (column: keyof Profile, value: unknown) => {
            matches.push((p) => p[column] === value);
            return chain;
          },
          gte: (column: keyof Profile, value: string) => {
            matches.push((p) => String(p[column]) >= value);
            return chain;
          },
          then: (resolve: (value: { error: null }) => void) => {
            if (matches.every((m) => m(state.profile))) Object.assign(state.profile, patch);
            resolve({ error: null });
          },
        };
        return chain;
      },
    }),
  }),
}));

function profile(locale: string, ageMinutes: number): Profile {
  return {
    id: USER_ID,
    locale,
    created_at: new Date(Date.now() - ageMinutes * 60 * 1000).toISOString(),
    signup_source: null,
  };
}

function callback(params: Record<string, string>) {
  const url = new URL("https://www.leadwing.app/auth/callback");
  url.searchParams.set("code", "abc");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return GET(new Request(url));
}

beforeEach(() => {
  state.cookies.clear();
});

describe("auth callback language", () => {
  it("gives a new Google account the language of the page it signed up on", async () => {
    state.profile = profile("en", 0);
    const response = await callback({ next: "/home", locale: "es" });

    expect(state.profile.locale).toBe("es");
    expect(state.cookies.get("NEXT_LOCALE")).toBe("es");
    expect(response.headers.get("location")).toMatch(/\/home$/);
  });

  it("keeps an existing agent's language when they sign in from another page", async () => {
    state.profile = profile("en", 60 * 24 * 30);
    await callback({ locale: "ru" });

    expect(state.profile.locale).toBe("en");
    expect(state.cookies.get("NEXT_LOCALE")).toBe("en");
  });

  it("keeps a language a new account already has", async () => {
    // Signed up minutes ago by email code from /es, now Google from an English page.
    state.profile = profile("es", 3);
    await callback({ locale: "en" });

    expect(state.profile.locale).toBe("es");
    expect(state.cookies.get("NEXT_LOCALE")).toBe("es");
  });

  it("ignores a language the app doesn't have", async () => {
    state.profile = profile("en", 0);
    await callback({ locale: "de" });

    expect(state.profile.locale).toBe("en");
    expect(state.cookies.get("NEXT_LOCALE")).toBe("en");
  });
});
