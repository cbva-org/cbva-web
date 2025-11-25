import { createFileRoute, redirect } from "@tanstack/react-router";
import { viewerQueryOptions } from "@/auth/shared";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/admin/schedule")({
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
	return <DefaultLayout>Hello "/admin/dashboard"!</DefaultLayout>;
}
