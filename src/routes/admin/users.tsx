import { createFileRoute, redirect } from "@tanstack/react-router";
import { viewerQueryOptions } from "@/auth/shared";
import { UsersList } from "@/components/admin/users-list";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/admin/users")({
	loader: async ({ context: { queryClient } }) => {
		const viewer = await queryClient.ensureQueryData(viewerQueryOptions());

		// Check if user is admin
		if (!viewer || viewer.role !== "admin") {
			throw redirect({ to: "/not-found" });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<DefaultLayout
			classNames={{
				content: "max-w-4xl px-4 py-16 mx-auto flex flex-col space-y-8",
			}}
		>
			<UsersList />
		</DefaultLayout>
	);
}
