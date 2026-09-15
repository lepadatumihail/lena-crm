import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/supabase/types";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { isProtectedPath } from "@/lib/routes";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not run code between createServerClient and getClaims().
  // A simple mistake could make it very hard to debug issues with users
  // being randomly logged out.
  // getClaims() refreshes an expired session and verifies the token's
  // signature locally, so it costs no Supabase Auth round-trip. The price: a
  // session ended on another device still passes until its token expires
  // (an hour by default).
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const { pathname } = request.nextUrl;
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/auth");

  // Only the app itself needs a session. The marketing page, sign-in, invite
  // landings, the ICS feed, Stripe's webhook, robots/sitemap/llms.txt and any
  // URL that doesn't exist all pass through, so crawlers and dead links get a
  // real 404 instead of a bounce to /login. The protected pages check the
  // session again themselves; this layer's job is to preserve `next`.
  if (!claims && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (claims && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: return the supabaseResponse object as-is to keep cookies in sync.
  return supabaseResponse;
}
