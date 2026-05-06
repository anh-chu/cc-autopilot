"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SkillsRedirectPage() {
	const router = useRouter();

	useEffect(() => {
		router.replace("/crew?tab=skills");
	}, [router]);

	return null;
}
