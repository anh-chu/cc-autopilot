"use client";

import { createContext, type ReactNode, useContext } from "react";
import { DecisionDialog } from "@/components/decision-dialog";
import { useActiveRuns } from "@/hooks/use-active-runs";

type ActiveRunsContextValue = ReturnType<typeof useActiveRuns>;

const ActiveRunsContext = createContext<ActiveRunsContextValue | null>(null);

export function ActiveRunsProvider({ children }: { children: ReactNode }) {
	const activeRuns = useActiveRuns();

	return (
		<ActiveRunsContext.Provider value={activeRuns}>
			{children}
			<DecisionDialog
				open={activeRuns.showDecisionDialog}
				onOpenChange={activeRuns.setShowDecisionDialog}
				decision={activeRuns.pendingDecision}
				onAnswered={activeRuns.handleDecisionAnswered}
			/>
		</ActiveRunsContext.Provider>
	);
}

export function useActiveRunsContext(): ActiveRunsContextValue {
	const ctx = useContext(ActiveRunsContext);
	if (!ctx) {
		throw new Error(
			"useActiveRunsContext must be used within ActiveRunsProvider",
		);
	}
	return ctx;
}
