import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isEmailAllowed } from "@/lib/auth-email-allowlist";
import { isPublicPath } from "@/lib/auth-paths";

export const { auth, handlers, signIn, signOut } = NextAuth({
	providers: [Google],
	trustHost: true,
	session: {
		strategy: "jwt",
		maxAge: 30 * 24 * 60 * 60, // 30 days
	},
	pages: {
		signIn: "/login",
	},
	callbacks: {
		signIn({ profile }) {
			// Always require Google email verification at sign-in time
			if ((profile as Record<string, unknown>)?.email_verified !== true) {
				return false;
			}
			return isEmailAllowed(profile?.email);
		},
		authorized({ auth: session, request }) {
			const pathname = request.nextUrl.pathname;

			// Public paths (login page, auth routes, health check)
			if (isPublicPath(pathname)) {
				return true;
			}

			// All other routes require a valid session
			return !!session;
		},
	},
});
