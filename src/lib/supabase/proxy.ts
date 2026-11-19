import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnvironment, hasSupabaseEnvironment } from "./config";

export async function updateSession(request: NextRequest) {
  if (!hasSupabaseEnvironment()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { publishableKey, url } = getSupabaseEnvironment();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([name, value]) => {
          response.headers.set(name, value);
        });
      },
    },
  });

  // getClaims verifies the signed token. Never authorize server data from an
  // unverified session value read directly from a cookie.
  await supabase.auth.getClaims();

  return response;
}
