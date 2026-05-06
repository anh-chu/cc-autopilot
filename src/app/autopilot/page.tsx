"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AutopilotRedirectPage() {
	const router = useRouter();

	useEffect(() => {
		router.replace("/crew?tab=autopilot");
	}, [router]);

	return null;
}
