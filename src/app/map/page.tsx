"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MapRedirectPage() {
	const router = useRouter();

	useEffect(() => {
		router.replace("/priority-matrix?view=map");
	}, [router]);

	return null;
}
