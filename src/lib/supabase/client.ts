import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnvironment } from "./config";

export function createClient() {
  const { publishableKey, url } = getSupabaseEnvironment();
  return createBrowserClient(url, publishableKey);
}
