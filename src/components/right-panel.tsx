"use client";

import dynamic from "next/dynamic";
import type { ActivePanel } from "@/components/activity-rail";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const TerminalDrawer = dynamic(
	() => import("@/components/terminal-drawer").then((m) => m.TerminalDrawer),
	{ ssr: false },
);

interface RightPanelProps {
	activePanel: ActivePanel;
	isMobile: boolean;
	onClose: () => void;
}

function PanelContent({ activePanel }: { activePanel: ActivePanel }) {
	return (
		<>
			{activePanel === "chat" && <ChatSidebar />}
			{activePanel === "terminal" && <TerminalDrawer enabled />}
		</>
	);
}

export function RightPanel({
	activePanel,
	isMobile,
	onClose,
}: RightPanelProps) {
	if (isMobile) {
		return (
			<Sheet open={!!activePanel} onOpenChange={(open) => !open && onClose()}>
				<SheetContent
					side="right"
					className="w-full sm:w-full p-0 flex flex-col"
					onOpenAutoFocus={(e) => e.preventDefault()}
				>
					<SheetTitle className="sr-only">
						{activePanel === "chat" ? "Chat" : "Terminal"}
					</SheetTitle>
					<PanelContent activePanel={activePanel} />
				</SheetContent>
			</Sheet>
		);
	}

	if (!activePanel) return null;

	return (
		<div className="w-[480px] shrink-0 border-l flex flex-col overflow-hidden bg-card text-foreground">
			<PanelContent activePanel={activePanel} />
		</div>
	);
}
