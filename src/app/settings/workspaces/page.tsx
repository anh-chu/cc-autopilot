"use client";

import { Check, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "@/hooks/use-workspace";
import { cn } from "@/lib/utils";

const COLOR_SWATCHES = [
	{ label: "Orange", value: "#fa520f" },
	{ label: "Amber", value: "#ffa110" },
	{ label: "Gold", value: "#ffd900" },
	{ label: "Flame", value: "#fb6424" },
	{ label: "Sunshine", value: "#ffb83e" },
	{ label: "Black", value: "#1f1f1f" },
];

export default function WorkspacesPage() {
	const { workspaces, currentId, createWorkspace } = useWorkspace();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [newName, setNewName] = useState("");
	const [newColor, setNewColor] = useState(COLOR_SWATCHES[0].value);
	const [creating, setCreating] = useState(false);

	async function handleCreate() {
		if (!newName.trim()) return;
		setCreating(true);
		try {
			await createWorkspace(newName.trim(), newColor);
			setDialogOpen(false);
			setNewName("");
			setNewColor(COLOR_SWATCHES[0].value);
		} catch {
			// error handled inside hook
		} finally {
			setCreating(false);
		}
	}

	return (
		<div className="flex flex-col min-h-screen">
			<BreadcrumbNav
				items={[
					{ label: "Settings", href: "/settings" },
					{ label: "Workspaces" },
				]}
			/>

			<div className="flex-1 p-6 space-y-6 max-w-2xl">
				<div className="flex items-center justify-between">
					<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Workspaces
					</h2>
					<Button
						size="sm"
						className="gap-1.5"
						onClick={() => setDialogOpen(true)}
					>
						<Plus className="h-3.5 w-3.5" />
						New Workspace
					</Button>
				</div>

				<div className="space-y-3">
					{workspaces.map((ws) => (
						<Link
							key={ws.id}
							href={`/settings/workspaces/${ws.id}`}
							className="block"
						>
							<Card className="hover:bg-accent/40 transition-colors cursor-pointer">
								<CardContent className="flex items-center gap-3 p-4">
									<div
										className="h-4 w-4 rounded-full shrink-0 ring-1 ring-border"
										style={{ backgroundColor: ws.color }}
									/>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium truncate">{ws.name}</p>
										{ws.description && (
											<p className="text-xs text-muted-foreground truncate">
												{ws.description}
											</p>
										)}
									</div>
									{ws.id === currentId && (
										<Badge variant="secondary" className="gap-1 shrink-0">
											<Check className="h-3 w-3" />
											Active
										</Badge>
									)}
								</CardContent>
							</Card>
						</Link>
					))}
					{workspaces.length === 0 && (
						<p className="text-sm text-muted-foreground">
							No workspaces found.
						</p>
					)}
				</div>
			</div>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>New Workspace</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<div className="space-y-1.5">
							<Label htmlFor="ws-name">Name</Label>
							<Input
								id="ws-name"
								placeholder="e.g. Acme Corp"
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") void handleCreate();
								}}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Color</Label>
							<div className="flex gap-2 flex-wrap">
								{COLOR_SWATCHES.map((swatch) => (
									<button
										key={swatch.value}
										type="button"
										title={swatch.label}
										onClick={() => setNewColor(swatch.value)}
										className={cn(
											"h-6 w-6 rounded-full transition-all",
											newColor === swatch.value
												? "ring-2 ring-ring"
												: "hover:scale-110",
										)}
										style={{ backgroundColor: swatch.value }}
									/>
								))}
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDialogOpen(false)}>
							Cancel
						</Button>
						<Button
							onClick={() => void handleCreate()}
							disabled={!newName.trim() || creating}
						>
							{creating ? "Creating..." : "Create"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
