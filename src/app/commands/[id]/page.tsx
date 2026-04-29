"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { CommandForm } from "@/components/command-form";
import { useCommands } from "@/hooks/use-data";
import { useWorkspace } from "@/hooks/use-workspace";

export default function CommandEditorPage() {
	const params = useParams();
	const commandId = params.id as string;
	const router = useRouter();
	const { currentId: workspaceId } = useWorkspace();
	const {
		commands,
		remove: deleteCommand,
		activate,
		deactivate,
	} = useCommands(workspaceId);
	const [toggling, setToggling] = useState(false);

	const command = commands.find((c) => c.id === commandId);

	if (!command) {
		return (
			<div className="space-y-6">
				<BreadcrumbNav
					items={[
						{ label: "AI Commands", href: "/skills" },
						{ label: "Not Found" },
					]}
				/>
				<p className="text-muted-foreground">Command not found.</p>
			</div>
		);
	}

	const handleDelete = async () => {
		if (!confirm("Are you sure you want to delete this command?")) return;
		await deleteCommand(command.id);
		router.push("/skills");
	};

	const handleToggleActivation = async () => {
		setToggling(true);
		try {
			if (command.activated) {
				await deactivate(command.id);
			} else {
				await activate(command.id);
			}
		} finally {
			setToggling(false);
		}
	};

	return (
		<CommandForm
			mode="edit"
			initialData={command}
			onDelete={handleDelete}
			activationProps={{
				activated: command.activated === true,
				onToggle: handleToggleActivation,
				loading: toggling,
			}}
		/>
	);
}
