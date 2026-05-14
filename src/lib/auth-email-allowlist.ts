/**
 * Email allowlist check — extracted from auth.ts signIn callback
 * so it can be called from non-Next contexts (e.g., WebSocket upgrade handler).
 *
 * NOTE: This intentionally omits the `email_verified` check because by the time
 * a JWT cookie exists the sign-in callback already validated it. We only
 * re-check allowlist membership (in case ALLOWED_EMAILS was narrowed after
 * the JWT was issued).
 */
export function isEmailAllowed(email: string | null | undefined): boolean {
	const allowAll =
		process.env.AUTH_ALLOW_ALL_USERS === "true" &&
		process.env.NODE_ENV !== "production";

	const allowed = process.env.ALLOWED_EMAILS?.split(",")
		.map((e) => e.trim().toLowerCase())
		.filter(Boolean);

	// Fail closed: missing/empty ALLOWED_EMAILS denies all unless dev-only flag set
	if (!allowed?.length && !allowAll) return false;

	// Open access gate (dev only, no allowlist configured)
	if (!allowed?.length && allowAll) return true;

	const normalized = email?.toLowerCase();
	return normalized ? (allowed?.includes(normalized) ?? false) : false;
}
