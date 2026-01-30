import { createFileRoute, redirect } from "@tanstack/react-router";
import { ScheduleDashboard } from "@/components/admin/schedule";
import { UsersList } from "@/components/admin/users-list";
import { AdminLayout } from "@/layouts/admin";
import { Button } from "@/components/base/button";
import { Alert } from "@/components/base/alert";
import { useMutation } from "@tanstack/react-query";
import { addToast } from "@/components/base/toast";

export const Route = createFileRoute("/admin/system-tasks")({
	loader: async ({ context: { queryClient, ...context } }) => {
		const viewer = context.viewer;

		if (!viewer || viewer.role !== "admin") {
			throw redirect({ to: "/not-found" });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	const {
		mutate: rollupRatings,
		isPending: isRollupRatingsPending,
		failureReason: rollupRatingsFailureReason,
	} = useMutation({
		mutationFn: async () => {
			const response = await fetch("/api/tasks/ratings/rollup", {
				method: "POST",
			});

			if (!response.ok) {
				const data = await response.json();

				throw new Error(data.error ?? "Failed to rollup ratings");
			}

			addToast({
				variant: "success",
				title: "Success",
				description: "Completed ratings and points rollups.",
			});

			return response.json();
		},
	});

	const {
		mutate: cleanupStorage,
		isPending: isCleanupStoragePending,
		failureReason: cleanupStorageFailureReason,
	} = useMutation({
		mutationFn: async () => {
			const response = await fetch("/api/tasks/cleanup/storage", {
				method: "POST",
			});

			if (!response.ok) {
				const data = await response.json();

				throw new Error(data.error ?? "Failed to cleanup storage");
			}

			addToast({
				variant: "success",
				title: "Success",
				description: "Completed storage cleanup.",
			});

			return response.json();
		},
	});

	return (
		<AdminLayout
			classNames={{
				content: "flex flex-col space-y-12 max-w-2xl px-3 py-12 mx-auto",
			}}
		>
			<div className="flex flex-col">
				{rollupRatingsFailureReason && (
					<Alert
						color="error"
						title="Uh oh."
						description={rollupRatingsFailureReason.message}
					/>
				)}
				<Button
					color="primary"
					onPress={() => rollupRatings()}
					isDisabled={isRollupRatingsPending}
				>
					Rollup Ratings
				</Button>
			</div>

			<div className="flex flex-col">
				{cleanupStorageFailureReason && (
					<Alert
						color="error"
						title="Uh oh."
						description={cleanupStorageFailureReason.message}
					/>
				)}
				<Button
					color="primary"
					onPress={() => cleanupStorage()}
					isDisabled={isCleanupStoragePending}
				>
					Cleanup storage
				</Button>
			</div>
		</AdminLayout>
	);
}
