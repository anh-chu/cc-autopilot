import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import {
	CardSkeleton,
	GridSkeleton,
	PageSkeleton,
	Skeleton,
} from "@/components/skeletons";

export function DashboardContentSkeleton() {
	return (
		<div className="flex flex-col gap-8">
			<div className="grid gap-4 lg:grid-cols-2">
				<CardSkeleton className="p-6 space-y-3">
					<Skeleton className="h-5 w-32" />
					{["row-1", "row-2", "row-3"].map((key) => (
						<div key={key} className="flex items-center gap-2">
							<Skeleton className="h-4 w-4 rounded-sm" />
							<Skeleton className="h-4 flex-1" />
						</div>
					))}
				</CardSkeleton>
				<CardSkeleton className="p-6 space-y-3">
					<Skeleton className="h-5 w-32" />
					{["row-1", "row-2", "row-3"].map((key) => (
						<div key={key} className="flex items-center gap-2">
							<Skeleton className="h-4 w-4 rounded-sm" />
							<Skeleton className="h-4 flex-1" />
						</div>
					))}
				</CardSkeleton>
			</div>
			<GridSkeleton
				className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
				count={3}
				renderItem={() => (
					<CardSkeleton className="p-6 space-y-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Skeleton className="h-3 w-3 rounded-full" />
								<Skeleton className="h-5 w-32" />
							</div>
							<Skeleton className="h-5 w-14 rounded-sm" />
						</div>
						<Skeleton className="h-3 w-full" />
						<Skeleton className="h-3 w-24" />
					</CardSkeleton>
				)}
			/>
		</div>
	);
}

export default function DashboardLoading() {
	return (
		<PageSkeleton>
			<BreadcrumbNav items={[]} />
			<DashboardContentSkeleton />
		</PageSkeleton>
	);
}
