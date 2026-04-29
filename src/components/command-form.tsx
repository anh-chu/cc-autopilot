"use client";

import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCommands } from "@/hooks/use-data";
import type { CommandDefinition } from "@/lib/types";

interface ActivationProps {
	activated: boolean;
	onToggle: () => void;
	loading?: boolean;
}

interface CommandFormProps {
	mode: "create" | "edit";
	initialData?: CommandDefinition;
	onDelete?: () => void;
	activationProps?: ActivationProps;
}

export function CommandForm({
	mode,
	initialData,
	onDelete,
	activationProps,
}: CommandFormProps) {
	const router = useRouter();
	const { create: createCommand, update: updateCommand } = useCommands();

	const [name, setName] = useState(initialData?.name ?? "");
	const [command, setCommand] = useState(initialData?.command ?? "");
	const [description, setDescription] = useState(
		initialData?.description ?? "",
	);
	const [longDescription, setLongDescription] = useState(
		initialData?.longDescription ?? "",
	);
	const [icon, setIcon] = useState(initialData?.icon ?? "");
	const [content, setContent] = useState(initialData?.content ?? "");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [dirty, setDirty] = useState(false);

	useEffect(() => {
		if (mode === "edit" && initialData) {
			setName(initialData.name);
			setCommand(initialData.command);
			setDescription(initialData.description);
			setLongDescription(initialData.longDescription);
			setIcon(initialData.icon);
			setContent(initialData.content);
		}
	}, [mode, initialData]);

	const markDirty = () => {
		if (mode === "edit") setDirty(true);
	};

	const handleSubmit = async () => {
		setError(null);

		if (mode === "create") {
			if (!name.trim()) {
				setError("Name is required");
				return;
			}
			if (!command.trim()) {
				setError("Command is required (e.g. /standup)");
				return;
			}
			setSaving(true);
			try {
				await createCommand({
					id: `command_${Date.now()}`,
					name,
					command,
					description,
					longDescription,
					icon,
					content,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				});
				router.push("/skills");
			} catch {
				setError("Failed to create command.");
			} finally {
				setSaving(false);
			}
		} else {
			if (!initialData) return;
			setSaving(true);
			try {
				await updateCommand(initialData.id, {
					name,
					command,
					description,
					longDescription,
					icon,
					content,
				});
				setDirty(false);
			} finally {
				setSaving(false);
			}
		}
	};

	const isCreate = mode === "create";
	const pageTitle = isCreate ? "Create New Command" : "Edit Command";
	const submitLabel = isCreate ? "Create Command" : "Save Changes";
	const savingLabel = isCreate ? "Creating..." : "Saving...";
	const breadcrumbLabel = isCreate
		? "New Command"
		: (initialData?.name ?? "Edit Command");
	const textareaRows = isCreate ? 12 : 16;

	return (
		<div className="space-y-6 max-w-3xl">
			<BreadcrumbNav
				items={[
					{ label: "AI Commands", href: "/skills" },
					{ label: breadcrumbLabel },
				]}
			/>

			<div className="flex items-center gap-3">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => (isCreate ? router.back() : router.push("/skills"))}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-xl font-normal flex-1">{pageTitle}</h1>
				{!isCreate && activationProps && (
					<div className="flex items-center gap-2">
						<span className="text-xs text-muted-foreground">
							{activationProps.activated ? "Active" : "Inactive"}
						</span>
						<Switch
							checked={activationProps.activated}
							onCheckedChange={activationProps.onToggle}
							disabled={activationProps.loading}
							aria-label="Toggle command activation"
						/>
					</div>
				)}
				{!isCreate && onDelete && (
					<Button
						variant="destructive"
						size="sm"
						onClick={onDelete}
						className="text-xs"
					>
						Delete
					</Button>
				)}
			</div>

			{error && (
				<div className="rounded-sm border border-destructive bg-destructive-soft px-4 py-3 text-sm text-destructive">
					{error}
				</div>
			)}

			<div className="space-y-5">
				{/* Name */}
				<div className="space-y-2">
					<Label htmlFor="cmd-name">Name{isCreate && " *"}</Label>
					<Input
						id="cmd-name"
						placeholder={isCreate ? "e.g. Daily Standup" : undefined}
						value={name}
						onChange={(e) => {
							setName(e.target.value);
							markDirty();
						}}
					/>
				</div>

				{/* Command */}
				<div className="space-y-2">
					<Label htmlFor="cmd-command">Command{isCreate && " *"}</Label>
					<Input
						id="cmd-command"
						placeholder={isCreate ? "e.g. /standup" : undefined}
						value={command}
						onChange={(e) => {
							setCommand(e.target.value);
							markDirty();
						}}
					/>
					<p className="text-xs text-muted-foreground">
						Slash command trigger (must start with /)
					</p>
				</div>

				{/* Icon */}
				<div className="space-y-2">
					<Label htmlFor="cmd-icon">Icon</Label>
					<Input
						id="cmd-icon"
						placeholder={isCreate ? "e.g. 📋" : undefined}
						value={icon}
						onChange={(e) => {
							setIcon(e.target.value);
							markDirty();
						}}
						className="w-32"
					/>
				</div>

				{/* Description */}
				<div className="space-y-2">
					<Label htmlFor="cmd-desc">Description</Label>
					<Input
						id="cmd-desc"
						placeholder={
							isCreate
								? "Brief description of what this command does"
								: undefined
						}
						value={description}
						onChange={(e) => {
							setDescription(e.target.value);
							markDirty();
						}}
					/>
				</div>

				{/* Long Description */}
				<div className="space-y-2">
					<Label htmlFor="cmd-longdesc">Long Description</Label>
					<Textarea
						id="cmd-longdesc"
						placeholder={
							isCreate ? "Detailed description of this command..." : undefined
						}
						value={longDescription}
						onChange={(e) => {
							setLongDescription(e.target.value);
							markDirty();
						}}
						rows={4}
					/>
				</div>

				{/* Content */}
				<div className="space-y-2">
					<Label htmlFor="cmd-content">Content (Markdown)</Label>
					<Textarea
						id="cmd-content"
						placeholder={
							isCreate
								? "Full command content in Markdown. This is the prompt template injected when the command is triggered."
								: undefined
						}
						value={content}
						onChange={(e) => {
							setContent(e.target.value);
							markDirty();
						}}
						rows={textareaRows}
						className="font-mono text-sm"
					/>
					<p className="text-xs text-muted-foreground">
						{content.length.toLocaleString()} characters
					</p>
				</div>

				{/* Actions */}
				<div className="flex gap-3 pt-2">
					<Button
						onClick={handleSubmit}
						disabled={saving || (mode === "edit" && !dirty)}
						className="gap-1.5"
					>
						<Save className="h-3.5 w-3.5" />
						{saving ? savingLabel : submitLabel}
					</Button>
					<Button
						variant="ghost"
						onClick={() => (isCreate ? router.back() : router.push("/skills"))}
					>
						Cancel
					</Button>
					{mode === "edit" && dirty && (
						<p className="text-xs text-warning self-center">Unsaved changes</p>
					)}
				</div>
			</div>
		</div>
	);
}
