/**
 * Which top-level paths need a signed-in agent.
 *
 * The proxy (src/proxy.ts → updateSession) sends anonymous visitors on these
 * prefixes to /login, keeping where they were going in `next`. Everything
 * else, including URLs that don't exist, passes through so it can 404 like a
 * normal site. The pages behind sign-in verify the session again themselves,
 * so a prefix missing here costs the `next` hand-off, not access control;
 * routes.test.ts keeps the list in step with the filesystem. robots.txt
 * disallows the same prefixes.
 */
export const PROTECTED_PREFIXES = [
  "/admin",
  "/billing",
  "/calculator",
  "/calendar",
  "/clients",
  "/home",
  "/pricing",
  "/referrals",
  "/templates",
] as const;

/** The prefix itself or anything under it; never a look-alike such as "/clientsx". */
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
