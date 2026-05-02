import type { NextConfig } from "next";

// Permanent redirects for renamed routes
const nextConfig: NextConfig = {
	output: "standalone",
	redirects: async () => [
		{ source: "/daemon", destination: "/autopilot", permanent: true },
		// /goals and /objectives both redirect to /initiatives since objectives was renamed
		{ source: "/goals", destination: "/initiatives", permanent: true },
		{ source: "/objectives", destination: "/initiatives", permanent: true },
	],
	allowedDevOrigins: ["localhost", "devvm", "127.0.0.1"],
	devIndicators: false,
	// The Claude Agent SDK uses runtime path resolution and child processes.
	// Bundling it via webpack/turbopack breaks model and slash-command discovery,
	// so keep it as an external dependency at runtime.
	serverExternalPackages: ["@anthropic-ai/claude-agent-sdk"],
	experimental: {
		optimizePackageImports: ["lucide-react"],
	},
};

export default nextConfig;
