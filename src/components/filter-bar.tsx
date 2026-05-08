"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface FilterBarFilter {
	id: string;
	label: string;
	options: Array<{ value: string; label: string }>;
	value: string;
	onChange: (v: string) => void;
}

export interface FilterBarProps {
	search?: {
		value: string;
		onChange: (v: string) => void;
		placeholder?: string;
	};
	filters?: FilterBarFilter[];
	onClear?: () => void;
	className?: string;
}

export function FilterBar({
	search,
	filters,
	onClear,
	className,
}: FilterBarProps) {
	const hasActiveFilter =
		(search && search.value !== "") ||
		(filters ?? []).some((f) => f.value !== "" && f.value !== "all");

	return (
		<div
			className={cn("flex flex-row items-center gap-2 flex-wrap", className)}
		>
			{search && (
				<div className="relative">
					<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
					<Input
						placeholder={search.placeholder ?? "Search..."}
						value={search.value}
						onChange={(e) => search.onChange(e.target.value)}
						className="h-8 pl-8 text-sm w-[200px]"
						aria-label={search.placeholder ?? "Search"}
					/>
				</div>
			)}
			{(filters ?? []).map((filter) => (
				<Select
					key={filter.id}
					value={filter.value}
					onValueChange={filter.onChange}
				>
					<SelectTrigger
						className="h-8 w-[140px] text-xs"
						aria-label={filter.label}
					>
						<SelectValue placeholder={filter.label} />
					</SelectTrigger>
					<SelectContent>
						{filter.options.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			))}
			{onClear && hasActiveFilter && (
				<Button
					size="sm"
					variant="ghost"
					className="h-8 text-xs text-muted-foreground gap-1"
					onClick={onClear}
				>
					<X className="h-3.5 w-3.5" />
					Clear
				</Button>
			)}
		</div>
	);
}
