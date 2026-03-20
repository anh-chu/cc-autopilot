/**
 * LinkedIn Adapter
 *
 * Health-check-only adapter for verifying LinkedIn OAuth 2.0 credentials.
 * Uses the /v2/userinfo endpoint (OpenID Connect, read-only).
 *
 * Credential format in vault (JSON string):
 * {
 *   "accessToken": "..."          // OAuth 2.0 bearer token
 * }
 *
 * Supported operations: (none yet - health check only)
 */

import type {
  ServiceAdapter,
  AdapterContext,
  AdapterResult,
  PayloadValidation,
  HealthCheckResult,
} from "./types";
import type { FieldOpsService } from "@/lib/types";
import { registerAdapter } from "./registry";

// ─── Credential Parsing ─────────────────────────────────────────────────────

interface LinkedInCredentials {
  accessToken: string;
}

function parseCredentials(creds: Record<string, unknown>): LinkedInCredentials | null {
  const { accessToken } = creds;
  if (typeof accessToken === "string" && accessToken.length > 0) {
    return { accessToken };
  }
  return null;
}

// ─── LinkedIn Adapter ───────────────────────────────────────────────────────

const linkedinAdapter: ServiceAdapter = {
  serviceId: "linkedin",
  name: "LinkedIn",
  supportedOperations: [], // Health check only for now

  validatePayload(_payload: Record<string, unknown>): PayloadValidation {
    return { valid: false, errors: ["LinkedIn adapter does not support task execution yet."] };
  },

  async execute(_ctx: AdapterContext): Promise<AdapterResult> {
    return {
      success: false,
      data: {},
      error: "LinkedIn adapter does not support task execution yet. Only health checks are available.",
    };
  },

  async healthCheck(
    _service: FieldOpsService,
    credentials: Record<string, unknown>,
  ): Promise<HealthCheckResult> {
    const start = Date.now();
    const creds = parseCredentials(credentials);

    if (!creds) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        message: "Invalid credentials. Expected: { accessToken }",
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("https://api.linkedin.com/v2/userinfo", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${creds.accessToken}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const latencyMs = Date.now() - start;

      if (!response.ok) {
        return {
          ok: false,
          latencyMs,
          message: response.status === 401
            ? "Access token expired or invalid. Re-authenticate with LinkedIn."
            : `LinkedIn API error: ${response.status}`,
          apiResponseCode: response.status,
        };
      }

      const data = (await response.json()) as Record<string, unknown>;

      return {
        ok: true,
        latencyMs,
        message: `Connected as ${data.name ?? data.email ?? "LinkedIn user"}`,
        details: {
          name: data.name,
          email: data.email,
          sub: data.sub,
        },
        apiResponseCode: response.status,
      };
    } catch (err) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        message: err instanceof Error
          ? (err.name === "AbortError" ? "Request timed out (5s)" : err.message)
          : "Network error connecting to LinkedIn API",
      };
    }
  },
};

// ─── Self-register ──────────────────────────────────────────────────────────

registerAdapter(linkedinAdapter);

export { linkedinAdapter };
