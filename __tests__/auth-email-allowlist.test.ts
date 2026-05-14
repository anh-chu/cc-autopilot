import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isEmailAllowed } from "@/lib/auth-email-allowlist";

describe("isEmailAllowed", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("denies all when ALLOWED_EMAILS is empty and AUTH_ALLOW_ALL_USERS is unset", () => {
		process.env.ALLOWED_EMAILS = "";
		process.env.AUTH_ALLOW_ALL_USERS = "";
		expect(isEmailAllowed("user@example.com")).toBe(false);
	});

	it("allows an email on the allowlist", () => {
		process.env.ALLOWED_EMAILS = "admin@example.com, user@example.com";
		expect(isEmailAllowed("user@example.com")).toBe(true);
	});

	it("denies an email not on the allowlist", () => {
		process.env.ALLOWED_EMAILS = "admin@example.com";
		expect(isEmailAllowed("other@example.com")).toBe(false);
	});

	it("normalizes email case before comparison", () => {
		process.env.ALLOWED_EMAILS = "Admin@Example.COM";
		expect(isEmailAllowed("admin@example.com")).toBe(true);
	});

	it("denies null/undefined email even with open list", () => {
		process.env.ALLOWED_EMAILS = "admin@example.com";
		expect(isEmailAllowed(null)).toBe(false);
		expect(isEmailAllowed(undefined)).toBe(false);
	});

	it("allows all when AUTH_ALLOW_ALL_USERS=true in non-production with empty allowlist", () => {
		process.env.ALLOWED_EMAILS = "";
		process.env.AUTH_ALLOW_ALL_USERS = "true";
		process.env.NODE_ENV = "development";
		expect(isEmailAllowed("anyone@anywhere.com")).toBe(true);
	});

	it("ignores AUTH_ALLOW_ALL_USERS=true in production — denies all with empty allowlist", () => {
		process.env.ALLOWED_EMAILS = "";
		process.env.AUTH_ALLOW_ALL_USERS = "true";
		process.env.NODE_ENV = "production";
		expect(isEmailAllowed("anyone@anywhere.com")).toBe(false);
	});

	it("still uses allowlist when AUTH_ALLOW_ALL_USERS=true but ALLOWED_EMAILS is set", () => {
		process.env.ALLOWED_EMAILS = "vip@example.com";
		process.env.AUTH_ALLOW_ALL_USERS = "true";
		process.env.NODE_ENV = "development";
		expect(isEmailAllowed("vip@example.com")).toBe(true);
		expect(isEmailAllowed("other@example.com")).toBe(false);
	});
});
